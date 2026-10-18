'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Bot,
  Send,
  Volume2,
  VolumeX,
  TrendingUp,
  Code2,
  Package,
  Globe,
  Tag,
  RefreshCw,
  SlidersHorizontal,
  Zap,
  Activity,
  Award,
  Clock,
  Radio,
  Sparkles,
  Download,
  FileText,
  Lock,
  Trash2,
} from 'lucide-react';
import {
  playKiraChime,
  playStasisAwakenSound,
  playCommandDispatchSound,
  stopKiraVoice,
} from '@/lib/kira/sound';
import { SiriOrb } from './SiriOrb';
import { useKiraVoice } from './useKiraVoice';
import { KiraMicButton, KiraVoiceSettings, KiraVoiceStatus } from './KiraVoiceControls';
import type { TerminalLog, SubAgentId, AgentPodData } from './types';
import { KiraSpecialists } from './KiraSpecialists';
import { AgentReportModal } from './AgentReportModal';
import { MasterReportModal } from './MasterReportModal';
import { KiraLockModal } from './KiraLockModal';

export type AdminRole = 'HEAD' | 'SALES_MANAGER' | 'DEV_LEAD' | 'STOCK_MANAGER';
export type AdminHonorific = 'Sir' | "Ma'am" | 'Leader';

export interface AdminIdentity {
  name: string;
  role: AdminRole;
  honorific: AdminHonorific;
}

interface ChatMessage {
  id: string;
  sender: 'kira' | 'user';
  text: string;
  timestamp: string;
  model?: string;
  assignedAgent?: string;
  /** Exact database figures shown under Kira's answer. */
  liveData?: string;
  /** The admin asked this by voice. */
  spoken?: boolean;
}

const ROLE_DETAILS: Record<AdminRole, { title: string; badge: string; icon: any; desc: string }> = {
  HEAD: {
    title: 'HEAD (Executive Director)',
    badge: 'Supreme Command',
    icon: Award,
    desc: 'Full authorization across Sales, Dev, SEO, Stock, Marketing, UX, and Security.',
  },
  SALES_MANAGER: {
    title: 'Sales & Commercial Manager',
    badge: 'Revenue Lead',
    icon: TrendingUp,
    desc: 'Prioritizes best-selling products, demand spikes, flash sales, and conversion.',
  },
  DEV_LEAD: {
    title: 'Dev & Quality Engineering Lead',
    badge: 'Tech & UX Lead',
    icon: Code2,
    desc: 'Prioritizes website UI bugs, latency faults, and why clients leave checkout.',
  },
  STOCK_MANAGER: {
    title: 'Stock & Inventory Operations Manager',
    badge: 'Logistics Lead',
    icon: Package,
    desc: 'Prioritizes low stock items, out-of-stock risks, and warehouse replenishment.',
  },
};

const INITIAL_PODS: Record<SubAgentId, AgentPodData> = {
  VEX: {
    id: 'VEX',
    name: 'Vex',
    codename: 'COMMERCE-7',
    role: 'Sales & Demand Surge Velocity',
    team: 'Sales & Commercial Division',
    isAwakened: true,
    neuralLoad: 88,
    pingRate: 2480,
    color: {
      border: '',
      glow: 'shadow-[8px_8px_20px_rgba(16,185,129,0.18)]',
      text: 'text-emerald-950 font-black',
      bg: 'bg-emerald-50/90',
      accent: 'bg-emerald-600',
      badgeBg: 'bg-emerald-100',
      badgeText: 'text-emerald-950 font-black',
    },
    metricsSummary: 'High-demand SKUs tracking active in UAE / KSA',
    currentTask: 'Calculating SKU sales velocity and basket affinity',
  },
  CYPHER: {
    id: 'CYPHER',
    name: 'Cypher',
    codename: 'DEV-SENTINEL',
    role: 'Core Dev & UI Bug Forensics',
    team: 'Quality Engineering Division',
    isAwakened: true,
    neuralLoad: 92,
    pingRate: 3120,
    color: {
      border: '',
      glow: 'shadow-[8px_8px_20px_rgba(6,182,212,0.18)]',
      text: 'text-cyan-950 font-black',
      bg: 'bg-cyan-50/90',
      accent: 'bg-cyan-600',
      badgeBg: 'bg-cyan-100',
      badgeText: 'text-cyan-950 font-black',
    },
    metricsSummary: 'Catalog & homepage collection health',
    currentTask: 'Error monitoring not connected yet',
  },
  TARIQ: {
    id: 'TARIQ',
    name: 'Tariq',
    codename: 'GULF-SERP',
    role: 'Middle East SEO & Keyword Intelligence',
    team: 'Market Intelligence Division',
    isAwakened: false,
    neuralLoad: 34,
    pingRate: 850,
    color: {
      border: '',
      glow: 'shadow-[8px_8px_20px_rgba(168,85,247,0.18)]',
      text: 'text-purple-950 font-black',
      bg: 'bg-purple-50/90',
      accent: 'bg-purple-600',
      badgeBg: 'bg-purple-100',
      badgeText: 'text-purple-950 font-black',
    },
    metricsSummary: 'Organic search across GCC markets',
    currentTask: 'Waiting for a Search Console connection',
  },
  ATLAS: {
    id: 'ATLAS',
    name: 'Atlas',
    codename: 'WAREHOUSE-X',
    role: 'Stock Alerts & Supply Chain Sentinel',
    team: 'Inventory Logistics Division',
    isAwakened: true,
    neuralLoad: 76,
    pingRate: 1940,
    color: {
      border: '',
      glow: 'shadow-[8px_8px_20px_rgba(245,158,11,0.18)]',
      text: 'text-amber-950 font-black',
      bg: 'bg-amber-50/90',
      accent: 'bg-amber-600',
      badgeBg: 'bg-amber-100',
      badgeText: 'text-amber-950 font-black',
    },
    metricsSummary: 'Live buffer watch: flags SKUs with stock <= 5 units',
    currentTask: 'Watching store SKUs at or below 5 units',
  },
  MAYA: {
    id: 'MAYA',
    name: 'Maya',
    codename: 'CONVERSION-M',
    role: 'Marketing Campaigns & Sesi Sentiment',
    team: 'Growth Marketing Division',
    isAwakened: false,
    neuralLoad: 42,
    pingRate: 1100,
    color: {
      border: '',
      glow: 'shadow-[8px_8px_20px_rgba(236,72,153,0.18)]',
      text: 'text-pink-950 font-black',
      bg: 'bg-pink-50/90',
      accent: 'bg-pink-600',
      badgeBg: 'bg-pink-100',
      badgeText: 'text-pink-950 font-black',
    },
    metricsSummary: 'Review sentiment & coupon redemption monitoring',
    currentTask: 'Analyzing promo code traction and retention lift',
  },
  LYRA: {
    id: 'LYRA',
    name: 'Lyra',
    codename: 'UX-FORENSICS',
    role: 'Client Drop-off & Checkout Friction',
    team: 'Behavioral Diagnostics Division',
    isAwakened: true,
    neuralLoad: 84,
    pingRate: 2650,
    color: {
      border: '',
      glow: 'shadow-[8px_8px_20px_rgba(244,63,94,0.18)]',
      text: 'text-rose-950 font-black',
      bg: 'bg-rose-50/90',
      accent: 'bg-rose-600',
      badgeBg: 'bg-rose-100',
      badgeText: 'text-rose-950 font-black',
    },
    metricsSummary: 'Analyzes why clients left pending checkouts',
    currentTask: 'Tracing uncompleted checkout sessions and friction steps',
  },
  AEGIS: {
    id: 'AEGIS',
    name: 'Aegis',
    codename: 'CYBER-SHIELD',
    role: 'Transaction Guard & Security Radar',
    team: 'Infrastructure Security Division',
    isAwakened: false,
    neuralLoad: 25,
    pingRate: 720,
    color: {
      border: '',
      glow: 'shadow-[8px_8px_20px_rgba(14,165,233,0.18)]',
      text: 'text-sky-950 font-black',
      bg: 'bg-sky-50/90',
      accent: 'bg-sky-600',
      badgeBg: 'bg-sky-100',
      badgeText: 'text-sky-950 font-black',
    },
    metricsSummary: 'Cancellations & payment gateway watch',
    currentTask: 'Tracking cancellations and cancel requests',
  },
  VELOX: {
    id: 'VELOX',
    name: 'Velox',
    codename: 'SPEED-DIAGNOSTICS',
    role: 'Website Speed Optimizer & User Problem Sentinel',
    team: 'Performance & User Diagnostics Division',
    isAwakened: true,
    neuralLoad: 85,
    pingRate: 2950,
    color: {
      border: '',
      glow: 'shadow-[8px_8px_20px_rgba(249,115,22,0.18)]',
      text: 'text-orange-950 font-black',
      bg: 'bg-orange-50/90',
      accent: 'bg-orange-600',
      badgeBg: 'bg-orange-100',
      badgeText: 'text-orange-950 font-black',
    },
    metricsSummary: 'Real-user speed & checkout funnel watch',
    currentTask: 'Comparing begin_checkout vs purchase events',
  },
};

const QUICK_PROMPTS = [
  { label: '30-day snapshot', prompt: 'Give me a short summary of the last 30 days: orders, revenue, and anything that needs my attention.' },
  { label: 'Orders to action', prompt: 'How many orders are waiting for confirmation or have cancellation requests right now?' },
  { label: 'Stock alerts', prompt: 'Which products are out of stock or at 5 units or fewer? What should we restock first?' },
  { label: 'Top sellers', prompt: 'Which products sold the most in the last 30 days, and how is their stock?' },
  { label: 'Checkout funnel', prompt: 'Walk me through our checkout funnel for the last 30 days. Where are customers dropping off and what should we fix first?' },
];

const LOG_TONE: Record<string, string> = {
  INFO: 'text-slate-400',
  SUCCESS: 'text-emerald-300',
  WARN: 'text-amber-300',
  EXEC: 'text-cyan-300',
};

export function KiraClient() {
  // Identity State (One-time setup stored in localStorage)
  const [identity, setIdentity] = useState<AdminIdentity | null>(null);
  const [identityModalOpen, setIdentityModalOpen] = useState<boolean>(false);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  // Classified Security Lock State (Locked by default)
  const [isLocked, setIsLocked] = useState<boolean>(true);

  // Form state for identity verification
  const [formName, setFormName] = useState<string>('Pias');
  const [formRole, setFormRole] = useState<AdminRole>('HEAD');
  const [formHonorific, setFormHonorific] = useState<AdminHonorific>('Sir');

  // Audio & Speech Settings
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(true);
  const [chimeEnabled, setChimeEnabled] = useState<boolean>(true);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  // Sub-Agent Stasis Pods State
  const [pods, setPods] = useState<Record<SubAgentId, AgentPodData>>(INITIAL_PODS);

  // Countdown timer for next report (counts down from 45s)
  const [secondsUntilNextReport, setSecondsUntilNextReport] = useState<number>(45);

  // Chatbox Collapse State (Requested by user)
  const [isChatCollapsed, setIsChatCollapsed] = useState<boolean>(false);

  // Master Full Report Modal State
  const [isMasterReportOpen, setIsMasterReportOpen] = useState<boolean>(false);

  // Terminal Streaming Logs State
  const [terminalLogs, setTerminalLogs] = useState<TerminalLog[]>([
    {
      id: 'init-1',
      timestamp: new Date().toLocaleTimeString([], { hour12: false }),
      agent: 'KIRA',
      level: 'EXEC',
      message: 'Kira started',
    },
    {
      id: 'init-2',
      timestamp: new Date().toLocaleTimeString([], { hour12: false }),
      agent: 'CYPHER',
      level: 'INFO',
      message: 'Waiting for live store data',
    },
    {
      id: 'init-3',
      timestamp: new Date().toLocaleTimeString([], { hour12: false }),
      agent: 'VEX',
      level: 'SUCCESS',
      message: 'Specialists ready: sales, stock, checkout, marketing, payments, funnel, catalog, SEO',
    },
  ]);

  // Last dispatched command & active awakened agent
  const [dispatchedCommand, setDispatchedCommand] = useState<string | null>(null);
  const [lastAwakenedAgent, setLastAwakenedAgent] = useState<string | null>(null);

  // Selected Agent for Detailed Report Modal
  const [selectedReportAgent, setSelectedReportAgent] = useState<SubAgentId | null>(null);

  // Telemetry State from API
  const [telemetry, setTelemetry] = useState<any>(null);
  const [telemetryLoading, setTelemetryLoading] = useState<boolean>(true);

  // Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [chatLoading, setChatLoading] = useState<boolean>(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);

  // Voice assistant: mic / orb / "Hey Kira" → transcribe → handleExecuteCommand(text, true) → spoken reply.
  const voice = useKiraVoice({
    active: !isLocked && !!identity,
    muted: !voiceEnabled,
    onCommand: (text) => handleExecuteCommand(text, true),
    onWake: () => { if (chimeEnabled) playKiraChime(0.2); },
  });

  useEffect(() => {
    setIsSpeaking(voice.phase === 'speaking');
  }, [voice.phase]);

  // Append log to ascending terminal
  const appendLog = useCallback((agent: any, level: any, message: string) => {
    const newLog: TerminalLog = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString([], { hour12: false }),
      agent,
      level,
      message,
    };
    setTerminalLogs((prev) => [...prev.slice(-120), newLog]);
  }, []);

  // Download Report File Function
  const handleDownloadExecutiveReport = () => {
    if (chimeEnabled) playCommandDispatchSound(0.16);

    const dateStr = new Date().toISOString().split('T')[0];
    const timeStr = new Date().toLocaleTimeString();

    const topProducts = telemetry?.salesTeam?.topSellingProducts || [];
    const critInventory = telemetry?.stockTeam?.criticalInventory || [];
    const outOfStock = telemetry?.stockTeam?.outOfStockProducts || [];
    const dropReasons = telemetry?.devTeam?.dropOffReasons || {};
    const totalDropoffs = telemetry?.devTeam?.totalPendingCheckouts || 0;
    const seoRanks = telemetry?.seoTeam?.middleEastRankings || [];
    const discounts = telemetry?.marketingTeam?.activeDiscounts || [];

    const lines = [
      '========================================================================',
      '       SHAFAN ENTERPRISE - AGENT KIRA 24/7 AUTONOMOUS OPERATIONS REPORT',
      '========================================================================',
      `Report Date: ${dateStr} at ${timeStr}`,
      `Authorized User: ${identity?.honorific || 'Sir'} ${identity?.name || 'Admin'} (${identity?.role || 'HEAD'})`,
      `Squad Commander: AGENT KIRA (Chief Head of 24/7 Autonomous Operations)`,
      `Data source: live store database (figures marked n/a have no data source yet)`,
      '------------------------------------------------------------------------\n',
      '1. COMMERCIAL SALES VELOCITY & REVENUE DRIVERS (AGENT VEX):',
      `   - Total Active Catalog: ${telemetry?.salesTeam?.totalCatalogActive ?? 0} SKUs (sampled)`,
      `   - Active Hot Deals: ${telemetry?.salesTeam?.hotProductsCount ?? 0} Items`,
      `   - Homepage Trending Items: ${telemetry?.salesTeam?.trendingCount ?? 0} Items`,
      `   - Orders Sampled (30 days): ${telemetry?.salesTeam?.recentOrdersSample ?? 0} Orders`,
      '   - Top Selling Products by Velocity:',
      ...topProducts.map(
        (p: any, i: number) =>
          `     #${i + 1} ${p.name} (SKU: ${p.sku}) | ${p.unitsSold} units sold | AED ${Math.round(p.revenue)} | Remaining Stock: ${p.stock}`
      ),
      '\n2. CRITICAL WAREHOUSE & STOCK BUFFER ALERTS (AGENT ATLAS):',
      `   - Critical SKUs (stock <= 5 units): ${telemetry?.stockTeam?.criticalInventory?.length ?? 0} Items (sampled)`,
      `   - Catalog Stockouts (0 units remaining): ${telemetry?.stockTeam?.outOfStockCount ?? 0} SKUs (sampled)`,
      '   - Low Store Inventory:',
      ...critInventory.map(
        (c: any) =>
          `     * ${c.productName} (SKU: ${c.sku}) -> Store: ${c.store} | Remaining Qty: ${c.quantity}`
      ),
      '   - Catalog Depleted SKUs (Stockout):',
      ...outOfStock.map((o: any) => `     * ${o.name} (SKU: ${o.sku}) -> 0 Units available`),
      '\n3. CLIENT CHECKOUT DROP-OFF FORENSICS (AGENT LYRA):',
      `   - Checkout Sessions (Past 7 Days): ${totalDropoffs}`,
      '   - Exit Funnel Breakdown:',
      ...Object.entries(dropReasons).map(([reason, count]) => `     * ${reason}: ${count} exits`),
      '\n4. MIDDLE EAST ORGANIC SEO INTELLIGENCE (AGENT TARIQ):',
      `   - GCC Visibility Score: ${telemetry?.seoTeam?.visibilityScore || 'n/a (no SEO data source connected)'}`,
      `   - Average GCC Organic Rank: ${telemetry?.seoTeam?.averageRankGCC ? '#' + telemetry.seoTeam.averageRankGCC : 'n/a'}`,
      '   - Monitored Gulf Queries:',
      ...seoRanks.map(
        (r: any) =>
          `     * "${r.keyword}" (${r.country}): Rank #${r.rank} (${r.change}) | Volume: ${r.searchVolume}`
      ),
      '\n5. MARKETING & REVIEW SENTIMENT (AGENT MAYA):',
      `   - Review Satisfaction: ${telemetry?.marketingTeam?.customerSatisfactionRate != null ? telemetry.marketingTeam.customerSatisfactionRate + '%' : 'n/a (no reviews)'}`,
      `   - Published Reviews: ${telemetry?.marketingTeam?.happyVotes ?? 0} rated 4–5 / ${telemetry?.marketingTeam?.sadVotes ?? 0} rated 1–2 (of ${telemetry?.marketingTeam?.totalVotes ?? 0})`,
      '   - Active Discount Coupons:',
      ...discounts.map(
        (d: any) => `     * Code: ${d.code} (${d.value}% Off) | ${d.uses} Redemptions`
      ),
      '\n6. SECURITY & TRANSACTION GATEWAY HEALTH (AGENT AEGIS):',
      `   - Orders Sampled (30 days): ${telemetry?.salesTeam?.recentOrdersSample ?? 0}`,
      `   - Cancelled Orders (30 days): ${telemetry?.devTeam?.cancelledOrdersCount ?? 0}`,
      `   - Open Cancel Requests: ${telemetry?.devTeam?.cancelRequestsCount ?? 0}`,
      '   - Fraud / Security Monitoring: n/a (not connected)',
      '\n7. WEBSITE SPEED OPTIMIZATION & USER OBSTACLE INTELLIGENCE (AGENT VELOX):',
      `   - Largest Contentful Paint (LCP): ${telemetry?.speedTeam?.coreWebVitals?.lcp?.value || 'n/a (not recorded)'}`,
      `   - Time to First Byte (TTFB): ${telemetry?.speedTeam?.coreWebVitals?.ttfb?.value || 'n/a (not recorded)'}`,
      `   - Interaction to Next Paint (INP): ${telemetry?.speedTeam?.coreWebVitals?.fid?.value || 'n/a (not recorded)'}`,
      `   - Cumulative Layout Shift (CLS): ${telemetry?.speedTeam?.coreWebVitals?.cls?.value || 'n/a (not recorded)'}`,
      `   - Tracked User Events (30 days): ${telemetry?.speedTeam?.userIssues?.totalTrackedUserEvents ?? 0}`,
      `   - Funnel: ${telemetry?.speedTeam?.userIssues?.beginCheckoutCount ?? 0} checkouts started -> ${telemetry?.speedTeam?.userIssues?.purchaseCount ?? 0} purchases (${telemetry?.speedTeam?.userIssues?.droppedCheckoutCount ?? 0} not completed)`,
      '========================================================================',
      'End of Autonomous Operations Report & Telemetry Briefing',
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shafan-kira-operations-report-${dateStr}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    appendLog('KIRA', 'SUCCESS', `Report downloaded: shafan-kira-operations-report-${dateStr}.txt`);
  };

  // Load Admin Identity from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('agent_kira_admin_identity');
      if (stored) {
        const parsed = JSON.parse(stored);
        setIdentity(parsed);
      } else {
        setIdentityModalOpen(true);
      }
    } catch (e) {
      setIdentityModalOpen(true);
    } finally {
      setIsInitializing(false);
    }
  }, []);

  // Instant Auto-Lock: locks immediately when user leaves/clicks out of the page or unfocuses
  useEffect(() => {
    const handleLock = () => {
      setIsLocked(true);
      stopKiraVoice();
      setIsSpeaking(false);
    };

    // 1. Defocus / click outside window / switch apps
    // (ignored while the mic permission prompt is open or the admin is mid-sentence)
    const handleBlur = () => {
      if (voice.micBusyRef.current) return;
      handleLock();
    };
    window.addEventListener('blur', handleBlur);

    // 2. Switch browser tab or minimize
    const handleVisibility = () => {
      if (document.hidden) {
        handleLock();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    // 3. Clicking sidebar navigation links to leave
    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target && target.closest('aside')) {
        handleLock();
      }
    };
    document.addEventListener('click', handleDocumentClick, true);

    return () => {
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('visibilitychange', handleVisibility);
      document.removeEventListener('click', handleDocumentClick, true);
    };
  }, []);

  // Fetch Telemetry Data
  const fetchTelemetry = useCallback(async () => {
    setTelemetryLoading(true);
    try {
      const res = await fetch('/api/admin/kira/telemetry');
      const data = await res.json();
      if (data.success) {
        setTelemetry(data);
        appendLog('KIRA', 'SUCCESS', `Live data refreshed${data.overview ? `: ${data.overview.orders30} orders in 30 days` : ''}`);
      }
    } catch (err) {
      console.error('Failed to load Kira telemetry', err);
      appendLog('KIRA', 'WARN', 'Could not refresh live data. Will retry');
    } finally {
      setTelemetryLoading(false);
    }
  }, [appendLog]);

  // Next Report Countdown Timer Loop (45s cycle)
  useEffect(() => {
    fetchTelemetry();
    const timer = setInterval(() => {
      setSecondsUntilNextReport((prev) => {
        if (prev <= 1) {
          if (document.visibilityState === 'visible') fetchTelemetry();
          return 45;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [fetchTelemetry]);

  // Background log stream built from the latest telemetry snapshot
  useEffect(() => {
    const streamInterval = setInterval(() => {
      if (!telemetry) {
        appendLog('KIRA', 'INFO', 'Loading live store data…');
        return;
      }

      const top1 = telemetry.salesTeam?.topSellingProducts?.[0];
      const top2 = telemetry.salesTeam?.topSellingProducts?.[1];
      const crit1 = telemetry.stockTeam?.criticalInventory?.[0];
      const out1 = telemetry.stockTeam?.outOfStockProducts?.[0];
      const dropCount = telemetry.devTeam?.totalPendingCheckouts || 0;
      const discount = telemetry.marketingTeam?.activeDiscounts?.[0];
      const sat = telemetry.marketingTeam?.customerSatisfactionRate;

      const dynamicRealLogs = [
        {
          agent: 'VEX',
          level: 'SUCCESS',
          msg: top1
            ? `Real order pull: ${top1.name} (SKU: ${top1.sku}) leads with ${top1.unitsSold} units sold (AED ${Math.round(top1.revenue)})`
            : 'No sales in the last 30 days to rank',
        },
        {
          agent: 'VEX',
          level: 'INFO',
          msg: top2
            ? `Demand surge #2: ${top2.name} (SKU: ${top2.sku}) with ${top2.unitsSold} units sold`
            : 'Calculating SKU basket affinity across UAE & GCC',
        },
        {
          agent: 'CYPHER',
          level: 'INFO',
          msg: `Catalog: ${telemetry.salesTeam?.hotProductsCount ?? 0} hot deals, ${telemetry.salesTeam?.trendingCount ?? 0} trending, ${telemetry.salesTeam?.freshShelfCount ?? 0} fresh-from-shelf items`,
        },
        {
          agent: 'ATLAS',
          level: 'WARN',
          msg: crit1
            ? `Store inventory alert: ${crit1.productName} (Store: ${crit1.store}) has ${crit1.quantity} units remaining!`
            : 'No store SKUs at or below 5 units',
        },
        {
          agent: 'ATLAS',
          level: 'WARN',
          msg: out1
            ? `Out-of-stock flag: ${out1.name} (SKU: ${out1.sku}) is currently depleted at 0 stock in catalog`
            : 'No active products are out of stock',
        },
        {
          agent: 'LYRA',
          level: 'INFO',
          msg: `Checkout sessions in the last 7 days: ${dropCount}`,
        },
        {
          agent: 'MAYA',
          level: 'SUCCESS',
          msg: discount
            ? `Active coupon ${discount.code} (${discount.value}% off) has ${discount.uses} uses${sat != null ? `; review satisfaction ${sat}%` : ''}`
            : sat != null ? `Review satisfaction: ${sat}%` : 'No published reviews yet',
        },
        {
          agent: 'TARIQ',
          level: 'INFO',
          msg: 'No SEO data source connected. Connect Search Console for real rankings',
        },
        {
          agent: 'AEGIS',
          level: 'INFO',
          msg: `${telemetry.devTeam?.cancelledOrdersCount ?? 0} orders cancelled in 30 days, ${telemetry.devTeam?.cancelRequestsCount ?? 0} open cancel requests`,
        },
        {
          agent: 'VELOX',
          level: 'INFO',
          msg: telemetry.speedTeam?.coreWebVitals?.lcp?.value
            ? `Real-user LCP ${telemetry.speedTeam.coreWebVitals.lcp.value} (7-day avg)`
            : `${(telemetry.speedTeam?.userIssues?.totalTrackedUserEvents ?? 0).toLocaleString()} user events tracked in 30 days; no speed data recorded`,
        },
        {
          agent: 'VELOX',
          level: 'WARN',
          msg: `Funnel: ${telemetry.speedTeam?.userIssues?.beginCheckoutCount ?? 0} checkouts started, ${telemetry.speedTeam?.userIssues?.purchaseCount ?? 0} purchases (30 days)`,
        },
        {
          agent: 'KIRA',
          level: 'INFO',
          msg: 'Telemetry refreshes every few minutes from the live database',
        },
      ];

      const picked = dynamicRealLogs[Math.floor(Math.random() * dynamicRealLogs.length)];
      appendLog(picked.agent, picked.level, picked.msg);
    }, 3800);

    return () => clearInterval(streamInterval);
  }, [appendLog, telemetry]);

  // Initial greeting once unlocked
  useEffect(() => {
    if (identity && !isLocked && messages.length === 0) {
      const welcomeText = `Hello ${identity.honorific} ${identity.name}. I'm Kira, your operations assistant.\n\nI read live store data (orders, revenue, stock, the checkout funnel, discounts and reviews) and answer in seconds. Ask a question, tap a quick prompt, or tap the mic and just speak.`;
      
      setMessages([
        {
          id: 'welcome',
          sender: 'kira',
          text: welcomeText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);

      if (voiceEnabled) {
        voice.speak(`Hello ${identity.honorific} ${identity.name}. Kira here. Tap the microphone and ask me anything about the store.`);
      }
    }
  }, [identity, isLocked]);

  // Keep the newest message in view (scrolls the message list only, not the page)
  useEffect(() => {
    const el = messagesRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages, chatLoading]);

  // Save Identity Protocol
  const handleSaveIdentity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const newIdentity: AdminIdentity = {
      name: formName.trim(),
      role: formRole,
      honorific: formHonorific,
    };

    localStorage.setItem('agent_kira_admin_identity', JSON.stringify(newIdentity));
    setIdentity(newIdentity);
    setIdentityModalOpen(false);

    if (chimeEnabled) playKiraChime(0.2);

    const confirmSpeech = `Authorization confirmed, ${formHonorific} ${newIdentity.name}. Autonomous neural deck operational. Directing all 8 divisions to your service.`;
    if (voiceEnabled) voice.speak(confirmSpeech);
    appendLog('KIRA', 'EXEC', `Profile saved: ${formHonorific} ${newIdentity.name} (${ROLE_DETAILS[newIdentity.role].badge})`);
  };

  // Toggle Pod Stasis / Awakened
  const handleToggleAwaken = (agentId: SubAgentId) => {
    setPods((prev) => {
      const current = prev[agentId];
      const willAwaken = !current.isAwakened;
      
      appendLog(
        agentId,
        willAwaken ? 'EXEC' : 'INFO',
        willAwaken
          ? `AGENT ${current.name} UNSEALED FROM STASIS CHAMBER -> DEPLOYED TO FIELD`
          : `AGENT ${current.name} RETURNED TO SLEEP STASIS POD (STANDBY 0.2% CPU)`
      );

      return {
        ...prev,
        [agentId]: {
          ...current,
          isAwakened: willAwaken,
          neuralLoad: willAwaken ? 85 : 15,
        },
      };
    });
  };

  // Open Agent Detailed Diagnostic Report Modal
  const handleInspectReport = (agentId: SubAgentId) => {
    setSelectedReportAgent(agentId);
    if (chimeEnabled) playCommandDispatchSound(0.14);
  };

  // Kira commands team to analyze report and generate improvements
  const handleKiraAnalyzeReport = (agentId: SubAgentId, agentName: string, prompt: string) => {
    setPods((prev) => ({
      ...prev,
      [agentId]: {
        ...prev[agentId],
        isAwakened: true,
        neuralLoad: 95,
      },
    }));
    setLastAwakenedAgent(agentId);
    setDispatchedCommand(`Audit & Improvement Mandate: Agent ${agentName}`);

    appendLog('KIRA', 'EXEC', `Reviewing ${agentName}'s report`);
    appendLog(agentId, 'EXEC', `Preparing recommendations`);

    handleExecuteCommand(prompt);
  };

  // Detect which agent to awaken based on command content
  const pickTargetAgentForCommand = (cmd: string): SubAgentId => {
    const text = cmd.toLowerCase();
    // Most specific topics first; whole-word matches only.
    const routes: [SubAgentId, RegExp][] = [
      ['ATLAS', /\b(stock|stocks|inventory|restock|reorder|warehouse|out of stock|sku|skus)\b/],
      ['LYRA', /\b(checkout|checkouts|abandon\w*|drop[- ]?off|dropping|cart|carts)\b/],
      ['MAYA', /\b(coupon|coupons|promo\w*|discount\w*|marketing|campaign\w*|review|reviews|sentiment)\b/],
      ['AEGIS', /\b(cancel\w*|refund\w*|fraud|chargeback\w*|security|payment|payments)\b/],
      ['TARIQ', /\b(seo|ranking\w*|rank|keyword\w*|search console|google search)\b/],
      ['VELOX', /\b(speed|performance|lcp|ttfb|vitals|slow|latency|funnel|conversion)\b/],
      ['CYPHER', /\b(bug|bugs|error|errors|catalog|catalogue|homepage|collection\w*)\b/],
      ['VEX', /\b(sale|sales|revenue|orders?|best ?sell\w*|top sell\w*|demand)\b/],
    ];
    return routes.find(([, re]) => re.test(text))?.[0] ?? 'VEX';
  };

  // Main Command Dispatcher & Groq Chat Engine
  const handleExecuteCommand = async (customPrompt?: string, viaVoice = false) => {
    const textToSend = (customPrompt || inputMessage).trim();
    if (!textToSend || chatLoading || !identity) {
      if (viaVoice) voice.resetAfterCommand();
      return;
    }

    // Uncollapse chat so user sees output
    if (isChatCollapsed) {
      setIsChatCollapsed(false);
    }

    // 1. Determine & Awaken the Sub-Agent from their Sleep Box
    const targetAgentId = pickTargetAgentForCommand(textToSend);
    setLastAwakenedAgent(targetAgentId);
    setDispatchedCommand(textToSend);

    // Awaken agent from sleep box if asleep
    setPods((prev) => {
      const agent = prev[targetAgentId];
      if (!agent.isAwakened) {
        playStasisAwakenSound(0.2);
        return {
          ...prev,
          [targetAgentId]: {
            ...agent,
            isAwakened: true,
            neuralLoad: 95,
          },
        };
      }
      return prev;
    });

    if (chimeEnabled) {
      playCommandDispatchSound(0.18);
    }

    appendLog('KIRA', 'EXEC', `Question: "${textToSend.length > 80 ? textToSend.slice(0, 80) + '…' : textToSend}"`);
    appendLog(targetAgentId, 'EXEC', `Routed to ${pods[targetAgentId].name}`);
    appendLog(targetAgentId, 'INFO', `Reading live data and asking the AI model`);

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      spoken: viaVoice,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setChatLoading(true);

    try {
      const res = await fetch('/api/admin/kira/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          adminName: identity.name,
          adminRole: identity.role,
          honorific: identity.honorific,
          history: messages.slice(-6).map((m) => ({ sender: m.sender, text: m.text })),
          mode: viaVoice ? 'voice' : 'text',
        }),
      });

      const data = await res.json();
      if (data.success && data.reply) {
        const kiraMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: 'kira',
          text: data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          model: data.model,
          assignedAgent: pods[targetAgentId].name,
          liveData: data.liveData,
        };

        setMessages((prev) => [...prev, kiraMsg]);
        appendLog(targetAgentId, 'SUCCESS', `Answer ready${data.model ? ` (${String(data.model).replace(' (Groq)', '')})` : ''}`);

        if (voiceEnabled || viaVoice) voice.speak(data.reply, { viaVoice });
      } else if (viaVoice) {
        voice.speak('Sorry, I could not get an answer just now. Please try again.');
      }
    } catch (err) {
      console.error('Chat error:', err);
      appendLog('KIRA', 'WARN', 'Could not get an answer. Please try again');
      if (viaVoice) voice.speak('Sorry, I could not reach the store data just now.');
    } finally {
      setChatLoading(false);
    }
  };

  if (isInitializing) {
    return (
      <div className="relative w-full min-h-[600px] flex items-center justify-center bg-slate-50 text-slate-950">
        <KiraLockModal
          isOpen={isLocked}
          onUnlock={() => {
            setIsLocked(false);
            appendLog('KIRA', 'EXEC', 'Console unlocked');
          }}
        />
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full border-4 border-slate-900 border-t-transparent animate-spin" />
          <span className="text-xs font-mono font-black tracking-widest text-slate-950 uppercase animate-pulse drop-shadow-[0_1px_1px_rgba(0,0,0,0.18)]">
            INITIALIZING AGENT KIRA 24/7 AUTONOMOUS COMMAND DECK...
          </span>
        </div>
      </div>
    );
  }

  const ov = telemetry?.overview;
  const signals: { label: string; value: string; tone?: 'warn' | 'bad' }[] = [
    { label: 'Revenue · 30d', value: ov ? `AED ${ov.revenue30.toLocaleString()}` : '—' },
    { label: 'Orders · 30d', value: ov ? ov.orders30.toLocaleString() : '—' },
    { label: 'To confirm', value: ov ? String(ov.toConfirm) : '—', tone: ov?.toConfirm > 0 ? 'warn' : undefined },
    { label: 'Out of stock', value: ov ? String(ov.outOfStockCount) : '—', tone: ov?.outOfStockCount > 0 ? 'bad' : undefined },
    { label: 'Low-stock SKUs', value: ov ? String(ov.lowStockCount) : '—', tone: ov?.lowStockCount > 0 ? 'warn' : undefined },
    { label: 'Checkout → purchase', value: ov?.checkoutToPurchaseRate ?? '—' },
  ];
  const lastModel = [...messages].reverse().find((m) => m.model)?.model?.replace(' (Groq)', '');
  const voiceStatus =
    voice.phase === 'listening' ? 'Listening…' :
    voice.phase === 'transcribing' ? 'Transcribing…' :
    voice.phase === 'thinking' || chatLoading ? 'Checking live data…' :
    isSpeaking ? 'Speaking…' : 'Ready';

  return (
    <div className="relative w-full">
      <div
        className={`relative overflow-hidden rounded-2xl bg-[#060A14] text-slate-200 ring-1 ring-white/10 shadow-xl shadow-slate-900/25 transition-[filter,opacity] duration-300 ${
          isLocked ? 'pointer-events-none select-none blur-md opacity-40' : ''
        }`}
      >
        {/* Backdrop: fine grid + soft glows */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.07)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_at_top,black_25%,transparent_70%)]"
        />
        <div aria-hidden className="pointer-events-none absolute -top-40 left-1/4 h-80 w-[36rem] rounded-full bg-cyan-500/10 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -top-32 right-0 h-72 w-96 rounded-full bg-violet-600/10 blur-3xl" />

        {/* ===================== Header ===================== */}
        <header className="relative flex flex-col gap-5 border-b border-white/[0.07] p-4 sm:p-6 lg:flex-row lg:items-center">
          <div className="flex min-w-0 items-center gap-5">
            <SiriOrb
              isSpeaking={isSpeaking}
              isListening={voice.phase === 'listening'}
              isProcessing={chatLoading || voice.phase === 'transcribing'}
              getLevel={voice.level}
              size={104}
              title={voice.phase === 'listening' ? 'Listening… tap to finish' : 'Tap to talk to Kira'}
              onClick={() => {
                if (voice.phase === 'idle' && chimeEnabled) playKiraChime(0.2);
                if (voice.phase === 'speaking') voice.startListening();
                else voice.toggleListening();
              }}
            />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-tight text-white">Agent Kira</h1>
                <span className="rounded-md border border-cyan-400/30 bg-cyan-400/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-cyan-200">
                  AI operations
                </span>
              </div>
              <p className="mt-1 max-w-sm text-sm text-slate-400">
                Ask about sales, stock, checkout and reviews by voice or text. Answers come from live store data.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 font-mono text-[11px] text-slate-400">
                <span className="flex items-center gap-1.5 text-emerald-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" /> Online
                </span>
                <span>Model · {lastModel || 'qwen3.8-27b'}</span>
                <span className="flex items-center gap-1.5">
                  <Clock size={11} />
                  {telemetryLoading ? 'Syncing…' : `Next sync in ${secondsUntilNextReport}s`}
                </span>
                {identity && (
                  <button
                    onClick={() => setIdentityModalOpen(true)}
                    className="flex items-center gap-1 hover:text-slate-200"
                    title="Change your name or role"
                  >
                    {identity.honorific} {identity.name} · {ROLE_DETAILS[identity.role].badge}
                    <SlidersHorizontal size={11} />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2 lg:ml-auto lg:flex-nowrap">
            <button
              onClick={() => {
                if (voiceEnabled) {
                  stopKiraVoice();
                  setIsSpeaking(false);
                }
                setVoiceEnabled(!voiceEnabled);
              }}
              className={`kira-tool ${voiceEnabled ? 'border-cyan-400/30 bg-cyan-400/10 text-cyan-100' : ''}`}
              title={voiceEnabled ? 'Kira speaks her answers. Click to mute.' : 'Kira is muted. Click to turn her voice on.'}
            >
              {voiceEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
              {voiceEnabled ? 'Voice on' : 'Muted'}
            </button>
            <button
              onClick={() => {
                fetchTelemetry();
                setSecondsUntilNextReport(45);
                if (chimeEnabled) playKiraChime(0.18);
                appendLog('KIRA', 'EXEC', 'Manual data sync requested');
              }}
              disabled={telemetryLoading}
              className="kira-tool"
              title="Refresh live data now"
            >
              <RefreshCw size={14} className={telemetryLoading ? 'animate-spin' : ''} /> Sync
            </button>
            <button
              onClick={() => {
                setIsMasterReportOpen(true);
                if (chimeEnabled) playCommandDispatchSound(0.14);
              }}
              className="kira-tool"
              title="Open the full operations report"
            >
              <FileText size={14} /> Report
            </button>
            <button onClick={handleDownloadExecutiveReport} className="kira-tool" title="Download the operations report (.txt)">
              <Download size={14} /> Download
            </button>
            <button
              onClick={() => {
                setIsLocked(true);
                stopKiraVoice();
                setIsSpeaking(false);
                if (chimeEnabled) playKiraChime(0.15);
              }}
              className="kira-tool hover:border-rose-400/40 hover:text-rose-200"
              title="Lock the console now"
            >
              <Lock size={14} />
              <span className="sr-only">Lock</span>
            </button>
          </div>
        </header>

        {/* ===================== Workspace ===================== */}
        <div className="relative grid grid-cols-1 gap-5 p-4 sm:p-6 xl:grid-cols-12">
          {/* Conversation */}
          <section className="flex min-w-0 flex-col rounded-xl border border-white/[0.08] bg-white/[0.02] xl:col-span-8 xl:h-[clamp(480px,calc(100dvh-300px),720px)]" aria-label="Conversation with Kira">
            <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-3">
              <div className="flex items-center gap-2 text-sm font-medium text-white">
                <Bot size={16} className="text-cyan-300" /> Conversation
              </div>
              <span className={`flex items-center gap-1.5 font-mono text-[11px] ${voiceStatus === 'Ready' ? 'text-slate-400' : 'text-cyan-300'}`}>
                {voiceStatus !== 'Ready' && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-300" />}
                {voiceStatus}
              </span>
            </div>

            <div className="flex gap-2 overflow-x-auto px-4 py-3 [scrollbar-width:none]">
              {QUICK_PROMPTS.map((chip) => (
                <button
                  key={chip.label}
                  onClick={() => handleExecuteCommand(chip.prompt)}
                  disabled={chatLoading}
                  className="shrink-0 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-slate-300 transition-colors hover:border-cyan-400/40 hover:text-white disabled:opacity-50"
                >
                  {chip.label}
                </button>
              ))}
            </div>

            <div ref={messagesRef} className="h-[420px] space-y-4 overflow-y-auto px-4 pb-4 xl:h-auto xl:min-h-0 xl:flex-1 [scrollbar-color:rgba(148,163,184,0.25)_transparent] [scrollbar-width:thin]">
              {messages.map((m) => {
                const isKira = m.sender === 'kira';
                return (
                  <div key={m.id} className={`flex gap-3 ${isKira ? '' : 'flex-row-reverse'}`}>
                    <span
                      className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg text-[11px] font-semibold ${
                        isKira ? 'bg-gradient-to-br from-cyan-400 to-violet-500 text-white' : 'bg-white/10 text-slate-200'
                      }`}
                    >
                      {isKira ? 'K' : (identity?.name || 'A').slice(0, 1).toUpperCase()}
                    </span>
                    <div className={`min-w-0 max-w-[85%] ${isKira ? '' : 'flex flex-col items-end'}`}>
                      <div className="mb-1 flex flex-wrap items-center gap-1.5 font-mono text-[10px] text-slate-400">
                        <span className="text-slate-400">{isKira ? 'Kira' : identity?.name || 'You'}</span>
                        {m.assignedAgent && <span>· via {m.assignedAgent}</span>}
                        {m.spoken && <span className="text-emerald-300">· voice</span>}
                        <span>· {m.timestamp}</span>
                      </div>
                      <div
                        className={`rounded-xl px-3.5 py-2.5 text-sm leading-relaxed ${
                          isKira
                            ? 'rounded-tl-sm border border-white/[0.08] bg-white/[0.04] text-slate-200'
                            : 'rounded-tr-sm border border-cyan-400/20 bg-cyan-500/15 text-cyan-50'
                        }`}
                      >
                        <div className="whitespace-pre-wrap break-words">
                          {String(m.text).split(/(\*\*[^*]+\*\*)/g).map((part: string, i: number) =>
                            part.startsWith('**') && part.endsWith('**') ? <strong key={i} className="font-semibold text-white">{part.slice(2, -2)}</strong> : part,
                          )}
                        </div>
                        {m.liveData && (
                          <div
                            className="mt-2.5 border-t border-white/[0.08] pt-2 font-mono text-[11px] leading-relaxed text-cyan-200/80"
                            title="Exact figures from the database. Trust these if the text above differs."
                          >
                            ✓ {m.liveData}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {chatLoading && (
                <div className="flex items-center gap-3">
                  <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-cyan-400 to-violet-500 text-[11px] font-semibold text-white">K</span>
                  <div className="flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3.5 py-3">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-cyan-300 [animation-delay:-0.2s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-cyan-300 [animation-delay:-0.1s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-cyan-300" />
                  </div>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            <div className="space-y-2 border-t border-white/[0.06] p-3">
              <KiraVoiceStatus voice={voice} />
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleExecuteCommand();
                }}
                className="flex items-center gap-2"
              >
                <KiraMicButton voice={voice} />
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder={voice.settings.wakeWord ? 'Type, tap the mic, or say “Hey Kira”…' : 'Type a question, or tap the mic and speak…'}
                  disabled={chatLoading}
                  className="h-10 min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 text-sm text-white placeholder:text-slate-400 focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
                />
                <button
                  type="submit"
                  disabled={chatLoading || !inputMessage.trim()}
                  className="flex h-10 items-center gap-1.5 rounded-xl bg-white px-4 text-sm font-medium text-slate-900 transition-colors hover:bg-cyan-50 disabled:opacity-40"
                >
                  Send <Send size={14} />
                </button>
                <KiraVoiceSettings voice={voice} />
              </form>
            </div>
          </section>

          {/* Live signals + activity */}
          <aside className="flex min-w-0 flex-col gap-5 xl:col-span-4 xl:h-[clamp(480px,calc(100dvh-300px),720px)]">
            <section className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4" aria-label="Live signals">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-sm font-medium text-white">
                  <Activity size={15} className="text-cyan-300" /> Live signals
                </h2>
                <span className="font-mono text-[10px] text-slate-400">
                  {telemetry?.timestamp ? new Date(telemetry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {signals.map((sig) => (
                  <div key={sig.label} className="rounded-lg border border-white/[0.06] bg-black/20 px-3 py-2.5">
                    <div className="text-[11px] text-slate-400">{sig.label}</div>
                    <div
                      className={`mt-0.5 font-mono text-lg font-semibold tabular-nums ${
                        sig.tone === 'bad' ? 'text-rose-300' : sig.tone === 'warn' ? 'text-amber-300' : 'text-white'
                      }`}
                    >
                      {sig.value}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="flex min-h-[260px] flex-1 flex-col rounded-xl border border-white/[0.08] bg-white/[0.02] xl:min-h-0" aria-label="Activity">
              <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
                <h2 className="flex items-center gap-2 text-sm font-medium text-white">
                  <Radio size={15} className="text-violet-300" /> Activity
                </h2>
                <button
                  onClick={() => setTerminalLogs([])}
                  className="rounded p-1 text-slate-400 hover:bg-white/5 hover:text-slate-300"
                  title="Clear activity"
                  aria-label="Clear activity"
                >
                  <Trash2 size={13} />
                </button>
              </div>
              <ol className="max-h-[340px] min-h-0 flex-1 space-y-1.5 overflow-y-auto xl:max-h-none px-4 py-3 font-mono text-[11px] [scrollbar-color:rgba(148,163,184,0.25)_transparent] [scrollbar-width:thin]">
                {terminalLogs.length === 0 && <li className="text-slate-400">No activity yet.</li>}
                {[...terminalLogs].reverse().slice(0, 40).map((log) => (
                  <li key={log.id} className="flex gap-2 leading-relaxed">
                    <span className="shrink-0 text-slate-400">{log.timestamp}</span>
                    <span className={`shrink-0 ${LOG_TONE[log.level] || 'text-slate-400'}`}>{log.agent}</span>
                    <span className="min-w-0 break-words text-slate-300">{log.message}</span>
                  </li>
                ))}
              </ol>
            </section>
          </aside>
        </div>

        {/* ===================== Specialists ===================== */}
        <section className="relative border-t border-white/[0.07] p-4 sm:p-6" aria-label="Specialists">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-white">Specialists</h2>
            <p className="text-xs text-slate-400">Each specialist watches one area of the store. Ask one directly, or open its report.</p>
          </div>
          <KiraSpecialists
            pods={pods}
            telemetry={telemetry}
            activeAgentId={lastAwakenedAgent}
            busy={chatLoading}
            onAsk={(_id, prompt) => handleExecuteCommand(prompt)}
            onReport={handleInspectReport}
          />
        </section>
      </div>

      <div>
      {/* ========================================================= */}
      {/* 5. ONE-TIME IDENTITY & ROLE VERIFICATION MODAL GATE       */}
      {/* ========================================================= */}
      {identityModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-[36px] bg-white/95 backdrop-blur-3xl shadow-[20px_20px_60px_rgba(163,177,198,0.5),_-20px_-20px_60px_rgba(255,255,255,0.95)] p-6 sm:p-8 space-y-6 text-slate-950 relative">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-cyan-100 shadow-[4px_4px_10px_rgba(163,177,198,0.35),_-4px_-4px_10px_rgba(255,255,255,0.95)] flex items-center justify-center text-cyan-950">
                <Bot size={28} />
              </div>
              <div>
                <h2 className="text-lg font-black uppercase tracking-tight text-slate-950 drop-shadow-[0_1px_1px_rgba(0,0,0,0.18)]">
                  Agent Kira Identity Authorization
                </h2>
                <p className="text-xs font-mono text-slate-800 font-bold">
                  One-time identity verification protocol for operations access
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveIdentity} className="space-y-4">
              {/* Name Input */}
              <div>
                <label className="block text-xs font-mono font-black uppercase text-slate-900 mb-1.5 drop-shadow-xs">
                  Your Full / Preferred Name:
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Pias"
                  className="w-full bg-slate-100/90 shadow-[inset_3px_3px_7px_rgba(163,177,198,0.35),_inset_-3px_-3px_7px_rgba(255,255,255,0.95)] rounded-xl px-4 py-2.5 text-sm font-black text-slate-950 focus:outline-none"
                />
              </div>

              {/* Honorific Salutation Selection */}
              <div>
                <label className="block text-xs font-mono font-black uppercase text-slate-900 mb-1.5 drop-shadow-xs">
                  How Agent Kira Should Address You:
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {(['Sir', "Ma'am", 'Leader'] as AdminHonorific[]).map((hon) => (
                    <button
                      key={hon}
                      type="button"
                      onClick={() => setFormHonorific(hon)}
                      className={`py-2 px-3 rounded-xl text-xs font-mono font-black transition-all cursor-pointer text-center drop-shadow-xs ${
                        formHonorific === hon
                          ? 'bg-blue-100 text-blue-950 shadow-[inset_2px_2px_5px_rgba(163,177,198,0.4),_inset_-2px_-2px_5px_rgba(255,255,255,0.9)]'
                          : 'bg-white text-slate-800 shadow-[3px_3px_8px_rgba(163,177,198,0.3),_-3px_-3px_8px_rgba(255,255,255,0.9)] hover:bg-slate-50'
                      }`}
                    >
                      {hon}
                    </button>
                  ))}
                </div>
              </div>

              {/* Admin Role Selection */}
              <div>
                <label className="block text-xs font-mono font-black uppercase text-slate-900 mb-1.5 drop-shadow-xs">
                  Your Operational Command Role:
                </label>
                <div className="space-y-2.5">
                  {(Object.keys(ROLE_DETAILS) as AdminRole[]).map((roleKey) => {
                    const r = ROLE_DETAILS[roleKey];
                    const isSelected = formRole === roleKey;
                    const Icon = r.icon;
                    return (
                      <div
                        key={roleKey}
                        onClick={() => setFormRole(roleKey)}
                        className={`p-3.5 rounded-2xl cursor-pointer transition-all flex items-center gap-3.5 ${
                          isSelected
                            ? 'bg-blue-50/90 shadow-[inset_2px_2px_6px_rgba(163,177,198,0.35),_inset_-2px_-2px_6px_rgba(255,255,255,0.9)]'
                            : 'bg-white shadow-[4px_4px_10px_rgba(163,177,198,0.28),_-4px_-4px_10px_rgba(255,255,255,0.95)] hover:shadow-[6px_6px_14px_rgba(163,177,198,0.38)]'
                        }`}
                      >
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            isSelected ? 'bg-blue-200 text-blue-950' : 'bg-slate-200 text-slate-800'
                          }`}
                        >
                          <Icon size={18} />
                        </div>
                        <div className="flex-1">
                          <div className="text-xs font-black text-slate-950 flex items-center gap-2 drop-shadow-xs">
                            <span>{r.title}</span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-slate-200 text-slate-950 font-black shadow-[2px_2px_4px_rgba(163,177,198,0.3)]">
                              {r.badge}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-800 mt-0.5 leading-snug font-bold">
                            {r.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Submit Authorization */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3.5 rounded-2xl bg-cyan-200 hover:bg-cyan-300 text-cyan-950 font-mono font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-[6px_6px_16px_rgba(163,177,198,0.38),_-6px_-6px_16px_rgba(255,255,255,0.95)] active:shadow-[inset_2px_2px_5px_rgba(6,182,212,0.4)] drop-shadow-xs"
                >
                  Confirm Authorization &amp; Engage Autonomous Deck
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 6. INDIVIDUAL AGENT REPORT MODAL                         */}
      {/* ========================================================= */}
      {selectedReportAgent && (
        <AgentReportModal
          agent={pods[selectedReportAgent]}
          telemetry={telemetry}
          onClose={() => setSelectedReportAgent(null)}
          onAskKiraToAnalyze={(id, name, prompt) => {
            handleKiraAnalyzeReport(id, name, prompt);
          }}
        />
      )}

      {/* ========================================================= */}
      {/* 7. FULL MASTER TELEMETRY REPORT MODAL                    */}
      {/* ========================================================= */}
      {isMasterReportOpen && (
        <MasterReportModal
          telemetry={telemetry}
          identity={identity}
          onClose={() => setIsMasterReportOpen(false)}
          onDownloadReport={handleDownloadExecutiveReport}
          onOrderStorewideImprovement={(prompt) => {
            handleExecuteCommand(prompt);
          }}
        />
      )}

      </div>

      {/* ========================================================= */}
      {/* 8. AGENT KIRA CLASSIFIED LOCK MODAL                      */}
      {/* ========================================================= */}
      <KiraLockModal
        isOpen={isLocked}
        onUnlock={() => {
          setIsLocked(false);
          appendLog('KIRA', 'EXEC', 'Console unlocked');
        }}
      />

    </div>
  );
}
