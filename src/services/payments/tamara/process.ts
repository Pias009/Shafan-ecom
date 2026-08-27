import { prisma } from "@/lib/prisma";
import { TamaraService } from "@/services/payments/tamara";
import { OrderStatus, PaymentStatus } from "@prisma/client";
import { notifyNewOrder } from "@/lib/pusher";
import { sendEmail } from "@/lib/email";
import { promoteToOrder, expirePendingCheckout } from "@/services/checkout/pending-checkout";
import { TamaraCurrency } from "@/services/payments/tamara/types";

type CaptureResult =
  | { ok: true; captured?: boolean; alreadyCaptured?: boolean; status?: string }
  | { ok: false; reason: string; status?: string };

async function markOrderPaid(orderId: string) {
  await prisma.order.update({
    where: { id: orderId },
    data: {
      status: OrderStatus.ORDER_CONFIRMED,
      paymentStatus: PaymentStatus.PAID,
    },
  });
}

export async function notifyPaymentConfirmed(orderId: string) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) return;

    const shippingAddress = (order.shippingAddress ?? {}) as Record<string, unknown>;
    const firstName = String(shippingAddress.first_name || shippingAddress.fullName || "");
    const lastName = String(shippingAddress.last_name || "");
    const customerName = firstName ? `${firstName} ${lastName}`.trim() : "Customer";

    await notifyNewOrder({
      id: order.id,
      total: order.total ?? 0,
      currency: order.currency,
      userName: customerName,
      email: order.email || undefined,
    }).catch((err) => console.error("[Tamara] Pusher notification failed:", err));

    if (process.env.ADMIN_EMAIL) {
      const adminItemsList = order.items
        .map((item) => `${item.nameSnapshot || "Product"} x${item.quantity}`)
        .join(", ");

      await sendEmail({
        to: process.env.ADMIN_EMAIL,
        subject: `Tamara Payment Confirmed — Order #${order.id} — ${order.currency?.toUpperCase()} ${order.total?.toFixed(2)}`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2 style="color: #333;">Payment Confirmed via Tamara!</h2>
            <table style="border-collapse: collapse; width: 100%; max-width: 500px;">
              <tr><td style="padding: 8px 0; color: #666;">Order ID</td><td style="padding: 8px 0;"><strong>#${order.id}</strong></td></tr>
              <tr><td style="padding: 8px 0; color: #666;">Customer</td><td style="padding: 8px 0;">${order.email || customerName}</td></tr>
              <tr><td style="padding: 8px 0; color: #666;">Amount</td><td style="padding: 8px 0;"><strong style="font-size: 18px;">${order.currency?.toUpperCase()} ${order.total?.toFixed(2)}</strong></td></tr>
              <tr><td style="padding: 8px 0; color: #666;">Payment</td><td style="padding: 8px 0;">Tamara Installments</td></tr>
              <tr><td style="padding: 8px 0; color: #666;">Items</td><td style="padding: 8px 0;">${adminItemsList}</td></tr>
            </table>
            <p style="margin-top: 20px;"><a href="${process.env.NEXTAUTH_URL || "https://www.shanfaglobal.com"}/ueadmin/orders/${order.id}" style="background: #000; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none;">View Order</a></p>
          </div>
        `,
      }).catch(console.error);
    }
  } catch (err) {
    console.error("[Tamara] Failed to send post-payment notification:", err);
  }
}

/**
 * Verifies and promotes a PendingCheckout that used Tamara.
 * Performs retrieve/getOrder from Tamara API, authorises/captures if needed,
 * and promotes the PendingCheckout to a real Order in status ORDER_CONFIRMED & PaymentStatus.PAID.
 */
export async function capturePendingTamaraCheckout(
  pendingCheckoutId: string,
  opts?: { tamaraCheckoutId?: string; knownStatus?: string }
): Promise<CaptureResult> {
  const pc = await (prisma as any).pendingCheckout.findUnique({ where: { id: pendingCheckoutId } });
  if (!pc) return { ok: false, reason: "order_not_found" };

  if (pc.status === "CONSUMED" && pc.consumedOrderId) {
    return { ok: true, alreadyCaptured: true };
  }
  if (pc.status === "EXPIRED") {
    return { ok: false, reason: "not_payable", status: "EXPIRED" };
  }

  const tamaraId = opts?.tamaraCheckoutId || pc.tamaraCheckoutId;
  if (!tamaraId) return { ok: false, reason: "no_tamara_id" };

  const service = new TamaraService();
  let status = opts?.knownStatus?.toLowerCase();

  if (!status) {
    try {
      const orderInfo: any = await service.getOrder(tamaraId);
      status = (orderInfo.status || "").toLowerCase();
    } catch (err: any) {
      console.error(`[Tamara Process] Error fetching Tamara order ${tamaraId}:`, err.message);
      return { ok: false, reason: "tamara_api_error" };
    }
  }

  // Approved, authorised, captured, or fully_captured
  const isPaidOrAuthorized = status ? [
    "approved",
    "authorised",
    "authorized",
    "captured",
    "fully_captured",
    "order_approved",
    "order_authorised",
    "payment.approved",
    "payment.captured",
  ].includes(status) : false;

  if (isPaidOrAuthorized) {
    // Attempt authorise if needed (ignore error if already authorised)
    if (status === "approved" || status === "order_approved") {
      await service.authoriseOrder(tamaraId).catch((e) => {
        console.warn("[Tamara Process] Authorise call notice:", e.message);
      });
    }

    // Attempt capture if not yet fully captured
    if (status !== "captured" && status !== "fully_captured") {
      const currencyCode = (pc.currency || "AED").toUpperCase();
      const decimals = ["BHD", "KWD", "OMR"].includes(currencyCode) ? 3 : 2;
      const formattedTotal = Number(pc.total || 0).toFixed(decimals);
      const pcItems = (pc.items as any[]) || [];

      const captureItems = pcItems.map((item: any) => {
        const itemTotal = (Number(item.unitPrice || 0) * item.quantity).toFixed(decimals);
        return {
          name: item.nameSnapshot || "Product",
          quantity: item.quantity,
          reference_id: item.productId,
          sku: item.productId,
          unit_price: {
            amount: Number(item.unitPrice || 0).toFixed(decimals),
            currency: currencyCode as TamaraCurrency,
          },
          total_amount: {
            amount: itemTotal,
            currency: currencyCode as TamaraCurrency,
          },
          type: "Physical",
        };
      });

      await service.capturePayment({
        orderId: tamaraId,
        totalAmount: {
          amount: formattedTotal,
          currency: currencyCode as TamaraCurrency,
        },
        shippingInfo: {
          shipping_company: "Standard Delivery",
          tracking_number: tamaraId,
        },
        items: captureItems,
      }).catch((e) => {
        console.warn("[Tamara Process] Capture call notice:", e.message);
      });
    }

    // Promote to real Order
    const { order } = await promoteToOrder(pendingCheckoutId, {
      paymentStatus: PaymentStatus.PAID,
      status: OrderStatus.ORDER_CONFIRMED,
      paymentMethod: "tamara",
      paymentMethodTitle: "Tamara Installments",
      tamaraCheckoutId: tamaraId,
    });

    await notifyPaymentConfirmed(order.id);
    return { ok: true, captured: true, status: "PAID" };
  }

  if (status && ["declined", "canceled", "cancelled", "expired"].includes(status)) {
    await expirePendingCheckout(pendingCheckoutId);
    return { ok: false, reason: "not_payable", status };
  }

  return { ok: false, reason: "pending", status };
}

/**
 * Capture / mark paid for an existing Order (legacy or direct order path).
 */
export async function captureAuthorizedTamaraOrder(
  orderId: string,
  opts?: { tamaraCheckoutId?: string; knownStatus?: string }
): Promise<CaptureResult> {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return { ok: false, reason: "order_not_found" };

  if (order.status === OrderStatus.ORDER_CONFIRMED || order.paymentStatus === PaymentStatus.PAID) {
    return { ok: true, alreadyCaptured: true };
  }

  const tamaraId = opts?.tamaraCheckoutId || order.tamaraCheckoutId;
  if (!tamaraId) return { ok: false, reason: "no_tamara_id" };

  const service = new TamaraService();
  let status = opts?.knownStatus?.toLowerCase();

  if (!status) {
    try {
      const orderInfo: any = await service.getOrder(tamaraId);
      status = (orderInfo.status || "").toLowerCase();
    } catch (err: any) {
      console.error(`[Tamara Process] Error fetching Tamara order ${tamaraId}:`, err.message);
      return { ok: false, reason: "tamara_api_error" };
    }
  }

  const isPaidOrAuthorized = status ? [
    "approved",
    "authorised",
    "authorized",
    "captured",
    "fully_captured",
    "order_approved",
    "order_authorised",
    "payment.approved",
    "payment.captured",
  ].includes(status) : false;

  if (isPaidOrAuthorized) {
    await markOrderPaid(order.id);
    await notifyPaymentConfirmed(order.id);
    return { ok: true, captured: true, status: "PAID" };
  }

  return { ok: false, reason: "pending", status };
}
