import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { verifyStripeWebhook } from "@/services/payments/stripe/payment-service";
import { prisma } from "@/lib/prisma";
import { OrderStatus, PaymentStatus } from "@prisma/client";
import { sendEmail } from "@/lib/email";

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
        
        const updatedOrder = await prisma.order.update({
          where: { id: orderId },
          data: { 
            status: OrderStatus.ORDER_CONFIRMED,
            paymentStatus: PaymentStatus.PAID,
            stripePaymentIntentId: paymentIntent.id
          },
          include: { 
            user: true, 
            items: true 
          }
        });

        // Send confirmation email to client
        if (updatedOrder.user?.email) {
          sendEmail({
            to: updatedOrder.user.email,
            subject: `Order Confirmation #${updatedOrder.id}`,
            html: `
              <h1>Thank you for your order!</h1>
              <p>We've received your payment for order #${updatedOrder.id}.</p>
              <p>Total Paid: ${(updatedOrder.total || 0).toFixed(2)} ${updatedOrder.currency.toUpperCase()}</p>
              <p>We are now processing your order and will ship it soon!</p>
            `
          }).catch(console.error);
        }

        // Send notification to admin (Optional)
        if (process.env.ADMIN_EMAIL) {
          sendEmail({
            to: process.env.ADMIN_EMAIL,
            subject: `New PAID Order - #${updatedOrder.id}`,
            html: `<p>New order paid. Customer: ${updatedOrder.user?.email || 'Guest'}. Amount: ${(updatedOrder.total || 0).toFixed(2)} ${updatedOrder.currency.toUpperCase()}</p>`
          }).catch(console.error);
        }
      }

    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Stripe Webhook Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
