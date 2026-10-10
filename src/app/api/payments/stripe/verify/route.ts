import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { finalizeStripePayment } from "@/services/payments/stripe/process";

/**
 * Return-page fallback for the hosted Checkout Session flow. When the customer
 * lands on /checkout/success, ask Stripe directly whether the session is paid
 * and, if so, create the order — so a delayed or missing webhook never leaves
 * a charged customer without an order. The session id comes from the
 * success_url; we only trust what Stripe returns for it.
 */
export async function POST(req: Request) {
  try {
    const { pendingCheckoutId, sessionId } = await req.json();

    if (typeof sessionId !== "string" || !sessionId.startsWith("cs_") || typeof pendingCheckoutId !== "string") {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const session = await getStripe().checkout.sessions.retrieve(sessionId);

    if (session.metadata?.pendingCheckoutId !== pendingCheckoutId) {
      return NextResponse.json({ error: "Session does not match this checkout" }, { status: 400 });
    }

    if (session.payment_status !== "paid") {
      return NextResponse.json({ status: "unpaid" });
    }

    const paymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;
    if (!paymentIntentId) {
      return NextResponse.json({ status: "unpaid" });
    }

    const { orderId } = await finalizeStripePayment({ pendingCheckoutId, paymentIntentId, source: "return" });
    return NextResponse.json({ status: "paid", orderId });
  } catch (error: any) {
    console.error("[Stripe Verify] Error:", error?.message || error);
    return NextResponse.json({ error: "Failed to verify payment" }, { status: 500 });
  }
}
