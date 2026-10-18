import { prisma } from '@/lib/prisma';
import { convertToAED } from '@/lib/currency-rates';
import { formatOrderNumber } from '@/lib/order-number';

const DAY_MS = 86_400_000;
const TZ = 'Asia/Dubai';

export const GCC: Record<string, { name: string; flag: string }> = {
  AE: { name: 'United Arab Emirates', flag: '🇦🇪' },
  SA: { name: 'Saudi Arabia', flag: '🇸🇦' },
  KW: { name: 'Kuwait', flag: '🇰🇼' },
  QA: { name: 'Qatar', flag: '🇶🇦' },
  BH: { name: 'Bahrain', flag: '🇧🇭' },
  OM: { name: 'Oman', flag: '🇴🇲' },
};

const COUNTRY_ALIASES: Record<string, string> = {
  'UNITED ARAB EMIRATES': 'AE', ARE: 'AE', UAE: 'AE', EMIRATES: 'AE',
  'SAUDI ARABIA': 'SA', KSA: 'SA', SAU: 'SA',
  KUWAIT: 'KW', KWT: 'KW',
  QATAR: 'QA', QAT: 'QA',
  BAHRAIN: 'BH', BHR: 'BH',
  OMAN: 'OM', OMN: 'OM',
};

function normalizeCountry(raw: string | null | undefined): string {
  const c = (raw || '').trim().toUpperCase();
  if (!c) return 'OTHER';
  if (GCC[c]) return c;
  return COUNTRY_ALIASES[c] || 'OTHER';
}

/** Day key in store time, e.g. "2026-10-18". */
function dayKey(d: Date) {
  return d.toLocaleDateString('en-CA', { timeZone: TZ });
}

type StatusRow = { _id: { status: string; currency: string | null }; count: number; sum: number };
type DayRow = { _id: { day: string; currency: string | null }; count: number; sum: number };
type CountryRow = { _id: { country: string; currency: string | null; delivered: boolean }; count: number; sum: number };

export async function getDashboardData(storeIds: string[]) {
  const now = Date.now();
  const since30 = new Date(now - 30 * DAY_MS);
  const since60 = new Date(now - 60 * DAY_MS);

  const storeMatch = storeIds.length > 0 ? { storeId: { $in: storeIds.map((id) => ({ $oid: id })) } } : {};
  const storeWhere = storeIds.length > 0 ? { storeId: { in: storeIds } } : {};

  // One pass over orders for every order-derived number on the page.
  const facetPromise = prisma.order.aggregateRaw({
    pipeline: [
      { $match: storeMatch },
      {
        $facet: {
          byStatus: [
            { $group: { _id: { status: '$status', currency: '$currency' }, count: { $sum: 1 }, sum: { $sum: { $ifNull: ['$total', 0] } } } },
          ],
          daily: [
            { $match: { createdAt: { $gte: { $date: since60.toISOString() } }, status: { $ne: 'CANCELLED' } } },
            {
              $group: {
                _id: { day: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: TZ } }, currency: '$currency' },
                count: { $sum: 1 },
                sum: { $sum: { $ifNull: ['$total', 0] } },
              },
            },
          ],
          byCountry: [
            { $match: { status: { $ne: 'CANCELLED' } } },
            {
              $group: {
                _id: {
                  country: { $toUpper: { $ifNull: ['$shippingAddress.country', { $ifNull: ['$billingAddress.country', ''] }] } },
                  currency: '$currency',
                  delivered: { $eq: ['$status', 'DELIVERED'] },
                },
                count: { $sum: 1 },
                sum: { $sum: { $ifNull: ['$total', 0] } },
              },
            },
          ],
        },
      },
    ],
  }) as unknown as Promise<{ byStatus: StatusRow[]; daily: DayRow[]; byCountry: CountryRow[] }[]>;

  const [
    facetRaw,
    recentOrdersRaw,
    productsCount,
    customersCount,
    newCustomers30,
    newCustomersPrev30,
    cancelRequests,
    returnRequests,
    lowStock,
    outOfStock,
    ratingGroups,
    topItems,
  ] = await Promise.all([
    facetPromise,
    prisma.order.findMany({
      where: storeWhere,
      orderBy: { createdAt: 'desc' },
      take: 8,
      select: {
        id: true, createdAt: true, status: true, paymentStatus: true, total: true, currency: true, email: true,
        billingAddress: true,
        user: { select: { name: true, email: true } },
      },
    }),
    prisma.product.count({ where: { active: true } }),
    prisma.user.count({ where: { role: 'USER' } }),
    prisma.user.count({ where: { role: 'USER', createdAt: { gte: since30 } } }),
    prisma.user.count({ where: { role: 'USER', createdAt: { gte: since60, lt: since30 } } }),
    prisma.order.count({ where: { ...storeWhere, cancelRequest: true, status: { notIn: ['CANCELLED', 'REFUNDED'] } } }),
    prisma.order.count({ where: { ...storeWhere, returnRequest: true, returnStatus: { in: ['NONE', 'PENDING'] } } }),
    prisma.storeInventory.count({ where: { ...(storeIds.length ? { storeId: { in: storeIds } } : {}), quantity: { lte: 5 } } }),
    prisma.product.count({ where: { active: true, stockQuantity: { lte: 0 } } }),
    prisma.review.groupBy({ by: ['rating'], where: { active: true }, _count: { _all: true } }),
    prisma.orderItem.groupBy({
      by: ['productId'],
      where: { order: { createdAt: { gte: since30 }, status: { not: 'CANCELLED' }, ...storeWhere } },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5,
    }),
  ]);

  const facet = facetRaw[0] || { byStatus: [], daily: [], byCountry: [] };

  // ----- Status pipeline & all-time totals -----
  const statusCounts: Record<string, number> = {};
  let totalOrders = 0;
  let lifetimeRevenue = 0;
  for (const r of facet.byStatus) {
    statusCounts[r._id.status] = (statusCounts[r._id.status] || 0) + r.count;
    totalOrders += r.count;
    if (r._id.status !== 'CANCELLED') lifetimeRevenue += convertToAED(r.sum, r._id.currency);
  }

  // ----- Daily series: last 30 days vs the 30 before -----
  const byDay = new Map<string, { revenue: number; orders: number }>();
  for (const r of facet.daily) {
    const cur = byDay.get(r._id.day) || { revenue: 0, orders: 0 };
    cur.revenue += convertToAED(r.sum, r._id.currency);
    cur.orders += r.count;
    byDay.set(r._id.day, cur);
  }

  const series: { date: string; label: string; revenue: number; orders: number; prevRevenue: number; prevOrders: number }[] = [];
  const totals = { revenue: 0, orders: 0, prevRevenue: 0, prevOrders: 0 };
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now - i * DAY_MS);
    const p = new Date(now - (i + 30) * DAY_MS);
    const cur = byDay.get(dayKey(d)) || { revenue: 0, orders: 0 };
    const prev = byDay.get(dayKey(p)) || { revenue: 0, orders: 0 };
    series.push({
      date: dayKey(d),
      label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: TZ }),
      revenue: Math.round(cur.revenue),
      orders: cur.orders,
      prevRevenue: Math.round(prev.revenue),
      prevOrders: prev.orders,
    });
    totals.revenue += cur.revenue;
    totals.orders += cur.orders;
    totals.prevRevenue += prev.revenue;
    totals.prevOrders += prev.orders;
  }

  const today = byDay.get(dayKey(new Date(now))) || { revenue: 0, orders: 0 };

  // ----- Countries -----
  const countryMap = new Map<string, { orders: number; revenue: number; delivered: number }>();
  for (const r of facet.byCountry) {
    const code = normalizeCountry(r._id.country);
    const cur = countryMap.get(code) || { orders: 0, revenue: 0, delivered: 0 };
    cur.orders += r.count;
    cur.revenue += convertToAED(r.sum, r._id.currency);
    if (r._id.delivered) cur.delivered += r.count;
    countryMap.set(code, cur);
  }
  const countries = [...countryMap.entries()]
    .map(([code, v]) => ({
      code,
      name: GCC[code]?.name || 'Other / unknown',
      flag: GCC[code]?.flag || '🌐',
      orders: v.orders,
      revenue: Math.round(v.revenue),
      deliveredRate: v.orders > 0 ? Math.round((v.delivered / v.orders) * 100) : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue);

  // ----- Reviews -----
  const ratings: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const g of ratingGroups) ratings[g.rating] = g._count._all;
  const reviewCount = Object.values(ratings).reduce((a, b) => a + b, 0);
  const avgRating = reviewCount > 0
    ? Object.entries(ratings).reduce((acc, [r, n]) => acc + Number(r) * n, 0) / reviewCount
    : null;

  // ----- Top products (30 days) -----
  const topProductRows = topItems.length
    ? await prisma.product.findMany({
        where: { id: { in: topItems.map((t) => t.productId) } },
        select: { id: true, name: true, mainImage: true, stockQuantity: true },
      })
    : [];
  const topProducts = topItems
    .map((t) => {
      const p = topProductRows.find((x) => x.id === t.productId);
      return p ? { id: p.id, name: p.name, image: p.mainImage, stock: p.stockQuantity, units: t._sum.quantity || 0 } : null;
    })
    .filter((x): x is NonNullable<typeof x> => !!x);

  const recentOrders = recentOrdersRaw.map((o) => {
    const bill = (o.billingAddress as Record<string, string> | null) || {};
    return {
      id: o.id,
      number: formatOrderNumber(o.id),
      createdAt: o.createdAt.toISOString(),
      status: o.status as string,
      paymentStatus: o.paymentStatus as string,
      total: o.total || 0,
      currency: o.currency || 'AED',
      customer: o.user?.name || `${bill.first_name || ''} ${bill.last_name || ''}`.trim() || o.user?.email || o.email || 'Guest',
    };
  });

  return {
    generatedAt: new Date(now).toISOString(),
    kpis: {
      revenue30: Math.round(totals.revenue),
      revenuePrev30: Math.round(totals.prevRevenue),
      orders30: totals.orders,
      ordersPrev30: totals.prevOrders,
      aov30: totals.orders > 0 ? Math.round(totals.revenue / totals.orders) : 0,
      aovPrev30: totals.prevOrders > 0 ? Math.round(totals.prevRevenue / totals.prevOrders) : 0,
      newCustomers30,
      newCustomersPrev30,
      todayRevenue: Math.round(today.revenue),
      todayOrders: today.orders,
    },
    lifetime: { orders: totalOrders, revenue: Math.round(lifetimeRevenue), products: productsCount, customers: customersCount },
    statusCounts,
    attention: {
      toConfirm: statusCounts.ORDER_RECEIVED || 0,
      cancelRequests,
      returnRequests,
      lowStock,
      outOfStock,
    },
    series,
    countries,
    reviews: { ratings, count: reviewCount, average: avgRating },
    topProducts,
    recentOrders,
  };
}

export type DashboardData = Awaited<ReturnType<typeof getDashboardData>>;
