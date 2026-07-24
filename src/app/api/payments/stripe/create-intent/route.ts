import { NextResponse } from "next/server";
import { createPaymentIntent } from "@/services/payments/stripe/payment-service";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { orderId } = await req.json();

    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }

    // Fetch the pending checkout snapshot — no real Order exists yet.
    const pendingCheckout = await (prisma as any).pendingCheckout.findUnique({
      where: { id: orderId }
    });

    if (!pendingCheckout) {
      return NextResponse.json({ error: "Order not found in database" }, { status: 404 });
    }

    if (pendingCheckout.status !== "OPEN") {
      return NextResponse.json({ error: "Order is already paid or cancelled" }, { status: 400 });
    }

    const totalAmount = pendingCheckout.total || 0;
    if (totalAmount <= 0) {
      return NextResponse.json({ error: "Order total must be greater than 0" }, { status: 400 });
    }

    const orderCurrency = pendingCheckout.currency || "usd";
    const code = orderCurrency.toUpperCase();
    const isThreeDecimal = ["KWD", "BHD", "OMR"].includes(code);
    const multiplier = isThreeDecimal ? 1000 : 100;
    let amount = Math.round(totalAmount * multiplier);
    if (isThreeDecimal) {
      amount = Math.round(amount / 10) * 10;
    }
    const billing = (pendingCheckout.billingAddress as any) || {};
    const customerEmail = billing.email;

    const paymentIntent = await createPaymentIntent(amount, orderId.toString(), customerEmail, orderCurrency);

    await (prisma as any).pendingCheckout.update({
      where: { id: orderId },
      data: { stripePaymentIntentId: paymentIntent.id },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      id: paymentIntent.id
    });
  } catch (error: any) {
    console.error("CRITICAL: Stripe Intent Route Failed:", {
      message: error.message,
      stack: error.stack,
      raw: error
    });
    return NextResponse.json({ error: error.message || "Stripe creation crashed" }, { status: 500 });
  }
}
