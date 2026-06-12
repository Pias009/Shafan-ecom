import { prisma } from "@/lib/prisma";
import { TabbyService, TabbyRegion, TabbyCurrency } from "@/services/payments/tabby";
import { OrderStatus, PaymentStatus } from "@prisma/client";
import { notifyNewOrder } from "@/lib/pusher";
import { sendEmail } from "@/lib/email";

/**
 * Shared Tabby payment-processing helper.
 *
 * Capture MUST be driven by a server-to-server signal — either a registered
 * webhook (`payment.authorized`) or the Retrieve Request cron — and never by the
 * browser success callback (which can be skipped, spoofed, or never reached).
 * Both of those paths funnel through {@link captureAuthorizedTabbyOrder}.
 */

type CaptureResult =
  | { ok: true; captured?: boolean; alreadyCaptured?: boolean; status?: string }
  | { ok: false; reason: string; status?: string };

function regionForOrder(order: { shippingAddress: unknown; currency: string | null }): TabbyRegion {
  const shippingAddr = (order.shippingAddress ?? {}) as Record<string, unknown>;
  const countryCode = String(shippingAddr.country || "").toUpperCase();
  const byCountry: Record<string, TabbyRegion> = { AE: "UAE", SA: "KSA", KW: "Kuwait" };
  if (byCountry[countryCode]) return byCountry[countryCode];

  const byCurrency: Record<string, TabbyRegion> = { AED: "UAE", SAR: "KSA", KWD: "Kuwait" };
  return byCurrency[(order.currency || "AED").toUpperCase()] || "UAE";
}

async function markOrderPaid(orderId: string) {
  await prisma.order.update({
    where: { id: orderId },
    data: {
      status: OrderStatus.ORDER_CONFIRMED,
      paymentStatus: PaymentStatus.PAID,
    },
  });
}

async function notifyPaymentConfirmed(orderId: string) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) return;

    const shippingAddress = (order.shippingAddress ?? {}) as Record<string, unknown>;
    const firstName = String(shippingAddress.first_name || "");
    const lastName = String(shippingAddress.last_name || "");
    const customerName = firstName ? `${firstName} ${lastName}`.trim() : "Customer";

    await notifyNewOrder({
      id: order.id,
      total: order.total ?? 0,
      currency: order.currency,
      userName: customerName,
      email: order.email || undefined,
    }).catch((err) => console.error("[Tabby] Pusher notification failed:", err));

    if (process.env.ADMIN_EMAIL) {
      const adminItemsList = order.items
        .map((item) => `${item.nameSnapshot || "Product"} x${item.quantity}`)
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
    console.error("[Tabby] Failed to send post-payment notification:", err);
  }
}

/**
 * Retrieve the payment from Tabby and, if it is AUTHORIZED, capture it and
 * confirm the order. Idempotent: returns early if the order is already paid.
 *
 * @param orderId  The local order id.
 * @param opts.paymentId  Optional Tabby payment id (falls back to the one stored
 *                        on the order). When `opts.knownStatus` is provided (e.g.
 *                        from a webhook payload) the retrieve call is skipped.
 */
export async function captureAuthorizedTabbyOrder(
  orderId: string,
  opts?: { paymentId?: string; knownStatus?: string },
): Promise<CaptureResult> {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return { ok: false, reason: "order_not_found" };

  // Idempotency — never capture twice.
  if (order.status === OrderStatus.ORDER_CONFIRMED || order.paymentStatus === PaymentStatus.PAID) {
    return { ok: true, alreadyCaptured: true };
  }

  const paymentId = opts?.paymentId || order.tabbyPaymentId;
  if (!paymentId) return { ok: false, reason: "no_payment_id" };

  const region = regionForOrder(order);
  const service = new TabbyService(region);
  const currency = (order.currency || "AED") as TabbyCurrency;

  // Determine the authoritative status. Prefer a fresh Retrieve Request; only
  // trust a caller-supplied status when explicitly told to.
  let status = opts?.knownStatus?.toUpperCase();
  if (!status) {
    const payment = await service.getPayment(paymentId);
    status = payment.status?.toUpperCase();
  }

  if (status === "AUTHORIZED") {
    await service.capturePayment(paymentId, Number(order.total || 0), currency);
    await markOrderPaid(order.id);
    await notifyPaymentConfirmed(order.id);
    return { ok: true, captured: true, status: "CAPTURED" };
  }

  if (status === "CAPTURED" || status === "CLOSED") {
    await markOrderPaid(order.id);
    await notifyPaymentConfirmed(order.id);
    return { ok: true, captured: true, status };
  }

  if (status === "REJECTED" || status === "EXPIRED") {
    return { ok: false, reason: "not_payable", status };
  }

  // PENDING / NEW — nothing to do yet; a later webhook or cron pass will retry.
  return { ok: false, reason: "pending", status };
}
