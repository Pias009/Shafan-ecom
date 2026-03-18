import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { verifyStripeWebhook } from "@/services/payments/stripe/payment-service";
import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get("stripe-signature") || "";

  try {
    const event = await verifyStripeWebhook(body, signature);

    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object as any;
      const orderId = paymentIntent.metadata.orderId;

      if (orderId) {
        console.log(`Payment succeeded for Order ID: ${orderId}. Updating Prisma status...`);
        
        await prisma.order.update({
          where: { id: orderId },
          data: { 
            status: OrderStatus.PAID,
            stripePaymentIntentId: paymentIntent.id
          }
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Stripe Webhook Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
