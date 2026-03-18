import { NextResponse } from "next/server";
import { createPaymentIntent } from "@/services/payments/stripe/payment-service";
import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const { orderId } = await req.json();

    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }

    // Fetch order from Prisma
    const order = await (prisma as any).order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found in database" }, { status: 404 });
    }

    if (order.status !== OrderStatus.PENDING_PAYMENT) {
      return NextResponse.json({ error: "Order is not awaiting payment" }, { status: 400 });
    }

    const amount = order.totalCents / 100;
    const billing = (order.billingAddress as any) || {};
    const customerEmail = billing.email;

    const paymentIntent = await createPaymentIntent(amount, orderId.toString(), customerEmail);

    return NextResponse.json({ 
      clientSecret: paymentIntent.client_secret,
      id: paymentIntent.id
    });
  } catch (error: any) {
    console.error("Stripe Create Intent Route Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
