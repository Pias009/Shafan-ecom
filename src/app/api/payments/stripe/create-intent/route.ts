import { NextResponse } from "next/server";
import { createPaymentIntent } from "@/services/payments/stripe/payment-service";
import { getWooCommerceOrder } from "@/services/woocommerce/order-service";

export async function POST(req: Request) {
  try {
    const { orderId } = await req.json();

    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }

    // Fetch order from WooCommerce to get the correct total
    const order = await getWooCommerceOrder(orderId);

    if (!order) {
      return NextResponse.json({ error: "Order not found in WooCommerce" }, { status: 404 });
    }

    if (order.status !== "pending") {
      return NextResponse.json({ error: "Order is not in pending status" }, { status: 400 });
    }

    const amount = parseFloat(order.total);
    const customerEmail = order.billing.email;

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
