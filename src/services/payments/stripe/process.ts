import { prisma } from "@/lib/prisma";
import { OrderStatus, PaymentStatus } from "@prisma/client";
import { sendEmail } from "@/lib/email";
import { createAramexShipment } from "@/lib/shipping/aramex";
import { promoteToOrder } from "@/services/checkout/pending-checkout";
import { formatOrderNumber } from "@/lib/order-number";
import { getPickupDetails, renderPickupAdminRow, renderPickupEmailBlock } from "@/lib/pickup";

function generateTrackingCode(): string {
  const prefix = "GL";
  const random = Math.random().toString(36).substring(2, 10).toUpperCase();
  return `${prefix}-${random}-${Date.now().toString().slice(-6)}`;
}

export type StripePaymentSource = "webhook" | "return" | "cron";

/**
 * Turn a confirmed Stripe card payment into a real, PAID Order: promote the
 * PendingCheckout (or update a legacy up-front Order), create the shipment and
 * send the customer/admin emails. Idempotent — safe to call from the webhook,
 * the success-page verify and the reconcile cron for the same payment.
 */
export async function finalizeStripePayment({
  pendingCheckoutId,
  legacyOrderId,
  paymentIntentId,
  source,
}: {
  pendingCheckoutId?: string | null;
  legacyOrderId?: string | null;
  paymentIntentId: string;
  source: StripePaymentSource;
}): Promise<{ orderId: string | null; alreadyProcessed: boolean }> {
  // Legacy = an Order created up-front (no PendingCheckout). The embedded-card
  // flow sets metadata.orderId to the PendingCheckout id too, so a present
  // pendingCheckoutId always wins.
  const isLegacy = !pendingCheckoutId && Boolean(legacyOrderId);
  let orderId: string;

  if (pendingCheckoutId) {
    console.log(`[Stripe] Payment succeeded for pending checkout ${pendingCheckoutId} (via ${source})`);
    const { order, alreadyPromoted } = await promoteToOrder(pendingCheckoutId, {
      paymentStatus: PaymentStatus.PAID,
      status: OrderStatus.ORDER_CONFIRMED,
      paymentMethod: "stripe",
      paymentMethodTitle: "Card Payment (Stripe)",
      stripePaymentIntentId: paymentIntentId,
    });
    // Webhook, return-page verify and cron can all land for one payment —
    // only the call that actually created the Order sends notifications.
    if (alreadyPromoted) return { orderId: order.id, alreadyProcessed: true };
    orderId = order.id;
  } else if (legacyOrderId) {
    orderId = legacyOrderId;
  } else {
    return { orderId: null, alreadyProcessed: false };
  }

  console.log(`[Stripe] Payment succeeded for order ${orderId}`);

  const existingOrder = await prisma.order.findUnique({
    where: { id: orderId },
    include: { user: true, items: true },
  });

  if (!existingOrder) {
    console.warn(`[Stripe] Order ${orderId} not found — skipping`);
    return { orderId: null, alreadyProcessed: false };
  }

  // Idempotency guard — skip if already marked PAID (covers the legacy
  // Order-update path; the PendingCheckout path is already idempotent
  // via promoteToOrder's atomic claim).
  if (isLegacy && existingOrder.paymentStatus === PaymentStatus.PAID) {
    console.log(`[Stripe] Order ${orderId} already PAID — skipping duplicate event`);
    return { orderId, alreadyProcessed: true };
  }

  const updatedOrder = isLegacy
    ? await prisma.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.ORDER_CONFIRMED,
          paymentStatus: PaymentStatus.PAID,
          paymentMethod: "stripe",
          paymentMethodTitle: "Card Payment (Stripe)",
          stripePaymentIntentId: paymentIntentId,
        },
        include: { user: true, items: true },
      })
    : existingOrder;

  console.log(`[Stripe] Order ${orderId} updated to PAID`);

  // Create shipment only if one doesn't already exist
  const existingShipment = await prisma.shipment.findUnique({
    where: { orderId },
  }).catch(() => null);

  if (!existingShipment) {
    const shippingAddress = updatedOrder.shippingAddress as any;
    const countryCode = shippingAddress?.country || "AE";
    const gulfCountries = ["AE", "KW", "SA", "BH", "QA", "OM"];
    const trackingCode = generateTrackingCode();
    const isPickup = Boolean(getPickupDetails(updatedOrder));
    let aramexResult = null;

    if (!isPickup && gulfCountries.includes(countryCode.toUpperCase())) {
      try {
        aramexResult = await createAramexShipment({
          orderId,
          recipientName:
            shippingAddress?.fullName ||
            `${shippingAddress?.first_name || ""} ${shippingAddress?.last_name || ""}`.trim() ||
            "Customer",
          recipientPhone: shippingAddress?.phone || "+971048387827",
          recipientEmail: updatedOrder.email || "customer@email.com",
          recipientAddress:
            shippingAddress?.street_road ||
            shippingAddress?.address_1 ||
            shippingAddress?.address1 ||
            "Address",
          recipientCity:
            shippingAddress?.city_name ||
            shippingAddress?.city ||
            "City",
          recipientCountry: countryCode,
          productCode: "PDS",
          weight: 0.5,
          description: `SHANFA Order ${orderId}`,
          pieces: updatedOrder.items?.length || 1,
        });
      } catch (aramexError) {
        console.error("[Stripe] Aramex shipment creation failed:", aramexError);
      }
    }

    const shipmentTracking = aramexResult?.Shipments?.[0]?.ID;
    await prisma.shipment.create({
      data: {
        orderId,
        courier: isPickup ? "STORE_PICKUP" : shipmentTracking ? "ARAMEX" : "GLOBAL_COURIER",
        trackingCode: shipmentTracking || trackingCode,
        trackingUrl: isPickup
          ? null
          : shipmentTracking
            ? `https://www.aramex.com/track/${shipmentTracking}`
            : `https://global-courier.com/track/${trackingCode}`,
        status: "Created",
      },
    }).catch((err) => console.error("[Stripe] Shipment create error:", err));
  }

  // Send confirmation email (once only)
  const customerEmail = updatedOrder.email || updatedOrder.user?.email;
  const shippingAddr = updatedOrder.shippingAddress as any;
  const customerName =
    shippingAddr?.fullName ||
    (shippingAddr?.first_name
      ? `${shippingAddr.first_name} ${shippingAddr.last_name || ""}`.trim()
      : "Customer");

  if (customerEmail && !updatedOrder.emailConfirmationSent) {
    await prisma.order.update({
      where: { id: orderId },
      data: { emailConfirmationSent: true },
    }).catch(() => {});

    const DOMAIN = "https://shanfaglobal.com";
    const orderUrl = `${DOMAIN}/account/orders/${updatedOrder.id}`;

    const itemsHtml = updatedOrder.items
      .map(
        (item: any) => `
      <tr>
        <td style="padding:12px 8px;border-bottom:1px solid #eee;">
          <div style="font-weight:500;color:#333;">${item.nameSnapshot || "Product"}</div>
        </td>
        <td style="padding:12px 8px;border-bottom:1px solid #eee;text-align:center;color:#666;">x${item.quantity}</td>
        <td style="padding:12px 8px;border-bottom:1px solid #eee;text-align:right;color:#333;">
          ${(updatedOrder.currency || "AED").toUpperCase()} ${(Number(item.unitPrice) * item.quantity).toFixed(2)}
        </td>
      </tr>`
      )
      .join("");

    const addressLines = [
      shippingAddr?.house_building || shippingAddr?.address2,
      shippingAddr?.street_road || shippingAddr?.address1,
      shippingAddr?.block_no ? `Block ${shippingAddr.block_no}` : null,
      shippingAddr?.zone ? `Zone ${shippingAddr.zone}` : null,
      shippingAddr?.area_name,
      shippingAddr?.city_name || shippingAddr?.city,
      shippingAddr?.region,
      shippingAddr?.country,
    ]
      .filter(Boolean)
      .join(", ");

    const pickupDetails = getPickupDetails(updatedOrder);

    const emailHtml = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
        <div style="background:linear-gradient(135deg,#28a745 0%,#20c997 100%);padding:40px 30px;border-radius:16px 16px 0 0;">
          <h1 style="color:white;margin:0 0 10px;font-size:28px;">Payment Confirmed! ✅</h1>
          <p style="color:rgba(255,255,255,0.9);margin:0;font-size:16px;">Your order is confirmed and being processed</p>
        </div>
        <div style="background:#f8f9fa;padding:30px;border-radius:0 0 16px 16px;border:1px solid #e9ecef;">
          <p style="color:#495057;font-size:16px;margin:0 0 20px;">Hello <strong>${customerName}</strong>,</p>
          <p style="color:#495057;margin:0 0 24px;">Your payment was successful. We're now preparing your order!</p>
          <div style="background:white;padding:24px;border-radius:12px;margin:0 0 24px;">
            <h2 style="color:#333;margin:0 0 5px;font-size:20px;">Order ${formatOrderNumber(updatedOrder.id)}</h2>
            <p style="color:#6c757d;margin:0 0 16px;font-size:13px;">${new Date(updatedOrder.createdAt).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
            <table style="width:100%;border-collapse:collapse;">
              <thead>
                <tr style="border-bottom:2px solid #dee2e6;">
                  <th style="padding:8px;text-align:left;color:#6c757d;font-size:11px;text-transform:uppercase;">Product</th>
                  <th style="padding:8px;text-align:center;color:#6c757d;font-size:11px;text-transform:uppercase;">Qty</th>
                  <th style="padding:8px;text-align:right;color:#6c757d;font-size:11px;text-transform:uppercase;">Price</th>
                </tr>
              </thead>
              <tbody>${itemsHtml}</tbody>
            </table>
            <div style="border-top:2px solid #dee2e6;margin-top:16px;padding-top:16px;">
              <table style="width:100%;">
                <tr><td style="padding:4px 0;color:#6c757d;">Subtotal</td><td style="padding:4px 0;text-align:right;">${(updatedOrder.currency || "AED").toUpperCase()} ${Number(updatedOrder.subtotal).toFixed(2)}</td></tr>
                <tr><td style="padding:4px 0;color:#6c757d;">Shipping</td><td style="padding:4px 0;text-align:right;">${(updatedOrder.currency || "AED").toUpperCase()} ${Number(updatedOrder.shipping).toFixed(2)}</td></tr>
                ${updatedOrder.discount ? `<tr><td style="padding:4px 0;color:#28a745;">Discount</td><td style="padding:4px 0;text-align:right;color:#28a745;">-${(updatedOrder.currency || "AED").toUpperCase()} ${Number(updatedOrder.discount).toFixed(2)}</td></tr>` : ""}
                ${updatedOrder.taxAmount ? `<tr><td style="padding:4px 0;color:#6c757d;">VAT</td><td style="padding:4px 0;text-align:right;">${(updatedOrder.currency || "AED").toUpperCase()} ${Number(updatedOrder.taxAmount).toFixed(2)}</td></tr>` : ""}
                <tr style="font-weight:bold;font-size:18px;border-top:2px solid #333;">
                  <td style="padding:12px 0 0;">Total Paid</td>
                  <td style="padding:12px 0 0;text-align:right;color:#28a745;">${(updatedOrder.currency || "AED").toUpperCase()} ${Number(updatedOrder.total).toFixed(2)}</td>
                </tr>
              </table>
            </div>
          </div>
          ${pickupDetails ? renderPickupEmailBlock(pickupDetails) : addressLines ? `
          <div style="background:white;padding:24px;border-radius:12px;margin:0 0 24px;">
            <h3 style="color:#333;margin:0 0 12px;font-size:16px;">Shipping Address</h3>
            <p style="color:#495057;margin:0;line-height:1.6;">${customerName}<br>${addressLines}${shippingAddr?.phone ? `<br>📞 ${shippingAddr.phone}` : ""}</p>
          </div>` : ""}
          <a href="${orderUrl}" style="display:block;background:#28a745;color:white;padding:16px 24px;border-radius:10px;text-align:center;text-decoration:none;font-weight:600;font-size:14px;margin-bottom:24px;">📋 View My Order</a>
          <p style="color:#6c757d;font-size:12px;text-align:center;margin:0;">
            Thank you for shopping with SHANFA GLOBAL! 💚<br>
            <a href="${DOMAIN}" style="color:#28a745;">shanfaglobal.com</a>
          </p>
        </div>
      </div>`;

    await sendEmail({
      to: customerEmail,
      subject: `Payment Confirmed! Order ${formatOrderNumber(updatedOrder.id)} | SHANFA`,
      html: emailHtml,
    }).catch((err) => console.error("[Stripe] Customer email failed:", err));
  }

  // Admin notification
  if (process.env.ADMIN_EMAIL) {
    await sendEmail({
      to: process.env.ADMIN_EMAIL,
      subject: `Payment Received - Order #${updatedOrder.id} - ${(updatedOrder.total || 0).toFixed(2)} ${updatedOrder.currency.toUpperCase()}`,
      html: `
        <div style="font-family:Arial,sans-serif;padding:20px;">
          <h2 style="color:#28a745;">Payment Received! ✅</h2>
          <table style="border-collapse:collapse;width:100%;max-width:500px;">
            <tr><td style="padding:8px 0;color:#666;">Order ID</td><td><strong>#${updatedOrder.id}</strong></td></tr>
            <tr><td style="padding:8px 0;color:#666;">Customer</td><td>${customerEmail || "Guest"}</td></tr>
            <tr><td style="padding:8px 0;color:#666;">Amount</td><td><strong style="font-size:18px;color:#28a745;">${updatedOrder.currency.toUpperCase()} ${(updatedOrder.total || 0).toFixed(2)}</strong></td></tr>
            ${renderPickupAdminRow(updatedOrder)}
          </table>
          <p style="margin-top:20px;"><a href="https://shanfaglobal.com/ueadmin/orders/${updatedOrder.id}" style="background:#667eea;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;">View Order →</a></p>
        </div>`,
    }).catch((err) => console.error("[Stripe] Admin email failed:", err));
  }

  return { orderId, alreadyProcessed: false };
}
