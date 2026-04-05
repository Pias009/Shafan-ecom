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
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found in database" }, { status: 404 });
    }

    if (order.status !== OrderStatus.ORDER_RECEIVED) {
      return NextResponse.json({ error: "Order is already paid or cancelled" }, { status: 400 });
    }

    const totalAmount = order.total || 0;
    if (totalAmount <= 0) {
      return NextResponse.json({ error: "Order total must be greater than 0" }, { status: 400 });
    }

    // Stripe expects amounts in cents (smallest currency unit)
    const amount = Math.round(totalAmount * 100);
    const billing = (order.billingAddress as any) || {};
    const customerEmail = billing.email;
    const orderCurrency = order.currency || "usd";

    const paymentIntent = await createPaymentIntent(amount, orderId.toString(), customerEmail, orderCurrency);

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
