import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TabbyService } from "@/services/payments/tabby";
import { OrderStatus, PaymentStatus } from "@prisma/client";
import { notifyNewOrder } from "@/lib/pusher";
import { sendEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const payload = await request.text();
    const signature = request.headers.get("x-tabby-signature") || "";

    const tabbyService = new TabbyService();
    const webhookPayload = tabbyService.verifyWebhook(payload, signature);

    console.log("Tabby webhook received:", webhookPayload);

    const eventType = webhookPayload?.event?.type;
    const paymentStatus = webhookPayload?.payload?.status;
    const paymentId = webhookPayload?.payload?.id;
    const orderId = webhookPayload?.payload?.order_id || webhookPayload?.payload?.payment_id;

    if (!orderId) {
      return NextResponse.json({ error: "Order ID not found in webhook" }, { status: 400 });
    }

    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { tabbyPaymentId: paymentId },
          { tabbySessionId: paymentId },
          { id: orderId },
        ],
      },
    });
    
    if (!order) {
      console.log("Order not found for Tabby webhook:", orderId);
      // Order should have been created in create-order route
      // If not found, we can't process this webhook
      return NextResponse.json({ received: true });
    }

    let paymentConfirmed = false;

    switch (eventType) {
      case "payment.approved":
      case "payment.authorization":
        if (paymentStatus === "AUTHORIZED") {
          await prisma.order.update({
            where: { id: order.id },
            data: { status: OrderStatus.PROCESSING, paymentStatus: PaymentStatus.PAID },
          });
          paymentConfirmed = true;
        }
        break;

      case "payment.captured":
        if (paymentStatus === "CAPTURED") {
          await prisma.order.update({
            where: { id: order.id },
            data: { status: OrderStatus.ORDER_CONFIRMED, paymentStatus: PaymentStatus.PAID },
          });
          paymentConfirmed = true;
        }
        break;

      case "payment.declined":
      case "payment.rejected":
        console.log("Tabby payment declined for order:", order.id);
        await prisma.order.update({
          where: { id: order.id },
          data: { status: "CANCELLED" },
        });
        break;

      case "payment.expired":
        console.log("Tabby payment expired for order:", order.id);
        break;

      case "payment.void":
        await prisma.order.update({
          where: { id: order.id },
          data: { status: "CANCELLED" },
        });
        break;

      default:
        console.log("Unhandled Tabby webhook event:", eventType);
    }

    // Send admin notification ONLY after payment is confirmed
    if (paymentConfirmed) {
      const updatedOrder = await prisma.order.findUnique({
        where: { id: order.id },
        include: { items: true },
      });

      if (updatedOrder) {
        const shippingAddress = updatedOrder.shippingAddress as any;
        const customerName = shippingAddress?.first_name
          ? `${shippingAddress.first_name} ${shippingAddress.last_name || ""}`
          : "Customer";

        // Pusher real-time notification
        await notifyNewOrder({
          id: updatedOrder.id,
          total: updatedOrder.total ?? 0,
          currency: updatedOrder.currency,
          userName: customerName,
          email: updatedOrder.email || undefined,
        }).catch((err) => console.error("Pusher notification failed:", err));

        // Admin email
        if (process.env.ADMIN_EMAIL) {
          const adminItemsList = updatedOrder.items
            .map((item: any) => `${item.nameSnapshot || "Product"} x${item.quantity}`)
            .join(", ");

          await sendEmail({
            to: process.env.ADMIN_EMAIL,
            subject: `✅ Tabby Payment Confirmed — Order #${updatedOrder.id} — ${updatedOrder.currency.toUpperCase()} ${updatedOrder.total?.toFixed(2)}`,
            html: `
              <div style="font-family: Arial, sans-serif; padding: 20px;">
                <h2 style="color: #333;">✅ Payment Confirmed via Tabby!</h2>
                <table style="border-collapse: collapse; width: 100%; max-width: 500px;">
                  <tr><td style="padding: 8px 0; color: #666;">Order ID</td><td style="padding: 8px 0;"><strong>#${updatedOrder.id}</strong></td></tr>
                  <tr><td style="padding: 8px 0; color: #666;">Customer</td><td style="padding: 8px 0;">${updatedOrder.email || customerName}</td></tr>
                  <tr><td style="padding: 8px 0; color: #666;">Amount</td><td style="padding: 8px 0;"><strong style="font-size: 18px;">${updatedOrder.currency.toUpperCase()} ${updatedOrder.total?.toFixed(2)}</strong></td></tr>
                  <tr><td style="padding: 8px 0; color: #666;">Payment</td><td style="padding: 8px 0;">Tabby (${eventType})</td></tr>
                  <tr><td style="padding: 8px 0; color: #666;">Items</td><td style="padding: 8px 0;">${adminItemsList}</td></tr>
                </table>
                <p style="margin-top: 20px;"><a href="${process.env.NEXTAUTH_URL || "https://www.shanfaglobal.com"}/ueadmin/orders/${updatedOrder.id}" style="background: #667eea; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none;">View Order</a></p>
              </div>
            `,
          }).catch(console.error);
        }

        console.log(`[Tabby Payment Confirmed] Order #${updatedOrder.id} — Admin notified`);
      }
    }

    return NextResponse.json({ received: true });

  } catch (error: any) {
    console.error("Tabby webhook error:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
