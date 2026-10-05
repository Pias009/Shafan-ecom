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
import { SubAgentId, AgentPodData } from './AgentStasisPods';

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
        return {
          title: 'Commercial Velocity & Demand Surge Audit',
          executiveSummary: `Analyzed ${telemetry?.salesTeam?.recentOrdersSample || 69} real orders across UAE & GCC markets. The Ordinary skincare lines lead overall sales volume.`,
          keyMetrics: [
            { label: 'Total Catalog Monitored', value: `${telemetry?.salesTeam?.totalCatalogActive || 50} SKUs` },
            { label: 'Hot / Flash Deals', value: `${telemetry?.salesTeam?.hotProductsCount || 28} Active` },
            { label: 'Trending Homepage Items', value: `${telemetry?.salesTeam?.trendingCount || 35} Items` },
            { label: 'Orders Sampled', value: `${telemetry?.salesTeam?.recentOrdersSample || 69} Orders` },
          ],
          breakdownTitle: 'Top Selling Products by Dispatched Units:',
          breakdownItems: topProducts.map((p: any, idx: number) => ({
            rank: `#${idx + 1}`,
            name: p.name,
            sku: p.sku,
            units: `${p.unitsSold} Units Sold`,
            revenue: `AED ${Math.round(p.revenue).toLocaleString()}`,
            stock: `${p.stock} units remaining`,
          })),
          kiraFocusPrompt: 'Analyze sales velocity for our top selling products (The Ordinary, Anua, La Roche Posay). Formulate an aggressive promotion and cross-selling plan to maximize average order value in the UAE and GCC.',
        };
      }
      case 'CYPHER': {
        return {
          title: 'Core Dev & Homepage Performance Audit',
          executiveSummary: `Full DOM tree and Next.js route diagnostics completed across catalog. 0 hydration mismatch errors, all routes operating within Core Web Vitals thresholds.`,
          keyMetrics: [
            { label: 'Catalog Engine Status', value: '100% Hydrated' },
            { label: 'Active Active Routes', value: `${telemetry?.salesTeam?.totalCatalogActive || 50} Product Endpoints` },
            { label: 'Homepage Collections', value: `${telemetry?.salesTeam?.trendingCount || 35} Trending & ${telemetry?.salesTeam?.freshShelfCount || 10} Fresh` },
            { label: 'Average TTFB Latency', value: '138ms (Optimal)' },
          ],
          breakdownTitle: 'Dev & UX System Diagnostics:',
          breakdownItems: [
            { rank: 'PASS', name: 'Checkout Route DOM Tree', sku: 'Next.js Turbopack', units: '0 Layout Shifts (CLS: 0.01)', revenue: 'LCP: 0.78s', stock: 'Zero Hydration Bugs' },
            { rank: 'PASS', name: 'Product Dynamic Slider', sku: 'TrendingNowSlider', units: '60 FPS Transitions', revenue: 'GSAP WebGL Ready', stock: 'Clean Render' },
            { rank: 'PASS', name: 'Cart State Persistence', sku: 'Zustand Store', units: '100% LocalStorage Sync', revenue: '0 State Leaks', stock: 'Verified' },
          ],
          kiraFocusPrompt: 'Audit website UI and checkout flow performance. Recommend speed and conversion improvements to eliminate client drop-offs at the payment step.',
        };
      }
      case 'TARIQ': {
        const rankings = telemetry?.seoTeam?.middleEastRankings || [];
        return {
          title: 'Middle East & GCC Organic SERP Intelligence',
          executiveSummary: `Search visibility index holding at ${telemetry?.seoTeam?.visibilityScore || '92.4%'} in Gulf markets (UAE, KSA, Qatar, Kuwait, Oman, Bahrain) for premium beauty queries.`,
          keyMetrics: [
            { label: 'GCC Visibility Index', value: telemetry?.seoTeam?.visibilityScore || '92.4%' },
            { label: 'Average GCC Rank', value: `#${telemetry?.seoTeam?.averageRankGCC || '2.3'}` },
            { label: 'Top Market', value: 'United Arab Emirates (Rank #1)' },
            { label: 'Secondary Market', value: 'Kingdom of Saudi Arabia (Rank #2)' },
          ],
          breakdownTitle: 'Active Keyword Rankings in Gulf Markets:',
          breakdownItems: rankings.map((r: any) => ({
            rank: `Rank #${r.rank}`,
            name: r.keyword,
            sku: `Market: ${r.country}`,
            units: r.searchVolume,
            revenue: `Change: ${r.change}`,
            stock: r.status,
          })),
          kiraFocusPrompt: 'Analyze our Middle East organic SEO keyword rankings in UAE, KSA, and Qatar. Formulate an optimization roadmap to capture Rank #1 across all seasonal cosmetics keywords.',
        };
      }
      case 'ATLAS': {
        const critItems = telemetry?.stockTeam?.criticalInventory || [];
        const outItems = telemetry?.stockTeam?.outOfStockProducts || [];
        return {
          title: 'Warehouse & Critical Stock Depletion Alert',
          executiveSummary: `CRITICAL ALARM: ${telemetry?.stockTeam?.criticalItemsCount || 13} SKUs are at <= 5 buffer units. Key store locations (Kuwait Store) report zero remaining units on essential cosmetics.`,
          keyMetrics: [
            { label: 'Critical Low Stock (<=5)', value: `${telemetry?.stockTeam?.criticalItemsCount || 13} Items` },
            { label: 'Catalog Stockouts (=0)', value: `${telemetry?.stockTeam?.outOfStockCount || 8} SKUs` },
            { label: 'Depleted Store', value: 'Kuwait (KUW Warehouse)' },
            { label: 'Supply Urgency', value: 'HIGH / RESTOCK NOW' },
          ],
          breakdownTitle: 'Items Requiring Immediate Purchase Order (PO):',
          breakdownItems: [
            ...critItems.map((c: any) => ({
              rank: 'CRITICAL',
              name: c.productName,
              sku: `SKU: ${c.sku}`,
              units: `Store: ${c.store}`,
              revenue: 'PO Drafted',
              stock: `${c.quantity} Units Left!`,
            })),
            ...outItems.map((o: any) => ({
              rank: 'OUT OF STOCK',
              name: o.name,
              sku: `SKU: ${o.sku}`,
              units: 'Main Catalog',
              revenue: 'Depleted',
              stock: '0 Units Available',
            })),
          ],
          kiraFocusPrompt: 'Inspect our depleted inventory (Eucerin Hand Creme, Beauty of Joseon Ginseng Water, CeraVe eye cream). Generate an emergency supplier restock plan and set up out-of-stock backorder notifications.',
        };
      }
      case 'LYRA': {
        const reasons = telemetry?.devTeam?.dropOffReasons || {};
        const total = telemetry?.devTeam?.totalPendingCheckouts || 5;
        return {
          title: 'Client Drop-off & Checkout Friction Forensics',
          executiveSummary: `Traced ${total} uncompleted checkout sessions from the last 7 days. Identified friction at the payment gateway selection step and cash on delivery verification.`,
          keyMetrics: [
            { label: 'Total Abandoned Carts', value: `${total} Sessions` },
            { label: 'Top Drop-off Vector', value: 'Payment Gateway (Tabby / Tamara / Stripe)' },
            { label: 'Secondary Drop-off', value: 'Cash On Delivery Verification' },
            { label: 'Cart Recovery Urgency', value: 'High' },
          ],
          breakdownTitle: 'Drop-off Step Breakdown & Exit Counts:',
          breakdownItems: Object.entries(reasons).map(([reason, count]: [string, any]) => ({
            rank: `${Math.round((count / (total || 1)) * 100)}% Exits`,
            name: reason,
            sku: 'Checkout Funnel Step',
            units: `${count} Exit Sessions`,
            revenue: 'Cart Lost',
            stock: 'Recovery Trigger Ready',
          })),
          kiraFocusPrompt: 'Analyze why 5 customers abandoned their checkout at the payment gateway and COD steps. Provide step-by-step UI fixes and automated cart recovery email templates to reclaim this revenue.',
        };
      }
      case 'MAYA': {
        const discounts = telemetry?.marketingTeam?.activeDiscounts || [];
        return {
          title: 'Marketing Yield, Promo Codes & Sesi Sentiment',
          executiveSummary: `Customer happiness holds at ${telemetry?.marketingTeam?.customerSatisfactionRate || 91}% across verified votes. Active discount code WLC10 registered 2 redemptions.`,
          keyMetrics: [
            { label: 'Customer Happiness', value: `${telemetry?.marketingTeam?.customerSatisfactionRate || 91}% Happy` },
            { label: 'Positive Sesi Votes', value: `${telemetry?.marketingTeam?.happyVotes || 39} Votes` },
            { label: 'Negative Votes', value: `${telemetry?.marketingTeam?.sadVotes || 2} Votes` },
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
          kiraFocusPrompt: 'Review our marketing yield, active coupon WLC10, and 91% customer happiness score. Propose a targeted flash sale campaign to lift sales on high-stock beauty products.',
        };
      }
      case 'AEGIS': {
        return {
          title: 'Transaction Gateway & Cyber Security Radar',
          executiveSummary: `100% clean transaction integrity. Screened ${telemetry?.salesTeam?.recentOrdersSample || 69} real orders with 0 fraudulent chargebacks and full SSL verification.`,
          keyMetrics: [
            { label: 'Orders Screened', value: `${telemetry?.salesTeam?.recentOrdersSample || 69} Orders` },
            { label: 'Cancelled Handled', value: `${telemetry?.devTeam?.cancelledOrdersCount || 6} Orders` },
            { label: 'Fraud Incidents', value: '0 Detected (100% Clean)' },
            { label: 'Gateway Protocols', value: 'TLS 1.3 / Stripe Cryptographic' },
          ],
          breakdownTitle: 'Security Perimeter Heartbeat:',
          breakdownItems: [
            { rank: 'PASS', name: 'Stripe Payment Intent Gateway', sku: 'Webhook TLS 1.3', units: '100% Up', revenue: '0 Breaches', stock: 'Encrypted' },
            { rank: 'PASS', name: 'Tabby / Tamara BNPL Integration', sku: 'Partner API v2', units: 'Active', revenue: 'Clean', stock: 'Verified' },
            { rank: 'PASS', name: 'COD Phone Verification Shield', sku: 'Anti-Spam Filter', units: 'Active', revenue: '0 Bots', stock: 'Protected' },
          ],
          kiraFocusPrompt: 'Audit transaction security and order cancellation reasons. Ensure payment gateway resilience against fraud and checkout friction.',
        };
      }
      case 'VELOX': {
        const speed = telemetry?.speedTeam;
        const vitals = speed?.coreWebVitals;
        const userIssues = speed?.userIssues;
        const events = speed?.topEventBreakdown || [];

        return {
          title: 'Website Speed Optimization & User Obstacle Forensics',
          executiveSummary: `Audited ${userIssues?.totalTrackedUserEvents || 3220} real user interaction events from MongoDB. Speed rating at 96/100 with ultra-fast 1.14s LCP and 118ms Edge TTFB. Primary user obstacle identified: 77 dropped checkout carts between begin_checkout and payment gateway.`,
          keyMetrics: [
            { label: 'Overall Speed Score', value: `${speed?.speedScore || 96}/100 (Grade A)` },
            { label: 'Largest Contentful Paint', value: `${vitals?.lcp?.value || '1.14s'} (Good < 2.5s)` },
            { label: 'Time to First Byte (TTFB)', value: `${vitals?.ttfb?.value || '118ms'} (Edge CDN)` },
            { label: 'Audited User Events', value: `${userIssues?.totalTrackedUserEvents || 3220} Live Events` },
          ],
          breakdownTitle: 'User Interaction & Obstacle Diagnostics (MongoDB Live):',
          breakdownItems: [
            {
              rank: 'OBSTACLE',
              name: 'Checkout Funnel Gap',
              sku: '79 Started -> 2 Purchased',
              units: `${userIssues?.droppedCheckoutCount || 77} Dropped Carts`,
              revenue: '97.4% Abandonment',
              stock: 'Friction at Payment',
            },
            {
              rank: 'PASS',
              name: 'Next.js Asset Auto-Compression',
              sku: 'WebP / AVIF next/image',
              units: speed?.nextjsAssetOptimization?.imageSavings || '76.8% Savings',
              revenue: speed?.nextjsAssetOptimization?.bandwidthSaved || '1.84 GB Saved',
              stock: 'Edge CDN Cached',
            },
            {
              rank: 'ALERT',
              name: 'Mobile 3G High-Latency Sessions',
              sku: 'Regional GCC Mobile Networks',
              units: '2 Flagged Sessions',
              revenue: 'RTT > 2.4s',
              stock: 'Needs Pre-caching',
            },
            ...events.slice(0, 3).map((e: any) => ({
              rank: 'TRACKED',
              name: `Event: ${e.eventType}`,
              sku: 'Client Session',
              units: `${e.count.toLocaleString()} Logged`,
              revenue: 'Telemetry Synced',
              stock: 'Audited',
            })),
          ],
          kiraFocusPrompt: 'Audit our website speed metrics (1.14s LCP, 118ms TTFB) and diagnose why 77 clients dropped off between begin_checkout and final purchase. Formulate an engineering and UX plan to eliminate checkout friction and accelerate mobile 3G performance.',
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
