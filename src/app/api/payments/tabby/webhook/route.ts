import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TabbyService, TabbyRegion, TabbyCurrency } from "@/services/payments/tabby";
import { OrderStatus } from "@prisma/client";
import { notifyNewOrder } from "@/lib/pusher";
import { sendEmail } from "@/lib/email";

// Tabby uses a custom header for webhook verification (not HMAC).
// The header title is "X-Tabby-Secret" and the value must match TABBY_WEBHOOK_SECRET.
function verifyTabbyHeader(request: NextRequest): boolean {
  const secret = process.env.TABBY_WEBHOOK_SECRET;
  if (!secret) return true; // skip verification if not configured
  const headerValue = request.headers.get("x-tabby-secret") || "";
  return headerValue === secret;
}

async function notifyPaymentConfirmed(orderId: string) {
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

    await notifyNewOrder({
      id: order.id,
      total: order.total ?? 0,
      currency: order.currency,
      userName: customerName,
      email: order.email || undefined,
    }).catch((err) => console.error("Pusher notification failed:", err));

    if (process.env.ADMIN_EMAIL) {
      const adminItemsList = order.items
        .map((item: any) => `${item.nameSnapshot || "Product"} x${item.quantity}`)
        .join(", ");

      await sendEmail({
        to: process.env.ADMIN_EMAIL,
        subject: `Tabby Payment Confirmed — Order #${order.id} — ${order.currency?.toUpperCase()} ${order.total?.toFixed(2)}`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2 style="color: #333;">Payment Confirmed via Tabby!</h2>
            <table style="border-collapse: collapse; width: 100%; max-width: 500px;">
              <tr><td style="padding: 8px 0; color: #666;">Order ID</td><td style="padding: 8px 0;"><strong>#${order.id}</strong></td></tr>
              <tr><td style="padding: 8px 0; color: #666;">Customer</td><td style="padding: 8px 0;">${order.email || customerName}</td></tr>
              <tr><td style="padding: 8px 0; color: #666;">Amount</td><td style="padding: 8px 0;"><strong style="font-size: 18px;">${order.currency?.toUpperCase()} ${order.total?.toFixed(2)}</strong></td></tr>
              <tr><td style="padding: 8px 0; color: #666;">Payment</td><td style="padding: 8px 0;">Tabby</td></tr>
              <tr><td style="padding: 8px 0; color: #666;">Items</td><td style="padding: 8px 0;">${adminItemsList}</td></tr>
            </table>
            <p style="margin-top: 20px;"><a href="${process.env.NEXTAUTH_URL || "https://www.shanfaglobal.com"}/ueadmin/orders/${order.id}" style="background: #3ECF8E; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none;">View Order</a></p>
          </div>
        `,
      }).catch(console.error);
    }
  } catch (err) {
    console.error("Failed to send post-payment notification:", err);
  }
}

export async function POST(request: NextRequest) {
  if (!verifyTabbyHeader(request)) {
    console.warn("[Tabby Webhook] Header verification failed");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rawPayload = await request.text();

  try {
    const body = JSON.parse(rawPayload);
    const eventType = body?.event?.type || body?.type;
    const paymentStatus = body?.payload?.status || body?.status;
    const paymentId = body?.payload?.id || body?.id;
    const orderId = body?.metadata?.order_id || body?.payload?.order_id || body?.payload?.order?.reference_id;

    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { tabbyPaymentId: paymentId },
          { tabbySessionId: paymentId },
          ...(orderId ? [{ id: orderId }] : []),
        ],
      },
    });

    if (!order) {
      return NextResponse.json({ received: true });
    }

    // Auto-capture on authorized status
    if (eventType === "payment.authorized" || paymentStatus?.toUpperCase() === "AUTHORIZED") {
      console.log(`[Tabby Webhook] Payment AUTHORIZED for ${order.id}. Triggering capture...`);
      try {
        const shippingAddr = (order.shippingAddress ?? {}) as Record<string, unknown>;
        const countryCode = String(shippingAddr.country || "AE").toUpperCase();
        const regionMap: Record<string, TabbyRegion> = { AE: "UAE", SA: "KSA", KW: "Kuwait" };
        const region: TabbyRegion = regionMap[countryCode] || "UAE";
        const tabbyService = new TabbyService(region);

        await tabbyService.capturePayment(
          paymentId,
          Number(order.total || 0),
          (order.currency || "AED") as TabbyCurrency,
        );

        await prisma.order.update({
          where: { id: order.id },
          data: {
            status: OrderStatus.ORDER_CONFIRMED,
            paymentStatus: "PAID" as any,
          },
        });

        await notifyPaymentConfirmed(order.id);

        console.log(`[Tabby Webhook] Payment captured and order ${order.id} confirmed.`);
      } catch (err: any) {
        console.error(`[Tabby Webhook] Capture FAILED for ${order.id}:`, err.message);
      }
    } else if (paymentStatus?.toUpperCase() === "CAPTURED") {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.ORDER_CONFIRMED,
          paymentStatus: "PAID" as any,
        },
      });

      await notifyPaymentConfirmed(order.id);
    } else if (paymentStatus?.toUpperCase() === "CLOSED") {
      await prisma.order.update({
        where: { id: order.id },
        data: { paymentStatus: "PAID" as any },
      });
    } else if (paymentStatus?.toUpperCase() === "REJECTED" || paymentStatus?.toUpperCase() === "FAILED") {
      await prisma.order.update({
        where: { id: order.id },
        data: { paymentStatus: "CANCELLED" as any },
      });
    }

    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ received: true });
  }
}
