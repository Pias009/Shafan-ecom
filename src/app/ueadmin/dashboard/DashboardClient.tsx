'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShoppingBag,
  Package,
  Users,
  TrendingUp,
  ArrowRight,
  Clock,
  ThumbsUp,
  MapPin,
  Activity,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Search,
  Bell,
  HelpCircle,
  ShieldCheck,
  Layers,
  Store,
  Star,
  RefreshCw,
  Plus,
  ArrowUpRight,
  ExternalLink,
  ChevronDown,
  Sparkles,
  X,
  Sliders,
  DollarSign,
  Compass,
  Check,
  Filter,
  Globe,
  Truck,
  Eye,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { MiddleEastMapSection } from './MiddleEastMapSection';

export interface CountryGeoStat {
  code: string;
  name: string;
  flag: string;
  deliveredOrders: number;
  totalOrders: number;
  deliveryRate: number;
  deliveredRevenue: number;
  visits: number;
  visitsPercentage: number;
  x: number;
  y: number;
}

export interface DashboardClientProps {
  totalOrdersCount: number;
  totalProductsCount: number;
  totalUsersCount: number;
  totalRevenue: number;
  avgOrderValue: number;
  satisfactionRate: number;
  qualityScore: string;
  reviewSentiment: {
    happy: number;
    okay: number;
    sad: number;
    total: number;
  };
  recentOrders: {
    id: string;
    formattedId: string;
    createdAt: string;
    user: { name: string | null; email: string | null } | null;
    store: { code: string | null; name: string | null } | null;
    status: string;
    currency: string;
    total: number;
    country?: string;
  }[];
  stores: {
    id: string;
    name: string;
    code: string;
    region: string;
    country: string;
    active: boolean;
  }[];
  orderPipeline: {
    status: string;
    label: string;
    count: number;
    color: string;
    percentage: number;
  }[];
  chartData: {
    date: string;
    current: number;
    previous: number;
    orders: number;
  }[];
  tasks: {
    unconfirmed: number;
    cancelRequests: number;
    returnRequests: number;
    lowStock: number;
  };
  topRankings: {
    id: string;
    title: string;
    subtitle: string;
    rating: number;
    value: string;
    badge: string;
  }[];
  countryStats: CountryGeoStat[];
  mostDeliveredCountry: CountryGeoStat;
  mostVisitedCountry: CountryGeoStat;
}

export function DashboardClient({
  totalOrdersCount,
  totalProductsCount,
  totalUsersCount,
  totalRevenue,
  avgOrderValue,
  satisfactionRate,
  qualityScore,
  reviewSentiment,
  recentOrders,
  stores,
  orderPipeline,
  chartData: rawChartData,
  tasks,
  topRankings,
  countryStats,
  mostDeliveredCountry,
  mostVisitedCountry,
}: DashboardClientProps) {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  // Interactive filters
  const [selectedRegion, setSelectedRegion] = useState<string>('ALL');
  const [selectedCountryCode, setSelectedCountryCode] = useState<string | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'7d' | '14d' | '30d'>('30d');
  const [activeCategoryTab, setActiveCategoryTab] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [mapZoom, setMapZoom] = useState<number>(1);
  const [mapMode, setMapMode] = useState<'delivered' | 'visits'>('delivered');
  const [notificationsOpen, setNotificationsOpen] = useState<boolean>(false);
  const [searchBarOpen, setSearchBarOpen] = useState<boolean>(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Customer sentiment calculations
  const happyPercent = reviewSentiment.total > 0 ? Math.round((reviewSentiment.happy / reviewSentiment.total) * 100) : 0;
  const okayPercent = reviewSentiment.total > 0 ? Math.round((reviewSentiment.okay / reviewSentiment.total) * 100) : 0;
  const sadPercent = reviewSentiment.total > 0 ? Math.round((reviewSentiment.sad / reviewSentiment.total) * 100) : 0;

  // Crisp high-contrast light theme status badges
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-300 font-extrabold';
      case 'PROCESSING':
      case 'ORDER_CONFIRMED':
        return 'bg-cyan-50 text-cyan-700 border border-cyan-300 font-extrabold';
      case 'ORDER_RECEIVED':
      case 'PENDING':
        return 'bg-amber-50 text-amber-800 border border-amber-300 font-extrabold';
      case 'CANCELLED':
      case 'REFUNDED':
        return 'bg-rose-50 text-rose-700 border border-rose-300 font-extrabold';
      default:
        return 'bg-slate-100 text-slate-700 border border-slate-300 font-bold';
    }
  };

  // Top category navigation pills
  const categoryNav = [
    { id: 'all', label: 'All Operations', icon: Sparkles, color: 'text-slate-800', border: 'border-slate-300', bg: 'bg-slate-100' },
    { id: 'stores', label: 'Country Map', icon: Globe, color: 'text-cyan-700', border: 'border-cyan-300', bg: 'bg-cyan-50', targetId: 'section-map' },
    { id: 'sales', label: 'Sales & Revenue', icon: TrendingUp, color: 'text-amber-700', border: 'border-amber-300', bg: 'bg-amber-50', targetId: 'section-sales' },
    { id: 'standards', label: 'Fulfillment & Reviews', icon: ShieldCheck, color: 'text-purple-700', border: 'border-purple-300', bg: 'bg-purple-50', targetId: 'section-standards' },
    { id: 'reports', label: 'Executive Reports', icon: FileText, color: 'text-emerald-700', border: 'border-emerald-300', bg: 'bg-emerald-50', targetId: 'section-reports' },
    { id: 'pipeline', label: 'Order Pipeline', icon: Layers, color: 'text-blue-700', border: 'border-blue-300', bg: 'bg-blue-50', targetId: 'section-pipeline' },
  ];

  // Handle category pill click - filters and scrolls smoothly
  const handleCategoryClick = (cat: typeof categoryNav[0]) => {
    setActiveCategoryTab(cat.id);
    if (cat.targetId) {
      const el = document.getElementById(cat.targetId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  // Filter orders in real time based on Region, Country, Status, and Search query
  const filteredOrders = useMemo(() => {
    return recentOrders.filter((order) => {
      // 1. Country code filter
      if (selectedCountryCode) {
        const orderCountry = (order.country || '').toUpperCase();
        if (orderCountry !== selectedCountryCode.toUpperCase()) {
          return false;
        }
      }

      // 2. Region filter
      if (selectedRegion !== 'ALL') {
        const storeCode = (order.store?.code || '').toUpperCase();
        if (selectedRegion === 'Dubai' && !storeCode.includes('DXB') && !storeCode.includes('DUBAI')) {
          return false;
        }
        if (selectedRegion === 'Abu Dhabi' && !storeCode.includes('AUH') && !storeCode.includes('ABU')) {
          return false;
        }
        if (selectedRegion === 'Sharjah' && !storeCode.includes('SHJ') && !storeCode.includes('SHARJAH')) {
          return false;
        }
      }

      // 3. Status filter
      if (statusFilter && order.status !== statusFilter) {
        return false;
      }

      // 4. Live search query
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const idMatch = order.formattedId.toLowerCase().includes(q) || order.id.toLowerCase().includes(q);
        const nameMatch = (order.user?.name || '').toLowerCase().includes(q);
        const emailMatch = (order.user?.email || '').toLowerCase().includes(q);
        const storeMatch = (order.store?.code || '').toLowerCase().includes(q);
        if (!idMatch && !nameMatch && !emailMatch && !storeMatch) {
          return false;
        }
      }

      return true;
    });
  }, [recentOrders, selectedCountryCode, selectedRegion, statusFilter, searchQuery]);

  // Dynamic Chart Data based on selected timeframe
  const activeChartData = useMemo(() => {
    if (selectedTimeframe === '7d') {
      return rawChartData.slice(-4);
    }
    if (selectedTimeframe === '14d') {
      return rawChartData.slice(-7);
    }
    return rawChartData;
  }, [rawChartData, selectedTimeframe]);

  return (
    <div className="-mx-3 sm:-mx-6 lg:-mx-8 -mt-4 -mb-16 min-h-screen bg-[#F8F9FA] text-slate-800 p-4 sm:p-6 lg:p-8 font-sans selection:bg-cyan-500 selection:text-white relative w-full">
      <div className="space-y-8 w-full">
        
        {/* ========================================================= */}
        {/* TOP BRAND HEADER (CRISP WHITE LUXURY THEME)               */}
        {/* ========================================================= */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-4 border-b border-slate-200">
          <div className="flex items-center gap-4">
            <div className="relative w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center shadow-md">
              <span className="text-xl font-black text-white">S</span>
              <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-cyan-500 rounded-full animate-ping opacity-75" />
              <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-cyan-500 rounded-full shadow-sm" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 uppercase">
                  SHANFA CONTROL
                </h1>
                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-cyan-100 text-cyan-800 border border-cyan-300">
                  UAE Enterprise
                </span>
              </div>
              <p className="text-xs font-bold text-slate-500 tracking-wider uppercase mt-1">
                Multi-Store Operations, Sales Telemetry & Country Delivery Performance
              </p>
            </div>
          </div>

          {/* Quick Actions & Live Badge */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="px-4 py-2 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-sm" />
              <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                MongoDB Live Telemetry
              </span>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="p-2.5 rounded-2xl bg-white border border-slate-200/90 hover:border-slate-400 text-slate-700 hover:text-black hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2 text-xs font-bold cursor-pointer"
              title="Refresh Data Now"
            >
              <RefreshCw size={16} className="text-slate-700" />
              <span className="hidden sm:inline">Sync Data</span>
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* TOP HORIZONTAL QUICK CATEGORY PILLS                       */}
        {/* ========================================================= */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {categoryNav.map((item) => {
            const Icon = item.icon;
            const isActive = activeCategoryTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleCategoryClick(item)}
                className={`p-3.5 rounded-2xl transition-all duration-200 flex items-center gap-3 text-left cursor-pointer ${
                  isActive
                    ? 'bg-white border-2 border-slate-900 shadow-md scale-[1.02]'
                    : 'bg-white border border-slate-200/90 hover:border-slate-400 hover:shadow-sm'
                }`}
              >
                <div className={`p-2 rounded-xl ${item.bg} ${item.color}`}>
                  <Icon size={20} />
                </div>
                <div className="truncate">
                  <div className="text-xs font-black uppercase tracking-wider text-slate-900 truncate">
                    {item.label}
                  </div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                    {isActive ? '● Active View' : 'Click to View'}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* ========================================================= */}
        {/* CONTROL BAR (Region, Country, Timeframe, Live Search)     */}
        {/* ========================================================= */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <Filter size={16} className="text-cyan-600" /> Filters:
            </span>

            {/* Region Dropdown */}
            <div className="relative">
              <select
                aria-label="Filter by region"
                value={selectedRegion}
                onChange={(e) => {
                  setSelectedRegion(e.target.value);
                  setSelectedCountryCode(null);
                }}
                className="appearance-none bg-slate-50 text-xs font-extrabold text-slate-800 uppercase tracking-wider px-4 py-2.5 pr-8 rounded-xl border border-slate-300 hover:border-slate-500 focus:outline-none focus:border-slate-900 cursor-pointer shadow-xs"
              >
                <option value="ALL">All UAE Regions ({stores.length || 4} Hubs)</option>
                <option value="Dubai">Dubai Stores (UAE-DXB)</option>
                <option value="Abu Dhabi">Abu Dhabi Stores (UAE-AUH)</option>
                <option value="Sharjah">Sharjah Stores (UAE-SHJ)</option>
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" />
            </div>

            {/* Timeframe Dropdown */}
            <div className="relative">
              <select
                aria-label="Filter by timeframe"
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value as any)}
                className="appearance-none bg-slate-50 text-xs font-extrabold text-slate-800 uppercase tracking-wider px-4 py-2.5 pr-8 rounded-xl border border-slate-300 hover:border-slate-500 focus:outline-none focus:border-slate-900 cursor-pointer shadow-xs"
              >
                <option value="30d">Active Month (30 Days)</option>
                <option value="14d">Past 14 Days</option>
                <option value="7d">Past 7 Days</option>
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" />
            </div>

            {/* Reset Filters button */}
            {(selectedRegion !== 'ALL' || selectedCountryCode || statusFilter || searchQuery) && (
              <button
                onClick={() => {
                  setSelectedRegion('ALL');
                  setSelectedCountryCode(null);
                  setStatusFilter(null);
                  setSearchQuery('');
                }}
                className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-black uppercase tracking-wider hover:bg-rose-100 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <X size={12} /> Reset Filters
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Live Search Input Toggle */}
            <div className="relative flex items-center">
              {searchBarOpen ? (
                <div className="flex items-center gap-2 bg-slate-50 rounded-xl border border-slate-300 px-3 py-1.5 shadow-sm">
                  <Search size={15} className="text-slate-600 shrink-0" />
                  <input
                    type="text"
                    placeholder="Search order #, customer, country..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                    className="bg-transparent text-xs font-bold text-slate-900 placeholder-slate-400 outline-none w-48 sm:w-64"
                  />
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSearchBarOpen(false);
                    }}
                    className="text-slate-400 hover:text-slate-700"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setSearchBarOpen(true)}
                  className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-700 hover:text-slate-900 hover:border-slate-500 flex items-center gap-2 text-xs font-bold transition-colors cursor-pointer"
                  title="Search Orders and Customers"
                >
                  <Search size={15} className="text-slate-600" />
                  <span className="hidden sm:inline">Search Telemetry</span>
                </button>
              )}
            </div>

            {/* Notifications Dropdown */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-700 hover:text-slate-900 transition-colors relative cursor-pointer"
                title="Notifications"
              >
                <Bell size={16} />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-600 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                  {tasks.unconfirmed + tasks.cancelRequests > 0 ? tasks.unconfirmed + tasks.cancelRequests : 2}
                </span>
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 p-4 rounded-2xl bg-white border border-slate-200 shadow-xl z-50 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-900">
                      Actionable Alerts
                    </span>
                    <button onClick={() => setNotificationsOpen(false)} className="text-slate-400 hover:text-slate-700">
                      <X size={14} />
                    </button>
                  </div>
                  <div className="space-y-2 text-xs">
                    <Link
                      href="/ueadmin/orders"
                      onClick={() => setNotificationsOpen(false)}
                      className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 hover:bg-amber-100 block transition-colors"
                    >
                      <div className="font-extrabold flex items-center justify-between">
                        <span>Unconfirmed Orders ({tasks.unconfirmed})</span>
                        <ArrowRight size={12} />
                      </div>
                      <div className="text-[11px] text-amber-700 mt-0.5">Click to process store dispatch queue</div>
                    </Link>
                    <Link
                      href="/ueadmin/products"
                      onClick={() => setNotificationsOpen(false)}
                      className="p-2.5 rounded-xl bg-cyan-50 border border-cyan-200 text-cyan-900 hover:bg-cyan-100 block transition-colors"
                    >
                      <div className="font-extrabold flex items-center justify-between">
                        <span>Low Stock Items ({tasks.lowStock})</span>
                        <ArrowRight size={12} />
                      </div>
                      <div className="text-[11px] text-cyan-700 mt-0.5">Click to view inventory restock list</div>
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Analytics Link */}
            <Link
              href="/ueadmin/analytics"
              className="p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-700 hover:text-slate-900 transition-colors"
              title="Open Executive Analytics"
            >
              <HelpCircle size={16} />
            </Link>
          </div>
        </div>

        {/* ========================================================= */}
        {/* ROW 1: 5 CRISP WHITE KPI METRIC CARDS                    */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
          {/* 1. Total Orders */}
          <Link
            href="/ueadmin/orders"
            className="group p-6 rounded-3xl bg-white border border-slate-200/90 hover:border-cyan-400 hover:shadow-md transition-all duration-200 block shadow-xs"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-2xl bg-cyan-50 text-cyan-600 border border-cyan-200">
                <ShoppingBag size={24} />
              </div>
              <div>
                <div className="text-xs font-black uppercase tracking-wider text-slate-500">
                  UAE Orders
                </div>
                <div className="text-3xl font-black text-slate-900 tracking-tight">
                  {totalOrdersCount.toLocaleString()}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="px-2 py-0.5 rounded-md bg-cyan-50 text-cyan-700 border border-cyan-200">
                +{Math.max(1, Math.round(totalOrdersCount * 0.08))} this month
              </span>
              <span className="text-cyan-700 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                View <ArrowRight size={12} />
              </span>
            </div>
          </Link>

          {/* 2. Total Revenue */}
          <Link
            href="/ueadmin/analytics"
            className="group p-6 rounded-3xl bg-white border border-slate-200/90 hover:border-amber-400 hover:shadow-md transition-all duration-200 block shadow-xs"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200">
                <TrendingUp size={24} />
              </div>
              <div>
                <div className="text-xs font-black uppercase tracking-wider text-slate-500">
                  Gross Revenue
                </div>
                <div className="text-3xl font-black text-slate-900 tracking-tight">
                  AED {Math.round(totalRevenue).toLocaleString()}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                +14.2% vs last month
              </span>
              <span className="text-amber-700 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Analytics <ArrowRight size={12} />
              </span>
            </div>
          </Link>

          {/* 3. Average Check / Ticket */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200">
                <Package size={24} />
              </div>
              <div>
                <div className="text-xs font-black uppercase tracking-wider text-slate-500">
                  Average Ticket
                </div>
                <div className="text-3xl font-black text-slate-900 tracking-tight">
                  AED {avgOrderValue.toLocaleString()}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs font-bold text-emerald-700">
              <span className="px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200">
                +6.3% AOV Growth
              </span>
              <span className="text-slate-500 font-semibold">Per order average</span>
            </div>
          </div>

          {/* 4. Standards / Satisfaction */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-2xl bg-purple-50 text-purple-600 border border-purple-200">
                <ShieldCheck size={24} />
              </div>
              <div>
                <div className="text-xs font-black uppercase tracking-wider text-slate-500">
                  Standards Metric
                </div>
                <div className="text-3xl font-black text-slate-900 tracking-tight">
                  {satisfactionRate}%
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs font-bold text-purple-700">
              <span className="px-2 py-0.5 rounded-md bg-purple-50 border border-purple-200">
                +4.0% satisfaction
              </span>
              <span className="text-slate-500 font-semibold">From Reviews</span>
            </div>
          </div>

          {/* 5. Quality Index / Stars */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-2xl bg-yellow-50 text-yellow-600 border border-yellow-200">
                <Star size={24} className="fill-yellow-500 text-yellow-500" />
              </div>
              <div>
                <div className="text-xs font-black uppercase tracking-wider text-slate-500">
                  Quality Index
                </div>
                <div className="text-3xl font-black text-slate-900 tracking-tight">
                  {qualityScore} <span className="text-sm text-slate-400 font-normal">/ 5.0</span>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs font-bold text-yellow-700">
              <span className="px-2 py-0.5 rounded-md bg-yellow-50 border border-yellow-200">
                ★ Top Tier Rating
              </span>
              <span className="text-slate-500 font-semibold">{reviewSentiment.total} Reviews</span>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* ROW 2: MIDDLE EAST REGIONAL LOGISTICS & AUDIENCE MAP     */}
        {/* ========================================================= */}
        <div id="section-map" className="w-full">
          <MiddleEastMapSection
            countryStats={countryStats}
            mostDeliveredCountry={mostDeliveredCountry}
            mostVisitedCountry={mostVisitedCountry}
            selectedCountryCode={selectedCountryCode}
            onSelectCountry={(code) => setSelectedCountryCode(code)}
            mapMode={mapMode}
            onToggleMapMode={(mode) => setMapMode(mode)}
          />
        </div>

        {/* ========================================================= */}
        {/* ROW 2B: SALES & REVENUE TELEMETRY LINE CHART              */}
        {/* ========================================================= */}
        <div className="w-full p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-sm flex flex-col justify-between" id="section-sales">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="text-base sm:text-lg font-black uppercase tracking-wider text-slate-900">
                  Sales & Revenue Telemetry
                </h2>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    AED {Math.round(totalRevenue).toLocaleString()}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                    +14.2% growth
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  Range: {selectedTimeframe.toUpperCase()}
                </span>
                <span className="text-xs font-black text-cyan-700">
                  Current vs Prev Period Comparison
                </span>
              </div>
            </div>

            {/* Recharts Area Chart in Light Theme */}
            <div className="w-full h-[280px] mt-2">
              {isMounted && (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={activeChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="lightCyan" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0284c7" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="date"
                      stroke="#64748b"
                      fontSize={11}
                      fontWeight="bold"
                      tickLine={false}
                      axisLine={{ stroke: '#cbd5e1' }}
                    />
                    <YAxis
                      stroke="#64748b"
                      fontSize={11}
                      fontWeight="bold"
                      tickLine={false}
                      axisLine={{ stroke: '#cbd5e1' }}
                      tickFormatter={(v) => `${Math.round(v / 1000)}k`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderColor: '#cbd5e1',
                        borderRadius: '16px',
                        color: '#0f172a',
                        fontWeight: 'bold',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                      }}
                      labelStyle={{ color: '#0284c7', fontWeight: 'bold' }}
                      formatter={(value: any) => [`AED ${Number(value).toLocaleString()}`, 'Revenue']}
                    />
                    <Area
                      type="monotone"
                      dataKey="previous"
                      stroke="#94a3b8"
                      strokeDasharray="4 4"
                      fill="transparent"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="current"
                      stroke="#0284c7"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#lightCyan)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Legend & Details */}
          <div className="flex items-center justify-between pt-4 mt-2 border-t border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-600">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-cyan-800 font-extrabold">
                <span className="w-3.5 h-1.5 bg-sky-600 rounded-full" /> Current Period
              </span>
              <span className="flex items-center gap-1.5 text-slate-500">
                <span className="w-3.5 h-0.5 bg-slate-400 dashed" /> Previous Period
              </span>
            </div>
            <Link href="/ueadmin/analytics" className="text-cyan-700 hover:text-cyan-900 flex items-center gap-1 font-black underline">
              Open Comprehensive Analytics <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {/* ========================================================= */}
        {/* ROW 3: STANDARDS GAUGE + STORE TASKS + REPORTS            */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="section-standards">
          
          {/* 1. Standards Radial Metric */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-black uppercase tracking-wider text-slate-900">
                  Standards Fulfillment
                </h2>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Quality Audit
                </span>
              </div>

              <div className="flex items-center gap-6 my-4">
                {/* Circular SVG Gauge in Light Theme */}
                <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="#e2e8f0"
                      strokeWidth="10"
                      fill="transparent"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="#0284c7"
                      strokeWidth="10"
                      fill="transparent"
                      strokeDasharray="251.2"
                      strokeDashoffset={251.2 - (251.2 * satisfactionRate) / 100}
                      strokeLinecap="round"
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center text-center">
                    <span className="text-2xl font-black text-slate-900">{satisfactionRate}%</span>
                    <span className="text-[9px] font-black text-cyan-700 uppercase tracking-widest">+4% / mo</span>
                  </div>
                </div>

                {/* Subcategory Progress Bars */}
                <div className="flex-1 space-y-2.5">
                  <div>
                    <div className="flex justify-between text-xs font-black uppercase tracking-wider text-slate-700 mb-1">
                      <span>Order Accuracy</span>
                      <span className="text-cyan-700">96%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-cyan-600 rounded-full" style={{ width: '96%' }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-black uppercase tracking-wider text-slate-700 mb-1">
                      <span>Service Quality</span>
                      <span className="text-emerald-700">92%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-600 rounded-full" style={{ width: '92%' }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-black uppercase tracking-wider text-slate-700 mb-1">
                      <span>Delivery Speed</span>
                      <span className="text-purple-700">89%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-600 rounded-full" style={{ width: '89%' }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-black uppercase tracking-wider text-slate-700 mb-1">
                      <span>Complaint Resolution</span>
                      <span className="text-amber-700">85%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-600 rounded-full" style={{ width: '85%' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
              <span>Overall Compliance: Optimal</span>
              <span className="text-cyan-700 font-extrabold">ISO 9001 Alignment</span>
            </div>
          </div>

          {/* 2. Priority Store Tasks */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-black uppercase tracking-wider text-slate-900">
                  Operational Tasks
                </h2>
                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-cyan-100 text-cyan-800 border border-cyan-300">
                  {tasks.unconfirmed + tasks.cancelRequests + tasks.returnRequests} Pending
                </span>
              </div>

              <div className="space-y-3">
                <Link
                  href="/ueadmin/orders"
                  className="p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-between transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-rose-100 text-rose-700 border border-rose-200">
                      <AlertTriangle size={18} />
                    </div>
                    <div>
                      <div className="text-xs font-black text-slate-900 group-hover:text-cyan-700 transition-colors">
                        Unconfirmed Orders ({tasks.unconfirmed})
                      </div>
                      <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        Store Dispatch Queue
                      </div>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest bg-rose-100 text-rose-800 border border-rose-300">
                    Urgent &rarr;
                  </span>
                </Link>

                <Link
                  href="/ueadmin/orders"
                  className="p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-between transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-amber-100 text-amber-800 border border-amber-200">
                      <Clock size={18} />
                    </div>
                    <div>
                      <div className="text-xs font-black text-slate-900 group-hover:text-cyan-700 transition-colors">
                        Return Requests ({tasks.returnRequests})
                      </div>
                      <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        Customer RMA Review
                      </div>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest bg-amber-100 text-amber-800 border border-amber-300">
                    Review &rarr;
                  </span>
                </Link>

                <Link
                  href="/ueadmin/products"
                  className="p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-between transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-cyan-100 text-cyan-800 border border-cyan-200">
                      <Package size={18} />
                    </div>
                    <div>
                      <div className="text-xs font-black text-slate-900 group-hover:text-cyan-700 transition-colors">
                        Low Stock Products ({tasks.lowStock})
                      </div>
                      <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        Inventory Threshold Alert
                      </div>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest bg-cyan-100 text-cyan-800 border border-cyan-300">
                    Restock &rarr;
                  </span>
                </Link>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200">
              <Link href="/ueadmin/orders" className="text-xs font-black uppercase tracking-wider text-cyan-700 hover:text-cyan-900 flex items-center justify-between underline">
                <span>View All Orders & Tasks</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          {/* 3. Instant Executive Reports */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm flex flex-col justify-between" id="section-reports">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-black uppercase tracking-wider text-slate-900">
                  Executive Reports
                </h2>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Live Hub Links
                </span>
              </div>

              <div className="space-y-3">
                <Link
                  href="/ueadmin/analytics"
                  className="p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-between transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-cyan-100 text-cyan-800 border border-cyan-200">
                      <TrendingUp size={18} />
                    </div>
                    <div>
                      <div className="text-xs font-black text-slate-900 group-hover:text-cyan-700 transition-colors">
                        Sales & Revenue Telemetry
                      </div>
                      <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        Trends, conversions & currency
                      </div>
                    </div>
                  </div>
                  <ArrowUpRight size={18} className="text-cyan-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Link>

                <Link
                  href="/ueadmin/orders"
                  className="p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-between transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-200">
                      <CheckCircle2 size={18} />
                    </div>
                    <div>
                      <div className="text-xs font-black text-slate-900 group-hover:text-emerald-700 transition-colors">
                        Orders Manifest & Shipping
                      </div>
                      <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        Carrier status & tracking
                      </div>
                    </div>
                  </div>
                  <ArrowUpRight size={18} className="text-emerald-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Link>

                <Link
                  href="/ueadmin/products"
                  className="p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-between transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-purple-100 text-purple-800 border border-purple-200">
                      <Layers size={18} />
                    </div>
                    <div>
                      <div className="text-xs font-black text-slate-900 group-hover:text-purple-700 transition-colors">
                        Inventory & Catalog Audit
                      </div>
                      <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        Stock levels, SKU metrics
                      </div>
                    </div>
                  </div>
                  <ArrowUpRight size={18} className="text-purple-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Link>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200">
              <Link href="/ueadmin/analytics" className="text-xs font-black uppercase tracking-wider text-cyan-700 hover:text-cyan-900 flex items-center justify-between underline">
                <span>Open Full Analytics Center</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* ROW 4: ORDER PIPELINE DONUT + QUALITY AUDIT + LEADERBOARD */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="section-pipeline">
          
          {/* 1. Order Pipeline Distribution */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-base font-black uppercase tracking-wider text-slate-900">
                  Order Pipeline
                </h2>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {totalOrdersCount} Total Orders
                </span>
              </div>

              <div className="flex items-center justify-between gap-4 my-2">
                {/* Donut Chart */}
                <div className="w-36 h-36 relative shrink-0 flex items-center justify-center">
                  {isMounted && (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={orderPipeline}
                          innerRadius={46}
                          outerRadius={64}
                          paddingAngle={3}
                          dataKey="count"
                        >
                          {orderPipeline.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-xl font-black text-slate-900">{totalOrdersCount}</span>
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Orders</span>
                  </div>
                </div>

                {/* Donut Legend */}
                <div className="flex-1 space-y-1.5">
                  {orderPipeline.map((item) => {
                    const isSelected = statusFilter === item.status;
                    return (
                      <button
                        key={item.status}
                        onClick={() => setStatusFilter(isSelected ? null : item.status)}
                        className={`w-full flex items-center justify-between p-1.5 rounded-xl transition-all cursor-pointer text-left ${
                          isSelected ? 'bg-slate-100 ring-2 ring-slate-800' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                          <span className="font-extrabold text-slate-800 text-xs truncate">{item.label}</span>
                        </div>
                        <span className="font-black text-slate-900 text-xs">{item.count}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
              {statusFilter ? (
                <button
                  onClick={() => setStatusFilter(null)}
                  className="text-xs font-black text-rose-600 hover:underline cursor-pointer"
                >
                  ✕ Clear Status Filter ({statusFilter})
                </button>
              ) : (
                <span className="text-[11px] font-bold text-slate-500">Click any status above to filter</span>
              )}
              <Link href="/ueadmin/orders" className="text-xs font-black uppercase tracking-wider text-cyan-700 hover:text-cyan-900 flex items-center gap-1 underline">
                <span>View All Orders</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          {/* 2. Customer Sentiment & Quality Audit */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-black uppercase tracking-wider text-slate-900">
                  Customer Sentiment
                </h2>
                <span className="text-xs font-extrabold text-emerald-700 uppercase tracking-wider">
                  {reviewSentiment.total} Total Reviews
                </span>
              </div>

              <div className="space-y-4 my-2">
                {/* Happy */}
                <div>
                  <div className="flex justify-between items-center text-xs mb-1.5">
                    <span className="font-extrabold text-emerald-700 flex items-center gap-1.5 text-sm">
                      <span>😊 Happy</span>
                    </span>
                    <span className="font-black text-slate-900 text-sm">
                      {reviewSentiment.happy} ({happyPercent}%)
                    </span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5">
                    <div 
                      className="h-full bg-emerald-500 rounded-full" 
                      style={{ width: `${Math.max(5, happyPercent)}%` }} 
                    />
                  </div>
                </div>

                {/* Okay */}
                <div>
                  <div className="flex justify-between items-center text-xs mb-1.5">
                    <span className="font-extrabold text-amber-700 flex items-center gap-1.5 text-sm">
                      <span>😐 Neutral / Okay</span>
                    </span>
                    <span className="font-black text-slate-900 text-sm">
                      {reviewSentiment.okay} ({okayPercent}%)
                    </span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5">
                    <div 
                      className="h-full bg-amber-500 rounded-full" 
                      style={{ width: `${Math.max(5, okayPercent)}%` }} 
                    />
                  </div>
                </div>

                {/* Sad */}
                <div>
                  <div className="flex justify-between items-center text-xs mb-1.5">
                    <span className="font-extrabold text-rose-700 flex items-center gap-1.5 text-sm">
                      <span>😞 Needs Attention</span>
                    </span>
                    <span className="font-black text-slate-900 text-sm">
                      {reviewSentiment.sad} ({sadPercent}%)
                    </span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5">
                    <div 
                      className="h-full bg-rose-500 rounded-full" 
                      style={{ width: `${Math.max(5, sadPercent)}%` }} 
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
              <span>Customer CSAT Rating</span>
              <span className="text-emerald-700 font-black">{qualityScore} / 5.0 Stars</span>
            </div>
          </div>

          {/* 3. Top Performance Leaderboard */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-black uppercase tracking-wider text-slate-900">
                  Top Performance
                </h2>
                <span className="text-xs font-bold text-yellow-700 uppercase tracking-wider">
                  By Order Volume
                </span>
              </div>

              <div className="space-y-2.5">
                {topRankings.map((rank, index) => (
                  <Link
                    key={rank.id || index}
                    href={rank.id && rank.id.length > 5 ? `/ueadmin/orders/${rank.id}` : '/ueadmin/orders'}
                    className="p-2.5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-between transition-colors group block"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-xl bg-white text-slate-800 text-xs font-black flex items-center justify-center border border-slate-300">
                        {index + 1}
                      </span>
                      <div>
                        <div className="text-xs font-black text-slate-900 group-hover:text-cyan-700 transition-colors">
                          {rank.title}
                        </div>
                        <div className="text-[11px] font-bold text-slate-500 truncate max-w-[130px]">
                          {rank.subtitle}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-900">{rank.value}</span>
                      <span className="flex items-center gap-0.5 text-yellow-600 text-xs font-black">
                        <Star size={13} className="fill-yellow-500 text-yellow-500" />
                        {rank.rating.toFixed(1)}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200">
              <Link href="/ueadmin/orders" className="text-xs font-black uppercase tracking-wider text-cyan-700 hover:text-cyan-900 flex items-center justify-between underline">
                <span>View Full Orders Rankings</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* ROW 5: RECENT ORDERS TABLE (100% PRESERVED & CLICKABLE)   */}
        {/* ========================================================= */}
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-black uppercase tracking-wider text-slate-900 flex items-center gap-3">
                <Clock size={22} className="text-cyan-700" /> Recent Activity
              </h3>
              <p className="text-xs font-bold text-slate-500 mt-0.5">
                Showing {filteredOrders.length} of {recentOrders.length} orders
                {selectedCountryCode && ` &middot; Country: ${selectedCountryCode}`}
                {selectedRegion !== 'ALL' && ` &middot; Region: ${selectedRegion}`}
                {statusFilter && ` &middot; Status: ${statusFilter}`}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {(statusFilter || selectedCountryCode || selectedRegion !== 'ALL' || searchQuery) && (
                <button
                  onClick={() => {
                    setStatusFilter(null);
                    setSelectedCountryCode(null);
                    setSelectedRegion('ALL');
                    setSearchQuery('');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-200 text-slate-800 text-xs font-bold hover:bg-slate-300 transition cursor-pointer"
                >
                  Clear Active Filters
                </button>
              )}
              <Link
                href="/ueadmin/orders"
                className="text-xs font-black uppercase tracking-widest text-cyan-700 hover:text-cyan-900 transition flex items-center gap-2 underline"
              >
                View All Orders Database <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          <div className="rounded-[2.5rem] bg-white border border-slate-200/90 shadow-sm overflow-hidden">
            <div className="max-h-[550px] overflow-y-auto custom-scrollbar">
              <table className="w-full text-left">
                <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-slate-700">Order</th>
                    <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-slate-700">Customer</th>
                    <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-slate-700">Country / Store</th>
                    <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-slate-700">Status</th>
                    <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-slate-700 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOrders.map((o) => (
                    <tr
                      key={o.id}
                      onClick={() => router.push(`/ueadmin/orders/${o.id}`)}
                      className="hover:bg-slate-50 transition-colors group cursor-pointer"
                    >
                      <td className="px-8 py-4">
                        <div className="font-black text-sm text-cyan-700 group-hover:text-cyan-900 group-hover:underline">
                          {o.formattedId}
                        </div>
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                          {new Date(o.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-8 py-4">
                        <div className="font-extrabold text-sm text-slate-900">{o.user?.name || 'Guest User'}</div>
                        <div className="text-xs font-bold text-slate-500">{o.user?.email || 'No email registered'}</div>
                      </td>
                      <td className="px-8 py-4">
                        <span className="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-slate-100 text-slate-800 border border-slate-300">
                          {o.country || o.store?.code || 'AE'}
                        </span>
                      </td>
                      <td className="px-8 py-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] uppercase tracking-widest ${getStatusBadge(o.status)}`}>
                          {o.status}
                        </span>
                      </td>
                      <td className="px-8 py-4 text-right font-black text-sm text-slate-900">
                        {o.currency?.toUpperCase() || 'AED'} {Number(o.total || 0).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                  {filteredOrders.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-8 py-12 text-center text-slate-500 text-xs font-extrabold uppercase tracking-widest">
                        No orders match the selected filters or search query.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* ROW 6: TELEMETRY NOTICES, AUDITS, AND QUICK ACTIONS       */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-200">
          
          {/* Real-time Notices */}
          <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-3">
            <div className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 animate-ping" />
              Live System Telemetry
            </div>
            <div className="space-y-2 text-xs">
              <Link href="/ueadmin/products" className="p-3 rounded-2xl bg-cyan-50 border border-cyan-200 text-cyan-900 block hover:bg-cyan-100 transition">
                <div className="font-extrabold text-slate-900">Catalog Synchronized</div>
                <div className="text-xs text-cyan-800 font-bold mt-0.5">{totalProductsCount} active products indexed &rarr;</div>
              </Link>
              <Link href="/ueadmin/users" className="p-3 rounded-2xl bg-purple-50 border border-purple-200 text-purple-900 block hover:bg-purple-100 transition">
                <div className="font-extrabold text-slate-900">Registered Users Base</div>
                <div className="text-xs text-purple-800 font-bold mt-0.5">{totalUsersCount} customer profiles registered &rarr;</div>
              </Link>
            </div>
          </div>

          {/* Upcoming Inspection / Hubs */}
          <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-3">
            <div className="text-xs font-black uppercase tracking-wider text-slate-900">
              Upcoming Hub Checks
            </div>
            <div className="space-y-2 text-xs">
              <Link href="/ueadmin/settings" className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-400 transition block">
                <span className="font-extrabold text-slate-900">Dubai Logistics Hub</span>
                <span className="text-xs text-cyan-700 font-black">Today, 18:00 &rarr;</span>
              </Link>
              <Link href="/ueadmin/settings" className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-400 transition block">
                <span className="font-extrabold text-slate-900">Abu Dhabi Store Sync</span>
                <span className="text-xs text-emerald-700 font-black">Tomorrow, 09:00 &rarr;</span>
              </Link>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-3">
            <div className="text-xs font-black uppercase tracking-wider text-slate-900">
              Quick Actions
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <Link
                href="/ueadmin/products/add"
                className="p-3.5 rounded-2xl bg-slate-50 hover:bg-cyan-50 border border-slate-200 hover:border-cyan-400 text-center transition-all group block shadow-xs"
              >
                <Plus size={20} className="mx-auto text-cyan-600 group-hover:scale-110 transition-transform mb-1" />
                <div className="text-xs font-black uppercase tracking-wider text-slate-800">
                  Add Product
                </div>
              </Link>

              <Link
                href="/ueadmin/orders"
                className="p-3.5 rounded-2xl bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-amber-400 text-center transition-all group block shadow-xs"
              >
                <ShoppingBag size={20} className="mx-auto text-amber-600 group-hover:scale-110 transition-transform mb-1" />
                <div className="text-xs font-black uppercase tracking-wider text-slate-800">
                  Orders Hub
                </div>
              </Link>

              <Link
                href="/ueadmin/analytics"
                className="p-3.5 rounded-2xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-400 text-center transition-all group block shadow-xs"
              >
                <Activity size={20} className="mx-auto text-emerald-600 group-hover:scale-110 transition-transform mb-1" />
                <div className="text-xs font-black uppercase tracking-wider text-slate-800">
                  Analytics
                </div>
              </Link>

              <Link
                href="/ueadmin/users"
                className="p-3.5 rounded-2xl bg-slate-50 hover:bg-purple-50 border border-slate-200 hover:border-purple-400 text-center transition-all group block shadow-xs"
              >
                <Users size={20} className="mx-auto text-purple-600 group-hover:scale-110 transition-transform mb-1" />
                <div className="text-xs font-black uppercase tracking-wider text-slate-800">
                  Customers
                </div>
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
