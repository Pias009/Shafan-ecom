// Server-side GA4 events via the Measurement Protocol.
//
// The browser `purchase` event only fires if the buyer stays on
// /checkout/success until payment is confirmed, so paid orders whose buyer
// closed the tab never reached GA. Sending `purchase` from the server when the
// order is created fills that gap. GA4 deduplicates purchases from the same
// client_id with the same transaction_id, so the browser event (which uses the
// same order id) does not double count.
//
// No-op unless both NEXT_PUBLIC_GA_ID and GA4_API_SECRET are set
// (GA Admin → Data streams → Measurement Protocol API secrets).

const MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_ID || process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const API_SECRET = process.env.GA4_API_SECRET;

type CookieReader = { get(name: string): { value: string } | undefined };

/** Reads GA4 client_id / session_id from the buyer's `_ga` and `_ga_<id>` cookies. */
export function readGaIds(cookies: CookieReader): { gaClientId: string | null; gaSessionId: string | null } {
  // _ga = "GA1.1.<random>.<timestamp>" → client_id "<random>.<timestamp>"
  const ga = cookies.get("_ga")?.value || "";
  const clientMatch = ga.match(/^GA\d\.\d\.(\d+\.\d+)$/);

  // _ga_<suffix> = "GS1.1.<session_id>.…" (legacy) or "GS2.1.s<session_id>$o…" (current)
  let gaSessionId: string | null = null;
  const suffix = MEASUREMENT_ID?.replace(/^G-/, "");
  const gs = suffix ? cookies.get(`_ga_${suffix}`)?.value || "" : "";
  const sessionMatch = gs.match(/^GS1\.\d\.(\d+)\./) || gs.match(/^GS2\.\d\.s(\d+)/);
  if (sessionMatch) gaSessionId = sessionMatch[1];

  return { gaClientId: clientMatch ? clientMatch[1] : null, gaSessionId };
}

export async function sendServerPurchase(order: {
  id: string;
  total: number | null;
  currency: string;
  shipping?: number | null;
  taxAmount?: number | null;
  couponCode?: string | null;
  paymentMethod?: string | null;
  items: { productId: string; nameSnapshot?: string | null; unitPrice: number | null; quantity: number }[];
  gaClientId?: string | null;
  gaSessionId?: string | null;
}): Promise<void> {
  if (!MEASUREMENT_ID || !API_SECRET) return;

  // Without the buyer's client_id the purchase can't be tied to their session;
  // a synthetic id still records the revenue (attributed as direct).
  const clientId = order.gaClientId || `${Math.floor(Math.random() * 1e10)}.${Math.floor(Date.now() / 1000)}`;

  const body = {
    client_id: clientId,
    events: [
      {
        name: "purchase",
        params: {
          transaction_id: order.id,
          value: order.total || 0,
          currency: order.currency.toUpperCase(),
          shipping: order.shipping || 0,
          tax: order.taxAmount || 0,
          ...(order.couponCode ? { coupon: order.couponCode } : {}),
          ...(order.paymentMethod ? { payment_type: order.paymentMethod } : {}),
          ...(order.gaSessionId ? { session_id: order.gaSessionId } : {}),
          engagement_time_msec: 1,
          items: order.items.map((item) => ({
            item_id: item.productId,
            item_name: item.nameSnapshot || "Product",
            price: item.unitPrice ?? 0,
            quantity: item.quantity,
          })),
        },
      },
    ],
  };

  try {
    await fetch(
      `https://www.google-analytics.com/mp/collect?measurement_id=${encodeURIComponent(MEASUREMENT_ID)}&api_secret=${encodeURIComponent(API_SECRET)}`,
      { method: "POST", body: JSON.stringify(body), signal: AbortSignal.timeout(3000) }
    );
  } catch (err: any) {
    console.error("[GA server] purchase event failed:", err?.message || err);
  }
}
