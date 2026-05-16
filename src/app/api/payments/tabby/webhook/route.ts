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

    console.log("[Tabby Webhook] Received:", JSON.stringify(webhookPayload, null, 2));

    const eventType = webhookPayload?.event?.type;
    const paymentStatus = webhookPayload?.payload?.status;
    const paymentId = webhookPayload?.payload?.id;
    // Tabby may send order_id or reference_id in the payload
    const orderRef =
      webhookPayload?.payload?.order?.reference_id ||
      webhookPayload?.payload?.order_id ||
      webhookPayload?.payload?.payment_id;

    // Find the order via payment ID (most reliable) then fall back to reference
    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { tabbyPaymentId: paymentId },
          { tabbySessionId: paymentId },
          ...(orderRef ? [{ id: orderRef }] : []),
        ],
      },
    });

    if (!order) {
      console.warn("[Tabby Webhook] Order not found for payment:", paymentId, "ref:", orderRef);
      return NextResponse.json({ received: true });
    }

    let paymentConfirmed = false;

    switch (paymentStatus) {
      // ── AUTHORIZED: immediately capture the payment ─────────────────────────
      case "AUTHORIZED": {
        console.log(`[Tabby Webhook] Payment AUTHORIZED for order ${order.id}. Triggering capture...`);
        const decimals = ["KWD", "BHD", "OMR"].includes(order.currency?.toUpperCase()) ? 3 : 2;

        try {
          // IDEMPOTENCY CHECK: Do not capture if already paid
          if (order.paymentStatus === "PAID" || order.status === OrderStatus.ORDER_CONFIRMED) {
            console.log(`[Tabby Webhook] Order ${order.id} is already paid. Skipping capture.`);
            paymentConfirmed = true; 
            break;
          }

          const captured = await tabbyService.capturePayment(
            paymentId,
            Number(order.total || 0),
            (order.currency || "AED") as any
          );
          console.log(`[Tabby Webhook] Capture successful for order ${order.id}:`, captured?.status);

          await prisma.order.update({
            where: { id: order.id },
            data: {
              status: OrderStatus.ORDER_CONFIRMED,
              paymentStatus: "PAID" as any,
            },
          });
          paymentConfirmed = true;
        } catch (captureErr: any) {
          console.error(`[Tabby Webhook] Capture FAILED for order ${order.id}:`, captureErr.message);
          // Rule 3: DO NOT update to PAID if capture fails.
          // Keep as PENDING so it can be investigated or retried manually.
        }
        break;
      }

      // ── CAPTURED: already captured (in case we receive this later) ───────────
      case "CAPTURED": {
        // IDEMPOTENCY CHECK: Do not process if already paid
        if (order.paymentStatus === "PAID" || order.status === OrderStatus.ORDER_CONFIRMED) {
          console.log(`[Tabby Webhook] Order ${order.id} already marked as paid. Skipping CAPTURED logic.`);
          paymentConfirmed = false; // Set to false to avoid duplicate notifications
          break;
        }

        await prisma.order.update({
          where: { id: order.id },
          data: {
            status: OrderStatus.ORDER_CONFIRMED,
            paymentStatus: "PAID" as any,
          },
        });
        paymentConfirmed = true;
        break;
      }

      // ── REJECTED / EXPIRED / CLOSED ──────────────────────────────────────────
      case "REJECTED":
        console.warn(`[Tabby Webhook] Payment REJECTED for order ${order.id}. NOT marking confirmed.`);
        // Do NOT mark order as confirmed — just log and let the user retry
        await prisma.order.update({
          where: { id: order.id },
          data: { paymentStatus: PaymentStatus.CANCELLED },
        });
        break;

      case "EXPIRED":
        console.warn(`[Tabby Webhook] Payment EXPIRED for order ${order.id}`);
        break;

      case "CLOSED":
        await prisma.order.update({
          where: { id: order.id },
          data: { status: OrderStatus.CANCELLED, paymentStatus: PaymentStatus.CANCELLED },
        });
        break;

      default:
        console.log(`[Tabby Webhook] Unhandled status: ${paymentStatus} (event: ${eventType})`);
    }

    // ── Admin notification after confirmed payment ────────────────────────────
    if (paymentConfirmed) {
      const updatedOrder = await prisma.order.findUnique({
        where: { id: order.id },
        include: { items: true },
      });

      if (updatedOrder) {
        const shippingAddr = updatedOrder.shippingAddress as any;
        const customerName = shippingAddr?.first_name
          ? `${shippingAddr.first_name} ${shippingAddr.last_name || ""}`
          : "Customer";

        await notifyNewOrder({
          id: updatedOrder.id,
          total: updatedOrder.total ?? 0,
          currency: updatedOrder.currency,
          userName: customerName,
          email: updatedOrder.email || undefined,
        }).catch((err) => console.error("[Tabby Webhook] Pusher error:", err));

        if (process.env.ADMIN_EMAIL) {
          const adminItemsList = updatedOrder.items
            .map((item: any) => `${item.nameSnapshot || "Product"} x${item.quantity}`)
            .join(", ");

          await sendEmail({
            to: process.env.ADMIN_EMAIL,
            subject: `✅ Tabby Payment Confirmed — Order #${updatedOrder.id} — ${updatedOrder.currency?.toUpperCase()} ${updatedOrder.total?.toFixed(2)}`,
            html: `
              <div style="font-family: Arial, sans-serif; padding: 20px;">
                <h2 style="color: #333;">✅ Payment Confirmed via Tabby!</h2>
                <table style="border-collapse: collapse; width: 100%; max-width: 500px;">
                  <tr><td style="padding: 8px 0; color: #666;">Order ID</td><td style="padding: 8px 0;"><strong>#${updatedOrder.id}</strong></td></tr>
                  <tr><td style="padding: 8px 0; color: #666;">Customer</td><td style="padding: 8px 0;">${updatedOrder.email || customerName}</td></tr>
                  <tr><td style="padding: 8px 0; color: #666;">Amount</td><td style="padding: 8px 0;"><strong style="font-size: 18px;">${updatedOrder.currency?.toUpperCase()} ${updatedOrder.total?.toFixed(2)}</strong></td></tr>
                  <tr><td style="padding: 8px 0; color: #666;">Payment</td><td style="padding: 8px 0;">Tabby | Pay in 4 interest-free payments</td></tr>
                  <tr><td style="padding: 8px 0; color: #666;">Items</td><td style="padding: 8px 0;">${adminItemsList}</td></tr>
                </table>
                <p style="margin-top: 20px;"><a href="${process.env.NEXTAUTH_URL || "https://www.shanfaglobal.com"}/ueadmin/orders/${updatedOrder.id}" style="background: #3ECF8E; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none;">View Order</a></p>
              </div>
            `,
          }).catch(console.error);
        }

        console.log(`[Tabby Payment Confirmed] Order #${updatedOrder.id}`);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("[Tabby Webhook] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
