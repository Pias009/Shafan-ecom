'use client';

import React, { useEffect, useState } from 'react';
import {
  ArrowRight, BadgeDollarSign, Boxes, Flame, FlaskConical, HeartHandshake, Megaphone,
  MonitorSmartphone, Sparkles, Target, Truck, Wrench, X, type LucideIcon,
} from 'lucide-react';
import { DEPARTMENTS, TEAMS, type TeamConfig, type TeamId } from '@/lib/kira/teams';
import type { KiraInsights, TeamInsight, Tone } from '@/lib/kira/insights';

export const TEAM_ICONS: Record<string, LucideIcon> = {
  Megaphone, Target, Sparkles, Flame, FlaskConical, BadgeDollarSign, Boxes, MonitorSmartphone, Truck, HeartHandshake, Wrench,
};

const TONE: Record<Tone, string> = {
  good: 'text-[#8FC79E]',
  warn: 'text-[#F2B33D]',
  bad: 'text-[#EC8A80]',
  muted: 'text-[#8A8E98]',
};

export const STATUS: Record<TeamInsight['status'], { label: string; color: string; text: string }> = {
  attention: { label: 'Needs attention', color: 'bg-[#F2B33D]', text: 'text-[#F2B33D]' },
  ok: { label: 'On track', color: 'bg-[#7DBA8E]', text: 'text-[#8FC79E]' },
  limited: { label: 'Needs data', color: 'bg-[#6B6F78]', text: 'text-[#9A9EA7]' },
};

function initials(role: string) {
  return role.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

function StatusMark({ status, working }: { status: TeamInsight['status']; working?: boolean }) {
  const s = STATUS[status];
  return (
    <span className={`kira-mono inline-flex items-center gap-1.5 text-[11px] ${working ? 'text-[#ECEAE4]' : s.text}`}>
      <span className={`h-1.5 w-1.5 rounded-[1px] ${working ? 'animate-pulse bg-[#ECEAE4]' : s.color}`} />
      {working ? 'Working' : s.label}
    </span>
  );
}

function Roster({ team, working }: { team: TeamConfig; working?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex gap-1">
        {team.members.map((m, i) => (
          <span
            key={m.role}
            title={`${m.role}: ${m.does}`}
            className={`kira-mono grid h-6 w-6 place-items-center rounded-[4px] border text-[9.5px] font-medium ${
              working && i === 0 ? 'border-[#ECEAE4]/60 bg-[#1F2127] text-[#ECEAE4]' : 'border-[#2A2D34] bg-[#17191E] text-[#B9BBC1]'
            }`}
          >
            {initials(m.role)}
          </span>
        ))}
      </div>
      <span className="min-w-0 text-[11.5px] leading-tight text-[#A9ACB4]">
        {team.members[0].role} <span className="text-[#7E828C]">+ {team.members.length - 1}</span>
      </span>
    </div>
  );
}

export function TeamCard({
  team,
  insight,
  working,
  onOpen,
  onBrief,
}: {
  team: TeamConfig;
  insight?: TeamInsight;
  working: boolean;
  onOpen: () => void;
  onBrief: () => void;
}) {
  const Icon = TEAM_ICONS[team.icon] || Sparkles;
  const status = insight?.status || 'limited';
  return (
    <article
      className={`group relative flex flex-col overflow-hidden rounded-md border bg-[#121317] transition-colors ${
        working ? 'border-[#ECEAE4]/40' : 'border-[#23252B] hover:border-[#363942]'
      }`}
    >
      <span aria-hidden className={`absolute inset-y-0 left-0 w-[2px] ${working ? 'bg-[#ECEAE4]' : STATUS[status].color}`} />

      <div className="px-4 pb-3 pt-3.5">
        <div className="flex items-center justify-between gap-3">
          <span className="kira-mono text-[11px] text-[#7E828C]">{team.code}</span>
          <StatusMark status={status} working={working} />
        </div>
        <h3 className="mt-1.5 flex items-start gap-2 text-[15px] font-semibold leading-snug text-[#ECEAE4]">
          <Icon size={16} strokeWidth={1.75} className="mt-[3px] shrink-0 text-[#8A8E98]" />
          {team.name}
        </h3>
        <div className="mt-3"><Roster team={team} working={working} /></div>
        <p className="mt-3 text-[13.5px] leading-snug text-[#D9D7D1]">{insight?.headline || 'Loading live data…'}</p>
      </div>

      <dl className="grid grid-cols-2 border-t border-[#1F2126]">
        {(insight?.metrics || []).slice(0, 2).map((m, i) => (
          <div key={m.label} className={`min-w-0 px-4 py-2.5 ${i === 1 ? 'border-l border-[#1F2126]' : ''}`}>
            <dt className="text-[11px] leading-tight text-[#8A8E98]">{m.label}</dt>
            <dd className={`kira-mono mt-1 break-words text-[15px] font-medium leading-snug ${m.tone ? TONE[m.tone] : 'text-[#ECEAE4]'}`}>
              {m.value}
            </dd>
          </div>
        ))}
      </dl>

      {insight?.findings?.[0] && (
        <p className="border-t border-[#1F2126] px-4 py-2.5 text-[12.5px] leading-relaxed text-[#A9ACB4]">
          {insight.findings[0]}
        </p>
      )}

      <footer className="mt-auto flex items-center justify-between border-t border-[#1F2126] px-2 py-1.5">
        <button onClick={onOpen} className="flex items-center gap-1 rounded px-2 py-1 text-[12.5px] font-medium text-[#D4D2CC] hover:bg-[#1A1C21] hover:text-white">
          Open team <ArrowRight size={13} />
        </button>
        <button onClick={onBrief} className="rounded bg-[#ECEAE4] px-2.5 py-1 text-[12.5px] font-medium text-[#0C0D0F] hover:bg-white">
          Brief me
        </button>
      </footer>
    </article>
  );
}

/** Kira, three departments, ten teams. */
export function TeamsOrgChart({
  insights,
  workingTeam,
  onOpen,
  onBrief,
}: {
  insights: KiraInsights | null;
  workingTeam: TeamId | null;
  onOpen: (id: TeamId) => void;
  onBrief: (id: TeamId) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-x-5 gap-y-8 lg:grid-cols-3">
      {DEPARTMENTS.map((dept, di) => {
        const teams = TEAMS.filter((t) => t.department === dept.id);
        const needs = teams.filter((t) => insights?.teams[t.id]?.status === 'attention').length;
        return (
          <section key={dept.id} className="min-w-0">
            <header className="mb-3 border-b border-[#23252B] pb-3 lg:min-h-[84px]">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-[13px] font-semibold uppercase tracking-[0.14em] text-[#ECEAE4]">{dept.name}</h2>
                <span className="kira-mono text-[11px] text-[#7E828C]">0{di + 1}</span>
              </div>
              <p className="mt-1 text-[12.5px] text-[#A9ACB4]">{dept.purpose}</p>
              <p className="kira-mono mt-1.5 text-[11px] text-[#8A8E98]">
                {teams.length} teams
                {needs ? <span className="text-[#F2B33D]"> · {needs} need{needs === 1 ? 's' : ''} attention</span> : <span className="text-[#8FC79E]"> · on track</span>}
              </p>
            </header>
            <div className="space-y-3">
              {teams.map((t) => (
                <TeamCard
                  key={t.id}
                  team={t}
                  insight={insights?.teams[t.id]}
                  working={workingTeam === t.id}
                  onOpen={() => onOpen(t.id)}
                  onBrief={() => onBrief(t.id)}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

/** Slide-over with the whole team: crew, every metric, every finding, and questions to ask it. */
export function TeamPanel({
  team,
  insight,
  busy,
  onClose,
  onAsk,
}: {
  team: TeamConfig | null;
  insight?: TeamInsight;
  busy: boolean;
  onClose: () => void;
  onAsk: (team: TeamId, question: string) => void;
}) {
  const [draft, setDraft] = useState('');
  useEffect(() => setDraft(''), [team?.id]);
  useEffect(() => {
    if (!team) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [team, onClose]);

  if (!team) return null;
  const Icon = TEAM_ICONS[team.icon] || Sparkles;
  const status = insight?.status || 'limited';
  const dept = DEPARTMENTS.find((d) => d.id === team.department);

  return (
    <div className="fixed inset-0 z-40 flex justify-end" role="dialog" aria-modal="true" aria-label={`${team.name} team`}>
      <div className="absolute inset-0 bg-black/65" onClick={onClose} />
      <aside className="kira-slide-in relative flex h-full w-full max-w-[540px] flex-col border-l border-[#23252B] bg-[#0E0F12] text-[#ECEAE4] shadow-2xl">
        <header className="relative border-b border-[#23252B] px-6 pb-5 pt-5">
          <span aria-hidden className={`absolute inset-y-0 left-0 w-[2px] ${STATUS[status].color}`} />
          <div className="flex items-center justify-between">
            <span className="kira-label">{dept?.name} · {team.code}</span>
            <button onClick={onClose} className="rounded p-1.5 text-[#8A8E98] hover:bg-[#1A1C21] hover:text-white" aria-label="Close">
              <X size={16} />
            </button>
          </div>
          <h2 className="mt-2 flex items-center gap-2.5 text-[24px] font-semibold tracking-tight">
            <Icon size={20} strokeWidth={1.75} className="text-[#8A8E98]" /> {team.name}
          </h2>
          <p className="mt-1.5 max-w-md text-sm text-[#A9ACB4]">{team.mission}</p>
          <div className="mt-3"><StatusMark status={status} /></div>
        </header>

        <div className="flex-1 space-y-7 overflow-y-auto px-6 py-6 [scrollbar-color:#2A2D34_transparent] [scrollbar-width:thin]">
          <section>
            <h3 className="kira-label mb-2.5">Crew</h3>
            <ul className="divide-y divide-[#1F2126] rounded-md border border-[#23252B]">
              {team.members.map((m, i) => (
                <li key={m.role} className="flex items-center gap-3 px-3.5 py-3">
                  <span className="kira-mono grid h-8 w-8 shrink-0 place-items-center rounded-[5px] border border-[#2A2D34] bg-[#17191E] text-[11px] text-[#D4D2CC]">
                    {initials(m.role)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium">
                      {m.role}
                      {i === 0 && <span className="kira-mono ml-2 text-[10px] uppercase tracking-wider text-[#8A8E98]">Lead</span>}
                    </div>
                    <div className="text-[12.5px] text-[#A9ACB4]">{m.does}</div>
                  </div>
                  <span className="kira-mono text-[10.5px] text-[#7E828C]">AI agent</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h3 className="kira-label mb-2.5">Live metrics</h3>
            <dl className="grid grid-cols-1 divide-y divide-[#1F2126] rounded-md border border-[#23252B] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
              {(insight?.metrics || []).map((m) => (
                <div key={m.label} className="min-w-0 px-3.5 py-3">
                  <dt className="text-[11.5px] text-[#8A8E98]">{m.label}</dt>
                  <dd className={`kira-mono mt-1 break-words text-[15px] font-medium ${m.tone ? TONE[m.tone] : 'text-[#ECEAE4]'}`}>{m.value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section>
            <h3 className="kira-label mb-2.5">What the team found</h3>
            <ol className="space-y-3">
              {(insight?.findings || []).map((f, i) => (
                <li key={i} className="flex gap-3 text-sm leading-relaxed text-[#D9D7D1]">
                  <span className="kira-mono mt-[2px] shrink-0 text-[11px] text-[#7E828C]">{String(i + 1).padStart(2, '0')}</span>
                  {f}
                </li>
              ))}
            </ol>
          </section>

          <section>
            <h3 className="kira-label mb-2.5">Ask this team</h3>
            <div className="space-y-1.5">
              {team.questions.map((q) => (
                <button
                  key={q}
                  disabled={busy}
                  onClick={() => onAsk(team.id, q)}
                  className="flex w-full items-center justify-between gap-3 rounded-md border border-[#23252B] px-3.5 py-2.5 text-left text-[13px] text-[#D4D2CC] hover:border-[#363942] hover:bg-[#15161A] disabled:opacity-50"
                >
                  {q} <ArrowRight size={14} className="shrink-0 text-[#7E828C]" />
                </button>
              ))}
            </div>
          </section>
        </div>

        <form
          className="flex gap-2 border-t border-[#23252B] p-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!draft.trim()) return;
            onAsk(team.id, draft.trim());
            setDraft('');
          }}
        >
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={`Ask the ${team.short} team…`}
            className="h-10 min-w-0 flex-1 rounded-md border border-[#262930] bg-[#121317] px-3.5 text-sm text-[#ECEAE4] placeholder:text-[#7E828C] focus:border-[#4A4E57] focus:outline-none"
          />
          <button
            type="submit"
            disabled={busy || !draft.trim()}
            className="h-10 rounded-md bg-[#ECEAE4] px-4 text-sm font-semibold text-[#0C0D0F] hover:bg-white disabled:opacity-40"
          >
            Ask
          </button>
        </form>
      </aside>
    </div>
  );
}
