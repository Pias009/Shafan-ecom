import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TabbyService, TabbyRegion, TabbyWebhookPayload } from "@/services/payments/tabby";
import { OrderStatus, PaymentStatus } from "@prisma/client";
import { notifyNewOrder } from "@/lib/pusher";
import { sendEmail } from "@/lib/email";

const TABBY_REJECTION_STATUSES = new Set(["REJECTED", "EXPIRED", "CLOSED", "VOIDED"]);

async function verifyPaymentWithTabby(paymentId: string, region: TabbyRegion = "UAE"): Promise<{
  verified: boolean;
  status: string;
  details?: any;
}> {
  try {
    const tabbyService = new TabbyService(region);
    const payment = await tabbyService.getPayment(paymentId);

    return {
      verified: true,
      status: payment.status,
      details: payment,
    };
  } catch (err: any) {
    console.error(`[Tabby Webhook] Status verification failed for ${paymentId}:`, err.message);
    return {
      verified: false,
      status: "UNKNOWN",
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const rawPayload = await request.text();
    const signature = request.headers.get("x-tabby-signature") || "";

    const tabbyService = new TabbyService();
    let webhookPayload: TabbyWebhookPayload;

    try {
      webhookPayload = tabbyService.verifyWebhook(rawPayload, signature);
    } catch (verifyErr: any) {
      console.error("[Tabby Webhook] Signature verification failed:", verifyErr.message);
      return NextResponse.json({ received: true });
    }

    const eventType = webhookPayload?.event?.type;
    const paymentStatus = webhookPayload?.payload?.status;
    const paymentId = webhookPayload?.payload?.id;
    const orderRef =
      webhookPayload?.payload?.order?.reference_id ||
      webhookPayload?.payload?.order_id ||
      webhookPayload?.payload?.payment_id;

    console.log(
      `[Tabby Webhook] Event: ${eventType}, Status: ${paymentStatus}, Payment: ${paymentId}, Ref: ${orderRef}`,
    );

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

    if (order.paymentStatus === "PAID" || order.status === OrderStatus.ORDER_CONFIRMED) {
      console.log(`[Tabby Webhook] Order ${order.id} already processed. Skipping.`);
      return NextResponse.json({ received: true });
    }

    const verifiedStatus = await verifyPaymentWithTabby(paymentId);
    const effectiveStatus = verifiedStatus.verified ? verifiedStatus.status : paymentStatus;

    console.log(
      `[Tabby Webhook] Order ${order.id}: webhook says "${paymentStatus}", Tabby API says "${verifiedStatus.status}" (verified: ${verifiedStatus.verified})`,
    );

    if (verifiedStatus.verified && TABBY_REJECTION_STATUSES.has(verifiedStatus.status) && paymentStatus !== "AUTHORIZED" && paymentStatus !== "CAPTURED") {
      console.warn(`[Tabby Webhook] Verified status "${verifiedStatus.status}" is a rejection for order ${order.id}. Updating accordingly.`);

      if (verifiedStatus.status === "REJECTED" || verifiedStatus.status === "EXPIRED") {
        await prisma.order.update({
          where: { id: order.id },
          data: { paymentStatus: PaymentStatus.CANCELLED },
        });
      } else if (verifiedStatus.status === "CLOSED") {
        await prisma.order.update({
          where: { id: order.id },
          data: { status: OrderStatus.CANCELLED, paymentStatus: PaymentStatus.CANCELLED },
        });
      }

      return NextResponse.json({ received: true });
    }

    let paymentConfirmed = false;

    switch (effectiveStatus) {
      case "AUTHORIZED": {
        console.log(`[Tabby Webhook] Authorized for order ${order.id}. Triggering capture...`);

        try {
          const captureResp = await fetch(
            `${request.nextUrl.origin}/api/payments/tabby/capture`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                paymentId,
                orderId: order.id,
                amount: Number(order.total || 0),
                currency: order.currency || "AED",
              }),
            },
          );

          const captureResult = await captureResp.json();

          if (captureResp.ok && captureResult.success) {
            console.log(`[Tabby Webhook] Capture succeeded for order ${order.id}`);
            paymentConfirmed = true;
          } else {
            console.error(`[Tabby Webhook] Capture failed for order ${order.id}:`, captureResult.error);
          }
        } catch (captureErr: any) {
          console.error(`[Tabby Webhook] Capture error for order ${order.id}:`, captureErr.message);
        }
        break;
      }

      case "CAPTURED": {
        await prisma.order.update({
          where: { id: order.id },
          data: {
            status: OrderStatus.ORDER_CONFIRMED,
            paymentStatus: PaymentStatus.PAID,
          },
        });
        paymentConfirmed = true;
        break;
      }

      case "REJECTED":
        console.warn(`[Tabby Webhook] Payment REJECTED for order ${order.id}. Marking FAILED (not confirmed).`);
        await prisma.order.update({
          where: { id: order.id },
          data: { paymentStatus: PaymentStatus.CANCELLED },
        });
        break;

      case "EXPIRED":
        console.warn(`[Tabby Webhook] Payment EXPIRED for order ${order.id}. Marking FAILED.`);
        await prisma.order.update({
          where: { id: order.id },
          data: { paymentStatus: PaymentStatus.CANCELLED },
        });
        break;

      case "CLOSED":
        await prisma.order.update({
          where: { id: order.id },
          data: { status: OrderStatus.CANCELLED, paymentStatus: PaymentStatus.CANCELLED },
        });
        break;

      default:
        console.log(`[Tabby Webhook] Unhandled status: ${effectiveStatus} (event: ${eventType})`);
    }

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
            subject: `Tabby Payment Confirmed — Order #${updatedOrder.id} — ${updatedOrder.currency?.toUpperCase()} ${updatedOrder.total?.toFixed(2)}`,
            html: `
              <div style="font-family: Arial, sans-serif; padding: 20px;">
                <h2 style="color: #333;">Payment Confirmed via Tabby!</h2>
                <table style="border-collapse: collapse; width: 100%; max-width: 500px;">
                  <tr><td style="padding: 8px 0; color: #666;">Order ID</td><td style="padding: 8px 0;"><strong>#${updatedOrder.id}</strong></td></tr>
                  <tr><td style="padding: 8px 0; color: #666;">Customer</td><td style="padding: 8px 0;">${updatedOrder.email || customerName}</td></tr>
                  <tr><td style="padding: 8px 0; color: #666;">Amount</td><td style="padding: 8px 0;"><strong style="font-size: 18px;">${updatedOrder.currency?.toUpperCase()} ${updatedOrder.total?.toFixed(2)}</strong></td></tr>
                  <tr><td style="padding: 8px 0; color: #666;">Payment</td><td style="padding: 8px 0;">Tabby</td></tr>
                  <tr><td style="padding: 8px 0; color: #666;">Items</td><td style="padding: 8px 0;">${adminItemsList}</td></tr>
                </table>
                <p style="margin-top: 20px;"><a href="${process.env.NEXTAUTH_URL || "https://www.shanfaglobal.com"}/ueadmin/orders/${updatedOrder.id}" style="background: #3ECF8E; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none;">View Order</a></p>
              </div>
            `,
          }).catch(console.error);
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("[Tabby Webhook] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
