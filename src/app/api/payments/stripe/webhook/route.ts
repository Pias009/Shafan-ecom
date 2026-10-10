import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { verifyStripeWebhook } from "@/services/payments/stripe/payment-service";
import { prisma } from "@/lib/prisma";
import { finalizeStripePayment } from "@/services/payments/stripe/process";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get("stripe-signature") || "";

  // Step 1 — verify signature. Only this step may return 400/500.
  let event: Awaited<ReturnType<typeof verifyStripeWebhook>>;
  try {
    event = await verifyStripeWebhook(body, signature);
  } catch (err: any) {
    if (err.isConfigError) {
      // A missing/misconfigured env var, not a bad signature — surface this
      // as 500 so it's visibly distinct from a real signature failure in
      // Stripe's Dashboard delivery log, and so Stripe keeps retrying (a
      // config fix later should still land the event, unlike a genuinely
      // invalid signature which will never succeed on retry).
      console.error("[Stripe Webhook] Configuration error:", err.message);
      return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
    }
    console.error("[Stripe Webhook] Signature verification failed:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Step 2 — process event. Always return 200 regardless of internal errors.
  try {
    // Two event types can signal a completed card payment:
    // - payment_intent.succeeded: fires for both the embedded-Elements flow
    //   (metadata set directly on PaymentIntent creation) and the hosted
    //   Checkout Session flow (metadata copied via payment_intent_data).
    // - checkout.session.completed: an independent fallback for the hosted
    //   Checkout Session flow, read straight off the Session's own metadata
    //   (which Stripe always preserves) — this catches a payment even if the
    //   payment_intent_data metadata copy above was ever missing, misconfigured,
    //   or that event was missed, so a paid order is never silently lost.
    let paymentIntentId: string | undefined;
    let metadata: Record<string, any> | undefined;

    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object as any;
      paymentIntentId = paymentIntent.id;
      metadata = paymentIntent.metadata;
    } else if (event.type === "checkout.session.completed") {
      const session = event.data.object as any;
      if (session.payment_status !== "paid") {
        return NextResponse.json({ received: true });
      }
      paymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;
      metadata = session.metadata;
    }

    if (paymentIntentId && metadata) {
      // Legacy shape: metadata.orderId points at an Order created up-front
      // (pre-cutover in-flight checkouts). New shape: metadata.pendingCheckoutId
      // points at a PendingCheckout that must be promoted to a real Order now.
      const legacyOrderId = metadata?.orderId;
      let pendingCheckoutId = metadata?.pendingCheckoutId;

      // Fallback: if pendingCheckoutId is missing but orderId is present,
      // check if this ID belongs to a PendingCheckout record that hasn't been promoted yet.
      if (!pendingCheckoutId && legacyOrderId) {
        const pc = await (prisma as any).pendingCheckout.findUnique({
          where: { id: legacyOrderId },
          select: { id: true },
        });
        if (pc) {
          pendingCheckoutId = legacyOrderId;
        }
      }

      if (!legacyOrderId && !pendingCheckoutId) {
        console.warn(`[Stripe Webhook] ${event.type} missing orderId/pendingCheckoutId in metadata`);
        return NextResponse.json({ received: true });
      }

      await finalizeStripePayment({
        pendingCheckoutId,
        legacyOrderId,
        paymentIntentId,
        source: "webhook",
      });
    }
  } catch (processingError: any) {
    // Log internally but still return 200 so Stripe stops retrying
    console.error("[Stripe Webhook] Processing error:", processingError.message, processingError);
  }

  return NextResponse.json({ received: true });
}
