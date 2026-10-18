'use client';

import React, { useState } from 'react';
import {
  X,
  Download,
  FileText,
  TrendingUp,
  Package,
  Eye,
  Globe,
  Tag,
  ShieldCheck,
  Bot,
  Sparkles,
  ArrowRight,
  Zap,
} from 'lucide-react';

interface MasterReportModalProps {
  telemetry: any;
  identity: any;
  onClose: () => void;
  onDownloadReport: () => void;
  onOrderStorewideImprovement: (prompt: string) => void;
}

export function MasterReportModal({
  telemetry,
  identity,
  onClose,
  onDownloadReport,
  onOrderStorewideImprovement,
}: MasterReportModalProps) {
  const [activeTab, setActiveTab] = useState<'sales' | 'stock' | 'dropoffs' | 'seo' | 'marketing' | 'speed'>('sales');

  const topProducts = telemetry?.salesTeam?.topSellingProducts || [];
  const critInventory = telemetry?.stockTeam?.criticalInventory || [];
  const outOfStock = telemetry?.stockTeam?.outOfStockProducts || [];
  const dropReasons = telemetry?.devTeam?.dropOffReasons || {};
  const totalDropoffs = telemetry?.devTeam?.totalPendingCheckouts || 0;
  const seoRanks = telemetry?.seoTeam?.middleEastRankings || [];
  const discounts = telemetry?.marketingTeam?.activeDiscounts || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
      <div className="w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-[36px] bg-white/95 backdrop-blur-3xl shadow-[20px_20px_60px_rgba(163,177,198,0.5),_-20px_-20px_60px_rgba(255,255,255,0.95)] p-6 sm:p-8 space-y-6 text-slate-950 relative scrollbar-thin scrollbar-thumb-slate-300">
        
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-cyan-100 shadow-[4px_4px_10px_rgba(163,177,198,0.35),_-4px_-4px_10px_rgba(255,255,255,0.95)] flex items-center justify-center text-cyan-950">
              <FileText size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-lg bg-blue-100 text-blue-950 font-black shadow-xs drop-shadow-xs">
                  MASTER TELEMETRY AUDIT
                </span>
                <span className="text-[10px] font-mono text-slate-700 font-bold">
                  7 SQUADS SYNCHRONIZED
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black uppercase text-slate-950 drop-shadow-[0_1px_1px_rgba(0,0,0,0.18)] mt-0.5">
                Shafan Enterprise Operations Report
              </h2>
              <p className="text-xs font-mono text-slate-800 font-bold">
                Prepared by AGENT KIRA for {identity?.honorific || 'Sir'} {identity?.name || 'Admin'}
              </p>
            </div>
          </div>

          {/* Action buttons in header */}
          <div className="flex items-center gap-2.5 self-end sm:self-auto">
            {/* Download Button */}
            <button
              onClick={onDownloadReport}
              className="px-3.5 py-2 rounded-xl bg-cyan-100 hover:bg-cyan-200 text-cyan-950 text-xs font-mono font-black shadow-[3px_3px_8px_rgba(163,177,198,0.35),_-3px_-3px_8px_rgba(255,255,255,0.95)] active:shadow-[inset_2px_2px_4px_rgba(6,182,212,0.4)] transition-all cursor-pointer flex items-center gap-1.5 drop-shadow-xs"
              title="Download report file (.txt)"
            >
              <Download size={14} />
              <span>DOWNLOAD FILE</span>
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 shadow-[3px_3px_8px_rgba(163,177,198,0.3),_-3px_-3px_8px_rgba(255,255,255,0.9)] active:shadow-[inset_2px_2px_4px_rgba(163,177,198,0.4)] transition-all cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* 3D Morphic Tab Selector */}
        <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
          {[
            { id: 'sales', label: 'Sales Velocity', icon: TrendingUp },
            { id: 'stock', label: 'Stock Alarms', icon: Package },
            { id: 'dropoffs', label: 'Checkout Exits', icon: Eye },
            { id: 'seo', label: 'Middle East SEO', icon: Globe },
            { id: 'marketing', label: 'Marketing & Sesi', icon: Tag },
            { id: 'speed', label: 'Speed & User Issues', icon: Zap },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3.5 py-2 rounded-xl text-xs font-mono font-black flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer drop-shadow-xs ${
                  isActive
                    ? 'bg-blue-100 text-blue-950 shadow-[inset_2px_2px_5px_rgba(163,177,198,0.4),_inset_-2px_-2px_5px_rgba(255,255,255,0.9)]'
                    : 'bg-white text-slate-800 shadow-[3px_3px_8px_rgba(163,177,198,0.3),_-3px_-3px_8px_rgba(255,255,255,0.9)] hover:bg-slate-50'
                }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB CONTENT */}

        {/* 1. SALES TAB */}
        {activeTab === 'sales' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-100/90 shadow-[inset_3px_3px_7px_rgba(163,177,198,0.35),_inset_-3px_-3px_7px_rgba(255,255,255,0.95)]">
              <span className="text-[10px] font-mono font-black uppercase text-blue-950 block drop-shadow-xs">
                COMMERCIAL SNAPSHOT
              </span>
              <p className="text-xs font-mono text-slate-900 font-bold mt-0.5">
                {telemetry?.salesTeam?.recentOrdersSample ?? 0} orders sampled from the last 30 days.{topProducts[0] ? ` ${topProducts[0].name} leads with ${topProducts[0].unitsSold} units.` : ''}
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-xs font-mono font-black uppercase text-slate-950 drop-shadow-xs">
                Top Products by Revenue &amp; Units Sold:
              </h3>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {topProducts.map((p: any, idx: number) => (
                  <div
                    key={p.id || idx}
                    className="p-3 rounded-2xl bg-white shadow-[3px_3px_8px_rgba(163,177,198,0.25),_-3px_-3px_8px_rgba(255,255,255,0.9)] flex items-center justify-between text-xs font-mono"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-950 font-black text-[10px] drop-shadow-xs shrink-0">
                        #{idx + 1}
                      </span>
                      <div className="min-w-0">
                        <div className="text-slate-950 font-black truncate max-w-sm drop-shadow-xs">
                          {p.name}
                        </div>
                        <div className="text-[10px] text-slate-700 font-bold">
                          SKU: {p.sku} &middot; Remaining Stock: <strong className="text-slate-950">{p.stock}</strong>
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-slate-950 font-black drop-shadow-xs">{p.unitsSold} Units</div>
                      <div className="text-[10px] text-emerald-950 font-black">AED {Math.round(p.revenue)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 2. STOCK ALARMS TAB */}
        {activeTab === 'stock' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-amber-50/90 shadow-[inset_3px_3px_7px_rgba(245,158,11,0.2),_inset_-3px_-3px_7px_rgba(255,255,255,0.9)]">
              <span className="text-[10px] font-mono font-black uppercase text-amber-950 block drop-shadow-xs">
                CRITICAL INVENTORY ALERT
              </span>
              <p className="text-xs font-mono text-slate-900 font-bold mt-0.5">
                {telemetry?.stockTeam?.criticalInventory?.length ?? 0} store SKUs at &lt;= 5 units and {telemetry?.stockTeam?.outOfStockCount ?? 0} active products out of stock (samples of up to 10 each).
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-xs font-mono font-black uppercase text-slate-950 drop-shadow-xs">
                Depleted &amp; Out of Stock SKUs:
              </h3>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {critInventory.map((c: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-white shadow-[3px_3px_8px_rgba(163,177,198,0.25),_-3px_-3px_8px_rgba(255,255,255,0.9)] flex items-center justify-between text-xs font-mono"
                  >
                    <div>
                      <div className="text-slate-950 font-black drop-shadow-xs">{c.productName}</div>
                      <div className="text-[10px] text-slate-700 font-bold">
                        Store: <strong className="text-slate-950">{c.store}</strong> &middot; SKU: {c.sku}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="px-2 py-0.5 rounded-lg bg-rose-100 text-rose-950 font-black text-[10px] drop-shadow-xs">
                        {c.quantity} Units Left!
                      </span>
                    </div>
                  </div>
                ))}

                {outOfStock.map((o: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-white shadow-[3px_3px_8px_rgba(163,177,198,0.25),_-3px_-3px_8px_rgba(255,255,255,0.9)] flex items-center justify-between text-xs font-mono"
                  >
                    <div>
                      <div className="text-slate-950 font-black drop-shadow-xs">{o.name}</div>
                      <div className="text-[10px] text-slate-700 font-bold">
                        Main Catalog &middot; SKU: {o.sku}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="px-2 py-0.5 rounded-lg bg-slate-200 text-slate-950 font-black text-[10px]">
                        0 Available (Stockout)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 3. CHECKOUT EXITS TAB */}
        {activeTab === 'dropoffs' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-rose-50/90 shadow-[inset_3px_3px_7px_rgba(244,63,94,0.2),_inset_-3px_-3px_7px_rgba(255,255,255,0.9)]">
              <span className="text-[10px] font-mono font-black uppercase text-rose-950 block drop-shadow-xs">
                CLIENT DROP-OFF FORENSICS
              </span>
              <p className="text-xs font-mono text-slate-900 font-bold mt-0.5">
                {totalDropoffs} checkout sessions started in the past 7 days. The breakdown below estimates where each one stopped.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-xs font-mono font-black uppercase text-slate-950 drop-shadow-xs">
                Exit Reasons &amp; Loss Volumes:
              </h3>
              <div className="space-y-2">
                {Object.entries(dropReasons).map(([reason, count]: [string, any], idx: number) => {
                  const pct = Math.round((count / (totalDropoffs || 1)) * 100);
                  return (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl bg-white shadow-[3px_3px_8px_rgba(163,177,198,0.25),_-3px_-3px_8px_rgba(255,255,255,0.9)] text-xs font-mono"
                    >
                      <div className="flex items-center justify-between mb-1.5 font-black text-slate-950">
                        <span>{reason}</span>
                        <span className="text-rose-950">{count} Exits ({pct}%)</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden shadow-[inset_1px_1px_3px_rgba(0,0,0,0.15)]">
                        <div className="h-full bg-rose-600 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* 4. SEO TAB */}
        {activeTab === 'seo' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-purple-50/90 shadow-[inset_3px_3px_7px_rgba(168,85,247,0.2),_inset_-3px_-3px_7px_rgba(255,255,255,0.9)]">
              <span className="text-[10px] font-mono font-black uppercase text-purple-950 block drop-shadow-xs">
                GULF ORGANIC VISIBILITY
              </span>
              <p className="text-xs font-mono text-slate-900 font-bold mt-0.5">
                {telemetry?.seoTeam?.connected
                  ? <>Visibility index: {telemetry?.seoTeam?.visibilityScore} across UAE, KSA, Qatar, Kuwait, Oman, Bahrain.</>
                  : <>No SEO data source is connected yet. Connect Google Search Console to see real keyword rankings here.</>}
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-xs font-mono font-black uppercase text-slate-950 drop-shadow-xs">
                Active Keyword Rankings:
              </h3>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {seoRanks.map((r: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-white shadow-[3px_3px_8px_rgba(163,177,198,0.25),_-3px_-3px_8px_rgba(255,255,255,0.9)] flex items-center justify-between text-xs font-mono"
                  >
                    <div>
                      <div className="text-slate-950 font-black drop-shadow-xs">{r.keyword}</div>
                      <div className="text-[10px] text-slate-700 font-bold">
                        Market: {r.country} &middot; Vol: {r.searchVolume}
                      </div>
                    </div>
                    <div>
                      <span className="px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-950 font-black text-[10px]">
                        Rank #{r.rank} ({r.change})
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 5. MARKETING TAB */}
        {activeTab === 'marketing' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-pink-50/90 shadow-[inset_3px_3px_7px_rgba(236,72,153,0.2),_inset_-3px_-3px_7px_rgba(255,255,255,0.9)]">
              <span className="text-[10px] font-mono font-black uppercase text-pink-950 block drop-shadow-xs">
                MARKETING YIELD &amp; CUSTOMER SESI
              </span>
              <p className="text-xs font-mono text-slate-900 font-bold mt-0.5">
                {telemetry?.marketingTeam?.totalVotes
                  ? <>{telemetry.marketingTeam.customerSatisfactionRate}% satisfaction from {telemetry.marketingTeam.totalVotes} published reviews ({telemetry.marketingTeam.happyVotes} rated 4–5★). {(telemetry?.marketingTeam?.activeDiscounts || []).length} active discount codes.</>
                  : <>No published reviews yet. {(telemetry?.marketingTeam?.activeDiscounts || []).length} active discount codes.</>}
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-xs font-mono font-black uppercase text-slate-950 drop-shadow-xs">
                Active Promo Codes in Database:
              </h3>
              <div className="space-y-2">
                {discounts.map((d: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-white shadow-[3px_3px_8px_rgba(163,177,198,0.25),_-3px_-3px_8px_rgba(255,255,255,0.9)] flex items-center justify-between text-xs font-mono"
                  >
                    <div>
                      <div className="text-slate-950 font-black drop-shadow-xs">Code: {d.code}</div>
                      <div className="text-[10px] text-slate-700 font-bold">
                        {d.discountType} &middot; {d.value}% Off
                      </div>
                    </div>
                    <div>
                      <span className="px-2 py-0.5 rounded-lg bg-blue-100 text-blue-950 font-black text-[10px]">
                        {d.uses} Redemptions
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 6. SPEED & USER PROBLEMS TAB */}
        {activeTab === 'speed' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-orange-50/90 shadow-[inset_3px_3px_7px_rgba(249,115,22,0.2),_inset_-3px_-3px_7px_rgba(255,255,255,0.9)]">
              <span className="text-[10px] font-mono font-black uppercase text-orange-950 block drop-shadow-xs">
                WEBSITE SPEED &amp; USER PROBLEMS TRACKING (AGENT VELOX)
              </span>
              <p className="text-xs font-mono text-slate-900 font-bold mt-0.5">
                {telemetry?.speedTeam?.connected ? 'Real-user speed metrics (7-day average) are shown below.' : 'No real-user speed data is being recorded yet, so Web Vitals show n/a.'}{' '}
                Tracked {(telemetry?.speedTeam?.userIssues?.totalTrackedUserEvents ?? 0).toLocaleString()} user events in the last 30 days.{' '}
                {telemetry?.speedTeam?.userIssues?.beginCheckoutCount
                  ? <>{telemetry.speedTeam.userIssues.droppedCheckoutCount} of {telemetry.speedTeam.userIssues.beginCheckoutCount} started checkouts did not complete.</>
                  : null}
              </p>
            </div>

            {/* Core Web Vitals HUD */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 rounded-2xl bg-white shadow-[3px_3px_8px_rgba(163,177,198,0.25),_-3px_-3px_8px_rgba(255,255,255,0.9)] text-center">
                <span className="text-[9px] font-mono font-bold text-slate-700 uppercase block">LCP (Page Speed)</span>
                <span className="text-base font-black text-emerald-950 font-mono drop-shadow-xs">{telemetry?.speedTeam?.coreWebVitals?.lcp?.value || 'n/a'}</span>
                <span className="text-[9px] font-mono font-bold text-emerald-800 block">Target &lt; 2.5s</span>
              </div>
              <div className="p-3 rounded-2xl bg-white shadow-[3px_3px_8px_rgba(163,177,198,0.25),_-3px_-3px_8px_rgba(255,255,255,0.9)] text-center">
                <span className="text-[9px] font-mono font-bold text-slate-700 uppercase block">TTFB (Edge Cache)</span>
                <span className="text-base font-black text-blue-950 font-mono drop-shadow-xs">{telemetry?.speedTeam?.coreWebVitals?.ttfb?.value || 'n/a'}</span>
                <span className="text-[9px] font-mono font-bold text-blue-800 block">Target &lt; 800ms</span>
              </div>
              <div className="p-3 rounded-2xl bg-white shadow-[3px_3px_8px_rgba(163,177,198,0.25),_-3px_-3px_8px_rgba(255,255,255,0.9)] text-center">
                <span className="text-[9px] font-mono font-bold text-slate-700 uppercase block">INP / Latency</span>
                <span className="text-base font-black text-purple-950 font-mono drop-shadow-xs">{telemetry?.speedTeam?.coreWebVitals?.fid?.value || 'n/a'}</span>
                <span className="text-[9px] font-mono font-bold text-purple-800 block">Target &lt; 200ms</span>
              </div>
              <div className="p-3 rounded-2xl bg-white shadow-[3px_3px_8px_rgba(163,177,198,0.25),_-3px_-3px_8px_rgba(255,255,255,0.9)] text-center">
                <span className="text-[9px] font-mono font-bold text-slate-700 uppercase block">CLS (Layout Shift)</span>
                <span className="text-base font-black text-slate-950 font-mono drop-shadow-xs">{telemetry?.speedTeam?.coreWebVitals?.cls?.value || 'n/a'}</span>
                <span className="text-[9px] font-mono font-bold text-emerald-800 block">Target &lt; 0.1</span>
              </div>
            </div>

            {/* Tracked User Obstacles */}
            <div className="space-y-2">
              <h3 className="text-xs font-mono font-black uppercase text-slate-950 drop-shadow-xs">
                Audited User Obstacles &amp; Funnel Friction (MongoDB Telemetry):
              </h3>
              <div className="space-y-2">
                <div className="p-3 rounded-2xl bg-white shadow-[3px_3px_8px_rgba(163,177,198,0.25),_-3px_-3px_8px_rgba(255,255,255,0.9)] flex items-center justify-between text-xs font-mono">
                  <div>
                    <div className="text-rose-950 font-black drop-shadow-xs">Checkout Funnel Drop-off</div>
                    <div className="text-[10px] text-slate-700 font-bold">
                      {telemetry?.speedTeam?.userIssues?.beginCheckoutCount ?? 0} begin_checkout vs {telemetry?.speedTeam?.userIssues?.purchaseCount ?? 0} purchases, last 30 days{telemetry?.speedTeam?.userIssues?.cartDropoffRate ? ` (${telemetry.speedTeam.userIssues.cartDropoffRate} gap)` : ''}
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-lg bg-rose-100 text-rose-950 font-black text-[10px]">
                    {telemetry?.speedTeam?.userIssues?.droppedCheckoutCount ?? 0} Dropped
                  </span>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* Footer CTAs */}
        <div className="pt-3 flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={() => {
              onOrderStorewideImprovement(
                'Review the live Master Operations Report (top sellers, low and out-of-stock items, open checkouts, and the begin_checkout → purchase gap). Generate a prioritized storewide improvement action plan for development, sales, and supply chain, using only the live data.'
              );
              onClose();
            }}
            className="w-full sm:flex-1 py-3.5 px-4 rounded-2xl bg-cyan-200 hover:bg-cyan-300 text-cyan-950 font-mono font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-[6px_6px_16px_rgba(163,177,198,0.38),_-6px_-6px_16px_rgba(255,255,255,0.95)] active:shadow-[inset_2px_2px_5px_rgba(6,182,212,0.4)] flex items-center justify-center gap-2 drop-shadow-xs"
          >
            <Bot size={16} />
            <span>ORDER KIRA: DEPLOY STOREWIDE IMPROVEMENT PLAN</span>
            <ArrowRight size={14} />
          </button>

          <button
            onClick={onClose}
            className="w-full sm:w-auto py-3.5 px-5 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-mono font-black text-xs uppercase transition-all cursor-pointer shadow-[4px_4px_10px_rgba(163,177,198,0.3),_-4px_-4px_10px_rgba(255,255,255,0.95)]"
          >
            CLOSE
          </button>
        </div>

      </div>
    </div>
  );
}
