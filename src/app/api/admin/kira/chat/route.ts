import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { OrderStatus } from '@prisma/client';
import { requireAdminApi } from '@/lib/admin-session';
import { convertToAED } from '@/lib/currency-rates';

export const dynamic = 'force-dynamic';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = process.env.KIRA_MODEL || 'qwen/qwen3.8-27b';
const MAX_MESSAGE_CHARS = 2000;

async function liveContext() {
  const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [orders30, pendingCheckouts, lowStock, outOfStock, funnel, topItems, toConfirm, cancelRequests] = await Promise.all([
    prisma.order.findMany({
      where: { NOT: { status: OrderStatus.CANCELLED }, createdAt: { gte: since30 } },
      select: { total: true, currency: true },
    }),
    prisma.pendingCheckout.count({ where: { status: 'OPEN' } }),
    prisma.storeInventory.count({ where: { quantity: { lte: 5 } } }),
    prisma.product.count({ where: { stockQuantity: { lte: 0 }, active: true } }),
    prisma.trackingLog.groupBy({ by: ['eventType'], where: { createdAt: { gte: since30 } }, _count: { _all: true } }),
    prisma.orderItem.groupBy({
      by: ['productId'],
      where: { order: { createdAt: { gte: since30 }, status: { not: OrderStatus.CANCELLED } } },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5,
    }),
    prisma.order.count({ where: { status: OrderStatus.ORDER_RECEIVED } }),
    prisma.order.count({ where: { cancelRequest: true, status: { notIn: [OrderStatus.CANCELLED, OrderStatus.REFUNDED] } } }),
  ]);

  const [outOfStockItems, lowStockItems] = await Promise.all([
    prisma.product.findMany({
      where: { stockQuantity: { lte: 0 }, active: true },
      select: { name: true },
      orderBy: { updatedAt: 'desc' },
      take: 5,
    }),
    prisma.storeInventory.findMany({
      where: { quantity: { lte: 5 } },
      select: { quantity: true, product: { select: { name: true } }, store: { select: { code: true } } },
      orderBy: { quantity: 'asc' },
      take: 5,
    }),
  ]);

  const products = topItems.length
    ? await prisma.product.findMany({
        where: { id: { in: topItems.map((t) => t.productId) } },
        select: { id: true, name: true, stockQuantity: true },
      })
    : [];

  const events = Object.fromEntries(funnel.map((f) => [f.eventType, f._count._all])) as Record<string, number>;
  const revenue30 = orders30.reduce((sum, o) => sum + convertToAED(o.total || 0, o.currency), 0);

  return {
    window: 'last 30 days',
    orders: orders30.length,
    revenueAED: Math.round(revenue30),
    ordersAwaitingConfirmation: toConfirm,
    openCancellationRequests: cancelRequests,
    openCheckoutSessions: pendingCheckouts,
    storeSkusAtOrBelow5Units: lowStock,
    activeProductsOutOfStock: outOfStock,
    outOfStockExamples: outOfStockItems.map((p) => p.name),
    lowestStockExamples: lowStockItems.map((i) => `${i.product?.name || 'Unknown'} (${i.quantity} left, ${i.store?.code || '—'})`),
    funnelEvents: {
      view_item: events.view_item || 0,
      add_to_cart: events.add_to_cart || 0,
      begin_checkout: events.begin_checkout || 0,
      purchase: events.purchase || 0,
      search: events.search || 0,
    },
    // Precomputed so the model quotes it instead of doing arithmetic.
    checkoutToPurchaseRate: (events.begin_checkout || 0) > 0
      ? `${(((events.purchase || 0) / events.begin_checkout) * 100).toFixed(1)}%`
      : null,
    topSellers: topItems.map((t) => {
      const p = products.find((x) => x.id === t.productId);
      return { name: p?.name || 'Unknown product', unitsSold: t._sum.quantity || 0, stock: p?.stockQuantity ?? null };
    }),
    notConnected: ['SEO rankings', 'Core Web Vitals / page speed', 'error monitoring'],
  };
}

type Ctx = Awaited<ReturnType<typeof liveContext>>;

/** Exact figures straight from the database, appended under AI prose so admins can verify it. */
function sourceLine(ctx: Ctx) {
  const f = ctx.funnelEvents;
  return `Live data (30 days): ${ctx.orders} orders · AED ${ctx.revenueAED.toLocaleString()} · ` +
    `${f.begin_checkout} checkouts started → ${f.purchase} purchases${ctx.checkoutToPurchaseRate ? ` (${ctx.checkoutToPurchaseRate})` : ''} · ` +
    `${ctx.ordersAwaitingConfirmation} to confirm · ${ctx.activeProductsOutOfStock} out of stock · ${ctx.storeSkusAtOrBelow5Units} low-stock SKUs`;
}

function fallbackReply(message: string, ctx: Ctx, honorific: string, name: string) {
  const lower = message.toLowerCase();
  const f = ctx.funnelEvents;
  const convRate = ctx.checkoutToPurchaseRate;
  let reply = `At your service, ${honorific} ${name}. (AI model unavailable, so this is a summary of live data.)\n\n`;

  if (/drop|left|why|abandon|checkout|funnel|convert/.test(lower)) {
    reply += `**Checkout funnel, last 30 days**\n` +
      `• ${f.view_item.toLocaleString()} product views → ${f.add_to_cart.toLocaleString()} add-to-carts → ${f.begin_checkout.toLocaleString()} checkouts started → **${f.purchase.toLocaleString()} purchases**` +
      (convRate ? ` (${convRate} of checkouts complete).\n` : '.\n') +
      `• **${ctx.openCheckoutSessions}** checkout sessions are still open.\n` +
      `• Next step: review the payment step for the most-used gateway, and follow up on open checkouts.`;
  } else if (/stock|inventory|alert|reorder/.test(lower)) {
    reply += `**Stock**\n` +
      `• **${ctx.storeSkusAtOrBelow5Units}** store SKUs are at 5 units or fewer.\n` +
      `• **${ctx.activeProductsOutOfStock}** active products are out of stock.\n` +
      `• Next step: open Products, sort by stock, and reorder the best sellers first.`;
  } else if (/sell|product|demand|top|best/.test(lower)) {
    reply += `**Top sellers, last 30 days**\n` +
      (ctx.topSellers.length
        ? ctx.topSellers.map((p, i) => `${i + 1}. ${p.name}: **${p.unitsSold} units**${p.stock !== null ? ` (stock ${p.stock})` : ''}`).join('\n')
        : 'No sales recorded in this window.');
  } else if (/seo|rank|google|speed|lcp|ttfb|vitals|performance|slow|error/.test(lower)) {
    reply += `I don’t have a live data source for ${ctx.notConnected.join(', ')} yet, so I won’t guess. ` +
      `Connect Google Search Console or Vercel Speed Insights and I can report on it.`;
  } else {
    reply += `**Store snapshot, last 30 days**\n` +
      `• **${ctx.orders}** orders · **AED ${ctx.revenueAED.toLocaleString()}** revenue\n` +
      `• **${ctx.ordersAwaitingConfirmation}** orders waiting for confirmation, **${ctx.openCancellationRequests}** cancellation requests\n` +
      `• **${ctx.storeSkusAtOrBelow5Units}** low-stock SKUs, **${ctx.activeProductsOutOfStock}** products out of stock\n` +
      `• Funnel: ${f.begin_checkout} checkouts started → ${f.purchase} purchases\n\n` +
      `Ask me about sales, stock, or the checkout funnel.`;
  }
  return reply;
}

export async function POST(req: Request) {
  const auth = await requireAdminApi();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json().catch(() => ({}));
    const message = String(body.message || '').slice(0, MAX_MESSAGE_CHARS).trim();
    if (!message) {
      return NextResponse.json({ success: false, error: 'Message is required' }, { status: 400 });
    }
    const adminName = String(body.adminName || auth.user.name || 'Administrator').slice(0, 60);
    const adminRole = String(body.adminRole || 'HEAD').slice(0, 40);
    const honorific = String(body.honorific || 'Sir').slice(0, 20);
    // Accepts both { role, content } and the console's { sender, text } message shape.
    const history = (Array.isArray(body.history) ? body.history : []).map((h: any) => ({
      role: h?.role === 'assistant' || h?.sender === 'kira' ? 'assistant' : 'user',
      content: String(h?.content ?? h?.text ?? ''),
    })).filter((h: { content: string }) => h.content.trim());
    const voice = body.mode === 'voice';

    const ctx = await liveContext();

    const systemPrompt = `You are AGENT KIRA, head of operations assistance for the SHANFA (Shafan Group) store admin team, a skincare and beauty e-commerce business serving six GCC countries.
You coordinate specialist roles: VEX (sales), ATLAS (stock), LYRA (checkout funnel), MAYA (marketing), AEGIS (security), CYPHER (dev), VELOX (speed), TARIQ (SEO).

ADMIN: ${adminName} · role ${adminRole} · address them as "${honorific} ${adminName}".

RULES
- Copy numbers exactly as they appear in LIVE DATA; never round, re-derive or estimate them.
- Use ONLY the numbers in LIVE DATA below. Never invent metrics, rankings, percentages or actions you have taken, and do not compute new percentages; quote the precomputed ones.
- Anything listed under notConnected has no data source: say so plainly and suggest connecting one.
- You cannot change the store yourself. Recommend concrete next steps the admin can take in the panel.
${voice
  ? `- This answer will be SPOKEN ALOUD by a voice assistant. Reply in 1–3 short conversational sentences (under 60 words). No markdown, no bullet points, no emojis, no headings. Say money as "25,859 dirhams" rather than "AED 25,859". Do not read out every number, only the ones that answer the question. Do not start with a greeting or the admin's name every time.`
  : '- Be concise: at most 2–3 short paragraphs or a tight bullet list. Bold the key figures.'}

LIVE DATA (JSON)
${JSON.stringify(ctx)}`;

    const groqKey = process.env.GROQ_API_KEY;
    if (groqKey) {
      try {
        const res = await fetch(GROQ_URL, {
          method: 'POST',
          headers: { Authorization: `Bearer ${groqKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: MODEL,
            max_tokens: voice ? 300 : 600,
            temperature: 0.2,
            messages: [
              { role: 'system', content: systemPrompt },
              ...history.slice(-6).map((h: { role: string; content: string }) => ({
                role: h.role,
                content: h.content.slice(0, MAX_MESSAGE_CHARS),
              })),
              { role: 'user', content: message },
            ],
          }),
          signal: AbortSignal.timeout(25_000),
        });

        if (res.ok) {
          const data = await res.json();
          const reply = String(data.choices?.[0]?.message?.content || '')
            .replace(/<think>[\s\S]*?<\/think>/g, '')
            .trim();
          if (reply) {
            return NextResponse.json({
              success: true,
              reply,
              liveData: sourceLine(ctx),
              timestamp: new Date().toISOString(),
              model: `${MODEL} (Groq)`,
            });
          }
        } else {
          console.warn(`Kira: Groq returned ${res.status} for model ${MODEL}:`, (await res.text()).slice(0, 300));
        }
      } catch (groqError: any) {
        console.warn('Kira: Groq request failed, using live-data summary:', groqError?.message);
      }
    }

    return NextResponse.json({
      success: true,
      reply: fallbackReply(message, ctx, honorific, adminName),
      liveData: sourceLine(ctx),
      timestamp: new Date().toISOString(),
      model: 'Kira live-data summary',
    });
  } catch (error: any) {
    console.error('Agent Kira Chat Error:', error);
    return NextResponse.json({ success: false, error: 'Kira could not answer right now' }, { status: 500 });
  }
}
