'use client';

import { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle, ArrowDownRight, ArrowUpRight, Ban, Boxes, CheckCircle2, ChevronRight, Clock,
  PackageX, Plus, RefreshCw, RotateCcw, Star,
} from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { DashboardData } from './data';
import {
  Card, CardLink, EmptyState, ORDER_STATUS_META, OrderStatusBadge, PageHeader, btn, formatMoney,
} from '../_components/ui';

const STATUS_COLORS: Record<string, string> = {
  ORDER_RECEIVED: '#f59e0b', ORDER_CONFIRMED: '#3b82f6', PROCESSING: '#6366f1', READY_FOR_PICKUP: '#8b5cf6',
  ORDER_PICKED_UP: '#f97316', IN_TRANSIT: '#06b6d4', DELIVERED: '#10b981', CANCELLED: '#f43f5e',
  REFUNDED: '#94a3b8', PENDING: '#cbd5e1',
};

function aed(n: number) {
  return `AED ${Math.round(n).toLocaleString('en-US')}`;
}

function compactAed(n: number) {
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(Math.round(n));
}

function greeting() {
  const h = Number(new Date().toLocaleString('en-US', { hour: 'numeric', hour12: false, timeZone: 'Asia/Dubai' }));
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function Delta({ current, previous }: { current: number; previous: number }) {
  if (previous === 0 && current === 0) return <span className="text-xs text-slate-400">No change</span>;
  if (previous === 0) return <span className="text-xs font-medium text-emerald-600">New</span>;
  const pct = ((current - previous) / previous) * 100;
  const up = pct >= 0;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-medium ${up ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
      <Icon size={13} />
      {Math.abs(pct) >= 1000 ? '999+' : Math.abs(pct).toFixed(Math.abs(pct) < 10 ? 1 : 0)}%
    </span>
  );
}

function Kpi({ label, value, current, previous, foot }: { label: string; value: string; current: number; previous: number; foot?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="text-[13px] text-slate-500">{label}</div>
      <div className="mt-1.5 flex items-baseline gap-2">
        <span className="text-[26px] font-semibold leading-none tracking-tight text-slate-900 tabular-nums">{value}</span>
        <Delta current={current} previous={previous} />
      </div>
      <div className="mt-2 text-xs text-slate-400">{foot || 'vs previous 30 days'}</div>
    </div>
  );
}

function ChartTooltip({ active, payload, metric }: any) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  const isRev = metric === 'revenue';
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg">
      <div className="mb-1 font-medium text-slate-900">{row.label}</div>
      <div className="flex items-center gap-2 text-slate-700">
        <span className="h-2 w-2 rounded-full bg-[#9c0f55]" />
        This period: <span className="font-medium tabular-nums">{isRev ? aed(row.revenue) : row.orders}</span>
      </div>
      <div className="flex items-center gap-2 text-slate-500">
        <span className="h-2 w-2 rounded-full bg-slate-300" />
        Previous: <span className="tabular-nums">{isRev ? aed(row.prevRevenue) : row.prevOrders}</span>
      </div>
    </div>
  );
}

export function DashboardClient({ data, adminName }: { data: DashboardData; adminName: string }) {
  const router = useRouter();
  const [refreshing, startRefresh] = useTransition();
  const [metric, setMetric] = useState<'revenue' | 'orders'>('revenue');
  const { kpis, lifetime, attention, series, countries, reviews, topProducts, recentOrders, statusCounts } = data;

  const firstName = adminName.split(/[\s@]/)[0];
  const pipeline = useMemo(() => {
    const order = ['ORDER_RECEIVED', 'ORDER_CONFIRMED', 'PROCESSING', 'READY_FOR_PICKUP', 'ORDER_PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED', 'REFUNDED'];
    const max = Math.max(1, ...order.map((s) => statusCounts[s] || 0));
    return order.map((s) => ({ status: s, count: statusCounts[s] || 0, pct: ((statusCounts[s] || 0) / max) * 100 }));
  }, [statusCounts]);

  const attentionItems = [
    { label: 'Orders to confirm', count: attention.toConfirm, href: '/ueadmin/orders?status=ORDER_RECEIVED', icon: Clock, tone: 'text-amber-600 bg-amber-50' },
    { label: 'Cancellation requests', count: attention.cancelRequests, href: '/ueadmin/orders', icon: Ban, tone: 'text-rose-600 bg-rose-50' },
    { label: 'Return requests', count: attention.returnRequests, href: '/ueadmin/orders', icon: RotateCcw, tone: 'text-violet-600 bg-violet-50' },
    { label: 'Low stock (≤ 5 units)', count: attention.lowStock, href: '/ueadmin/products', icon: Boxes, tone: 'text-orange-600 bg-orange-50' },
    { label: 'Out of stock products', count: attention.outOfStock, href: '/ueadmin/products', icon: PackageX, tone: 'text-slate-600 bg-slate-100' },
  ];
  const openTasks = attentionItems.reduce((n, i) => n + (i.count > 0 ? 1 : 0), 0);
  const maxCountryRevenue = Math.max(1, ...countries.map((c) => c.revenue));

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${greeting()}, ${firstName}`}
        description={
          kpis.todayOrders > 0
            ? `Today so far: ${kpis.todayOrders} order${kpis.todayOrders === 1 ? '' : 's'} · ${aed(kpis.todayRevenue)}`
            : 'No orders yet today. Here’s how the last 30 days look.'
        }
        actions={
          <>
            <button onClick={() => startRefresh(() => router.refresh())} className={btn.secondary} disabled={refreshing}>
              <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} /> Refresh
            </button>
            <Link href="/ueadmin/orders/create" className={btn.primary}>
              <Plus size={15} /> Create order
            </Link>
          </>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Revenue · 30 days" value={aed(kpis.revenue30)} current={kpis.revenue30} previous={kpis.revenuePrev30} />
        <Kpi label="Orders · 30 days" value={kpis.orders30.toLocaleString()} current={kpis.orders30} previous={kpis.ordersPrev30} />
        <Kpi label="Average order value" value={aed(kpis.aov30)} current={kpis.aov30} previous={kpis.aovPrev30} />
        <Kpi label="New customers" value={kpis.newCustomers30.toLocaleString()} current={kpis.newCustomers30} previous={kpis.newCustomersPrev30} />
      </div>

      {/* Chart + attention */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card
          className="xl:col-span-2"
          title={metric === 'revenue' ? 'Revenue' : 'Orders'}
          description="Last 30 days compared with the 30 days before · excludes cancelled · AED"
          action={
            <div className="flex rounded-lg border border-slate-200 p-0.5 text-xs">
              {(['revenue', 'orders'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMetric(m)}
                  className={`rounded-md px-2.5 py-1 font-medium capitalize transition-colors ${metric === m ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  {m}
                </button>
              ))}
            </div>
          }
          bodyClassName="px-2 pb-3 pt-4"
        >
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 800, height: 280 }}>
              <AreaChart data={series} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="dashFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#9c0f55" stopOpacity={0.18} />
                    <stop offset="100%" stopColor="#9c0f55" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#475569' }} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={24} />
                <YAxis
                  tick={{ fontSize: 11, fill: '#475569' }}
                  tickLine={false}
                  axisLine={false}
                  width={44}
                  allowDecimals={false}
                  tickFormatter={(v) => (metric === 'revenue' ? compactAed(v) : String(v))}
                />
                <Tooltip content={<ChartTooltip metric={metric} />} cursor={{ stroke: '#cbd5e1', strokeDasharray: '3 3' }} />
                <Area
                  type="monotone"
                  dataKey={metric === 'revenue' ? 'prevRevenue' : 'prevOrders'}
                  stroke="#cbd5e1"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  fill="none"
                  isAnimationActive={false}
                />
                <Area
                  type="monotone"
                  dataKey={metric === 'revenue' ? 'revenue' : 'orders'}
                  stroke="#9c0f55"
                  strokeWidth={2}
                  fill="url(#dashFill)"
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card
          title="Needs attention"
          description={openTasks > 0 ? `${openTasks} area${openTasks === 1 ? '' : 's'} waiting on you` : 'Nothing waiting on you'}
          bodyClassName="p-2"
        >
          <ul>
            {attentionItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.label}>
                  <Link href={item.href} className="group flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-slate-50">
                    <span className={`grid h-8 w-8 place-items-center rounded-lg ${item.count > 0 ? item.tone : 'bg-slate-50 text-slate-300'}`}>
                      <Icon size={16} />
                    </span>
                    <span className={`flex-1 text-sm ${item.count > 0 ? 'text-slate-800' : 'text-slate-400'}`}>{item.label}</span>
                    <span className={`text-sm font-semibold tabular-nums ${item.count > 0 ? 'text-slate-900' : 'text-slate-300'}`}>{item.count}</span>
                    <ChevronRight size={15} className="text-slate-300 group-hover:text-slate-500" />
                  </Link>
                </li>
              );
            })}
          </ul>
          {openTasks === 0 && (
            <div className="mx-3 mb-2 mt-1 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
              <CheckCircle2 size={14} /> All clear. Nice work.
            </div>
          )}
        </Card>
      </div>

      {/* Recent orders + pipeline */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2" title="Recent orders" action={<CardLink href="/ueadmin/orders">View all</CardLink>} bodyClassName="">
          {recentOrders.length === 0 ? (
            <EmptyState title="No orders yet" description="New orders will show up here as soon as they’re placed." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <tbody>
                  {recentOrders.map((o) => (
                    <tr key={o.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70">
                      <td className="py-3 pl-5 pr-3">
                        <Link href={`/ueadmin/orders/${o.id}`} className="font-medium text-slate-900 hover:underline">{o.number}</Link>
                        <div className="text-xs text-slate-500">
                          {new Date(o.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Dubai' })}
                        </div>
                      </td>
                      <td className="max-w-[200px] truncate px-3 py-3 text-slate-700">{o.customer}</td>
                      <td className="px-3 py-3"><OrderStatusBadge status={o.status} /></td>
                      <td className="whitespace-nowrap py-3 pl-3 pr-5 text-right font-medium tabular-nums text-slate-900">{formatMoney(o.total, o.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card title="Order pipeline" description={`${lifetime.orders.toLocaleString()} orders all-time`} action={<CardLink href="/ueadmin/orders">Manage</CardLink>}>
          <ul className="space-y-3">
            {pipeline.map((p) => (
              <li key={p.status}>
                <Link href={`/ueadmin/orders?status=${p.status}`} className="group block">
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-slate-600 group-hover:text-slate-900">{ORDER_STATUS_META[p.status]?.label || p.status}</span>
                    <span className="font-medium tabular-nums text-slate-900">{p.count.toLocaleString()}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full" style={{ width: `${Math.max(p.count > 0 ? 2 : 0, p.pct)}%`, background: STATUS_COLORS[p.status] }} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Countries + products + reviews */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
        <Card title="Sales by country" description="All-time, excludes cancelled">
          {countries.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500">No sales yet.</p>
          ) : (
            <ul className="space-y-3.5">
              {countries.map((c) => (
                <li key={c.code}>
                  <div className="mb-1 flex items-center gap-2 text-sm">
                    <span className="text-base leading-none">{c.flag}</span>
                    <span className="flex-1 truncate text-slate-700">{c.name}</span>
                    <span className="font-medium tabular-nums text-slate-900">{aed(c.revenue)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-slate-800" style={{ width: `${(c.revenue / maxCountryRevenue) * 100}%` }} />
                    </div>
                    <span className="w-28 text-right text-xs tabular-nums text-slate-500">
                      {c.orders.toLocaleString()} orders · {c.deliveredRate}% del.
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Top products" description="Units sold · last 30 days" action={<CardLink href="/ueadmin/products">All products</CardLink>} bodyClassName="p-2">
          {topProducts.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500">No sales in the last 30 days.</p>
          ) : (
            <ul>
              {topProducts.map((p, i) => (
                <li key={p.id}>
                  <Link href={`/ueadmin/products/${p.id}`} className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-slate-50">
                    <span className="w-4 text-xs tabular-nums text-slate-400">{i + 1}</span>
                    {p.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.image} alt="" className="h-9 w-9 rounded-md border border-slate-100 object-cover" loading="lazy" />
                    ) : (
                      <span className="h-9 w-9 rounded-md bg-slate-100" />
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-slate-800">{p.name}</span>
                      <span className={`block text-xs ${p.stock <= 5 ? 'text-orange-600' : 'text-slate-500'}`}>
                        {p.stock <= 0 ? 'Out of stock' : `${p.stock} in stock`}
                      </span>
                    </span>
                    <span className="text-sm font-semibold tabular-nums text-slate-900">{p.units}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Customer reviews" description={reviews.count > 0 ? `${reviews.count} published reviews` : 'No published reviews yet'}>
          {reviews.count === 0 || reviews.average === null ? (
            <p className="py-6 text-center text-sm text-slate-500">Reviews will appear once published.</p>
          ) : (
            <div className="flex gap-6">
              <div className="shrink-0 text-center">
                <div className="text-4xl font-semibold tracking-tight text-slate-900 tabular-nums">{reviews.average.toFixed(1)}</div>
                <div className="mt-1 flex justify-center gap-0.5 text-amber-400">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} size={13} fill={s <= Math.round(reviews.average!) ? 'currentColor' : 'none'} />
                  ))}
                </div>
                <div className="mt-1 text-xs text-slate-500">out of 5</div>
              </div>
              <ul className="flex-1 space-y-1.5">
                {[5, 4, 3, 2, 1].map((r) => {
                  const n = reviews.ratings[r] || 0;
                  return (
                    <li key={r} className="flex items-center gap-2 text-xs">
                      <span className="w-3 tabular-nums text-slate-500">{r}</span>
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-amber-400" style={{ width: `${(n / reviews.count) * 100}%` }} />
                      </div>
                      <span className="w-8 text-right tabular-nums text-slate-500">{n}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </Card>
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-slate-200 pt-4 text-xs text-slate-500">
        <span>Lifetime revenue <span className="font-medium text-slate-700">{aed(lifetime.revenue)}</span></span>
        <span>Active products <span className="font-medium text-slate-700">{lifetime.products.toLocaleString()}</span></span>
        <span>Registered customers <span className="font-medium text-slate-700">{lifetime.customers.toLocaleString()}</span></span>
        {attention.lowStock > 0 && (
          <span className="flex items-center gap-1 text-orange-600"><AlertTriangle size={12} /> {attention.lowStock} store SKUs running low</span>
        )}
        <span className="ml-auto">
          Updated {new Date(data.generatedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Dubai' })} (Dubai time)
        </span>
      </div>
    </div>
  );
}
