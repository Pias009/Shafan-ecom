import { NextResponse } from "next/server";
import Stripe from "stripe";
import { wooApi } from "@/lib/woocommerce";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24-preview" as any,
});

export async function POST(req: Request) {
  try {
    const { orderId } = await req.json();

    // 1. Fetch order from WooCommerce to ensure we have the correct total
    const { data: order } = await wooApi.get(`orders/${orderId}`);

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // 2. Convert total to cents (Stripe expects integers)
    const amountCents = Math.round(parseFloat(order.total) * 100);

    // 3. Create a PaymentIntent with the order ID in metadata
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: "usd", // Adjust if your store uses another currency
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
