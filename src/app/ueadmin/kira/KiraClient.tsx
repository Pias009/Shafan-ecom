'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, ArrowLeft, ArrowRight, Download, Lock, RefreshCw, Send, Volume2, VolumeX, X } from 'lucide-react';
import { playCommandDispatchSound, playKiraChime, stopKiraVoice } from '@/lib/kira/sound';
import { DEPARTMENTS, TEAMS, TEAM_BY_ID, routeQuestion, type TeamId } from '@/lib/kira/teams';
import type { KiraInsights } from '@/lib/kira/insights';
import { KiraLockModal } from './KiraLockModal';
import { useKiraVoice } from './useKiraVoice';
import { KiraMicButton, KiraVoiceSettings, KiraVoiceStatus } from './KiraVoiceControls';
import { STATUS, TEAM_ICONS, TeamPanel, TeamsOrgChart } from './KiraTeams';
import { VoiceCore } from './VoiceCore';

type Identity = { name: string; honorific: string; title: string };

type ChatMessage = {
  id: string;
  sender: 'kira' | 'user';
  text: string;
  time: string;
  team?: TeamId;
  liveData?: string;
  spoken?: boolean;
};

/** Where the opening voice conversation is: Kira asked "how are you?" → answered → briefed. */
type Stage = 'none' | 'greeting' | 'briefed';

const IDENTITY_KEY = 'agent_kira_admin_identity';
const REFRESH_SECONDS = 45;
const HONORIFICS = ['Sir', "Ma'am", 'Mr.', 'Ms.', ''];
const TITLES = ['Head of store', 'Store manager', 'Marketing manager', 'Operations manager', 'Stock manager', 'Developer'];

const QUICK_PROMPTS = [
  { label: 'Morning briefing', prompt: 'Give me a short briefing: what happened in the last 30 days and what needs my attention today?' },
  { label: 'Any bugs?', prompt: 'Are there any bugs or errors on the website right now?' },
  { label: 'Restock first', prompt: 'What should we restock first?' },
  { label: 'Grow sales', prompt: 'Based on all teams, what are the three best actions to grow sales this week?' },
];

const clock = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

function partOfDay() {
  const h = new Date().getHours();
  return h < 12 ? 'morning' : h < 18 ? 'afternoon' : 'evening';
}

function loadIdentity(): Identity | null {
  try {
    const raw = JSON.parse(localStorage.getItem(IDENTITY_KEY) || 'null');
    if (!raw?.name) return null;
    const legacyTitle: Record<string, string> = { HEAD: 'Head of store', SALES_MANAGER: 'Marketing manager', DEV_LEAD: 'Developer', STOCK_MANAGER: 'Stock manager' };
    return { name: raw.name, honorific: raw.honorific ?? 'Sir', title: raw.title || legacyTitle[raw.role] || 'Head of store' };
  } catch {
    return null;
  }
}

const addressOf = (i: Identity) => `${i.honorific ? `${i.honorific} ` : ''}${i.name}`;

/** Spoken + written briefing Kira gives when the admin doesn't answer her greeting. */
function briefingText(insights: KiraInsights | null) {
  if (!insights) return 'Live data is still loading. Ask me anything when you are ready.';
  const att = TEAMS.filter((t) => insights.teams[t.id]?.status === 'attention');
  const lead = att.length
    ? `${att.length} of ${TEAMS.length} teams need your attention.`
    : `All ${TEAMS.length} teams are on track.`;
  const items = att.slice(0, 3).map((t) => `${t.short}: ${insights.teams[t.id].headline}.`).join(' ');
  return `Here is today's briefing. ${lead} ${items} What would you like to look at first?`;
}

export function KiraClient() {
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [identityOpen, setIdentityOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [isLocked, setIsLocked] = useState(true);
  const [voiceEnabled, setVoiceEnabled] = useState(true);

  const [insights, setInsights] = useState<KiraInsights | null>(null);
  const [loadingInsights, setLoadingInsights] = useState(true);
  const [insightsError, setInsightsError] = useState('');
  const [nextRefresh, setNextRefresh] = useState(REFRESH_SECONDS);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [workingTeam, setWorkingTeam] = useState<TeamId | null>(null);
  const [openTeam, setOpenTeam] = useState<TeamId | null>(null);

  const messagesRef = useRef<HTMLDivElement>(null);
  const messagesStateRef = useRef<ChatMessage[]>([]);
  messagesStateRef.current = messages;
  const insightsRef = useRef<KiraInsights | null>(null);
  insightsRef.current = insights;
  const stageRef = useRef<Stage>('none');
  const greetedRef = useRef(false);

  const addKira = (text: string, extra: Partial<ChatMessage> = {}) =>
    setMessages((prev) => [...prev, { id: `k${Date.now()}${Math.random()}`, sender: 'kira', text, time: clock(), ...extra }]);

  const voice = useKiraVoice({
    active: !isLocked && !!identity,
    muted: !voiceEnabled,
    onCommand: (text) => ask(text, { viaVoice: true }),
    onWake: () => playKiraChime(0.2),
    // No answer to "how are you?": carry on like a person would and give the briefing.
    onSilence: () => {
      if (stageRef.current !== 'greeting') return;
      stageRef.current = 'briefed';
      const text = `No worries. ${briefingText(insightsRef.current)}`;
      addKira(text);
      voice.speak(text, { listenAfter: true });
    },
  });
  const isSpeaking = voice.phase === 'speaking';

  /* ---------------- identity ---------------- */
  useEffect(() => {
    const id = loadIdentity();
    setIdentity(id);
    if (!id) setIdentityOpen(true);
    setReady(true);
  }, []);

  /* ---------------- live data ---------------- */
  const fetchInsights = useCallback(async () => {
    setLoadingInsights(true);
    try {
      const res = await fetch('/api/admin/kira/telemetry', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Live data unavailable');
      setInsights(data);
      setInsightsError('');
    } catch (e: any) {
      setInsightsError(e?.message || 'Live data unavailable');
    } finally {
      setLoadingInsights(false);
      setNextRefresh(REFRESH_SECONDS);
    }
  }, []);

  useEffect(() => { fetchInsights(); }, [fetchInsights]);

  useEffect(() => {
    const t = setInterval(() => {
      setNextRefresh((s) => {
        if (s <= 1) {
          if (document.visibilityState === 'visible') fetchInsights();
          return REFRESH_SECONDS;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [fetchInsights]);

  /* ---------------- auto-lock ---------------- */
  useEffect(() => {
    const lock = () => {
      setIsLocked(true);
      stopKiraVoice();
    };
    const onBlur = () => {
      if (voice.micBusyRef.current) return; // mic permission prompt / mid-sentence
      lock();
    };
    const onVisibility = () => { if (document.hidden) lock(); };
    window.addEventListener('blur', onBlur);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('visibilitychange', onVisibility);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------------- voice-first opening ---------------- */
  useEffect(() => {
    if (!identity || isLocked) return;
    const who = addressOf(identity);
    if (greetedRef.current) {
      // Unlocked again later: a short welcome, no interview.
      if (voiceEnabled && voice.settings.autoGreet) voice.speak(`Welcome back, ${identity.name}.`);
      return;
    }
    greetedRef.current = true;
    const greeting = `Good ${partOfDay()}, ${who}. How are you doing today?`;
    if (voiceEnabled && voice.settings.autoGreet) {
      stageRef.current = 'greeting';
      addKira(greeting);
      // Ask, then listen for the answer.
      voice.speak(greeting, { listenAfter: true });
    } else {
      stageRef.current = 'briefed';
      addKira(`Good ${partOfDay()}, ${who}. ${briefingText(insightsRef.current)}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [identity, isLocked]);

  useEffect(() => {
    const el = messagesRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages, chatLoading]);

  /* ---------------- ask Kira ---------------- */
  const ask = async (text: string, opts: { viaVoice?: boolean; team?: TeamId } = {}) => {
    const question = text.trim();
    if (!question || chatLoading || !identity) {
      if (opts.viaVoice) voice.resetAfterCommand();
      return;
    }
    const greetingReply = stageRef.current === 'greeting';
    if (greetingReply) stageRef.current = 'briefed';
    const team = opts.team || routeQuestion(question);
    setWorkingTeam(greetingReply ? null : team);
    setMessages((prev) => [...prev, { id: `u${Date.now()}`, sender: 'user', text: question, time: clock(), spoken: opts.viaVoice }]);
    setInput('');
    setChatLoading(true);
    playCommandDispatchSound(0.1);

    try {
      const res = await fetch('/api/admin/kira/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: question,
          team: greetingReply ? undefined : team,
          stage: greetingReply ? 'greeting-reply' : undefined,
          adminName: identity.name,
          adminRole: identity.title,
          honorific: identity.honorific,
          mode: opts.viaVoice ? 'voice' : 'text',
          history: messagesStateRef.current.slice(-6).map((m) => ({ sender: m.sender, text: m.text })),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'No answer');
      addKira(data.reply, { team: greetingReply ? undefined : data.team, liveData: data.liveData });
      if (voiceEnabled || opts.viaVoice) voice.speak(data.reply, { viaVoice: opts.viaVoice, listenAfter: greetingReply });
    } catch {
      addKira('Sorry, I could not get an answer just now. Please try again.');
      if (opts.viaVoice) voice.speak('Sorry, I could not get an answer just now.');
    } finally {
      setChatLoading(false);
      setWorkingTeam(null);
    }
  };

  /* ---------------- briefing download ---------------- */
  const downloadBriefing = () => {
    if (!insights) return;
    const o = insights.overview;
    const lines = [
      'SHANFA · Kira operations briefing',
      `Generated ${new Date(insights.generatedAt).toLocaleString()}${identity ? ` for ${addressOf(identity)}` : ''}`,
      '',
      `Last 30 days: ${o.orders30} orders · AED ${o.revenue30.toLocaleString()} revenue · AED ${o.aov30} average order`,
      `Today: ${o.toConfirm} orders to confirm · ${o.outOfStock} products out of stock · ${o.lowStock} low-stock SKUs · ${o.openCheckouts} open checkouts`,
      '',
      ...DEPARTMENTS.flatMap((d) => [
        `######## ${d.name.toUpperCase()}`,
        ...TEAMS.filter((t) => t.department === d.id).flatMap((t) => {
          const i = insights.teams[t.id];
          return [
            `== ${t.code} ${t.name} (${STATUS[i.status].label.toLowerCase()})`,
            ...i.metrics.map((m) => `   ${m.label}: ${m.value}`),
            ...i.findings.map((f) => `   - ${f}`),
            '',
          ];
        }),
      ]),
      `Not connected yet: ${insights.notConnected.join(', ') || 'nothing'}`,
    ];
    const url = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `kira-briefing-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const attention = insights ? TEAMS.filter((t) => insights.teams[t.id]?.status === 'attention') : [];
  const o = insights?.overview;
  const kpis: { label: string; value: string; tone?: string }[] = [
    { label: 'Revenue 30d', value: o ? `AED ${o.revenue30.toLocaleString()}` : '—' },
    { label: 'Orders 30d', value: o ? String(o.orders30) : '—' },
    { label: 'Avg order', value: o ? `AED ${o.aov30}` : '—' },
    { label: 'To confirm', value: o ? String(o.toConfirm) : '—', tone: o?.toConfirm ? 'text-[#F2B33D]' : '' },
    { label: 'Out of stock', value: o ? String(o.outOfStock) : '—', tone: o?.outOfStock ? 'text-[#EC8A80]' : '' },
    { label: 'Checkout → order', value: o?.checkoutToOrderRate ?? '—' },
  ];
  const voiceState =
    voice.phase === 'listening' ? 'Listening' :
    voice.phase === 'transcribing' ? 'Transcribing' :
    voice.phase === 'thinking' || chatLoading ? (workingTeam ? `${TEAM_BY_ID[workingTeam].short} team working` : 'Thinking') :
    isSpeaking ? 'Speaking' : 'Ready';

  if (!ready) return <div className="fixed inset-0 bg-[#0B0C0E]" />;

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden bg-[#0B0C0E] text-[#ECEAE4] antialiased">
      <div className={`flex min-h-0 flex-1 flex-col transition-[filter,opacity] duration-300 ${isLocked ? 'pointer-events-none select-none opacity-25 blur-sm' : ''}`}>
        {/* ===================== Top bar ===================== */}
        <header className="flex h-12 shrink-0 items-center gap-3 border-b border-[#1E2025] px-3 sm:px-5">
          <Link href="/ueadmin/dashboard" className="flex items-center gap-1.5 rounded px-2 py-1 text-[13px] text-[#A9ACB4] hover:bg-[#15161A] hover:text-white">
            <ArrowLeft size={15} /> <span className="hidden sm:inline">Admin</span>
          </Link>
          <span className="h-4 w-px bg-[#26282E]" />
          <div className="flex items-baseline gap-2">
            <span className="kira-mono text-[13px] font-semibold tracking-[0.18em] text-white">KIRA</span>
            <span className="kira-label hidden sm:inline">Operations HQ</span>
          </div>
          <div className="kira-mono ml-4 hidden items-center gap-4 text-[11px] text-[#8A8E98] lg:flex">
            <span className="flex items-center gap-1.5 text-[#8FC79E]"><span className="h-1.5 w-1.5 rounded-[1px] bg-[#7DBA8E]" /> LIVE</span>
            <span>{loadingInsights ? 'SYNCING…' : `NEXT SYNC ${String(nextRefresh).padStart(2, '0')}s`}</span>
            <span>{TEAMS.length} TEAMS · {DEPARTMENTS.length} DEPARTMENTS</span>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <button
              onClick={() => { if (voiceEnabled) stopKiraVoice(); setVoiceEnabled((v) => !v); }}
              aria-pressed={voiceEnabled}
              className="kira-tool"
              title={voiceEnabled ? 'Kira speaks out loud. Click to mute.' : 'Kira is muted. Click to let her speak.'}
            >
              {voiceEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
              <span className="hidden md:inline">{voiceEnabled ? 'Voice on' : 'Muted'}</span>
            </button>
            <button onClick={fetchInsights} disabled={loadingInsights} className="kira-tool" title="Refresh live data">
              <RefreshCw size={14} className={loadingInsights ? 'animate-spin' : ''} />
              <span className="hidden md:inline">Sync</span>
            </button>
            <button onClick={downloadBriefing} disabled={!insights} className="kira-tool" title="Download today’s briefing (.txt)">
              <Download size={14} />
              <span className="hidden md:inline">Briefing</span>
            </button>
            <button onClick={() => { setIsLocked(true); stopKiraVoice(); }} className="kira-tool" title="Lock Kira" aria-label="Lock Kira">
              <Lock size={14} />
            </button>
            {identity && (
              <button onClick={() => setIdentityOpen(true)} className="ml-1 hidden items-center gap-2 rounded px-2 py-1 text-left hover:bg-[#15161A] sm:flex" title="How Kira addresses you">
                <span className="kira-mono grid h-7 w-7 place-items-center rounded-[5px] border border-[#2A2D34] text-[11px]">{identity.name.slice(0, 1).toUpperCase()}</span>
                <span className="hidden leading-tight xl:block">
                  <span className="block text-[12.5px] font-medium">{identity.name}</span>
                  <span className="block text-[11px] text-[#8A8E98]">{identity.title}</span>
                </span>
              </button>
            )}
          </div>
        </header>

        {/* ===================== Body ===================== */}
        <div className="grid min-h-0 flex-1 grid-cols-1 overflow-y-auto xl:grid-cols-[minmax(0,1fr)_440px] xl:overflow-hidden">
          <main className="px-4 pb-12 pt-8 sm:px-8 xl:min-h-0 xl:overflow-y-auto [scrollbar-color:#2A2D34_transparent] [scrollbar-width:thin]">
            <div className="mx-auto max-w-6xl">
              {/* Kira */}
              <section className="flex flex-col gap-6 border-b border-[#1E2025] pb-8 md:flex-row md:items-center">
                <VoiceCore
                  listening={voice.phase === 'listening'}
                  speaking={isSpeaking}
                  thinking={chatLoading || voice.phase === 'transcribing'}
                  getLevel={voice.level}
                  size={128}
                  title={voice.phase === 'listening' ? 'Listening… tap to finish' : 'Tap to talk to Kira'}
                  onClick={() => {
                    if (voice.phase === 'speaking') voice.startListening();
                    else voice.toggleListening();
                  }}
                />
                <div className="min-w-0 flex-1">
                  <div className="kira-label">Kira · Chief of staff</div>
                  <h1 className="mt-2 text-[30px] font-semibold leading-tight tracking-tight sm:text-[36px]">
                    {identity ? `Good ${partOfDay()}, ${identity.name}.` : 'Kira'}
                  </h1>
                  <p className="mt-2 text-[15px] text-[#A9ACB4]">
                    {insights
                      ? attention.length
                        ? <><span className="text-[#F2B33D]">{attention.length} of {TEAMS.length} teams</span> need your attention today.</>
                        : <>All {TEAMS.length} teams are on track today.</>
                      : 'Loading live store data…'}
                  </p>
                  <p className="kira-mono mt-3 text-[11.5px] text-[#7E828C]">
                    {voice.phase === 'listening' ? 'LISTENING · speak now' : voiceEnabled ? 'VOICE ON · tap the core or the mic to talk' : 'MUTED · Kira replies in text'}
                  </p>
                  {insightsError && (
                    <p className="mt-3 flex items-center gap-2 text-[12.5px] text-[#F2B33D]"><AlertTriangle size={14} /> {insightsError}. Retrying automatically.</p>
                  )}
                </div>
              </section>

              {/* KPI strip */}
              <section className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-md border border-[#23252B] bg-[#23252B] sm:grid-cols-3 lg:grid-cols-6" aria-label="Key numbers">
                {kpis.map((k) => (
                  <div key={k.label} className="bg-[#0B0C0E] px-4 py-3.5">
                    <div className="kira-label">{k.label}</div>
                    <div className={`kira-mono mt-1.5 text-[20px] font-medium ${k.tone || 'text-[#ECEAE4]'}`}>{k.value}</div>
                  </div>
                ))}
              </section>

              {/* Priority queue */}
              {attention.length > 0 && (
                <section className="mt-8" aria-label="Needs attention">
                  <div className="mb-2.5 flex items-baseline justify-between">
                    <h2 className="kira-label">Priority queue</h2>
                    <span className="kira-mono text-[11px] text-[#7E828C]">{attention.length} open</span>
                  </div>
                  <ul className="divide-y divide-[#1F2126] rounded-md border border-[#23252B]">
                    {attention.map((t) => {
                      const Icon = TEAM_ICONS[t.icon];
                      return (
                        <li key={t.id}>
                          <button onClick={() => setOpenTeam(t.id)} className="group flex w-full items-center gap-4 px-4 py-3 text-left hover:bg-[#121317]">
                            <span className="kira-mono w-10 shrink-0 text-[11px] text-[#7E828C]">{t.code}</span>
                            {Icon && <Icon size={15} strokeWidth={1.75} className="shrink-0 text-[#8A8E98]" />}
                            <span className="w-44 shrink-0 text-[13.5px] font-medium">{t.name}</span>
                            <span className="min-w-0 flex-1 text-[13.5px] text-[#D9D7D1]">{insights?.teams[t.id].headline}</span>
                            <ArrowRight size={14} className="shrink-0 text-[#4A4E57] group-hover:text-[#ECEAE4]" />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              )}

              {/* Teams */}
              <section className="mt-10" aria-label="Teams">
                <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <h2 className="text-[18px] font-semibold tracking-tight">Teams</h2>
                    <p className="mt-0.5 text-[13px] text-[#A9ACB4]">{DEPARTMENTS.length} departments, {TEAMS.length} AI teams. Every number is live store data.</p>
                  </div>
                  <div className="kira-mono flex items-center gap-4 text-[11px] text-[#8A8E98]">
                    {(['attention', 'ok', 'limited'] as const).map((s) => (
                      <span key={s} className="flex items-center gap-1.5"><span className={`h-1.5 w-1.5 rounded-[1px] ${STATUS[s].color}`} />{STATUS[s].label}</span>
                    ))}
                  </div>
                </div>
                <TeamsOrgChart insights={insights} workingTeam={workingTeam} onOpen={setOpenTeam} onBrief={(id) => ask(TEAM_BY_ID[id].questions[0], { team: id })} />
              </section>
            </div>
          </main>

          {/* ===================== Transcript ===================== */}
          <aside className="flex h-[640px] flex-col border-t border-[#1E2025] bg-[#0E0F12] xl:h-auto xl:min-h-0 xl:border-l xl:border-t-0" aria-label="Conversation with Kira">
            <div className="flex items-center justify-between border-b border-[#1E2025] px-4 py-3">
              <h2 className="kira-label">Transcript</h2>
              <span className={`kira-mono flex items-center gap-1.5 text-[11px] uppercase ${voiceState === 'Ready' ? 'text-[#7E828C]' : voice.phase === 'listening' ? 'text-[#F2B33D]' : 'text-[#ECEAE4]'}`}>
                {voiceState !== 'Ready' && <span className="h-1.5 w-1.5 animate-pulse rounded-[1px] bg-current" />}
                {voiceState}
              </span>
            </div>

            <div ref={messagesRef} className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-5 [scrollbar-color:#2A2D34_transparent] [scrollbar-width:thin]">
              {messages.map((m) => {
                const isKira = m.sender === 'kira';
                const team = m.team ? TEAM_BY_ID[m.team] : null;
                return (
                  <div key={m.id} className={isKira ? '' : 'border-l-2 border-[#3A3D45] pl-3'}>
                    <div className="kira-mono mb-1.5 flex flex-wrap items-center gap-2 text-[10.5px] uppercase tracking-[0.08em]">
                      <span className={isKira ? 'text-[#ECEAE4]' : 'text-[#A9ACB4]'}>{isKira ? 'Kira' : identity?.name || 'You'}</span>
                      {team && isKira && <span className="rounded-[3px] border border-[#2A2D34] px-1.5 text-[#A9ACB4]">{team.code} {team.short}</span>}
                      {m.spoken && <span className="text-[#F2B33D]">voice</span>}
                      <span className="text-[#5E626B]">{m.time}</span>
                    </div>
                    <div className={`whitespace-pre-wrap break-words text-[14px] leading-relaxed ${isKira ? 'text-[#ECEAE4]' : 'text-[#C9CBD0]'}`}>
                      {m.text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
                        part.startsWith('**') && part.endsWith('**') ? <strong key={i} className="font-semibold text-white">{part.slice(2, -2)}</strong> : part,
                      )}
                    </div>
                    {m.liveData && (
                      <div className="kira-mono mt-2.5 rounded-[4px] border border-[#23252B] bg-[#121317] px-2.5 py-2 text-[11px] leading-relaxed text-[#A9ACB4]" title="Exact figures from the database. Trust these if the text above differs.">
                        <span className="mr-1.5 text-[#8FC79E]">DATA</span>{m.liveData.replace(/^Live data /, '')}
                      </div>
                    )}
                  </div>
                );
              })}
              {chatLoading && (
                <div className="kira-mono flex items-center gap-2 text-[11px] uppercase tracking-[0.08em] text-[#A9ACB4]">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-[1px] bg-[#ECEAE4]" />
                  {workingTeam ? `${TEAM_BY_ID[workingTeam].name} team · checking live data` : 'Kira · thinking'}
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5 px-4 pb-2.5">
              {QUICK_PROMPTS.map((q) => (
                <button
                  key={q.label}
                  disabled={chatLoading}
                  onClick={() => ask(q.prompt)}
                  className="rounded-[4px] border border-[#262930] px-2.5 py-1 text-[12px] text-[#C9CBD0] hover:border-[#3A3D45] hover:text-white disabled:opacity-50"
                >
                  {q.label}
                </button>
              ))}
            </div>

            <div className="space-y-2 border-t border-[#1E2025] p-3">
              <KiraVoiceStatus voice={voice} />
              <form onSubmit={(e) => { e.preventDefault(); ask(input); }} className="flex items-center gap-2">
                <KiraMicButton voice={voice} />
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={chatLoading}
                  placeholder={voice.settings.wakeWord ? 'Type, tap the mic, or say “Hey Kira”…' : 'Ask Kira or any team…'}
                  className="h-10 min-w-0 flex-1 rounded-md border border-[#262930] bg-[#121317] px-3.5 text-[14px] text-[#ECEAE4] placeholder:text-[#6E727C] focus:border-[#4A4E57] focus:outline-none"
                />
                <button type="submit" disabled={chatLoading || !input.trim()} className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-[#ECEAE4] text-[#0C0D0F] hover:bg-white disabled:opacity-35" aria-label="Send">
                  <Send size={15} />
                </button>
                <KiraVoiceSettings voice={voice} />
              </form>
            </div>
          </aside>
        </div>
      </div>

      <TeamPanel
        team={openTeam ? TEAM_BY_ID[openTeam] : null}
        insight={openTeam ? insights?.teams[openTeam] : undefined}
        busy={chatLoading}
        onClose={() => setOpenTeam(null)}
        onAsk={(id, q) => { setOpenTeam(null); ask(q, { team: id }); }}
      />

      {identityOpen && (
        <IdentityDialog
          initial={identity}
          onClose={identity ? () => setIdentityOpen(false) : undefined}
          onSave={(id) => {
            localStorage.setItem(IDENTITY_KEY, JSON.stringify(id));
            setIdentity(id);
            setIdentityOpen(false);
          }}
        />
      )}

      <KiraLockModal isOpen={isLocked} onUnlock={() => setIsLocked(false)} />
    </div>
  );
}

function IdentityDialog({ initial, onSave, onClose }: { initial: Identity | null; onSave: (i: Identity) => void; onClose?: () => void }) {
  const [name, setName] = useState(initial?.name || '');
  const [honorific, setHonorific] = useState(initial?.honorific ?? 'Sir');
  const [title, setTitle] = useState(initial?.title || TITLES[0]);
  const field = 'mt-1 h-10 w-full rounded-md border border-[#262930] bg-[#0E0F12] px-3 text-[14px] text-[#ECEAE4] focus:border-[#4A4E57] focus:outline-none [&>option]:bg-[#0E0F12]';
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-label="Your profile">
      <form
        onSubmit={(e) => { e.preventDefault(); if (name.trim()) onSave({ name: name.trim(), honorific, title }); }}
        className="relative w-full max-w-md rounded-md border border-[#262930] bg-[#121317] p-6 text-[#ECEAE4] shadow-2xl"
      >
        {onClose && (
          <button type="button" onClick={onClose} className="absolute right-4 top-4 rounded p-1 text-[#8A8E98] hover:bg-[#1A1C21] hover:text-white" aria-label="Close"><X size={16} /></button>
        )}
        <div className="kira-label">Profile</div>
        <h2 className="mt-1.5 text-[20px] font-semibold tracking-tight">How should Kira address you?</h2>
        <p className="mt-1 text-[13px] text-[#8A8E98]">Saved in this browser only.</p>
        <label className="mt-5 block text-[12.5px] text-[#A9ACB4]">Your name</label>
        <input autoFocus value={name} onChange={(e) => setName(e.target.value)} className={field} placeholder="e.g. Nishad" />
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[12.5px] text-[#A9ACB4]">Form of address</label>
            <select value={honorific} onChange={(e) => setHonorific(e.target.value)} className={field}>
              {HONORIFICS.map((h) => <option key={h} value={h}>{h || 'Name only'}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[12.5px] text-[#A9ACB4]">Your role</label>
            <select value={title} onChange={(e) => setTitle(e.target.value)} className={field}>
              {TITLES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <button type="submit" disabled={!name.trim()} className="mt-6 h-10 w-full rounded-md bg-[#ECEAE4] text-[14px] font-semibold text-[#0C0D0F] hover:bg-white disabled:opacity-40">
          Save and continue
        </button>
      </form>
    </div>
  );
}
