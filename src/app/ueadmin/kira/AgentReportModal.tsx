'use client';

import React from 'react';
import {
  X,
  FileText,
  Sparkles,
  Zap,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Bot,
  Activity,
  Layers,
} from 'lucide-react';
import type { SubAgentId, AgentPodData } from './types';

interface AgentReportModalProps {
  agent: AgentPodData | null;
  telemetry: any;
  onClose: () => void;
  onAskKiraToAnalyze: (agentId: SubAgentId, agentName: string, contextPrompt: string) => void;
}

export function AgentReportModal({
  agent,
  telemetry,
  onClose,
  onAskKiraToAnalyze,
}: AgentReportModalProps) {
  if (!agent) return null;

  const getDetailedReportData = (id: SubAgentId) => {
    switch (id) {
      case 'VEX': {
        const topProducts = telemetry?.salesTeam?.topSellingProducts || [];
        const leader = topProducts[0];
        const sample = telemetry?.salesTeam?.recentOrdersSample ?? 0;
        return {
          title: 'Sales Velocity & Demand',
          executiveSummary: sample > 0
            ? `Analyzed ${sample} recent orders from the last 30 days.${leader ? ` ${leader.name} leads with ${leader.unitsSold} units sold.` : ''}`
            : 'No non-cancelled orders in the last 30 days to analyze.',
          keyMetrics: [
            { label: 'Active Catalog', value: `${telemetry?.salesTeam?.totalCatalogActive ?? 0} SKUs (sampled)` },
            { label: 'Hot / Flash Deals', value: `${telemetry?.salesTeam?.hotProductsCount ?? 0} Active` },
            { label: 'Trending Homepage Items', value: `${telemetry?.salesTeam?.trendingCount ?? 0} Items` },
            { label: 'Orders Sampled', value: `${sample} Orders` },
          ],
          breakdownTitle: 'Top Selling Products by Units:',
          breakdownItems: topProducts.map((p: any, idx: number) => ({
            rank: `#${idx + 1}`,
            name: p.name,
            sku: p.sku,
            units: `${p.unitsSold} Units Sold`,
            revenue: `${Math.round(p.revenue).toLocaleString()} (order currency)`,
            stock: `${p.stock} units remaining`,
          })),
          kiraFocusPrompt: 'Using the live top-seller data, suggest a promotion and cross-selling plan to raise average order value across the GCC stores.',
        };
      }
      case 'CYPHER': {
        return {
          title: 'Dev & Homepage Health',
          executiveSummary: 'Kira does not run automated front-end diagnostics, so there are no DOM, hydration or route-health results to report. Catalog and homepage collection counts below are live.',
          keyMetrics: [
            { label: 'Active Catalog (sampled)', value: `${telemetry?.salesTeam?.totalCatalogActive ?? 0} Products` },
            { label: 'Trending on Homepage', value: `${telemetry?.salesTeam?.trendingCount ?? 0} Items` },
            { label: 'Fresh From Shelf', value: `${telemetry?.salesTeam?.freshShelfCount ?? 0} Items` },
            { label: 'Error Monitoring', value: 'Not connected' },
          ],
          breakdownTitle: 'Recorded performance metrics (last 7 days):',
          breakdownItems: (telemetry?.devTeam?.performanceMetrics || []).map((m: any) => ({
            rank: 'METRIC',
            name: m.name,
            sku: 'Real users',
            units: m.value,
            revenue: '7-day average',
            stock: 'PerformanceMetric',
          })),
          kiraFocusPrompt: 'What monitoring should we add (error tracking, real-user Web Vitals) so you can report on front-end health, and what should we check manually in the meantime?',
        };
      }
      case 'TARIQ': {
        const rankings = telemetry?.seoTeam?.middleEastRankings || [];
        const connected = !!telemetry?.seoTeam?.connected;
        return {
          title: 'Middle East & GCC Organic Search',
          executiveSummary: connected
            ? `Search visibility index at ${telemetry?.seoTeam?.visibilityScore} across Gulf markets.`
            : 'No SEO data source is connected, so there are no real rankings to report. Connect Google Search Console to track keyword positions per GCC market.',
          keyMetrics: [
            { label: 'GCC Visibility Index', value: telemetry?.seoTeam?.visibilityScore || 'Not connected' },
            { label: 'Average GCC Rank', value: telemetry?.seoTeam?.averageRankGCC ? `#${telemetry.seoTeam.averageRankGCC}` : 'Not connected' },
            { label: 'Tracked Keywords', value: String(rankings.length) },
            { label: 'Data Source', value: connected ? 'Search Console' : 'None yet' },
          ],
          breakdownTitle: 'Keyword Rankings:',
          breakdownItems: rankings.map((r: any) => ({
            rank: `Rank #${r.rank}`,
            name: r.keyword,
            sku: `Market: ${r.country}`,
            units: r.searchVolume,
            revenue: `Change: ${r.change}`,
            stock: r.status,
          })),
          kiraFocusPrompt: 'What would we need to connect to track real organic search rankings in UAE, KSA and Qatar, and which on-site SEO basics should we check first?',
        };
      }
      case 'ATLAS': {
        const critItems = telemetry?.stockTeam?.criticalInventory || [];
        const outItems = telemetry?.stockTeam?.outOfStockProducts || [];
        const lowCount = critItems.length;
        const outCount = telemetry?.stockTeam?.outOfStockCount ?? 0;
        const stores = Array.from(new Set(critItems.map((c: any) => c.store))).join(', ');
        return {
          title: 'Stock Alerts',
          executiveSummary: lowCount + outCount > 0
            ? `${lowCount} store SKUs (sample of up to 10) are at 5 units or fewer${stores ? ` in ${stores}` : ''}, and ${outCount} active products (sample of up to 10) are out of stock.`
            : 'No low-stock or out-of-stock items found.',
          keyMetrics: [
            { label: 'Low Stock (≤ 5), sampled', value: `${lowCount} Items` },
            { label: 'Out of Stock, sampled', value: `${outCount} Products` },
            { label: 'Stores Affected', value: stores || 'None' },
            { label: 'Urgency', value: outCount > 0 ? 'Restock needed' : lowCount > 0 ? 'Watch' : 'OK' },
          ],
          breakdownTitle: 'Items to restock:',
          breakdownItems: [
            ...critItems.map((c: any) => ({
              rank: c.quantity <= 2 ? 'CRITICAL' : 'LOW',
              name: c.productName,
              sku: `SKU: ${c.sku}`,
              units: `Store: ${c.store}`,
              revenue: 'Reorder',
              stock: `${c.quantity} units left`,
            })),
            ...outItems.map((o: any) => ({
              rank: 'OUT OF STOCK',
              name: o.name,
              sku: `SKU: ${o.sku}`,
              units: 'Main Catalog',
              revenue: 'Reorder',
              stock: '0 units',
            })),
          ],
          kiraFocusPrompt: 'Using the live low-stock and out-of-stock lists, draft a restock priority plan and suggest back-in-stock notifications for the most popular items.',
        };
      }
      case 'LYRA': {
        const reasons = telemetry?.devTeam?.dropOffReasons || {};
        const total = telemetry?.devTeam?.totalPendingCheckouts ?? 0;
        const top = Object.entries(reasons).sort((a: any, b: any) => b[1] - a[1])[0] as [string, number] | undefined;
        return {
          title: 'Checkout Drop-off',
          executiveSummary: total > 0
            ? `${total} checkout sessions were started in the last 7 days (sample of up to 30).${top && top[1] > 0 ? ` Most common stopping point: ${top[0]} (${top[1]}).` : ''}`
            : 'No checkout sessions recorded in the last 7 days.',
          keyMetrics: [
            { label: 'Checkout Sessions (7d)', value: `${total} Sessions` },
            { label: 'Top Drop-off Step', value: top && top[1] > 0 ? top[0] : 'n/a' },
            { label: 'Cancelled Orders (30d)', value: `${telemetry?.devTeam?.cancelledOrdersCount ?? 0}` },
            { label: 'Open Cancel Requests', value: `${telemetry?.devTeam?.cancelRequestsCount ?? 0}` },
          ],
          breakdownTitle: 'Drop-off step breakdown (heuristic, from payment method and address):',
          breakdownItems: Object.entries(reasons).map(([reason, count]: [string, any]) => ({
            rank: `${Math.round((count / (total || 1)) * 100)}%`,
            name: reason,
            sku: 'Checkout step',
            units: `${count} sessions`,
            revenue: 'Not completed',
            stock: 'Last 7 days',
          })),
          kiraFocusPrompt: 'Using the live checkout session breakdown, explain the most likely friction points and give step-by-step fixes plus a cart-recovery message template.',
        };
      }
      case 'MAYA': {
        const discounts = telemetry?.marketingTeam?.activeDiscounts || [];
        return {
          title: 'Marketing, Promo Codes & Review Sentiment',
          executiveSummary: telemetry?.marketingTeam?.totalVotes
            ? `Review satisfaction is ${telemetry.marketingTeam.customerSatisfactionRate}% across ${telemetry.marketingTeam.totalVotes} published reviews. ${discounts.length} discount codes are active.`
            : `No published reviews yet. ${discounts.length} discount codes are active.`,
          keyMetrics: [
            { label: 'Review Satisfaction', value: telemetry?.marketingTeam?.customerSatisfactionRate != null ? `${telemetry.marketingTeam.customerSatisfactionRate}%` : 'No reviews' },
            { label: '4–5★ Reviews', value: `${telemetry?.marketingTeam?.happyVotes ?? 0}` },
            { label: '1–2★ Reviews', value: `${telemetry?.marketingTeam?.sadVotes ?? 0}` },
            { label: 'Active Promo Codes', value: `${discounts.length} Active` },
          ],
          breakdownTitle: 'Active Promotions in Database:',
          breakdownItems: discounts.map((d: any) => ({
            rank: 'ACTIVE',
            name: `Code: ${d.code}`,
            sku: `${d.discountType} Discount`,
            units: `${d.value}% Off Cart`,
            revenue: `${d.uses} Total Redemptions`,
            stock: 'Live in Checkout',
          })),
          kiraFocusPrompt: 'Review our active discount codes and customer review sentiment from the live data. Propose a targeted campaign to lift sales on high-stock beauty products.',
        };
      }
      case 'AEGIS': {
        return {
          title: 'Transactions & Security',
          executiveSummary: 'Kira has no fraud or security monitoring connected, so it cannot certify transaction integrity. Order and cancellation counts below are live.',
          keyMetrics: [
            { label: 'Orders Sampled (30d)', value: `${telemetry?.salesTeam?.recentOrdersSample ?? 0} Orders` },
            { label: 'Cancelled (30d)', value: `${telemetry?.devTeam?.cancelledOrdersCount ?? 0} Orders` },
            { label: 'Open Cancel Requests', value: `${telemetry?.devTeam?.cancelRequestsCount ?? 0}` },
            { label: 'Fraud Monitoring', value: 'Not connected' },
          ],
          breakdownTitle: 'Payment providers in use:',
          breakdownItems: [
            { rank: 'INFO', name: 'Stripe (cards)', sku: 'Webhook', units: 'Configured in env', revenue: '—', stock: 'Check Stripe Radar' },
            { rank: 'INFO', name: 'Tabby / Tamara (BNPL)', sku: 'Partner API', units: 'Configured in env', revenue: '—', stock: 'Check partner dashboards' },
            { rank: 'INFO', name: 'Cash on delivery', sku: 'Manual confirmation', units: '—', revenue: '—', stock: 'Confirm by phone' },
          ],
          kiraFocusPrompt: 'Review cancellations and cancel requests in the live data and recommend fraud and chargeback safeguards for Stripe, Tabby, Tamara and COD.',
        };
      }
      case 'VELOX': {
        const speed = telemetry?.speedTeam;
        const vitals = speed?.coreWebVitals;
        const userIssues = speed?.userIssues;
        const events = speed?.topEventBreakdown || [];
        const started = userIssues?.beginCheckoutCount ?? 0;
        const purchased = userIssues?.purchaseCount ?? 0;

        return {
          title: 'Website Speed & Checkout Obstacles',
          executiveSummary: `${(userIssues?.totalTrackedUserEvents ?? 0).toLocaleString()} user events tracked in the last 30 days. ${started > 0 ? `${purchased} of ${started} started checkouts completed (${userIssues?.cartDropoffRate} did not).` : 'No checkout events were tracked.'} ${speed?.connected ? 'Real-user Web Vitals are shown below.' : 'No real-user speed data is recorded yet.'}`,
          keyMetrics: [
            { label: 'Largest Contentful Paint', value: vitals?.lcp?.value ? `${vitals.lcp.value} (target < 2.5s)` : 'Not recorded' },
            { label: 'Time to First Byte', value: vitals?.ttfb?.value ? `${vitals.ttfb.value} (target < 800ms)` : 'Not recorded' },
            { label: 'Checkouts → Purchases', value: `${started} → ${purchased}` },
            { label: 'Tracked Events (30d)', value: (userIssues?.totalTrackedUserEvents ?? 0).toLocaleString() },
          ],
          breakdownTitle: 'Tracked user events (last 30 days):',
          breakdownItems: [
            {
              rank: started > 0 && purchased / started < 0.2 ? 'OBSTACLE' : 'FUNNEL',
              name: 'Checkout Funnel',
              sku: `${started} started → ${purchased} purchased`,
              units: `${userIssues?.droppedCheckoutCount ?? 0} did not complete`,
              revenue: userIssues?.cartDropoffRate ? `${userIssues.cartDropoffRate} drop-off` : 'n/a',
              stock: 'From tracking log',
            },
            ...events.slice(0, 5).map((e: any) => ({
              rank: 'TRACKED',
              name: `Event: ${e.eventType}`,
              sku: 'Client Session',
              units: `${e.count.toLocaleString()} Logged`,
              revenue: 'Last 30 days',
              stock: 'Tracking log',
            })),
          ],
          kiraFocusPrompt: `Using the live funnel data (${started} checkouts started, ${purchased} purchases in 30 days), diagnose the most likely reasons customers drop off and give a prioritized UX and engineering plan to fix it.`,
        };
      }
    }
  };

  const report = getDetailedReportData(agent.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[36px] bg-white/95 backdrop-blur-3xl shadow-[20px_20px_60px_rgba(163,177,198,0.5),_-20px_-20px_60px_rgba(255,255,255,0.95)] p-6 sm:p-8 space-y-6 text-slate-950 relative scrollbar-thin scrollbar-thumb-slate-300">
        
        {/* Top Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-cyan-100 shadow-[4px_4px_10px_rgba(163,177,198,0.35),_-4px_-4px_10px_rgba(255,255,255,0.95)] flex items-center justify-center text-cyan-950">
              <FileText size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-950 font-black shadow-xs drop-shadow-xs">
                  OFFICIAL AGENT REPORT
                </span>
                <span className="text-[10px] font-mono text-slate-700 font-bold">
                  REF: RPT-{agent.codename}-LIVE
                </span>
              </div>
              <h2 className="text-lg font-black uppercase text-slate-950 drop-shadow-[0_1px_1px_rgba(0,0,0,0.18)] mt-0.5">
                {report.title}
              </h2>
              <p className="text-xs font-mono text-slate-800 font-bold">
                Prepared by AGENT {agent.name} &middot; {agent.team}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 shadow-[3px_3px_8px_rgba(163,177,198,0.3),_-3px_-3px_8px_rgba(255,255,255,0.9)] active:shadow-[inset_2px_2px_4px_rgba(163,177,198,0.4)] transition-all cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Executive Summary Pill */}
        <div className="p-4 rounded-2xl bg-slate-100/90 shadow-[inset_3px_3px_7px_rgba(163,177,198,0.35),_inset_-3px_-3px_7px_rgba(255,255,255,0.95)] space-y-1">
          <div className="text-[10px] font-mono font-black uppercase text-blue-950 tracking-wider flex items-center gap-1.5 drop-shadow-xs">
            <Sparkles size={12} className="text-blue-950" />
            <span>EXECUTIVE AUDIT SUMMARY</span>
          </div>
          <p className="text-xs font-mono text-slate-900 font-bold leading-relaxed">
            {report.executiveSummary}
          </p>
        </div>

        {/* Key KPI Metric Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {report.keyMetrics.map((km, idx) => (
            <div
              key={idx}
              className="p-3 rounded-2xl bg-white shadow-[4px_4px_10px_rgba(163,177,198,0.28),_-4px_-4px_10px_rgba(255,255,255,0.95)]"
            >
              <div className="text-[9px] font-mono font-black uppercase text-slate-700 truncate drop-shadow-xs">
                {km.label}
              </div>
              <div className="text-sm font-mono font-black text-slate-950 mt-1 drop-shadow-[0_1px_1px_rgba(0,0,0,0.15)]">
                {km.value}
              </div>
            </div>
          ))}
        </div>

        {/* Detailed Breakdown List */}
        <div className="space-y-2.5">
          <h3 className="text-xs font-mono font-black uppercase text-slate-950 tracking-wider drop-shadow-xs">
            {report.breakdownTitle}
          </h3>
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {report.breakdownItems.map((item: any, idx: number) => (
              <div
                key={idx}
                className="p-3 rounded-2xl bg-white shadow-[3px_3px_8px_rgba(163,177,198,0.25),_-3px_-3px_8px_rgba(255,255,255,0.9)] flex items-center justify-between gap-3 text-xs font-mono"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="px-2 py-0.5 rounded-lg bg-blue-100 text-blue-950 font-black text-[10px] shrink-0 drop-shadow-xs">
                    {item.rank}
                  </span>
                  <div className="min-w-0">
                    <div className="text-slate-950 font-black truncate max-w-xs drop-shadow-xs">
                      {item.name}
                    </div>
                    <div className="text-[10px] text-slate-700 font-bold truncate">
                      {item.sku} &middot; <span className="text-slate-900 font-black">{item.stock}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-slate-950 font-black drop-shadow-xs">{item.units}</div>
                  <div className="text-[10px] text-emerald-950 font-black">{item.revenue}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main CTA: Ask Kira to Analyze & Generate Improvement Solutions */}
        <div className="pt-3 flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={() => {
              onAskKiraToAnalyze(agent.id, agent.name, report.kiraFocusPrompt);
              onClose();
            }}
            className="w-full sm:flex-1 py-3.5 px-4 rounded-2xl bg-cyan-200 hover:bg-cyan-300 text-cyan-950 font-mono font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-[6px_6px_16px_rgba(163,177,198,0.38),_-6px_-6px_16px_rgba(255,255,255,0.95)] active:shadow-[inset_2px_2px_5px_rgba(6,182,212,0.4)] flex items-center justify-center gap-2 drop-shadow-xs"
          >
            <Bot size={16} />
            <span>ORDER KIRA: ANALYZE REPORT &amp; GET IMPROVEMENTS</span>
            <ArrowRight size={14} />
          </button>

          <button
            onClick={onClose}
            className="w-full sm:w-auto py-3.5 px-5 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-mono font-black text-xs uppercase transition-all cursor-pointer shadow-[4px_4px_10px_rgba(163,177,198,0.3),_-4px_-4px_10px_rgba(255,255,255,0.95)]"
          >
            DISMISS
          </button>
        </div>

      </div>
    </div>
  );
}
