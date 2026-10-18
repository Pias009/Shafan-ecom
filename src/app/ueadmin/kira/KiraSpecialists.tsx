'use client';

import React from 'react';
import { Code2, Eye, FileText, Globe, MessageSquareText, Package, ShieldCheck, Tag, TrendingUp, Zap, type LucideIcon } from 'lucide-react';
import type { AgentPodData, SubAgentId } from './types';

type Metric = { label: string; value: string; tone?: 'warn' | 'bad' | 'muted' };

const META: Record<SubAgentId, { icon: LucideIcon; accent: string; ring: string; focus: string; ask: string }> = {
  VEX: { icon: TrendingUp, accent: 'text-emerald-300 bg-emerald-400/10', ring: 'hover:border-emerald-400/40', focus: 'Sales & demand', ask: 'Which products sold the most in the last 30 days, and how is their stock?' },
  ATLAS: { icon: Package, accent: 'text-amber-300 bg-amber-400/10', ring: 'hover:border-amber-400/40', focus: 'Stock & restock', ask: 'Which products are out of stock or at 5 units or fewer? What should we restock first?' },
  LYRA: { icon: Eye, accent: 'text-rose-300 bg-rose-400/10', ring: 'hover:border-rose-400/40', focus: 'Checkout drop-off', ask: 'Where are customers dropping off in checkout, and what should we fix first?' },
  MAYA: { icon: Tag, accent: 'text-pink-300 bg-pink-400/10', ring: 'hover:border-pink-400/40', focus: 'Promotions & reviews', ask: 'How are our active discount codes performing, and what does review sentiment say?' },
  AEGIS: { icon: ShieldCheck, accent: 'text-sky-300 bg-sky-400/10', ring: 'hover:border-sky-400/40', focus: 'Cancellations & payments', ask: 'Summarise cancellations and open cancel requests. Anything suspicious?' },
  VELOX: { icon: Zap, accent: 'text-orange-300 bg-orange-400/10', ring: 'hover:border-orange-400/40', focus: 'Funnel & speed', ask: 'Walk me through the visitor funnel for the last 30 days.' },
  CYPHER: { icon: Code2, accent: 'text-cyan-300 bg-cyan-400/10', ring: 'hover:border-cyan-400/40', focus: 'Catalog health', ask: 'How healthy is our catalog and homepage collections right now?' },
  TARIQ: { icon: Globe, accent: 'text-violet-300 bg-violet-400/10', ring: 'hover:border-violet-400/40', focus: 'Search & SEO', ask: 'What would we need to connect to track our Google rankings in the GCC?' },
};

const ORDER: SubAgentId[] = ['VEX', 'ATLAS', 'LYRA', 'MAYA', 'AEGIS', 'VELOX', 'CYPHER', 'TARIQ'];

const n = (v: unknown) => (typeof v === 'number' ? v.toLocaleString() : '—');

function metricsFor(id: SubAgentId, t: any): { metrics: Metric[]; connected: boolean } {
  if (!t) return { metrics: [{ label: 'Status', value: 'Loading live data…', tone: 'muted' }], connected: true };
  const o = t.overview || {};
  switch (id) {
    case 'VEX': {
      const top = t.salesTeam?.topSellingProducts?.[0];
      return {
        connected: true,
        metrics: [
          { label: 'Top seller (30d)', value: top ? `${top.name} · ${top.unitsSold} units` : 'No sales yet' },
          { label: 'Orders (30d)', value: n(o.orders30) },
          { label: 'Hot deals / trending', value: `${n(t.salesTeam?.hotProductsCount)} / ${n(t.salesTeam?.trendingCount)}` },
        ],
      };
    }
    case 'ATLAS': {
      const first = t.stockTeam?.criticalInventory?.[0];
      return {
        connected: true,
        metrics: [
          { label: 'Out of stock', value: n(o.outOfStockCount), tone: o.outOfStockCount > 0 ? 'bad' : undefined },
          { label: 'Store SKUs ≤ 5 units', value: n(o.lowStockCount), tone: o.lowStockCount > 0 ? 'warn' : undefined },
          { label: 'Lowest item', value: first ? `${first.productName} · ${first.quantity} left (${first.store})` : 'None' },
        ],
      };
    }
    case 'LYRA': {
      const reasons = Object.entries(t.devTeam?.dropOffReasons || {}).sort((a: any, b: any) => b[1] - a[1]) as [string, number][];
      return {
        connected: true,
        metrics: [
          { label: 'Open checkout sessions', value: n(o.openCheckouts) },
          { label: 'Most common stop (7d)', value: reasons[0] && reasons[0][1] > 0 ? `${reasons[0][0]} (${reasons[0][1]})` : 'n/a' },
          { label: 'Open cancel requests', value: n(o.cancelRequests) },
        ],
      };
    }
    case 'MAYA': {
      const d = t.marketingTeam?.activeDiscounts || [];
      const sat = t.marketingTeam?.customerSatisfactionRate;
      return {
        connected: true,
        metrics: [
          { label: 'Active discount codes', value: n(d.length) },
          { label: 'Most used code', value: d.length ? [...d].sort((a: any, b: any) => b.uses - a.uses).map((x: any) => `${x.code} · ${x.uses} uses`)[0] : 'None' },
          { label: 'Review satisfaction', value: sat == null ? 'No reviews yet' : `${sat}% (${n(t.marketingTeam?.totalVotes)} reviews)` },
        ],
      };
    }
    case 'AEGIS':
      return {
        connected: true,
        metrics: [
          { label: 'Cancelled (30d)', value: n(t.devTeam?.cancelledOrdersCount) },
          { label: 'Open cancel requests', value: n(o.cancelRequests) },
          { label: 'Fraud monitoring', value: 'Not connected', tone: 'muted' },
        ],
      };
    case 'VELOX': {
      const u = t.speedTeam?.userIssues || {};
      return {
        connected: true,
        metrics: [
          { label: 'Checkout → purchase', value: `${n(u.beginCheckoutCount)} → ${n(u.purchaseCount)}${o.checkoutToPurchaseRate ? ` (${o.checkoutToPurchaseRate})` : ''}` },
          { label: 'Tracked events (30d)', value: n(u.totalTrackedUserEvents) },
          { label: 'Real-user LCP', value: t.speedTeam?.coreWebVitals?.lcp?.value || 'Not recorded', tone: t.speedTeam?.coreWebVitals?.lcp?.value ? undefined : 'muted' },
        ],
      };
    }
    case 'CYPHER':
      return {
        connected: true,
        metrics: [
          { label: 'Trending on homepage', value: n(t.salesTeam?.trendingCount) },
          { label: 'Fresh from shelf', value: n(t.salesTeam?.freshShelfCount) },
          { label: 'Error monitoring', value: 'Not connected', tone: 'muted' },
        ],
      };
    case 'TARIQ':
      return {
        connected: false,
        metrics: [
          { label: 'Google Search Console', value: 'Not connected', tone: 'muted' },
          { label: 'Tracked keywords', value: '0', tone: 'muted' },
        ],
      };
  }
}

const TONE: Record<string, string> = { warn: 'text-amber-300', bad: 'text-rose-300', muted: 'text-slate-400' };

export function KiraSpecialists({
  pods,
  telemetry,
  activeAgentId,
  busy,
  onAsk,
  onReport,
}: {
  pods: Record<SubAgentId, AgentPodData>;
  telemetry: any;
  activeAgentId: string | null;
  busy: boolean;
  onAsk: (id: SubAgentId, prompt: string) => void;
  onReport: (id: SubAgentId) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-4">
      {ORDER.map((id) => {
        const pod = pods[id];
        const meta = META[id];
        const Icon = meta.icon;
        const { metrics, connected } = metricsFor(id, telemetry);
        const working = activeAgentId === id && busy;
        return (
          <article
            key={id}
            className={`group relative flex flex-col rounded-xl border border-white/[0.08] bg-white/[0.025] p-4 transition-colors ${meta.ring} ${activeAgentId === id ? 'border-cyan-400/40 bg-cyan-400/[0.04]' : ''}`}
          >
            <header className="flex items-start gap-3">
              <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${meta.accent}`}>
                <Icon size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-white">{pod.name}</h3>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      working ? 'bg-cyan-400/15 text-cyan-200' : connected ? 'bg-emerald-400/10 text-emerald-300' : 'bg-slate-500/15 text-slate-400'
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${working ? 'bg-cyan-300 animate-pulse' : connected ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                    {working ? 'Working' : connected ? 'Live' : 'Not connected'}
                  </span>
                </div>
                <p className="text-xs text-slate-400">{meta.focus}</p>
              </div>
            </header>

            <dl className="mt-3 flex-1 space-y-2 border-t border-white/[0.06] pt-3">
              {metrics.map((m) => (
                <div key={m.label} className="flex items-baseline justify-between gap-3 text-xs">
                  <dt className="shrink-0 text-slate-400">{m.label}</dt>
                  <dd className={`min-w-0 break-words text-right font-mono tabular-nums ${m.tone ? TONE[m.tone] : 'text-slate-100'}`}>{m.value}</dd>
                </div>
              ))}
            </dl>

            <footer className="mt-4 flex gap-2">
              <button
                onClick={() => onReport(id)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:bg-white/[0.07]"
              >
                <FileText size={13} /> Report
              </button>
              <button
                onClick={() => onAsk(id, meta.ask)}
                disabled={busy}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-cyan-400/10 px-2.5 py-1.5 text-xs font-medium text-cyan-200 hover:bg-cyan-400/20 disabled:opacity-50"
              >
                <MessageSquareText size={13} /> Ask Kira
              </button>
            </footer>
          </article>
        );
      })}
    </div>
  );
}
