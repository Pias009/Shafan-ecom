'use client';

import { useState, useTransition, useMemo } from 'react';
import Image from 'next/image';
import {
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  ShoppingBag,
  Eye,
  Search,
  Download,
  BarChart2,
  PieChart as PieChartIcon,
  Globe,
  CreditCard,
  RefreshCw,
  Calendar,
  Sparkles,
  Package,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  MousePointerClick,
  Check,
  FileDown,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  AnalyticsResponse,
  TimeRange,
  ProductAnalyticsItem,
} from '@/lib/analytics-data';
import { exportElementToPdf } from '@/lib/export-pdf';

interface AnalyticsClientProps {
  initialData: AnalyticsResponse;
}

export function AnalyticsClient({ initialData }: AnalyticsClientProps) {
  const [data, setData] = useState<AnalyticsResponse>(initialData);
  const [range, setRange] = useState<TimeRange>(initialData.range);
  const [compare, setCompare] = useState<boolean>(initialData.compare);
  const [isPending, startTransition] = useTransition();
  const [isExporting, setIsExporting] = useState<string | null>(null);

  // Chart view mode (Revenue vs Orders)
  const [chartMetric, setChartMetric] = useState<'revenue' | 'orders'>('revenue');

  // Product table filters & search
  const [productSearch, setProductSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<
    'orders' | 'revenue' | 'clicks' | 'cartAdds' | 'search' | 'conversion'
  >('orders');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Handle Range or Compare Change
  const fetchData = (newRange: TimeRange, newCompare: boolean) => {
    setRange(newRange);
    setCompare(newCompare);

    startTransition(async () => {
      try {
        const res = await fetch(
          `/api/ueadmin/analytics?range=${newRange}&compare=${newCompare}`
        );
        if (res.ok) {
          const freshData = await res.json();
          setData(freshData);
          setPage(1);
        }
      } catch (err) {
        console.error('Failed to update analytics:', err);
      }
    });
  };

  // PDF Export Handler
  const handlePdfExport = async (
    elementId: string,
    title: string,
    subtitle?: string,
    orientation: 'portrait' | 'landscape' = 'portrait'
  ) => {
    try {
      setIsExporting(elementId);
      await exportElementToPdf(elementId, {
        title,
        subtitle: `${subtitle || data.periodLabel} ${compare && data.comparisonPeriodLabel ? `vs ${data.comparisonPeriodLabel}` : ''}`,
        filename: `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${range}`,
        orientation,
      });
    } catch (err) {
      console.error('PDF export error:', err);
    } finally {
      setIsExporting(null);
    }
  };

  // Filter & Sort Products
  const categories = useMemo(() => {
    const set = new Set<string>();
    data.products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [data.products]);

  const filteredProducts = useMemo(() => {
    return data.products
      .filter((p) => {
        const matchesQuery =
          p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
          (p.sku && p.sku.toLowerCase().includes(productSearch.toLowerCase())) ||
          (p.brand && p.brand.toLowerCase().includes(productSearch.toLowerCase()));
        const matchesCategory =
          selectedCategory === 'all' || p.category === selectedCategory;
        return matchesQuery && matchesCategory;
      })
      .sort((a, b) => {
        if (sortBy === 'orders') return b.ordersCount - a.ordersCount || b.revenue - a.revenue;
        if (sortBy === 'revenue') return b.revenue - a.revenue;
        if (sortBy === 'clicks') return b.clicks - a.clicks;
        if (sortBy === 'cartAdds') return b.cartAdds - a.cartAdds;
        if (sortBy === 'search') return b.searchFrequency - a.searchFrequency;
        if (sortBy === 'conversion') return b.conversionRate - a.conversionRate;
        return 0;
      });
  }, [data.products, productSearch, selectedCategory, sortBy]);

  const totalPages = Math.ceil(filteredProducts.length / pageSize) || 1;
  const paginatedProducts = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, page, pageSize]);

  // Max values for relative progress indicators
  const maxOrders = useMemo(
    () => Math.max(...data.products.map((p) => p.ordersCount), 1),
    [data.products]
  );
  const maxClicks = useMemo(
    () => Math.max(...data.products.map((p) => p.clicks), 1),
    [data.products]
  );

  return (
    <div id="analytics-full-report" className="space-y-10 pb-28 px-4 sm:px-6 md:px-10 max-w-[1600px] mx-auto">
      {/* Top Header & Global Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pt-2 border-b border-black/5 pb-8">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-black">
              Executive Analytics
            </h1>
            <span className="px-3 py-1 bg-black text-white text-[10px] font-black uppercase tracking-widest rounded-full">
              Live Hub
            </span>
            {isPending && (
              <RefreshCw size={16} className="animate-spin text-black/40" />
            )}
          </div>
          <p className="text-xs sm:text-sm font-semibold text-black/50 mt-1 uppercase tracking-[0.18em]">
            Real-time multi-dimensional sales, product performance & conversion insights
          </p>
        </div>

        {/* Global Controls: Time Filter, Compare Toggle, Full PDF Export */}
        <div className="flex flex-wrap items-center gap-3 no-pdf">
          {/* Time Filter Pills */}
          <div className="bg-white p-1.5 rounded-2xl border border-black/10 shadow-sm flex items-center gap-1">
            {(
              [
                { id: 'daily', label: 'Daily (Today)' },
                { id: 'weekly', label: 'Weekly' },
                { id: 'monthly', label: 'Monthly' },
                { id: 'yearly', label: 'Yearly' },
                { id: 'all', label: 'All Time' },
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                onClick={() => fetchData(item.id, compare)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
                  range === item.id
                    ? 'bg-black text-white shadow-sm'
                    : 'text-black/60 hover:text-black hover:bg-black/5'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Compare Toggle */}
          <button
            onClick={() => fetchData(range, !compare)}
            disabled={range === 'all'}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl border text-xs font-black transition-all shadow-sm ${
              range === 'all'
                ? 'opacity-40 cursor-not-allowed bg-gray-100 border-gray-200 text-gray-400'
                : compare
                ? 'bg-indigo-600 border-indigo-600 text-white hover:bg-indigo-700'
                : 'bg-white border-black/10 text-black/70 hover:text-black hover:bg-black/5'
            }`}
          >
            <div
              className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                compare ? 'border-white bg-white' : 'border-black/30'
              }`}
            >
              {compare && <Check size={10} className="text-indigo-600 stroke-[3]" />}
            </div>
            Compare Period
          </button>

          {/* Export Full Executive Report PDF */}
          <button
            onClick={() =>
              handlePdfExport(
                'analytics-full-report',
                'Comprehensive Executive Analytics Report',
                `Period: ${data.periodLabel}`,
                'landscape'
              )
            }
            disabled={isExporting !== null}
            className="flex items-center gap-2 bg-black text-white hover:bg-black/80 px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-md active:scale-95"
          >
            {isExporting === 'analytics-full-report' ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                Generating PDF...
              </>
            ) : (
              <>
                <FileDown size={15} />
                Export Full PDF
              </>
            )}
          </button>
        </div>
      </div>

      {/* Comparison Active Banner */}
      {compare && data.comparisonPeriodLabel && (
        <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border border-indigo-100/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-xs">
              <Sparkles size={16} />
            </div>
            <div>
              <div className="text-xs font-black uppercase tracking-wider text-indigo-950">
                Comparative Intelligence Active
              </div>
              <div className="text-xs text-indigo-700 mt-0.5">
                Comparing <span className="font-bold underline">{data.periodLabel}</span> against{' '}
                <span className="font-bold underline">{data.comparisonPeriodLabel}</span>.
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs font-bold">
            <span className="flex items-center gap-1.5 text-black">
              <span className="w-3 h-3 rounded-full bg-black inline-block" /> Current Period
            </span>
            <span className="flex items-center gap-1.5 text-indigo-600">
              <span className="w-3 h-3 rounded-full border-2 border-indigo-600 border-dashed inline-block" /> Previous Period
            </span>
          </div>
        </div>
      )}

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        {/* Revenue Card */}
        <div className="bg-white rounded-[2rem] p-6 border border-black/5 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-black/50">
              Total Revenue
            </span>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:scale-110 transition-transform">
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-black tracking-tight">
            {data.kpis.revenue.formatted}
          </div>
          {compare && data.kpis.revenue.changePercent !== undefined && (
            <div className="mt-3 flex items-center gap-1.5">
              <span
                className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-black ${
                  data.kpis.revenue.changePercent >= 0
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {data.kpis.revenue.changePercent >= 0 ? (
                  <ArrowUpRight size={12} />
                ) : (
                  <ArrowDownRight size={12} />
                )}
                {data.kpis.revenue.changePercent >= 0 ? '+' : ''}
                {data.kpis.revenue.changePercent}%
              </span>
              <span className="text-[10px] font-semibold text-black/40">vs prev</span>
            </div>
          )}
        </div>

        {/* Total Orders Card */}
        <div className="bg-white rounded-[2rem] p-6 border border-black/5 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-black/50">
              Total Orders
            </span>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl group-hover:scale-110 transition-transform">
              <ShoppingBag size={20} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-black tracking-tight">
            {data.kpis.orders.formatted}
          </div>
          {compare && data.kpis.orders.changePercent !== undefined && (
            <div className="mt-3 flex items-center gap-1.5">
              <span
                className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-black ${
                  data.kpis.orders.changePercent >= 0
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {data.kpis.orders.changePercent >= 0 ? (
                  <ArrowUpRight size={12} />
                ) : (
                  <ArrowDownRight size={12} />
                )}
                {data.kpis.orders.changePercent >= 0 ? '+' : ''}
                {data.kpis.orders.changePercent}%
              </span>
              <span className="text-[10px] font-semibold text-black/40">vs prev</span>
            </div>
          )}
        </div>

        {/* Average Order Value (AOV) Card */}
        <div className="bg-white rounded-[2rem] p-6 border border-black/5 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-black/50">
              Avg Order Value
            </span>
            <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl group-hover:scale-110 transition-transform">
              <CreditCard size={20} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-black tracking-tight">
            {data.kpis.avgOrderValue.formatted}
          </div>
          {compare && data.kpis.avgOrderValue.changePercent !== undefined && (
            <div className="mt-3 flex items-center gap-1.5">
              <span
                className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-black ${
                  data.kpis.avgOrderValue.changePercent >= 0
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {data.kpis.avgOrderValue.changePercent >= 0 ? (
                  <ArrowUpRight size={12} />
                ) : (
                  <ArrowDownRight size={12} />
                )}
                {data.kpis.avgOrderValue.changePercent >= 0 ? '+' : ''}
                {data.kpis.avgOrderValue.changePercent}%
              </span>
              <span className="text-[10px] font-semibold text-black/40">vs prev</span>
            </div>
          )}
        </div>

        {/* Units Sold Card */}
        <div className="bg-white rounded-[2rem] p-6 border border-black/5 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-black/50">
              Items Sold
            </span>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl group-hover:scale-110 transition-transform">
              <Package size={20} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-black tracking-tight">
            {data.kpis.itemsSold.formatted}
          </div>
          {compare && data.kpis.itemsSold.changePercent !== undefined && (
            <div className="mt-3 flex items-center gap-1.5">
              <span
                className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-black ${
                  data.kpis.itemsSold.changePercent >= 0
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {data.kpis.itemsSold.changePercent >= 0 ? (
                  <ArrowUpRight size={12} />
                ) : (
                  <ArrowDownRight size={12} />
                )}
                {data.kpis.itemsSold.changePercent >= 0 ? '+' : ''}
                {data.kpis.itemsSold.changePercent}%
              </span>
              <span className="text-[10px] font-semibold text-black/40">vs prev</span>
            </div>
          )}
        </div>

        {/* Conversion Rate Card */}
        <div className="bg-white rounded-[2rem] p-6 border border-black/5 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-black/50">
              Store Conversion
            </span>
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:scale-110 transition-transform">
              <MousePointerClick size={20} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-black tracking-tight">
            {data.kpis.conversionRate.formatted}
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] font-bold text-black/50">
            <span>{data.kpis.totalClicks.formatted} Views</span>
            <span>{data.kpis.totalCartAdds.formatted} In Cart</span>
          </div>
        </div>
      </div>

      {/* Section 1: Sales & Orders Performance Trends Chart */}
      <section
        id="section-sales-chart"
        className="bg-white rounded-[2.5rem] p-6 sm:p-8 border border-black/5 shadow-xl"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <BarChart2 size={22} className="text-black/70" />
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-black">
                Sales & Revenue Trends
              </h2>
            </div>
            <p className="text-xs text-black/50 font-bold uppercase tracking-wider mt-1">
              Time-bucketed performance comparison ({data.periodLabel})
            </p>
          </div>

          <div className="flex items-center gap-3 no-pdf">
            {/* Metric Switcher: Revenue vs Orders */}
            <div className="bg-black/5 p-1 rounded-xl flex items-center gap-1 text-xs font-black">
              <button
                onClick={() => setChartMetric('revenue')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  chartMetric === 'revenue'
                    ? 'bg-white text-black shadow-xs'
                    : 'text-black/60 hover:text-black'
                }`}
              >
                Revenue (AED)
              </button>
              <button
                onClick={() => setChartMetric('orders')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  chartMetric === 'orders'
                    ? 'bg-white text-black shadow-xs'
                    : 'text-black/60 hover:text-black'
                }`}
              >
                Order Volume
              </button>
            </div>

            {/* Section PDF Export */}
            <button
              onClick={() =>
                handlePdfExport(
                  'section-sales-chart',
                  'Sales & Revenue Trends Report',
                  `${chartMetric === 'revenue' ? 'Revenue (AED)' : 'Orders'} Chart`,
                  'landscape'
                )
              }
              disabled={isExporting !== null}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-black/5 hover:bg-black/10 rounded-xl text-xs font-black text-black transition-all"
              title="Download Section PDF"
            >
              <Download size={14} />
              <span>PDF</span>
            </button>
          </div>
        </div>

        {/* Main Interactive Recharts Graph */}
        <div className="h-[340px] sm:h-[400px] w-full pt-4">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            {chartMetric === 'revenue' ? (
              <AreaChart data={data.chartData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                <defs>
                  <linearGradient id="colorCurrentRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#000000" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#000000" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorPrevRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="label"
                  stroke="#9CA3AF"
                  fontSize={11}
                  fontWeight={600}
                  tickLine={false}
                />
                <YAxis
                  stroke="#9CA3AF"
                  fontSize={11}
                  fontWeight={600}
                  tickLine={false}
                  tickFormatter={(val) => `AED ${val}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#000000',
                    color: '#ffffff',
                    borderRadius: '16px',
                    border: 'none',
                    fontSize: '12px',
                    fontWeight: 700,
                  }}
                  formatter={(value: any, name: any) => [
                    `AED ${Number(value).toLocaleString()}`,
                    name === 'revenue' ? 'Current Period' : 'Previous Period',
                  ]}
                />
                <Legend
                  verticalAlign="top"
                  align="right"
                  height={36}
                  formatter={(val) => (val === 'revenue' ? 'Current Period' : 'Previous Period')}
                />
                {compare && (
                  <Area
                    type="monotone"
                    dataKey="prevRevenue"
                    stroke="#6366F1"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    fillOpacity={1}
                    fill="url(#colorPrevRev)"
                    name="prevRevenue"
                  />
                )}
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#000000"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorCurrentRev)"
                  name="revenue"
                />
              </AreaChart>
            ) : (
              <BarChart data={data.chartData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="label"
                  stroke="#9CA3AF"
                  fontSize={11}
                  fontWeight={600}
                  tickLine={false}
                />
                <YAxis stroke="#9CA3AF" fontSize={11} fontWeight={600} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#000000',
                    color: '#ffffff',
                    borderRadius: '16px',
                    border: 'none',
                    fontSize: '12px',
                    fontWeight: 700,
                  }}
                  formatter={(value: any, name: any) => [
                    `${value} orders`,
                    name === 'orders' ? 'Current Period' : 'Previous Period',
                  ]}
                />
                <Legend
                  verticalAlign="top"
                  align="right"
                  height={36}
                  formatter={(val) => (val === 'orders' ? 'Current Period' : 'Previous Period')}
                />
                {compare && (
                  <Bar
                    dataKey="prevOrders"
                    fill="#C7D2FE"
                    radius={[6, 6, 0, 0]}
                    name="prevOrders"
                  />
                )}
                <Bar
                  dataKey="orders"
                  fill="#000000"
                  radius={[6, 6, 0, 0]}
                  name="orders"
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </section>

      {/* Section 2: Conversion Funnel & Engagement */}
      <section
        id="section-funnel"
        className="bg-white rounded-[2.5rem] p-6 sm:p-8 border border-black/5 shadow-xl"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2">
              <Layers size={22} className="text-black/70" />
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-black">
                Customer Conversion Funnel
              </h2>
            </div>
            <p className="text-xs text-black/50 font-bold uppercase tracking-wider mt-1">
              From initial product discovery to completed checkout
            </p>
          </div>

          <button
            onClick={() =>
              handlePdfExport(
                'section-funnel',
                'Customer Conversion Funnel Report',
                data.periodLabel
              )
            }
            className="no-pdf flex items-center gap-1.5 px-3.5 py-1.5 bg-black/5 hover:bg-black/10 rounded-xl text-xs font-black text-black transition-all"
          >
            <Download size={14} />
            <span>PDF</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {data.funnel.map((stage, idx) => (
            <div
              key={stage.stage}
              className="bg-black/[0.02] border border-black/5 p-5 rounded-2xl relative overflow-hidden"
            >
              <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-wider text-black/50 mb-2">
                <span>Step {idx + 1}</span>
                <span>{stage.percentage}%</span>
              </div>
              <div className="text-2xl font-black text-black">{stage.count.toLocaleString()}</div>
              <div className="text-xs font-bold text-black/70 mt-1">{stage.stage}</div>

              {/* Progress bar */}
              <div className="w-full bg-black/5 h-2 rounded-full mt-4 overflow-hidden">
                <div
                  className="bg-black h-full rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(stage.percentage, 100)}%` }}
                />
              </div>

              {stage.dropOff > 0 && (
                <div className="text-[10px] font-black text-red-500 mt-2 flex items-center gap-1">
                  <span>&darr; {stage.dropOff}% drop-off</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Section 3: Deep Product Analytics (Core Requirement) */}
      <section
        id="section-products-analytics"
        className="bg-white rounded-[2.5rem] p-6 sm:p-8 border border-black/5 shadow-xl space-y-8"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Package size={22} className="text-black/70" />
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-black">
                Product Analytics & Discovery Intelligence
              </h2>
            </div>
            <p className="text-xs text-black/50 font-bold uppercase tracking-wider mt-1">
              Orders, Clicks, Add-to-Cart conversions & Search frequency per product
            </p>
          </div>

          <div className="flex items-center gap-3 no-pdf">
            <button
              onClick={() =>
                handlePdfExport(
                  'section-products-analytics',
                  'Product Analytics & Discovery Intelligence',
                  `Catalog Performance (${data.products.length} Products)`,
                  'landscape'
                )
              }
              className="flex items-center gap-2 bg-black text-white hover:bg-black/80 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-sm"
            >
              <Download size={14} />
              Export Product PDF
            </button>
          </div>
        </div>

        {/* Top 8 Products Visual Chart */}
        <div className="bg-black/[0.015] rounded-3xl p-6 border border-black/5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-black uppercase tracking-wider text-black">
              Top Products Performance (Orders vs Clicks vs Cart)
            </span>
            <span className="text-[10px] font-bold text-black/40">Visual Benchmark</span>
          </div>

          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart data={data.topProductsChart} margin={{ top: 10, right: 20, left: 0, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="name"
                  stroke="#9CA3AF"
                  fontSize={10}
                  fontWeight={600}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis stroke="#9CA3AF" fontSize={10} fontWeight={600} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#000000',
                    color: '#ffffff',
                    borderRadius: '16px',
                    border: 'none',
                    fontSize: '11px',
                    fontWeight: 700,
                  }}
                />
                <Legend verticalAlign="top" height={30} />
                <Bar dataKey="orders" fill="#000000" name="Orders" radius={[4, 4, 0, 0]} />
                <Bar dataKey="cartAdds" fill="#6366F1" name="Cart Adds" radius={[4, 4, 0, 0]} />
                <Bar dataKey="clicks" fill="#A855F7" name="Clicks / Views" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Filter & Search Bar for Product Table */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 no-pdf">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-black/40" />
            <input
              type="text"
              placeholder="Search product name, SKU, or brand..."
              value={productSearch}
              onChange={(e) => {
                setProductSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 bg-black/5 hover:bg-black/[0.07] focus:bg-white border border-transparent focus:border-black/20 rounded-2xl text-xs font-bold text-black outline-none transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Category Dropdown */}
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setPage(1);
              }}
              className="bg-black/5 hover:bg-black/[0.07] text-black px-3.5 py-2.5 rounded-2xl text-xs font-black border border-transparent outline-none cursor-pointer"
            >
              <option value="all">All Categories ({categories.length})</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value as any);
                setPage(1);
              }}
              className="bg-black/5 hover:bg-black/[0.07] text-black px-3.5 py-2.5 rounded-2xl text-xs font-black border border-transparent outline-none cursor-pointer"
            >
              <option value="orders">Sort: Most Orders</option>
              <option value="revenue">Sort: Highest Revenue</option>
              <option value="clicks">Sort: Most Clicks / Views</option>
              <option value="cartAdds">Sort: Most Cart Adds</option>
              <option value="search">Sort: Most Searched</option>
              <option value="conversion">Sort: Highest Conversion</option>
            </select>
          </div>
        </div>

        {/* Detailed Product Analytics Table */}
        <div className="overflow-x-auto rounded-3xl border border-black/5">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black text-white">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">
                  Product Info
                </th>
                <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-right">
                  Price / Stock
                </th>
                <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-center">
                  Orders Count
                </th>
                <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-center">
                  Units Sold
                </th>
                <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-right">
                  Total Revenue
                </th>
                <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-center">
                  Clicks / Views
                </th>
                <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-center">
                  In Cart
                </th>
                <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-center">
                  Search Freq
                </th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-right">
                  Conversion
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 text-xs font-bold">
              {paginatedProducts.map((p) => {
                const orderShare = Math.round((p.ordersCount / maxOrders) * 100);
                const clickShare = Math.round((p.clicks / maxClicks) * 100);

                return (
                  <tr key={p.id} className="hover:bg-black/[0.015] transition-colors">
                    {/* Product Name & Thumbnail */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gray-100 relative overflow-hidden shrink-0 border border-black/5">
                          {p.mainImage ? (
                            <Image
                              src={p.mainImage}
                              alt={p.name}
                              fill
                              sizes="48px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                              <Package size={18} />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-black text-black line-clamp-1 max-w-[280px]">
                            {p.name}
                          </div>
                          <div className="text-[10px] font-semibold text-black/50 mt-0.5 flex items-center gap-2">
                            <span>{p.brand}</span>
                            <span>&bull;</span>
                            <span className="bg-black/5 px-2 py-0.5 rounded-full text-[9px] font-bold">
                              {p.sku}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Price & Stock */}
                    <td className="px-4 py-4 text-right">
                      <div className="font-black text-black">AED {p.price}</div>
                      <div className="text-[10px] font-semibold text-black/50">
                        {p.stockQuantity} in stock
                      </div>
                    </td>

                    {/* Orders Count with Mini Bar */}
                    <td className="px-4 py-4 text-center">
                      <span className="font-black text-sm text-black">{p.ordersCount}</span>
                      <div className="w-16 h-1 bg-black/10 rounded-full mx-auto mt-1 overflow-hidden">
                        <div
                          className="bg-black h-full rounded-full"
                          style={{ width: `${orderShare}%` }}
                        />
                      </div>
                    </td>

                    {/* Units Sold */}
                    <td className="px-4 py-4 text-center font-black text-sm text-black">
                      {p.unitsSold}
                    </td>

                    {/* Total Revenue */}
                    <td className="px-4 py-4 text-right font-black text-sm text-black">
                      AED {p.revenue.toLocaleString()}
                    </td>

                    {/* Clicks / Views */}
                    <td className="px-4 py-4 text-center">
                      <div className="inline-flex items-center gap-1 text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full text-[11px] font-black">
                        <Eye size={12} />
                        {p.clicks}
                      </div>
                    </td>

                    {/* Cart Adds */}
                    <td className="px-4 py-4 text-center">
                      <div className="inline-flex items-center gap-1 text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full text-[11px] font-black">
                        <ShoppingCart size={12} />
                        {p.cartAdds}
                      </div>
                    </td>

                    {/* Search Frequency */}
                    <td className="px-4 py-4 text-center">
                      <div className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full text-[11px] font-black">
                        <Search size={12} />
                        {p.searchFrequency}
                      </div>
                    </td>

                    {/* Conversion Rate */}
                    <td className="px-6 py-4 text-right">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-black ${
                          p.conversionRate > 5
                            ? 'bg-emerald-100 text-emerald-800'
                            : p.conversionRate > 0
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {p.conversionRate}%
                      </span>
                    </td>
                  </tr>
                );
              })}

              {paginatedProducts.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-sm font-semibold text-black/40">
                    No products matched your search filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 no-pdf pt-2">
          <div className="text-xs font-bold text-black/50">
            Showing {(page - 1) * pageSize + 1} to{' '}
            {Math.min(page * pageSize, filteredProducts.length)} of{' '}
            {filteredProducts.length} products
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="px-3.5 py-1.5 rounded-xl border border-black/10 text-xs font-black disabled:opacity-40 hover:bg-black/5 transition-all"
            >
              Previous
            </button>
            <span className="text-xs font-black text-black px-2">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page === totalPages}
              className="px-3.5 py-1.5 rounded-xl border border-black/10 text-xs font-black disabled:opacity-40 hover:bg-black/5 transition-all"
            >
              Next
            </button>
          </div>
        </div>
      </section>

      {/* Grid: Referral Sources & Regional Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Section 4: Traffic & Referral Sources */}
        <section
          id="section-referral-sources"
          className="bg-white rounded-[2.5rem] p-6 sm:p-8 border border-black/5 shadow-xl space-y-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Globe size={22} className="text-black/70" />
                <h2 className="text-xl font-black tracking-tight text-black">
                  Traffic & Referral Channels
                </h2>
              </div>
              <p className="text-xs text-black/50 font-bold uppercase tracking-wider mt-1">
                Where high-converting orders originate
              </p>
            </div>

            <button
              onClick={() =>
                handlePdfExport(
                  'section-referral-sources',
                  'Traffic & Referral Channels Report',
                  data.periodLabel
                )
              }
              className="no-pdf flex items-center gap-1.5 px-3 py-1.5 bg-black/5 hover:bg-black/10 rounded-xl text-xs font-black text-black transition-all"
            >
              <Download size={14} />
              <span>PDF</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-black/10 text-[10px] font-black uppercase text-black/50">
                  <th className="py-3">Source</th>
                  <th className="py-3 text-center">Orders</th>
                  <th className="py-3 text-right">Revenue</th>
                  <th className="py-3 text-right">AOV</th>
                  <th className="py-3 text-right">Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 font-bold">
                {data.sources.map((s) => (
                  <tr key={s.source} className="hover:bg-black/[0.01]">
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: s.color }}
                        />
                        <span className="font-black text-black">{s.label}</span>
                      </div>
                    </td>
                    <td className="py-3 text-center font-black">{s.orders}</td>
                    <td className="py-3 text-right font-black">
                      AED {s.revenue.toLocaleString()}
                    </td>
                    <td className="py-3 text-right text-black/70">
                      AED {s.avgOrder.toFixed(2)}
                    </td>
                    <td className="py-3 text-right">
                      <span className="bg-black/5 px-2 py-0.5 rounded-full font-black text-[10px]">
                        {s.percentage}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 5: Regional & Payment Breakdown */}
        <section
          id="section-regional-payment"
          className="bg-white rounded-[2.5rem] p-6 sm:p-8 border border-black/5 shadow-xl space-y-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <CreditCard size={22} className="text-black/70" />
                <h2 className="text-xl font-black tracking-tight text-black">
                  Regional & Payment Methods
                </h2>
              </div>
              <p className="text-xs text-black/50 font-bold uppercase tracking-wider mt-1">
                Order geographical spread and payment preferences
              </p>
            </div>

            <button
              onClick={() =>
                handlePdfExport(
                  'section-regional-payment',
                  'Regional & Payment Methods Report',
                  data.periodLabel
                )
              }
              className="no-pdf flex items-center gap-1.5 px-3 py-1.5 bg-black/5 hover:bg-black/10 rounded-xl text-xs font-black text-black transition-all"
            >
              <Download size={14} />
              <span>PDF</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Countries List */}
            <div className="bg-black/[0.02] p-4 rounded-2xl border border-black/5">
              <span className="text-[10px] font-black uppercase tracking-wider text-black/50 block mb-3">
                Top Countries
              </span>
              <div className="space-y-3">
                {data.countries.slice(0, 5).map((c) => (
                  <div key={c.country} className="flex items-center justify-between text-xs font-bold">
                    <span className="text-black">{c.countryName}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-black">{c.orders} orders</span>
                      <span className="bg-black/5 text-[10px] px-1.5 py-0.5 rounded-md font-black">
                        {c.percentage}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Methods List */}
            <div className="bg-black/[0.02] p-4 rounded-2xl border border-black/5">
              <span className="text-[10px] font-black uppercase tracking-wider text-black/50 block mb-3">
                Payment Gateways
              </span>
              <div className="space-y-3">
                {data.paymentMethods.map((pm) => (
                  <div key={pm.method} className="flex items-center justify-between text-xs font-bold">
                    <span className="text-black">{pm.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-black">{pm.orders} orders</span>
                      <span className="bg-black/5 text-[10px] px-1.5 py-0.5 rounded-md font-black">
                        {pm.percentage}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Order Status Breakdown */}
          <div className="pt-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-black/50 block mb-2">
              Fulfillment Status
            </span>
            <div className="flex flex-wrap gap-2">
              {data.statusBreakdown.map((sb) => (
                <div
                  key={sb.status}
                  className="px-3 py-1.5 rounded-xl border border-black/5 text-xs font-black flex items-center gap-2 bg-white"
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: sb.color }}
                  />
                  <span>{sb.status.replace(/_/g, ' ')}</span>
                  <span className="text-black/50">({sb.count})</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* Section 6: Search Insights & Query Analytics */}
      <section
        id="section-search-queries"
        className="bg-white rounded-[2.5rem] p-6 sm:p-8 border border-black/5 shadow-xl space-y-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Search size={22} className="text-black/70" />
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-black">
                Search Discovery & Customer Intent
              </h2>
            </div>
            <p className="text-xs text-black/50 font-bold uppercase tracking-wider mt-1">
              Top keywords searched by customers leading to catalog discovery
            </p>
          </div>

          <button
            onClick={() =>
              handlePdfExport(
                'section-search-queries',
                'Search Discovery & Customer Intent Report',
                data.periodLabel
              )
            }
            className="no-pdf flex items-center gap-1.5 px-3.5 py-1.5 bg-black/5 hover:bg-black/10 rounded-xl text-xs font-black text-black transition-all"
          >
            <Download size={14} />
            <span>PDF</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {data.searchQueries.map((sq, idx) => (
            <div
              key={sq.query}
              className="p-4 rounded-2xl bg-black/[0.02] border border-black/5 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-black/5 text-black font-black text-xs flex items-center justify-center shrink-0">
                  {idx + 1}
                </span>
                <div>
                  <div className="font-black text-xs text-black capitalize">
                    &ldquo;{sq.query}&rdquo;
                  </div>
                  <div className="text-[10px] font-semibold text-black/40">
                    {sq.resultsCount} products returned
                  </div>
                </div>
              </div>
              <span className="bg-amber-100 text-amber-900 px-2.5 py-1 rounded-full text-xs font-black shrink-0">
                {sq.count} searches
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
