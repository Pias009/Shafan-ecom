import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24-preview" as any,
});

export async function POST(req: Request) {
  try {
    const { orderId } = await req.json();

    // 1. Fetch order from Prisma
    const order = await (prisma as any).order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // 2. Already in cents in Prisma
    const amountCents = order.totalCents;

    // 3. Create a PaymentIntent with the order ID in metadata
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: order.currency || "usd",
      receipt_email: (order.billingAddress as any)?.email,
      metadata: {
        orderId: String(orderId),
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error: any) {
    console.error("Stripe Intent Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
