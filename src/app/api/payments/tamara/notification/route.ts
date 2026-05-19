import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TamaraService } from "@/services/payments/tamara";
import { OrderStatus, PaymentStatus } from "@prisma/client";
import { notifyNewOrder } from "@/lib/pusher";
import { sendEmail } from "@/lib/email";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const payload = await request.text();
    const authHeader = request.headers.get("authorization") || request.headers.get("Authorization");
    
    let token = "";
    if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
      token = authHeader.substring(7).trim();
    } else if (authHeader) {
      token = authHeader.trim();
    }

    const parts = token.split(".");
    if (parts.length !== 3) {
      console.error("[Tamara Notification] JWT must have 3 parts, got:", parts.length);
      return NextResponse.json({ error: "Invalid Signature" }, { status: 401 });
    }

    const [header, jwtPayload, signature] = parts;
    const dataToSign = `${header}.${jwtPayload}`;
    const notificationKey = (process.env.TAMARA_NOTIFICATION_KEY || "").trim();

    if (!notificationKey) {
      console.error("[Tamara Notification] TAMARA_NOTIFICATION_KEY environment variable is not defined");
      return NextResponse.json({ error: "Server Configuration Error" }, { status: 500 });
    }

    const calculatedSignature = crypto
      .createHmac("sha256", notificationKey)
      .update(dataToSign)
      .digest("base64url");

    const sigBuffer = Buffer.from(signature);
    const calcBuffer = Buffer.from(calculatedSignature);

    let isValid = false;
    if (sigBuffer.length === calcBuffer.length) {
      isValid = crypto.timingSafeEqual(sigBuffer, calcBuffer);
    }

    if (!isValid) {
      console.error("[Tamara Notification] Invalid HS256 signature detected. Payload rejected.");
      return NextResponse.json({ error: "Invalid Signature" }, { status: 401 });
    }

    // Parse the raw JSON payload to extract event data
    const webhookPayload = JSON.parse(payload) as Record<string, any>;
    console.log("[Tamara Notification] Signature verified successfully. Payload received:", webhookPayload);

    const eventType = webhookPayload?.event_type ?? webhookPayload?.eventType;
    const orderId = webhookPayload?.order_id ?? webhookPayload?.orderId;
    const orderReferenceId = webhookPayload?.order_reference_id ?? webhookPayload?.orderReferenceId;

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
      console.warn("[Tamara Notification] Order not found in DB for checkout ID:", orderId, "or ref:", baseOrderId);
      return NextResponse.json({ received: true });
    }

    const tamaraService = new TamaraService();
    let paymentConfirmed = false;

    switch (eventType) {
      case "order_approved":
      case "payment.approved":
        try {
          // IDEMPOTENCY CHECK: Do not capture if already paid
          if (order.paymentStatus === PaymentStatus.PAID || order.status === OrderStatus.ORDER_CONFIRMED) {
            console.log(`[Tamara Notification] Order ${order.id} is already paid. Skipping capture.`);
            paymentConfirmed = false;
            break;
          }

          console.log(`[Tamara Notification] Authorising order ${orderId}...`);
          await tamaraService.authoriseOrder(orderId);
          
          console.log(`[Tamara Notification] Capturing payment for order ${orderId}...`);
          const decimals = ["BHD", "KWD", "OMR"].includes(order.currency.toUpperCase()) ? 3 : 2;
          const formattedTotal = Number(order.total || 0).toFixed(decimals);
          
          await tamaraService.capturePayment({
            orderId: orderId,
            totalAmount: {
              amount: formattedTotal,
              currency: order.currency.toUpperCase() as any
            },
            shippingInfo: {
              shipping_company: "Standard Delivery",
              tracking_number: orderId,
            }
          });
          console.log(`[Tamara Notification] Successfully captured payment for order ${orderId}`);

          // Update DB ONLY AFTER successful capture
          await prisma.order.update({
            where: { id: order.id },
            data: { status: OrderStatus.ORDER_CONFIRMED, paymentStatus: PaymentStatus.PAID },
          });
          paymentConfirmed = true;
        } catch (authCapErr: any) {
          console.error(`[Tamara Notification] Failed to authorise/capture order ${orderId}:`, authCapErr);
          paymentConfirmed = false;
        }
        
        break;

      case "payment.captured":
        // IDEMPOTENCY CHECK: Do not process if already paid
        if (order.paymentStatus === PaymentStatus.PAID || order.status === OrderStatus.ORDER_CONFIRMED) {
          console.log(`[Tamara Notification] Order ${order.id} already marked as paid. Skipping captured logic.`);
          paymentConfirmed = false;
          break;
        }

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
        console.log("[Tamara Notification] Tamara payment declined for order:", order.id);
        break;

      case "order_cancelled":
        await prisma.order.update({
          where: { id: order.id },
          data: { paymentStatus: PaymentStatus.CANCELLED },
        });
        break;

      case "payment.refunded":
        await prisma.order.update({
          where: { id: order.id },
          data: { status: OrderStatus.REFUNDED, paymentStatus: PaymentStatus.CANCELLED },
        });
        break;

      default:
        console.log("[Tamara Notification] Unhandled Tamara notification event:", eventType);
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
    console.error("[Tamara Notification] error:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
