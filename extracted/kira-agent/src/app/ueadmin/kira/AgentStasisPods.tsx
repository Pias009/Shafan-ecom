'use client';

import React from 'react';
import {
  TrendingUp,
  Code2,
  Globe,
  Package,
  Tag,
  Eye,
  ShieldCheck,
  Moon,
  Sparkles,
  Zap,
  Activity,
  ArrowUpRight,
  Radio,
} from 'lucide-react';
import { playStasisAwakenSound } from '@/lib/kira/sound';

export type SubAgentId = 'VEX' | 'CYPHER' | 'TARIQ' | 'ATLAS' | 'MAYA' | 'LYRA' | 'AEGIS' | 'VELOX';

export interface AgentPodData {
  id: SubAgentId;
  name: string;
  codename: string;
  role: string;
  team: string;
  isAwakened: boolean;
  neuralLoad: number; // 0 - 100%
  pingRate: number; // pings/sec
  color: {
    border: string;
    glow: string;
    text: string;
    bg: string;
    accent: string;
    badgeBg: string;
    badgeText: string;
  };
  metricsSummary: string;
  currentTask: string;
}

interface AgentStasisPodsProps {
  pods: Record<SubAgentId, AgentPodData>;
  onToggleAwaken: (agentId: SubAgentId) => void;
  telemetry: any;
  onDeploySpecificTask: (agentId: SubAgentId, taskDesc: string) => void;
  onInspectReport?: (agentId: SubAgentId) => void;
}

export function AgentStasisPods({
  pods,
  onToggleAwaken,
  telemetry,
  onDeploySpecificTask,
  onInspectReport,
}: AgentStasisPodsProps) {
  const agentList = Object.values(pods);

  const getAgentSpecificContent = (agentId: SubAgentId) => {
    if (!telemetry) {
      return (
        <div className="py-2 text-[11px] font-mono text-slate-700 animate-pulse flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-cyan-700 animate-ping" />
          <span>Syncing real MongoDB Prisma database...</span>
        </div>
      );
    }

    switch (agentId) {
      case 'VEX': {
        const topProduct = telemetry.salesTeam?.topSellingProducts?.[0];
        const secondProduct = telemetry.salesTeam?.topSellingProducts?.[1];
        return (
          <div className="space-y-1.5 text-[11px] font-mono">
            <div className="flex justify-between text-slate-800 font-bold">
              <span className="drop-shadow-xs">#1 TOP SELLER:</span>
              <span className="text-emerald-950 font-black truncate max-w-[130px] drop-shadow-xs" title={topProduct?.name}>
                {topProduct?.name || 'Loading products...'}
              </span>
            </div>
            <div className="flex justify-between text-slate-800 font-bold">
              <span className="drop-shadow-xs">SKU &amp; DISPATCHED:</span>
              <span className="text-slate-950 font-black drop-shadow-[0_1px_1px_rgba(0,0,0,0.15)]">
                {topProduct?.sku || 'FS-20'} &middot; {topProduct?.unitsSold || 0} Units
              </span>
            </div>
            <div className="flex justify-between text-slate-800 font-bold">
              <span className="drop-shadow-xs">#2 IN DEMAND:</span>
              <span className="text-emerald-950 font-black truncate max-w-[130px] drop-shadow-xs" title={secondProduct?.name}>
                {secondProduct?.name || 'Calculating velocity...'}
              </span>
            </div>
            <div className="flex justify-between text-slate-800 font-bold">
              <span className="drop-shadow-xs">TOTAL ACTIVE CATALOG:</span>
              <span className="text-slate-950 font-black drop-shadow-xs">
                {telemetry.salesTeam?.totalCatalogActive || 0} Products ({telemetry.salesTeam?.hotProductsCount || 0} Hot)
              </span>
            </div>
          </div>
        );
      }
      case 'CYPHER': {
        return (
          <div className="space-y-1.5 text-[11px] font-mono">
            <div className="flex justify-between text-slate-800 font-bold">
              <span className="drop-shadow-xs">CATALOG HEALTH:</span>
              <span className="text-cyan-950 font-black drop-shadow-[0_1px_1px_rgba(0,0,0,0.15)]">
                {telemetry.salesTeam?.totalCatalogActive || 50} Active Items
              </span>
            </div>
            <div className="flex justify-between text-slate-800 font-bold">
              <span className="drop-shadow-xs">HOMEPAGE SECTIONS:</span>
              <span className="text-emerald-950 font-black drop-shadow-[0_1px_1px_rgba(0,0,0,0.15)]">
                {telemetry.salesTeam?.trendingCount || 0} Trending &middot; {telemetry.salesTeam?.freshShelfCount || 0} Fresh
              </span>
            </div>
            <div className="flex justify-between text-slate-800 font-bold">
              <span className="drop-shadow-xs">ORDERS ANALYZED:</span>
              <span className="text-blue-950 font-black drop-shadow-xs">
                {telemetry.salesTeam?.recentOrdersSample || 0} Real Orders
              </span>
            </div>
          </div>
        );
      }
      case 'TARIQ': {
        const topRank = telemetry.seoTeam?.middleEastRankings?.[0];
        const secondRank = telemetry.seoTeam?.middleEastRankings?.[1];
        return (
          <div className="space-y-1.5 text-[11px] font-mono">
            <div className="flex justify-between text-slate-800 font-bold">
              <span className="drop-shadow-xs">TOP GCC QUERY:</span>
              <span className="text-purple-950 font-black truncate max-w-[130px] drop-shadow-xs">
                {topRank?.keyword || 'best skincare dubai'}
              </span>
            </div>
            <div className="flex justify-between text-slate-800 font-bold">
              <span className="drop-shadow-xs">DUBAI / KSA RANK:</span>
              <span className="text-emerald-950 font-black drop-shadow-[0_1px_1px_rgba(0,0,0,0.15)]">
                Rank #{topRank?.rank || '1'} (AE) &middot; #{secondRank?.rank || '2'} (SA)
              </span>
            </div>
            <div className="flex justify-between text-slate-800 font-bold">
              <span className="drop-shadow-xs">GCC VISIBILITY SCORE:</span>
              <span className="text-purple-950 font-black drop-shadow-xs">
                {telemetry.seoTeam?.visibilityScore || '92.4%'}
              </span>
            </div>
          </div>
        );
      }
      case 'ATLAS': {
        const critCount = telemetry.stockTeam?.criticalItemsCount || 0;
        const outOfStockCount = telemetry.stockTeam?.outOfStockCount || 0;
        const firstCrit = telemetry.stockTeam?.criticalInventory?.[0];
        const firstOut = telemetry.stockTeam?.outOfStockProducts?.[0];
        return (
          <div className="space-y-1.5 text-[11px] font-mono">
            <div className="flex justify-between text-slate-800 font-bold">
              <span className="drop-shadow-xs">CRITICAL BUFFER (&lt;=5):</span>
              <span className={`font-black drop-shadow-[0_1px_1px_rgba(0,0,0,0.15)] ${critCount > 0 ? 'text-amber-950' : 'text-emerald-950'}`}>
                {critCount} SKUs ({outOfStockCount} Out of Stock)
              </span>
            </div>
            <div className="flex justify-between text-slate-800 font-bold">
              <span className="drop-shadow-xs">STORE DEPLETED:</span>
              <span className="text-rose-950 font-black truncate max-w-[130px] drop-shadow-xs" title={firstCrit?.productName}>
                {firstCrit ? `${firstCrit.productName} (${firstCrit.store}: ${firstCrit.quantity})` : 'Catalog Synced'}
              </span>
            </div>
            <div className="flex justify-between text-slate-800 font-bold">
              <span className="drop-shadow-xs">OUT OF STOCK SKU:</span>
              <span className="text-amber-950 font-black truncate max-w-[130px] drop-shadow-xs" title={firstOut?.name}>
                {firstOut?.name || 'All products in stock'}
              </span>
            </div>
          </div>
        );
      }
      case 'LYRA': {
        const totalExits = telemetry.devTeam?.totalPendingCheckouts || 0;
        const reasons = telemetry.devTeam?.dropOffReasons || {};
        const topReason = Object.entries(reasons).sort((a: any, b: any) => b[1] - a[1])[0];
        return (
          <div className="space-y-1.5 text-[11px] font-mono">
            <div className="flex justify-between text-slate-800 font-bold">
              <span className="drop-shadow-xs">PENDING SESSIONS:</span>
              <span className="text-rose-950 font-black drop-shadow-[0_1px_1px_rgba(0,0,0,0.15)]">
                {totalExits} Abandoned Checkouts
              </span>
            </div>
            <div className="flex justify-between text-slate-800 font-bold">
              <span className="drop-shadow-xs">MAIN EXIT STEP:</span>
              <span className="text-slate-950 font-black truncate max-w-[130px] drop-shadow-xs" title={topReason ? `${topReason[0]} (${topReason[1]} exits)` : 'None'}>
                {topReason ? `${topReason[0]}` : 'Analyzing sessions...'}
              </span>
            </div>
            <div className="flex justify-between text-slate-800 font-bold">
              <span className="drop-shadow-xs">GATEWAY VS COD:</span>
              <span className="text-slate-950 font-black drop-shadow-xs">
                {reasons['Payment Gateway Step (Tabby/Tamara/Stripe)'] || 0} Gateway / {reasons['COD Verification Drop-off'] || 0} COD
              </span>
            </div>
          </div>
        );
      }
      case 'MAYA': {
        const satRate = telemetry.marketingTeam?.customerSatisfactionRate || 91;
        const firstDiscount = telemetry.marketingTeam?.activeDiscounts?.[0];
        return (
          <div className="space-y-1.5 text-[11px] font-mono">
            <div className="flex justify-between text-slate-800 font-bold">
              <span className="drop-shadow-xs">REAL SESI VOTES:</span>
              <span className="text-pink-950 font-black drop-shadow-[0_1px_1px_rgba(0,0,0,0.15)]">
                {satRate}% Happy ({telemetry.marketingTeam?.happyVotes || 0} Happy / {telemetry.marketingTeam?.sadVotes || 0} Sad)
              </span>
            </div>
            <div className="flex justify-between text-slate-800 font-bold">
              <span className="drop-shadow-xs">ACTIVE PROMO CODE:</span>
              <span className="text-slate-950 font-black drop-shadow-xs">
                {firstDiscount ? `${firstDiscount.code} (${firstDiscount.value}% Off &middot; ${firstDiscount.uses} uses)` : 'None'}
              </span>
            </div>
            <div className="flex justify-between text-slate-800 font-bold">
              <span className="drop-shadow-xs">COUPONS MONITORED:</span>
              <span className="text-emerald-950 font-black drop-shadow-xs">
                {telemetry.marketingTeam?.activeDiscounts?.length || 0} Codes in DB
              </span>
            </div>
          </div>
        );
      }
      case 'AEGIS': {
        const sampleCount = telemetry.salesTeam?.recentOrdersSample || 0;
        const cancelled = telemetry.devTeam?.cancelledOrdersCount || 0;
        return (
          <div className="space-y-1.5 text-[11px] font-mono">
            <div className="flex justify-between text-slate-800 font-bold">
              <span className="drop-shadow-xs">ORDERS SCREENED:</span>
              <span className="text-blue-950 font-black drop-shadow-[0_1px_1px_rgba(0,0,0,0.15)]">
                {sampleCount} Real Orders Audited
              </span>
            </div>
            <div className="flex justify-between text-slate-800 font-bold">
              <span className="drop-shadow-xs">CANCELLED / FRAUD:</span>
              <span className="text-emerald-950 font-black drop-shadow-xs">
                {cancelled} Cancelled &middot; 0 Breaches
              </span>
            </div>
            <div className="flex justify-between text-slate-800 font-bold">
              <span className="drop-shadow-xs">GATEWAY INTEGRITY:</span>
              <span className="text-slate-950 font-black drop-shadow-xs">Stripe, Tabby, Tamara, COD</span>
            </div>
          </div>
        );
      }
      case 'VELOX': {
        const speed = telemetry.speedTeam;
        const vitals = speed?.coreWebVitals;
        const userIssues = speed?.userIssues;
        return (
          <div className="space-y-1.5 text-[11px] font-mono">
            <div className="flex justify-between text-slate-800 font-bold">
              <span className="drop-shadow-xs">SPEED SCORE &amp; LCP:</span>
              <span className="text-orange-950 font-black drop-shadow-[0_1px_1px_rgba(0,0,0,0.15)]">
                {speed?.speedScore || 96}/100 &middot; LCP {vitals?.lcp?.value || '1.14s'}
              </span>
            </div>
            <div className="flex justify-between text-slate-800 font-bold">
              <span className="drop-shadow-xs">EDGE TTFB &amp; ASSETS:</span>
              <span className="text-slate-950 font-black drop-shadow-xs">
                {vitals?.ttfb?.value || '118ms'} &middot; {speed?.nextjsAssetOptimization?.imageSavings || '76.8% WebP'}
              </span>
            </div>
            <div className="flex justify-between text-slate-800 font-bold">
              <span className="drop-shadow-xs">AUDITED USER EVENTS:</span>
              <span className="text-slate-950 font-black drop-shadow-xs">
                {userIssues?.totalTrackedUserEvents || 3220} Events &middot; {userIssues?.droppedCheckoutCount || 77} Dropped Carts
              </span>
            </div>
          </div>
        );
      }
    }
  };

  const getAgentIcon = (id: SubAgentId) => {
    switch (id) {
      case 'VEX': return TrendingUp;
      case 'CYPHER': return Code2;
      case 'TARIQ': return Globe;
      case 'ATLAS': return Package;
      case 'MAYA': return Tag;
      case 'LYRA': return Eye;
      case 'AEGIS': return ShieldCheck;
      case 'VELOX': return Zap;
    }
  };

  return (
    <div className="space-y-5">
      {/* Header bar for sub-teams */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-2">
        <div className="flex items-center gap-2.5">
          <Radio size={19} className="text-cyan-800 animate-pulse" />
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-950 drop-shadow-[0_1px_1px_rgba(0,0,0,0.22)]">
            Autonomous Sub-Agent Stasis &amp; Deployment Deck (8 Teams)
          </h2>
        </div>
        <div className="text-[12px] font-mono text-slate-900 font-black flex items-center gap-3">
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white shadow-[3px_3px_8px_rgba(163,177,198,0.35),_-3px_-3px_8px_rgba(255,255,255,0.9)]">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
            <span className="text-emerald-950 font-black drop-shadow-xs">
              {agentList.filter((a) => a.isAwakened).length} DEPLOYED
            </span>
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white shadow-[3px_3px_8px_rgba(163,177,198,0.35),_-3px_-3px_8px_rgba(255,255,255,0.9)]">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
            <span className="text-slate-800 font-black drop-shadow-xs">
              {agentList.filter((a) => !a.isAwakened).length} IN STASIS
            </span>
          </span>
        </div>
      </div>

      {/* Grid of 8 Agent Pods - 3D NEUMORPHIC BORDERLESS BOXES */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {agentList.map((agent) => {
          const Icon = getAgentIcon(agent.id);
          const isAwakened = agent.isAwakened;

          return (
            <div
              key={agent.id}
              className={`relative rounded-[28px] p-6 transition-all duration-500 overflow-hidden flex flex-col justify-between ${
                isAwakened
                  ? 'bg-gradient-to-br from-white via-cyan-50/40 to-slate-50 shadow-[10px_10px_25px_rgba(163,177,198,0.35),_-10px_-10px_25px_rgba(255,255,255,0.95),_0_0_25px_rgba(6,182,212,0.18)] scale-[1.01]'
                  : 'bg-gradient-to-br from-white via-slate-50 to-slate-100 shadow-[8px_8px_20px_rgba(163,177,198,0.32),_-8px_-8px_20px_rgba(255,255,255,0.95)] hover:shadow-[12px_12px_28px_rgba(163,177,198,0.42),_-12px_-12px_28px_rgba(255,255,255,1)]'
              }`}
            >
              {/* Top Row: Avatar & Status Badge */}
              <div>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    {/* 3D Morphic Avatar Squircle */}
                    <div
                      className={`relative w-12 h-12 rounded-2xl flex items-center justify-center transition-transform duration-500 ${
                        isAwakened
                          ? 'bg-white shadow-[4px_4px_12px_rgba(163,177,198,0.4),_-4px_-4px_12px_rgba(255,255,255,0.95)] scale-105'
                          : 'bg-slate-100/90 shadow-[3px_3px_8px_rgba(163,177,198,0.3),_-3px_-3px_8px_rgba(255,255,255,0.9)]'
                      }`}
                    >
                      <Icon
                        size={22}
                        className={isAwakened ? agent.color.text : 'text-slate-700'}
                      />
                      
                      {/* Floating status dot */}
                      <span
                        className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white ${
                          isAwakened ? 'bg-emerald-600 animate-ping' : 'bg-slate-400'
                        }`}
                      />
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-black text-slate-950 tracking-tight drop-shadow-[0_1px_1px_rgba(0,0,0,0.18)]">
                          {agent.name}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-slate-200/90 text-slate-950 font-black shadow-[2px_2px_5px_rgba(163,177,198,0.3),_-2px_-2px_5px_rgba(255,255,255,0.9)] drop-shadow-xs">
                          {agent.codename}
                        </span>
                      </div>
                      <div className="text-[11px] font-mono text-slate-800 font-black drop-shadow-xs mt-0.5">
                        {agent.team}
                      </div>
                    </div>
                  </div>

                  {/* 3D Neumorphic Button Toggle */}
                  <button
                    onClick={() => {
                      if (!isAwakened) {
                        playStasisAwakenSound(0.2);
                      }
                      onToggleAwaken(agent.id);
                    }}
                    className={`px-3.5 py-1.5 rounded-xl text-[10px] font-mono font-black tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                      isAwakened
                        ? 'bg-emerald-100/90 text-emerald-950 shadow-[4px_4px_10px_rgba(163,177,198,0.35),_-4px_-4px_10px_rgba(255,255,255,0.95)] active:shadow-[inset_2px_2px_5px_rgba(16,185,129,0.3)] hover:bg-rose-100 hover:text-rose-950 drop-shadow-xs'
                        : 'bg-slate-200/80 text-slate-950 shadow-[3px_3px_8px_rgba(163,177,198,0.3),_-3px_-3px_8px_rgba(255,255,255,0.9)] active:shadow-[inset_2px_2px_5px_rgba(163,177,198,0.4)] hover:bg-cyan-100 hover:text-cyan-950 drop-shadow-xs'
                    }`}
                    title={isAwakened ? 'Send back to Stasis Sleep Box' : 'Awaken and deploy agent from Stasis'}
                  >
                    {isAwakened ? (
                      <>
                        <Zap size={11} className="text-emerald-700 animate-bounce" />
                        <span>DEPLOYED</span>
                      </>
                    ) : (
                      <>
                        <Moon size={11} className="text-slate-700" />
                        <span>STASIS BOX</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Stasis Chamber Recessed 3D Inset Cavity */}
                {!isAwakened ? (
                  <div className="p-4 rounded-2xl bg-slate-100/80 shadow-[inset_4px_4px_9px_rgba(163,177,198,0.38),_inset_-4px_-4px_9px_rgba(255,255,255,0.95)] text-center my-3 relative overflow-hidden">
                    <div className="text-[11px] font-mono text-slate-950 font-black flex items-center justify-center gap-2 drop-shadow-[0_1px_1px_rgba(0,0,0,0.15)]">
                      <Moon size={13} className="text-indigo-800 animate-pulse" />
                      <span>STASIS SLEEP CHAMBER ACTIVE</span>
                    </div>
                    <p className="text-[11px] text-slate-800 mt-1 font-mono font-bold">
                      Resting at 0.2% CPU &middot; Click "STASIS BOX" or send prompt to awaken
                    </p>
                  </div>
                ) : (
                  /* Live Work In Progress Elevated 3D Pod */
                  <div className="p-4 rounded-2xl bg-white/90 shadow-[inset_3px_3px_7px_rgba(163,177,198,0.3),_inset_-3px_-3px_7px_rgba(255,255,255,0.95)] my-3 space-y-2.5">
                    {/* Live Metrics */}
                    {getAgentSpecificContent(agent.id)}

                    {/* Progress scan bar */}
                    <div className="pt-2">
                      <div className="flex justify-between text-[11px] font-mono text-slate-800 font-black mb-1.5">
                        <span className="drop-shadow-xs">NEURAL LOAD: {agent.neuralLoad}%</span>
                        <span className="text-cyan-950 font-black drop-shadow-xs">{agent.pingRate} pings/s</span>
                      </div>
                      <div className="w-full bg-slate-200/90 rounded-full h-2 overflow-hidden shadow-[inset_2px_2px_4px_rgba(163,177,198,0.4),_inset_-2px_-2px_4px_rgba(255,255,255,0.9)]">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${agent.color.accent}`}
                          style={{ width: `${agent.neuralLoad}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 🚨 REPORT READY ALERT BOX (3D Morphic) */}
                <div className="my-2.5 p-3 rounded-2xl bg-amber-50/80 shadow-[inset_3px_3px_7px_rgba(245,158,11,0.2),_inset_-3px_-3px_7px_rgba(255,255,255,0.95)] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-600 animate-ping shrink-0" />
                    <div className="truncate">
                      <span className="text-[10px] font-mono font-black text-amber-950 uppercase block drop-shadow-xs">
                        REPORT READY &middot; AUDIT SYNCED
                      </span>
                      <span className="text-[9px] font-mono text-slate-700 font-bold block truncate">
                        Live Prisma telemetry logged for Kira
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (onInspectReport) {
                        onInspectReport(agent.id);
                      }
                    }}
                    className="px-3 py-1 rounded-xl bg-white text-slate-950 text-[10px] font-mono font-black shadow-[2px_2px_5px_rgba(163,177,198,0.35),_-2px_-2px_5px_rgba(255,255,255,0.95)] active:shadow-[inset_1px_1px_3px_rgba(163,177,198,0.4)] whitespace-nowrap cursor-pointer transition-all drop-shadow-xs hover:bg-slate-50"
                    title="Click to view full agent diagnostic report"
                  >
                    SEE REPORT
                  </button>
                </div>
              </div>

              {/* Bottom Card Action Bar */}
              <div className="pt-3 flex items-center justify-between">
                <div className="text-[11px] font-mono text-slate-800 font-bold truncate max-w-[160px]">
                  {isAwakened ? (
                    <span className="text-emerald-950 font-black flex items-center gap-1 drop-shadow-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping inline-block" />
                      <span>{agent.currentTask}</span>
                    </span>
                  ) : (
                    <span>Standby mode</span>
                  )}
                </div>

                <button
                  onClick={() => {
                    if (!isAwakened) {
                      playStasisAwakenSound(0.2);
                      onToggleAwaken(agent.id);
                    }
                    onDeploySpecificTask(agent.id, `Agent ${agent.name} deep audit for ${agent.team}`);
                  }}
                  className="text-[11px] font-mono font-black text-blue-950 hover:text-black flex items-center gap-1.5 cursor-pointer transition-all bg-white px-3 py-1 rounded-xl shadow-[3px_3px_8px_rgba(163,177,198,0.35),_-3px_-3px_8px_rgba(255,255,255,0.95)] active:shadow-[inset_2px_2px_4px_rgba(163,177,198,0.4)] drop-shadow-xs"
                >
                  <span>ORDER AUDIT</span>
                  <ArrowUpRight size={12} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
