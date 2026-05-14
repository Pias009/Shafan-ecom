import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TamaraService } from "@/services/payments/tamara";
import { OrderStatus, PaymentStatus } from "@prisma/client";
import { notifyNewOrder } from "@/lib/pusher";
import { sendEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const payload = await request.text();
    const signature = request.headers.get("x-tamara-signature") || "";

    const tamaraService = new TamaraService();
    const isValid = tamaraService.verifyWebhook(payload, signature);

    if (!isValid) {
      console.error("[Tamara Webhook] Invalid signature detected. Payload rejected.");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // Parse the raw JSON payload to extract event data
    const webhookPayload = JSON.parse(payload) as Record<string, any>;

    console.log("Tamara webhook received (valid:", isValid, "):", webhookPayload);

    const eventType = webhookPayload?.event_type ?? webhookPayload?.eventType;
    const orderId = webhookPayload?.order_id ?? webhookPayload?.orderId;
    const orderReferenceId = webhookPayload?.order_reference_id ?? webhookPayload?.orderReferenceId;
    const status = webhookPayload?.status;

    const baseOrderId = orderReferenceId?.includes('-') ? orderReferenceId.split('-')[0] : orderReferenceId;

    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { tamaraCheckoutId: orderId },
          { id: baseOrderId },
        ],
      },
    });
    
    if (!order) {
      console.log("Order not found for Tamara webhook:", orderId);
      // Order should have been created in create-order route
      // If not found, we can't process this webhook
      return NextResponse.json({ received: true });
    }

    let paymentConfirmed = false;

    switch (eventType) {
      case "order_approved":
      case "payment.approved":
        await prisma.order.update({
          where: { id: order.id },
          data: { status: OrderStatus.PROCESSING, paymentStatus: PaymentStatus.PAID },
        });
        paymentConfirmed = true;
        break;

      case "payment.captured":
        await prisma.order.update({
          where: { id: order.id },
          data: { status: OrderStatus.ORDER_CONFIRMED, paymentStatus: PaymentStatus.PAID },
        });
        paymentConfirmed = true;
        break;

      case "payment.declined":
      case "order_declined":
        await prisma.order.update({
          where: { id: order.id },
          data: { paymentStatus: PaymentStatus.CANCELLED },
        });
        console.log("Tamara payment declined for order:", order.id);
        break;

      case "order_cancelled":
        await prisma.order.update({
          where: { id: order.id },
          data: { status: OrderStatus.CANCELLED, paymentStatus: PaymentStatus.CANCELLED },
        });
        break;

      case "payment.refunded":
        await prisma.order.update({
          where: { id: order.id },
          data: { status: OrderStatus.REFUNDED, paymentStatus: PaymentStatus.CANCELLED },
        });
        break;

      default:
        console.log("Unhandled Tamara webhook event:", eventType);
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
            subject: `✅ Tamara Payment Confirmed — Order #${updatedOrder.id} — ${updatedOrder.currency.toUpperCase()} ${updatedOrder.total?.toFixed(2)}`,
            html: `
              <div style="font-family: Arial, sans-serif; padding: 20px;">
                <h2 style="color: #333;">✅ Payment Confirmed via Tamara!</h2>
                <table style="border-collapse: collapse; width: 100%; max-width: 500px;">
                  <tr><td style="padding: 8px 0; color: #666;">Order ID</td><td style="padding: 8px 0;"><strong>#${updatedOrder.id}</strong></td></tr>
                  <tr><td style="padding: 8px 0; color: #666;">Customer</td><td style="padding: 8px 0;">${updatedOrder.email || customerName}</td></tr>
                  <tr><td style="padding: 8px 0; color: #666;">Amount</td><td style="padding: 8px 0;"><strong style="font-size: 18px;">${updatedOrder.currency.toUpperCase()} ${updatedOrder.total?.toFixed(2)}</strong></td></tr>
                  <tr><td style="padding: 8px 0; color: #666;">Payment</td><td style="padding: 8px 0;">Tamara (${eventType})</td></tr>
                  <tr><td style="padding: 8px 0; color: #666;">Items</td><td style="padding: 8px 0;">${adminItemsList}</td></tr>
                </table>
                <p style="margin-top: 20px;"><a href="${process.env.NEXTAUTH_URL || "https://www.shanfaglobal.com"}/ueadmin/orders/${updatedOrder.id}" style="background: #667eea; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none;">View Order</a></p>
              </div>
            `,
          }).catch(console.error);
        }

        console.log(`[Tamara Payment Confirmed] Order #${updatedOrder.id} — Admin notified`);
      }
    }

    return NextResponse.json({ received: true });

  } catch (error: any) {
    console.error("Tamara webhook error:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
