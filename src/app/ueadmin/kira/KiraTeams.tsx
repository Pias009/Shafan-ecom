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

/** Live state of a team: green and animated while on, grey when switched off. */
export function ActivityMark({ active, working }: { active: boolean; working?: boolean }) {
  if (!active) {
    return (
      <span className="kira-mono inline-flex items-center gap-1.5 text-[11px] text-[#8A8E98]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#5E626B]" /> Off
      </span>
    );
  }
  return (
    <span className="kira-mono inline-flex items-center gap-1.5 text-[11px] font-medium text-[#5FD08A]">
      <span className="relative flex h-2 w-2">
        <span className={`kira-ping absolute inline-flex h-full w-full rounded-full bg-[#5FD08A] ${working ? 'kira-ping-fast' : ''}`} />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-[#5FD08A]" />
      </span>
      {working ? 'Working' : 'Active'}
    </span>
  );
}

/** On/off switch for a team. */
export function TeamSwitch({ team, active, busy, onToggle }: { team: TeamConfig; active: boolean; busy?: boolean; onToggle: (active: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      aria-label={`${team.name} team ${active ? 'on' : 'off'}`}
      title={active ? `Turn the ${team.short} team off` : `Turn the ${team.short} team on`}
      disabled={busy}
      onClick={() => onToggle(!active)}
      className={`inline-flex h-[20px] w-9 shrink-0 items-center rounded-full border p-[2px] transition-colors disabled:cursor-wait ${
        active ? 'border-[#3FB36B] bg-[#3FB36B]' : 'border-[#3A3D45] bg-[#1A1C21] hover:border-[#4A4E57]'
      }`}
    >
      <span className={`h-3.5 w-3.5 rounded-full shadow transition-transform duration-200 ${active ? 'translate-x-4 bg-white' : 'bg-[#8A8E98]'}`} />
    </button>
  );
}

function Roster({ team, working, active = true }: { team: TeamConfig; working?: boolean; active?: boolean }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <div className="flex shrink-0 gap-1">
        {team.members.map((m, i) => (
          <span
            key={m.role}
            title={`${m.role}: ${m.does}${active ? ' · online' : ' · off'}`}
            className={`kira-mono relative grid h-6 w-6 place-items-center rounded-[4px] border text-[9.5px] font-medium ${
              working && i === 0 ? 'kira-working border-[#5FD08A]/70 bg-[#16241B] text-[#ECEAE4]' : 'border-[#2A2D34] bg-[#17191E] text-[#B9BBC1]'
            }`}
          >
            {initials(m.role)}
            {active && <span aria-hidden className="absolute -bottom-[3px] -right-[3px] h-[7px] w-[7px] rounded-full border-[1.5px] border-[#121317] bg-[#5FD08A]" />}
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
  active,
  toggling,
  onToggle,
  onOpen,
  onBrief,
}: {
  team: TeamConfig;
  insight?: TeamInsight;
  working: boolean;
  active: boolean;
  toggling?: boolean;
  onToggle: (active: boolean) => void;
  onOpen: () => void;
  onBrief: () => void;
}) {
  const Icon = TEAM_ICONS[team.icon] || Sparkles;
  const status = insight?.status || 'limited';
  return (
    <article
      className={`group relative flex flex-col overflow-hidden rounded-md border transition-colors ${
        !active
          ? 'border-[#1F2126] bg-[#0F1013]'
          : working
            ? 'border-[#5FD08A]/60 bg-[#121317]'
            : 'border-[#23252B] bg-[#121317] hover:border-[#363942]'
      }`}
    >
      <span aria-hidden className={`absolute inset-y-0 left-0 w-[2px] ${!active ? 'bg-[#2A2D34]' : working ? 'bg-[#5FD08A]' : STATUS[status].color}`} />
      {active && (
        // Activity sweep along the top edge: slow while on duty, fast while working on a request.
        <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[2px] overflow-hidden">
          <span className={`kira-scan block h-full w-1/4 bg-[#5FD08A] ${working ? 'kira-scan-fast' : ''}`} />
        </span>
      )}

      <div className="px-4 pb-3 pt-3.5">
        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-2.5">
            <span className="kira-mono text-[11px] text-[#7E828C]">{team.code}</span>
            <ActivityMark active={active} working={working} />
          </span>
          <TeamSwitch team={team} active={active} busy={toggling} onToggle={onToggle} />
        </div>
        <h3 className={`mt-1.5 flex items-start gap-2 text-[15px] font-semibold leading-snug ${active ? 'text-[#ECEAE4]' : 'text-[#A9ACB4]'}`}>
          <Icon size={16} strokeWidth={1.75} className={`mt-[3px] shrink-0 ${active ? 'text-[#8A8E98]' : 'text-[#6B6F78]'}`} />
          {team.name}
        </h3>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <Roster team={team} working={working} active={active} />
          {active && <StatusMark status={status} />}
        </div>
        <p className={`mt-3 text-[13.5px] leading-snug ${active ? 'text-[#D9D7D1]' : 'text-[#8A8E98]'}`}>
          {active ? insight?.headline || 'Loading live data…' : 'Switched off. Kira won’t send work here or include this team in briefings.'}
        </p>
      </div>

      {active && (
        <>
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
        </>
      )}

      <footer className="mt-auto flex items-center justify-between border-t border-[#1F2126] px-2 py-1.5">
        <button onClick={onOpen} className="flex items-center gap-1 rounded px-2 py-1 text-[12.5px] font-medium text-[#D4D2CC] hover:bg-[#1A1C21] hover:text-white">
          Open team <ArrowRight size={13} />
        </button>
        {active ? (
          <button onClick={onBrief} className="rounded bg-[#ECEAE4] px-2.5 py-1 text-[12.5px] font-medium text-[#0C0D0F] hover:bg-white">
            Brief me
          </button>
        ) : (
          <button
            onClick={() => onToggle(true)}
            disabled={toggling}
            className="rounded border border-[#3FB36B]/60 px-2.5 py-1 text-[12.5px] font-medium text-[#7FDCA0] hover:bg-[#3FB36B]/10 disabled:cursor-wait"
          >
            Turn on
          </button>
        )}
      </footer>
    </article>
  );
}

/** Kira, three departments, ten teams. */
export function TeamsOrgChart({
  insights,
  workingTeam,
  paused,
  toggling,
  onToggle,
  onOpen,
  onBrief,
}: {
  insights: KiraInsights | null;
  workingTeam: TeamId | null;
  paused: TeamId[];
  toggling: TeamId | 'all' | null;
  onToggle: (id: TeamId, active: boolean) => void;
  onOpen: (id: TeamId) => void;
  onBrief: (id: TeamId) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-x-5 gap-y-8 lg:grid-cols-3">
      {DEPARTMENTS.map((dept, di) => {
        const teams = TEAMS.filter((t) => t.department === dept.id);
        const live = teams.filter((t) => !paused.includes(t.id));
        const needs = live.filter((t) => insights?.teams[t.id]?.status === 'attention').length;
        return (
          <section key={dept.id} className="min-w-0">
            <header className="mb-3 border-b border-[#23252B] pb-3 lg:min-h-[84px]">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-[13px] font-semibold uppercase tracking-[0.14em] text-[#ECEAE4]">{dept.name}</h2>
                <span className="kira-mono text-[11px] text-[#7E828C]">0{di + 1}</span>
              </div>
              <p className="mt-1 text-[12.5px] text-[#A9ACB4]">{dept.purpose}</p>
              <p className="kira-mono mt-1.5 text-[11px] text-[#8A8E98]">
                {teams.length} teams · <span className="text-[#5FD08A]">{live.length} active</span>
                {needs ? <span className="text-[#F2B33D]"> · {needs} need{needs === 1 ? 's' : ''} attention</span> : live.length ? <span className="text-[#8FC79E]"> · on track</span> : null}
              </p>
            </header>
            <div className="space-y-3">
              {teams.map((t) => (
                <TeamCard
                  key={t.id}
                  team={t}
                  insight={insights?.teams[t.id]}
                  working={workingTeam === t.id}
                  active={!paused.includes(t.id)}
                  toggling={toggling === t.id || toggling === 'all'}
                  onToggle={(active) => onToggle(t.id, active)}
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
  active,
  toggling,
  onToggle,
  onClose,
  onAsk,
}: {
  team: TeamConfig | null;
  insight?: TeamInsight;
  busy: boolean;
  active: boolean;
  toggling?: boolean;
  onToggle: (team: TeamId, active: boolean) => void;
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
          <div className="mt-4 flex items-center justify-between gap-3 rounded-md border border-[#23252B] bg-[#121317] px-3.5 py-2.5">
            <span className="flex items-center gap-3">
              <ActivityMark active={active} working={busy && active} />
              {active && <StatusMark status={status} />}
            </span>
            <span className="flex items-center gap-2.5 text-[12.5px] text-[#A9ACB4]">
              {active ? 'On duty' : 'Switched off'}
              <TeamSwitch team={team} active={active} busy={toggling} onToggle={(v) => onToggle(team.id, v)} />
            </span>
          </div>
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
            {!active && <p className="mb-2.5 text-[12.5px] text-[#F2B33D]">This team is switched off. Turn it on to ask it questions.</p>}
            <div className="space-y-1.5">
              {team.questions.map((q) => (
                <button
                  key={q}
                  disabled={busy || !active}
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
            disabled={busy || !active || !draft.trim()}
            className="h-10 rounded-md bg-[#ECEAE4] px-4 text-sm font-semibold text-[#0C0D0F] hover:bg-white disabled:opacity-40"
          >
            Ask
          </button>
        </form>
      </aside>
    </div>
  );
}
