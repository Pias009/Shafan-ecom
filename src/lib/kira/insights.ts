// Live store insights for Agent Kira's teams. Server only.
// One parallel batch of read-only queries, cached briefly and shared by the
// console (telemetry API) and the chat (AI context), so both always agree.

import { OrderStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { convertToAED } from '@/lib/currency-rates';
import { TEAMS, type TeamId } from '@/lib/kira/teams';

export type Tone = 'good' | 'warn' | 'bad' | 'muted';
export type TeamMetric = { label: string; value: string; tone?: Tone };
export type TeamInsight = {
  status: 'ok' | 'attention' | 'limited';
  headline: string;
  metrics: TeamMetric[];
  findings: string[];
};

export type KiraInsights = {
  generatedAt: string;
  overview: {
    revenue30: number;
    orders30: number;
    aov30: number;
    toConfirm: number;
    outOfStock: number;
    lowStock: number;
    openCheckouts: number;
    checkoutsStarted30: number;
    checkoutToOrderRate: string | null;
    purchaseEvents30: number;
  };
  teams: Record<TeamId, TeamInsight>;
  notConnected: string[];
};

const DAY = 86_400_000;
const GCC = ['AE', 'SA', 'KW', 'BH', 'OM', 'QA'];
const SOCIAL = new Set(['facebook', 'instagram', 'tiktok', 'whatsapp', 'youtube', 'x', 'twitter', 'snapchat', 'pinterest', 'linkedin', 'telegram']);
const CACHE_MS = 30_000;

let cache: { at: number; data: KiraInsights } | null = null;
let inflight: Promise<KiraInsights> | null = null;

const n = (v: number) => v.toLocaleString('en-US');
const pct = (part: number, whole: number, digits = 1) => (whole > 0 ? `${((part / whole) * 100).toFixed(digits)}%` : '—');
const aed = (v: number) => `AED ${Math.round(v).toLocaleString('en-US')}`;
// Full product names read better now that cards wrap; only cut genuinely extreme ones.
const short = (s: string, _max?: number) => (s.length > 90 ? `${s.slice(0, 89)}…` : s.trim());

function normalizeSource(raw: string | null): string {
  const s = (raw || '').trim().toLowerCase();
  if (!s || s === 'email' || s === 'direct' || s === 'none') return 'direct';
  if (s === 'fb' || s.includes('facebook')) return 'facebook';
  if (s === 'ig' || s.includes('instagram')) return 'instagram';
  if (s.includes('google')) return 'google';
  if (s.includes('tiktok')) return 'tiktok';
  if (s.includes('whatsapp') || s === 'wa') return 'whatsapp';
  if (s.includes('youtube')) return 'youtube';
  if (s === 'twitter' || s === 'x') return 'x';
  return s;
}
const label = (s: string) => (s === 'x' ? 'X' : s === 'tiktok' ? 'TikTok' : s === 'whatsapp' ? 'WhatsApp' : s === 'youtube' ? 'YouTube' : s[0].toUpperCase() + s.slice(1));

export async function getKiraInsights(): Promise<KiraInsights> {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.data;
  if (!inflight) {
    inflight = computeInsights()
      .then((data) => {
        cache = { at: Date.now(), data };
        return data;
      })
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

async function computeInsights(): Promise<KiraInsights> {
  const now = Date.now();
  const since7 = new Date(now - 7 * DAY);
  const since14 = new Date(now - 14 * DAY);
  const since30 = new Date(now - 30 * DAY);
  const since90 = new Date(now - 90 * DAY);

  const [
    orders90,
    statusGroups,
    cancelRequests,
    returnRequests,
    openCheckouts,
    events,
    products,
    lowStockCount,
    lowStockItems,
    discounts,
    ratingGroups,
    newCustomers30,
    vitalRows,
    errorRows,
    sessionGroups,
    searchRows,
  ] = await Promise.all([
    prisma.order.findMany({
      where: { createdAt: { gte: since90 }, NOT: { status: OrderStatus.CANCELLED } },
      select: {
        createdAt: true, total: true, currency: true, referralSource: true, userId: true, email: true,
        items: { select: { productId: true, quantity: true, nameSnapshot: true } },
      },
    }),
    prisma.order.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.order.count({ where: { cancelRequest: true, status: { notIn: [OrderStatus.CANCELLED, OrderStatus.REFUNDED] } } }),
    prisma.order.count({ where: { returnRequest: true, returnStatus: { in: ['NONE', 'PENDING'] } } }),
    prisma.pendingCheckout.count({ where: { status: 'OPEN' } }),
    prisma.trackingLog.groupBy({ by: ['eventType'], where: { createdAt: { gte: since30 } }, _count: { _all: true } }),
    prisma.product.findMany({
      where: { active: true },
      select: {
        id: true, name: true, price: true, discountPrice: true, stockQuantity: true, trending: true, hot: true, createdAt: true,
        countryPrices: { select: { country: true, price: true, discountPrice: true, active: true } },
      },
    }),
    prisma.storeInventory.count({ where: { quantity: { lte: 5 } } }),
    prisma.storeInventory.findMany({
      where: { quantity: { lte: 5 } },
      orderBy: { quantity: 'asc' },
      take: 5,
      select: { quantity: true, product: { select: { name: true } }, store: { select: { code: true } } },
    }),
    prisma.discount.findMany({
      where: { active: true, OR: [{ endDate: null }, { endDate: { gte: new Date(now) } }] },
      select: { code: true, name: true, uses: true },
    }),
    prisma.review.groupBy({ by: ['rating'], where: { active: true }, _count: { _all: true } }),
    prisma.user.count({ where: { role: 'USER', createdAt: { gte: since30 } } }),
    prisma.performanceMetric.findMany({
      where: { timestamp: { gte: since7 }, name: { in: ['lcp', 'inp', 'cls', 'ttfb'] } },
      select: { name: true, value: true, metadata: true },
      orderBy: { timestamp: 'desc' },
      take: 20000,
    }),
    prisma.performanceMetric.findMany({
      where: { timestamp: { gte: since7 }, name: 'js_error' },
      select: { metadata: true, sessionId: true },
      orderBy: { timestamp: 'desc' },
      take: 3000,
    }),
    prisma.trackingLog.groupBy({
      by: ['sessionId', 'eventType'],
      where: { createdAt: { gte: since7 }, sessionId: { not: null } },
      _count: { _all: true },
    }),
    prisma.trackingLog.findMany({
      where: { createdAt: { gte: since30 }, eventType: 'search' },
      select: { eventData: true },
      take: 5000,
    }),
  ]);

  const ev = Object.fromEntries(events.map((e) => [e.eventType, e._count._all])) as Record<string, number>;
  const views = ev.view_item || 0;
  const carts = ev.add_to_cart || 0;
  const checkouts = ev.begin_checkout || 0;
  const purchases = ev.purchase || 0;
  const searches = ev.search || 0;

  const orders30 = orders90.filter((o) => o.createdAt >= since30);
  const revenue30 = orders30.reduce((s, o) => s + convertToAED(o.total || 0, o.currency), 0);
  const aov30 = orders30.length ? revenue30 / orders30.length : 0;

  const status: Record<string, number> = Object.fromEntries(statusGroups.map((g) => [g.status, g._count._all]));
  const toConfirm = status.ORDER_RECEIVED || 0;

  const productById = new Map(products.map((p) => [p.id, p]));
  const outOfStock = products.filter((p) => p.stockQuantity <= 0);

  // Units per product over windows.
  const unitsIn = (list: typeof orders90) => {
    const m = new Map<string, { units: number; name: string }>();
    for (const o of list) for (const it of o.items) {
      const cur = m.get(it.productId) || { units: 0, name: productById.get(it.productId)?.name || it.nameSnapshot };
      cur.units += it.quantity || 1;
      m.set(it.productId, cur);
    }
    return m;
  };
  const units30 = unitsIn(orders30);
  const units7 = unitsIn(orders90.filter((o) => o.createdAt >= since7));
  const unitsPrev7 = unitsIn(orders90.filter((o) => o.createdAt >= since14 && o.createdAt < since7));
  const topSellers = [...units30.entries()].sort((a, b) => b[1].units - a[1].units);

  const teams = {} as Record<TeamId, TeamInsight>;

  /* ---------------- Social media marketing ---------------- */
  {
    const bySource = new Map<string, number>();
    for (const o of orders30) {
      const s = normalizeSource(o.referralSource);
      bySource.set(s, (bySource.get(s) || 0) + 1);
    }
    const ranked = [...bySource.entries()].sort((a, b) => b[1] - a[1]);
    const social = ranked.filter(([s]) => SOCIAL.has(s)).reduce((sum, [, c]) => sum + c, 0);
    const topSocial = ranked.find(([s]) => SOCIAL.has(s));
    const bestCoupon = [...discounts].sort((a, b) => b.uses - a.uses)[0];
    const findings: string[] = [];
    if (ranked.length) findings.push(`Orders by channel (30d): ${ranked.slice(0, 4).map(([s, c]) => `${label(s)} ${c}`).join(', ')}.`);
    findings.push(
      social
        ? `${pct(social, orders30.length, 0)} of orders came from social channels${topSocial ? `, led by ${label(topSocial[0])}` : ''}.`
        : 'No orders were attributed to social channels in the last 30 days. Check UTM tags on social links.',
    );
    if (bestCoupon) findings.push(`Most-used active coupon: ${bestCoupon.code || bestCoupon.name} (${bestCoupon.uses} uses).`);
    teams.social = {
      status: social / Math.max(1, orders30.length) < 0.15 ? 'attention' : 'ok',
      headline:
        social / Math.max(1, orders30.length) < 0.15
          ? `Only ${pct(social, orders30.length, 0)} of orders come from social`
          : topSocial ? `${label(topSocial[0])} is the top social channel` : 'Social channels need attribution',
      metrics: [
        { label: 'Top channel (30d)', value: ranked[0] ? `${label(ranked[0][0])} · ${ranked[0][1]} orders` : '—' },
        { label: 'Orders from social', value: `${n(social)} (${pct(social, orders30.length, 0)})`, tone: social ? undefined : 'warn' },
        { label: 'Active coupons', value: n(discounts.length) },
      ],
      findings,
    };
  }

  /* ---------------- Conversion ---------------- */
  {
    const orderRate = checkouts ? orders30.length / checkouts : 0;
    const findings = [
      `Funnel (30d): ${n(views)} product views → ${n(carts)} add-to-carts → ${n(checkouts)} checkouts started → ${n(orders30.length)} orders.`,
      `About ${pct(orders30.length, checkouts, 0)} of started checkouts became orders; ${n(openCheckouts)} checkout sessions are still open.`,
    ];
    if (purchases < orders30.length * 0.6) {
      findings.push(`Only ${n(purchases)} purchase events were tracked for ${n(orders30.length)} real orders, so ad platforms are under-counting conversions (likely cash-on-delivery orders).`);
    }
    if (checkouts > carts * 2 && carts > 0) findings.push('More checkouts start than items are added to cart, so some events fire twice or out of order.');
    teams.conversion = {
      status: orderRate < 0.2 || purchases < orders30.length * 0.6 ? 'attention' : 'ok',
      headline: `${pct(orders30.length, checkouts, 0)} of checkouts become orders`,
      metrics: [
        { label: 'Checkout → order', value: pct(orders30.length, checkouts), tone: orderRate < 0.2 ? 'warn' : 'good' },
        { label: 'Add-to-cart rate', value: pct(carts, views) },
        { label: 'Open checkouts', value: n(openCheckouts), tone: openCheckouts > 20 ? 'warn' : undefined },
      ],
      findings,
    };
  }

  /* ---------------- Recommendations ---------------- */
  {
    const pairs = new Map<string, number>();
    let multi = 0;
    let itemsTotal = 0;
    for (const o of orders90) {
      const ids = [...new Set(o.items.map((i) => i.productId))];
      if (ids.length > 1) multi++;
      for (let a = 0; a < ids.length; a++) for (let b = a + 1; b < ids.length; b++) {
        const key = [ids[a], ids[b]].sort().join('|');
        pairs.set(key, (pairs.get(key) || 0) + 1);
      }
    }
    for (const o of orders30) itemsTotal += o.items.reduce((s, i) => s + (i.quantity || 1), 0);
    const nameOf = (id: string) => productById.get(id)?.name || orders90.flatMap((o) => o.items).find((i) => i.productId === id)?.nameSnapshot || 'Product';
    const topPairs = [...pairs.entries()].filter(([, c]) => c >= 2).sort((a, b) => b[1] - a[1]).slice(0, 3);
    const findings = topPairs.length
      ? topPairs.map(([k, c]) => {
          const [a, b] = k.split('|');
          return `${short(nameOf(a), 40)} + ${short(nameOf(b), 40)}: bought together ${c} times.`;
        })
      : ['No product pairs were bought together more than once in 90 days. Start with "complete the routine" suggestions on top sellers.'];
    findings.push(`${pct(multi, orders90.length, 0)} of orders (90d) contain more than one product.`);
    teams.recommendations = {
      status: multi / Math.max(1, orders90.length) < 0.3 ? 'attention' : 'ok',
      headline: topPairs.length ? 'Clear “bought together” pairs found' : 'Few repeat pairings yet',
      metrics: [
        { label: 'Items per order (30d)', value: orders30.length ? (itemsTotal / orders30.length).toFixed(2) : '—' },
        { label: 'Multi-product orders', value: pct(multi, orders90.length, 0) },
        { label: 'Repeat pairs found', value: n(topPairs.length) },
      ],
      findings,
    };
  }

  /* ---------------- Trending ---------------- */
  {
    const risers = [...units7.entries()]
      .map(([id, v]) => ({ id, name: v.name, now: v.units, before: unitsPrev7.get(id)?.units || 0 }))
      .filter((r) => r.now >= 2 && r.now > r.before)
      .sort((a, b) => b.now - b.before - (a.now - a.before))
      .slice(0, 3);
    const flagged = products.filter((p) => p.trending).length;
    const hot = products.filter((p) => p.hot).length;
    const findings = risers.length
      ? risers.map((r) => {
          const stock = productById.get(r.id)?.stockQuantity;
          return `${short(r.name)}: ${r.before} → ${r.now} units week over week${stock !== undefined && stock <= 5 ? ` (only ${stock} in stock!)` : ''}.`;
        })
      : ['No product is clearly rising week over week yet.'];
    const flaggedSelling = products.filter((p) => p.trending && units30.has(p.id)).length;
    findings.push(`${n(flaggedSelling)} of ${n(flagged)} products marked “Trending now” sold in the last 30 days.`);
    teams.trending = {
      status: risers.some((r) => (productById.get(r.id)?.stockQuantity ?? 99) <= 5) ? 'attention' : 'ok',
      headline: risers[0] ? `${risers[0].name} is rising` : 'Quiet week for risers',
      metrics: [
        { label: 'Rising products (7d)', value: n(risers.length) },
        { label: 'Marked “Trending now”', value: n(flagged) },
        { label: 'Hot deals', value: n(hot) },
      ],
      findings,
    };
  }

  /* ---------------- Product research ---------------- */
  {
    const sold = products.filter((p) => units30.has(p.id)).length;
    const unsold = products.length - sold;
    const newProducts = products.filter((p) => p.createdAt >= since30);
    const newSold = newProducts.filter((p) => units30.has(p.id)).length;
    const findings: string[] = [];
    if (topSellers[0]) findings.push(`Best seller (30d): ${short(topSellers[0][1].name)} with ${topSellers[0][1].units} units.`);
    if (topSellers.length > 1) findings.push(`Next: ${topSellers.slice(1, 3).map(([, v]) => `${short(v.name, 36)} (${v.units})`).join(', ')}.`);
    findings.push(`${n(unsold)} of ${n(products.length)} active products had no sales in 30 days.`);
    if (newProducts.length) findings.push(`${n(newProducts.length)} products were added in 30 days; ${n(newSold)} of them have sold.`);
    teams.research = {
      status: unsold / Math.max(1, products.length) > 0.6 ? 'attention' : 'ok',
      headline: topSellers[0] ? `${topSellers[0][1].name} leads sales` : 'No sales yet this month',
      metrics: [
        { label: 'Products that sold (30d)', value: `${n(sold)} of ${n(products.length)}` },
        { label: 'No sales in 30 days', value: n(unsold), tone: unsold > products.length / 2 ? 'warn' : undefined },
        { label: 'New products (30d)', value: n(newProducts.length) },
      ],
      findings,
    };
  }

  /* ---------------- Best pricing ---------------- */
  {
    const missing = products
      .map((p) => {
        const priced = new Set(p.countryPrices.filter((c) => c.active && (c.price ?? 0) > 0).map((c) => c.country.toUpperCase()));
        return { p, missing: GCC.filter((c) => !priced.has(c)) };
      })
      .filter((x) => x.missing.length > 0);
    const noPriceAnywhere = missing.filter((x) => x.missing.length === GCC.length).length;
    const discountRates: number[] = [];
    for (const p of products) {
      const pairs = p.countryPrices.filter((c) => c.active && (c.price ?? 0) > 0 && (c.discountPrice ?? 0) > 0 && (c.discountPrice as number) < (c.price as number));
      for (const c of pairs) discountRates.push(1 - (c.discountPrice as number) / (c.price as number));
    }
    for (const p of products) {
      if ((p.discountPrice ?? 0) > 0 && (p.price ?? 0) > (p.discountPrice as number)) discountRates.push(1 - (p.discountPrice as number) / (p.price as number));
    }
    const onSale = products.filter(
      (p) =>
        ((p.discountPrice ?? 0) > 0 && (p.price ?? 0) > (p.discountPrice as number)) ||
        p.countryPrices.some((c) => (c.discountPrice ?? 0) > 0 && (c.discountPrice as number) < (c.price ?? 0)),
    ).length;
    const avgDiscount = discountRates.length ? (discountRates.reduce((a, b) => a + b, 0) / discountRates.length) * 100 : 0;
    const findings: string[] = [];
    if (missing.length) {
      findings.push(`${n(missing.length)} products are missing a price in at least one GCC country, so they are hidden there.`);
      findings.push(`Examples: ${missing.slice(0, 3).map((x) => `${short(x.p.name, 34)} (no ${x.missing.join(', ')})`).join('; ')}.`);
    } else findings.push('Every active product has a price in all six GCC countries.');
    if (onSale) findings.push(`${n(onSale)} products are on sale, with an average discount of ${avgDiscount.toFixed(0)}%.`);
    findings.push(`Average order value (30d): ${aed(aov30)}.`);
    teams.pricing = {
      status: missing.length ? 'attention' : 'ok',
      headline: missing.length ? `${n(missing.length)} products missing country prices` : 'All country prices in place',
      metrics: [
        { label: 'Missing a country price', value: n(missing.length), tone: missing.length ? 'warn' : 'good' },
        { label: 'No price anywhere', value: n(noPriceAnywhere), tone: noPriceAnywhere ? 'bad' : undefined },
        { label: 'On sale · avg discount', value: `${n(onSale)} · ${avgDiscount.toFixed(0)}%` },
      ],
      findings,
    };
  }

  /* ---------------- Stock management ---------------- */
  {
    const topOut = topSellers.slice(0, 15).filter(([id]) => (productById.get(id)?.stockQuantity ?? 1) <= 0);
    const findings: string[] = [];
    if (topOut.length) findings.push(`Best sellers out of stock: ${topOut.slice(0, 3).map(([, v]) => short(v.name, 40)).join(', ')}. Restock these first.`);
    findings.push(`${n(outOfStock.length)} active products are at zero stock; ${n(lowStockCount)} store SKUs are at 5 units or fewer.`);
    if (lowStockItems.length) findings.push(`Lowest: ${lowStockItems.slice(0, 3).map((i) => `${short(i.product?.name || 'Item', 36)} (${i.quantity}, ${i.store?.code || '—'})`).join('; ')}.`);
    teams.stock = {
      status: outOfStock.length || lowStockCount ? 'attention' : 'ok',
      headline: topOut.length ? `${topOut.length} best seller${topOut.length > 1 ? 's' : ''} out of stock` : `${n(outOfStock.length)} products out of stock`,
      metrics: [
        { label: 'Out of stock', value: n(outOfStock.length), tone: outOfStock.length ? 'bad' : 'good' },
        { label: 'Store SKUs ≤ 5 units', value: n(lowStockCount), tone: lowStockCount ? 'warn' : 'good' },
        { label: 'Best sellers at zero', value: n(topOut.length), tone: topOut.length ? 'bad' : 'good' },
      ],
      findings,
    };
  }

  /* ---------------- Website UI & analytics ---------------- */
  {
    const zero = new Map<string, number>();
    let zeroCount = 0;
    for (const r of searchRows) {
      const d = (r.eventData || {}) as { query?: string; resultsCount?: number };
      const q = String(d.query || '').trim().toLowerCase();
      if (q && Number(d.resultsCount) === 0) {
        zeroCount++;
        zero.set(q, (zero.get(q) || 0) + 1);
      }
    }
    const topZero = [...zero.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);
    const findings = [
      `Visitors viewed products ${n(views)} times and searched ${n(searches)} times in 30 days.`,
      `${pct(carts, views)} of product views led to an add-to-cart.`,
      zeroCount
        ? `${n(zeroCount)} searches found nothing (${pct(zeroCount, searchRows.length, 0)}). Most common: ${topZero.map(([q, c]) => `“${q}” (${c})`).join(', ')}.`
        : 'Every tracked search returned at least one product.',
    ];
    teams.web = {
      status: zeroCount / Math.max(1, searchRows.length) > 0.15 ? 'attention' : 'ok',
      headline: zeroCount ? `${n(zeroCount)} searches found nothing` : `${pct(carts, views)} view-to-cart rate`,
      metrics: [
        { label: 'Product views (30d)', value: n(views) },
        { label: 'Searches with no results', value: `${n(zeroCount)} (${pct(zeroCount, searchRows.length, 0)})`, tone: zeroCount ? 'warn' : 'good' },
        { label: 'View → cart', value: pct(carts, views) },
      ],
      findings,
    };
  }

  /* ---------------- Engineering & performance ---------------- */
  {
    const p75 = (vals: number[]) => {
      if (!vals.length) return null;
      const sorted = [...vals].sort((x, y) => x - y);
      return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.75))];
    };
    const by = (name: string) => vitalRows.filter((r) => r.name === name).map((r) => r.value);
    const lcp = p75(by('lcp'));
    const inp = p75(by('inp'));
    const cls = p75(by('cls'));
    const ttfb = p75(by('ttfb'));
    const fmtMs = (v: number | null) => (v === null ? '—' : v >= 1000 ? `${(v / 1000).toFixed(2)}s` : `${Math.round(v)}ms`);
    const rate = (v: number | null, good: number, poor: number): Tone | undefined => (v === null ? 'muted' : v <= good ? 'good' : v > poor ? 'bad' : 'warn');

    // Slowest pages by LCP (pages with at least 5 samples).
    const byPage = new Map<string, number[]>();
    for (const r of vitalRows) {
      if (r.name !== 'lcp') continue;
      const page = String((r.metadata as { page?: string } | null)?.page || '').replace(/\/[a-f0-9]{24}$/i, '/[id]');
      if (!page) continue;
      const list = byPage.get(page) || [];
      list.push(r.value);
      byPage.set(page, list);
    }
    const slowPages = [...byPage.entries()]
      .filter(([, v]) => v.length >= 5)
      .map(([page, v]) => ({ page, lcp: p75(v) as number }))
      .sort((a, b) => b.lcp - a.lcp)
      .slice(0, 3);

    // Bugs: group JS errors by message.
    const errors = new Map<string, { count: number; pages: Set<string>; sessions: Set<string> }>();
    for (const r of errorRows) {
      const m = (r.metadata || {}) as { message?: string; page?: string };
      const key = String(m.message || 'Unknown error').slice(0, 140);
      const e = errors.get(key) || { count: 0, pages: new Set<string>(), sessions: new Set<string>() };
      e.count++;
      if (m.page) e.pages.add(m.page);
      e.sessions.add(r.sessionId);
      errors.set(key, e);
    }
    const topErrors = [...errors.entries()].sort((a, b) => b[1].count - a[1].count).slice(0, 3);
    const affectedSessions = new Set(errorRows.map((r) => r.sessionId)).size;

    // Footprints: what each tracked session did in the last 7 days.
    const sessions = new Map<string, Set<string>>();
    for (const g of sessionGroups) {
      if (!g.sessionId) continue;
      const set = sessions.get(g.sessionId) || new Set<string>();
      set.add(g.eventType);
      sessions.set(g.sessionId, set);
    }
    const total = sessions.size;
    const viewed = [...sessions.values()].filter((e) => e.has('view_item'));
    const deadEnds = viewed.filter((e) => !e.has('add_to_cart') && !e.has('begin_checkout')).length;
    const stalled = [...sessions.values()].filter((e) => e.has('begin_checkout') && !e.has('purchase')).length;

    const hasSpeed = lcp !== null;
    const findings: string[] = [];
    if (topErrors.length) {
      findings.push(`${n(errorRows.length)} JavaScript errors hit ${n(affectedSessions)} shopper sessions in 7 days.`);
      for (const [msg, e] of topErrors) findings.push(`Bug: “${msg}”: ${e.count}×${e.pages.size ? ` on ${[...e.pages].slice(0, 2).join(', ')}` : ''}.`);
    } else {
      findings.push(hasSpeed ? 'No JavaScript errors reported by shoppers in 7 days.' : 'Bug reporting is now live on the storefront; errors will appear here as shoppers browse.');
    }
    if (hasSpeed) {
      findings.push(`Real-user speed (75th percentile, 7d): LCP ${fmtMs(lcp)}, INP ${fmtMs(inp)}, CLS ${cls === null ? '—' : cls.toFixed(3)}, TTFB ${fmtMs(ttfb)}.`);
      if (slowPages.length) findings.push(`Slowest pages (LCP): ${slowPages.map((p) => `${p.page} ${fmtMs(p.lcp)}`).join(', ')}.`);
    } else {
      findings.push('Real-user speed collection just started on the storefront; numbers appear after shoppers visit.');
    }
    findings.push(`Footprints (7d): ${n(total)} sessions; ${n(deadEnds)} viewed products but never added to cart; ${n(stalled)} started checkout but didn’t buy.`);

    teams.engineering = {
      status: topErrors.length || (lcp !== null && lcp > 2500) || (inp !== null && inp > 200) ? 'attention' : hasSpeed ? 'ok' : 'limited',
      headline: topErrors.length
        ? `${n(errors.size)} distinct bug${errors.size > 1 ? 's' : ''} reported by shoppers`
        : hasSpeed
          ? `Pages load in ${fmtMs(lcp)} for most shoppers`
          : 'Speed and bug monitoring just switched on',
      metrics: [
        { label: 'Page load (LCP p75)', value: hasSpeed ? fmtMs(lcp) : 'Collecting…', tone: rate(lcp, 2500, 4000) },
        { label: 'JS errors (7d)', value: n(errorRows.length), tone: errorRows.length ? 'bad' : hasSpeed ? 'good' : 'muted' },
        { label: 'Responsiveness (INP p75)', value: inp === null ? 'Collecting…' : fmtMs(inp), tone: rate(inp, 200, 500) },
      ],
      findings,
    };
  }

  /* ---------------- Orders & fulfilment ---------------- */
  {
    const inProgress = (status.ORDER_CONFIRMED || 0) + (status.PROCESSING || 0) + (status.READY_FOR_PICKUP || 0);
    const inTransit = (status.IN_TRANSIT || 0) + (status.ORDER_PICKED_UP || 0);
    const findings = [
      toConfirm ? `${n(toConfirm)} orders are waiting for confirmation.` : 'No orders are waiting for confirmation.',
      `${n(inProgress)} orders are confirmed or being prepared, and ${n(inTransit)} are on the way.`,
      `${n(orders30.length)} orders in the last 30 days (${aed(revenue30)}).`,
    ];
    if (cancelRequests) findings.push(`${n(cancelRequests)} open cancellation requests need a decision.`);
    teams.orders = {
      status: toConfirm || cancelRequests ? 'attention' : 'ok',
      headline: toConfirm ? `${n(toConfirm)} orders to confirm` : 'Pipeline is clear',
      metrics: [
        { label: 'To confirm', value: n(toConfirm), tone: toConfirm ? 'warn' : 'good' },
        { label: 'In transit', value: n(inTransit) },
        { label: 'Cancel requests', value: n(cancelRequests), tone: cancelRequests ? 'warn' : undefined },
      ],
      findings,
    };
  }

  /* ---------------- Customer care & reviews ---------------- */
  {
    const ratings: Record<number, number> = {};
    for (const g of ratingGroups) ratings[g.rating] = g._count._all;
    const reviewCount = Object.values(ratings).reduce((a, b) => a + b, 0);
    const avg = reviewCount ? Object.entries(ratings).reduce((s, [r, c]) => s + Number(r) * c, 0) / reviewCount : null;
    const perCustomer = new Map<string, number>();
    for (const o of orders90) {
      const key = o.userId || o.email?.toLowerCase();
      if (key) perCustomer.set(key, (perCustomer.get(key) || 0) + 1);
    }
    const repeat = [...perCustomer.values()].filter((c) => c >= 2).length;
    const findings = [
      avg ? `Average review rating ${avg.toFixed(1)} from ${n(reviewCount)} published reviews.` : 'No published reviews yet.',
      `${n(repeat)} of ${n(perCustomer.size)} customers (90d) ordered more than once (${pct(repeat, perCustomer.size, 0)}).`,
      `${n(newCustomers30)} new customer accounts in 30 days.`,
    ];
    if (returnRequests) findings.push(`${n(returnRequests)} return requests are open.`);
    if (perCustomer.size >= 10 && repeat / perCustomer.size < 0.1) findings.push('Few customers come back for a second order. A post-delivery follow-up or refill reminder could help.');
    teams.care = {
      status: returnRequests || (avg !== null && avg < 4) || repeat / Math.max(1, perCustomer.size) < 0.1 ? 'attention' : 'ok',
      headline: returnRequests
        ? `${n(returnRequests)} open return request${returnRequests > 1 ? 's' : ''}`
        : avg !== null && avg < 4
          ? `Average rating dropped to ${avg.toFixed(1)}★`
          : perCustomer.size >= 10 && repeat / perCustomer.size < 0.1
            ? `Only ${pct(repeat, perCustomer.size, 0)} of customers order again`
            : avg ? `${avg.toFixed(1)}★ average rating` : 'Waiting for first reviews',
      metrics: [
        { label: 'Average rating', value: avg ? `${avg.toFixed(1)} ★ (${n(reviewCount)})` : 'No reviews', tone: avg && avg >= 4.5 ? 'good' : undefined },
        { label: 'Repeat customers (90d)', value: pct(repeat, perCustomer.size, 0) },
        { label: 'Open returns', value: n(returnRequests), tone: returnRequests ? 'warn' : undefined },
      ],
      findings,
    };
  }

  // Make sure every configured team has an entry.
  for (const t of TEAMS) if (!teams[t.id]) teams[t.id] = { status: 'limited', headline: 'No data yet', metrics: [], findings: [] };

  return {
    generatedAt: new Date(now).toISOString(),
    overview: {
      revenue30: Math.round(revenue30),
      orders30: orders30.length,
      aov30: Math.round(aov30),
      toConfirm,
      outOfStock: outOfStock.length,
      lowStock: lowStockCount,
      openCheckouts,
      checkoutsStarted30: checkouts,
      checkoutToOrderRate: checkouts ? pct(orders30.length, checkouts) : null,
      purchaseEvents30: purchases,
    },
    teams,
    notConnected: ['Google search rankings (Search Console)'],
  };
}

/** Compact, model-friendly version for the chat prompt. */
export function insightsForPrompt(i: KiraInsights) {
  return {
    window: 'last 30 days unless stated',
    overview: i.overview,
    teams: Object.fromEntries(
      TEAMS.map((t) => [
        t.name,
        {
          metrics: Object.fromEntries(i.teams[t.id].metrics.map((m) => [m.label, m.value])),
          findings: i.teams[t.id].findings,
        },
      ]),
    ),
    notConnected: i.notConnected,
  };
}
