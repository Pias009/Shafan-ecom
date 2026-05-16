import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TabbyService } from "@/services/payments/tabby";
import { TamaraService } from "@/services/payments/tamara";
import { OrderStatus, PaymentStatus } from "@prisma/client";
import { createShipmentForOrder } from "@/services/shipping/order-shipment";
import { notifyNewOrder } from "@/lib/pusher";
import { sendEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  const tabbySignature = request.headers.get("x-tabby-signature");
  const tamaraSignature = request.headers.get("x-tamara-signature");

  const payload = await request.text();

  try {
    if (tabbySignature) {
      return handleTabbyWebhook(payload, tabbySignature);
    } else if (tamaraSignature) {
      return handleTamaraWebhook(payload, tamaraSignature);
    } else {
      return NextResponse.json({ error: "Unknown payment provider" }, { status: 400 });
    }
  } catch (error: any) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

/**
 * Send admin notification + email after a successful payment
 */
async function notifyPaymentConfirmed(orderId: string, provider: string) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) return;

    const shippingAddress = order.shippingAddress as any;
    const customerName = shippingAddress?.first_name
      ? `${shippingAddress.first_name} ${shippingAddress.last_name || ""}`
      : "Customer";

    // Pusher real-time notification
    await notifyNewOrder({
      id: order.id,
      total: order.total ?? 0,
      currency: order.currency,
      userName: customerName,
      email: order.email || undefined,
    }).catch((err) => console.error("Pusher notification failed:", err));

    // Admin email notification
    if (process.env.ADMIN_EMAIL) {
      const adminItemsList = order.items
        .map((item: any) => `${item.nameSnapshot || "Product"} x${item.quantity}`)
        .join(", ");

      await sendEmail({
        to: process.env.ADMIN_EMAIL,
        subject: `✅ ${provider} Payment Confirmed — Order #${order.id} — ${order.currency.toUpperCase()} ${order.total?.toFixed(2)}`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2 style="color: #333;">✅ Payment Confirmed via ${provider}!</h2>
            <table style="border-collapse: collapse; width: 100%; max-width: 500px;">
              <tr><td style="padding: 8px 0; color: #666;">Order ID</td><td style="padding: 8px 0;"><strong>#${order.id}</strong></td></tr>
              <tr><td style="padding: 8px 0; color: #666;">Customer</td><td style="padding: 8px 0;">${order.email || customerName}</td></tr>
              <tr><td style="padding: 8px 0; color: #666;">Amount</td><td style="padding: 8px 0;"><strong style="font-size: 18px;">${order.currency.toUpperCase()} ${order.total?.toFixed(2)}</strong></td></tr>
              <tr><td style="padding: 8px 0; color: #666;">Payment</td><td style="padding: 8px 0;">${provider}</td></tr>
              <tr><td style="padding: 8px 0; color: #666;">Items</td><td style="padding: 8px 0;">${adminItemsList}</td></tr>
            </table>
            <p style="margin-top: 20px;"><a href="${process.env.NEXTAUTH_URL || "https://www.shanfaglobal.com"}/ueadmin/orders/${order.id}" style="background: #667eea; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none;">View Order</a></p>
          </div>
        `,
      }).catch(console.error);
    }

    console.log(`[Payment Confirmed] ${provider} — Order #${order.id} — Admin notified`);
  } catch (err) {
    console.error("Failed to send post-payment notification:", err);
  }
}

async function handleTabbyWebhook(payload: string, signature: string) {
  const tabbyService = new TabbyService();
  const webhookPayload = tabbyService.verifyWebhook(payload, signature);
  
  const eventType = webhookPayload?.event?.type;
  const paymentStatus = webhookPayload?.payload?.status;
  const paymentId = webhookPayload?.payload?.id;
  const orderId = webhookPayload?.payload?.order_id || webhookPayload?.payload?.payment_id;

  if (!orderId) return NextResponse.json({ received: true });

  const order = await prisma.order.findFirst({
    where: {
      OR: [{ tabbyPaymentId: paymentId }, { tabbySessionId: paymentId }, { id: orderId }],
    },
  });

  if (!order) return NextResponse.json({ received: true });

  if (eventType === "payment.captured" && paymentStatus === "CAPTURED") {
    await prisma.order.update({
      where: { id: order.id },
      data: { status: OrderStatus.ORDER_CONFIRMED, paymentStatus: PaymentStatus.PAID },
    });
    
    // Notify admin NOW — payment is confirmed
    await notifyPaymentConfirmed(order.id, "Tabby");

    // Trigger Naqel Shipment ONLY AFTER CAPTURE
    try {
      await createShipmentForOrder(order.id);
    } catch (e) {
      console.error("Failed to create Naqel shipment for order:", order.id, e);
    }
  } else if (eventType === "payment.authorized" || paymentStatus === "AUTHORIZED") {
    // ── Rule 3: Must Capture before Success ──
    console.log(`[Generic Webhook] Payment AUTHORIZED for ${order.id}. Triggering capture...`);
    try {
      const tabbyService = new TabbyService();
      await tabbyService.capturePayment(
        paymentId, 
        Number(order.total || 0), 
        (order.currency || "AED") as any
      );
      
      // Update DB ONLY AFTER successful capture call
      await prisma.order.update({
        where: { id: order.id },
        data: { status: OrderStatus.ORDER_CONFIRMED, paymentStatus: "PAID" as any },
      });
      await notifyPaymentConfirmed(order.id, "Tabby");
    } catch (err: any) {
      console.error(`[Generic Webhook] Capture FAILED for ${order.id}:`, err.message);
    }
  }

  return NextResponse.json({ received: true });
}

async function handleTamaraWebhook(payload: string, signature: string) {
  const tamaraService = new TamaraService();
  tamaraService.verifyWebhook(payload, signature); // validates signature

  // Parse raw JSON payload to extract event data
  const webhookPayload = JSON.parse(payload) as Record<string, any>;
  
  const eventType = webhookPayload?.event_type ?? webhookPayload?.eventType;
  const tamaraOrderId = webhookPayload?.order_id ?? webhookPayload?.orderId;
  const orderReferenceId = webhookPayload?.order_reference_id ?? webhookPayload?.orderReferenceId;

  const order = await prisma.order.findFirst({
    where: {
      OR: [{ tamaraCheckoutId: tamaraOrderId }, { id: orderReferenceId }],
    },
  });

  if (!order) return NextResponse.json({ received: true });

  if (eventType === "payment.captured") {
    await prisma.order.update({
      where: { id: order.id },
      data: { status: OrderStatus.ORDER_CONFIRMED, paymentStatus: "PAID" as any },
    });

    // Notify admin NOW — payment is confirmed
    await notifyPaymentConfirmed(order.id, "Tamara");

    // Trigger Naqel Shipment ONLY AFTER CAPTURE
    try {
      await createShipmentForOrder(order.id);
    } catch (e) {
      console.error("Failed to create Naqel shipment for order:", order.id, e);
    }
  } else if (eventType === "order_approved" || eventType === "payment.approved") {
    // ── Rule 3: Must Capture before Success ──
    console.log(`[Generic Webhook] Tamara APPROVED for ${order.id}. Triggering capture...`);
    try {
      const tamaraService = new TamaraService();
      const decimals = ["BHD", "KWD", "OMR"].includes(order.currency.toUpperCase()) ? 3 : 2;
      
      await tamaraService.authoriseOrder(tamaraOrderId);
      await tamaraService.capturePayment({
        orderId: tamaraOrderId,
        totalAmount: {
          amount: Number(order.total || 0).toFixed(decimals),
          currency: order.currency.toUpperCase() as any
        },
        shippingInfo: {
          shipping_company: "Standard Delivery",
          tracking_number: order.id,
        }
      });

      // Update DB ONLY AFTER successful capture
      await prisma.order.update({
        where: { id: order.id },
        data: { status: OrderStatus.ORDER_CONFIRMED, paymentStatus: "PAID" as any },
      });
      await notifyPaymentConfirmed(order.id, "Tamara");
    } catch (err: any) {
      console.error(`[Generic Webhook] Tamara Capture FAILED for ${order.id}:`, err.message);
    }
  }

  return NextResponse.json({ received: true });
}
