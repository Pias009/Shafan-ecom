import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { finalizeStripePayment } from "@/services/payments/stripe/process";

const CRON_SECRET = process.env.CRON_SECRET;

/**
 * Safety net for card payments: scans recent paid Stripe Checkout Sessions and
 * creates the order for any PendingCheckout still not promoted (webhook missed
 * and the customer never reached the success page).
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const since = Math.floor(Date.now() / 1000) - 3 * 24 * 60 * 60; // 3 days
  const stripe = getStripe();
  const results: Array<{ pendingCheckoutId: string; orderId?: string | null; error?: string }> = [];
  let scanned = 0;

  for await (const session of stripe.checkout.sessions.list({ created: { gte: since }, limit: 100 })) {
    if (++scanned > 500) break;
    const pendingCheckoutId = session.metadata?.pendingCheckoutId;
    if (session.payment_status !== "paid" || !pendingCheckoutId) continue;

    const pc = await (prisma as any).pendingCheckout.findUnique({
      where: { id: pendingCheckoutId },
      select: { status: true },
    });
    if (!pc || pc.status === "CONSUMED") continue;

    const paymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;
    if (!paymentIntentId) continue;

    try {
      const { orderId } = await finalizeStripePayment({ pendingCheckoutId, paymentIntentId, source: "cron" });
      results.push({ pendingCheckoutId, orderId });
    } catch (err: any) {
      console.error(`[Stripe Cron] Failed to finalize ${pendingCheckoutId}:`, err?.message || err);
      results.push({ pendingCheckoutId, error: err?.message || "failed" });
    }
  }

  return NextResponse.json({ success: true, scanned, recovered: results });
}
