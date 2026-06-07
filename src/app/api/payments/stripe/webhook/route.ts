import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { verifyStripeWebhook } from "@/services/payments/stripe/payment-service";
import { prisma } from "@/lib/prisma";
import { OrderStatus, PaymentStatus } from "@prisma/client";
import { sendEmail } from "@/lib/email";
import { notifyNewOrder } from "@/lib/pusher";
import { createAramexShipment } from "@/lib/shipping/aramex";

function generateTrackingCode(): string {
  const prefix = "GL";
  const random = Math.random().toString(36).substring(2, 10).toUpperCase();
  return `${prefix}-${random}-${Date.now().toString().slice(-6)}`;
}

export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get("stripe-signature") || "";

  // Step 1 — verify signature. Only this step may return 400.
  let event: Awaited<ReturnType<typeof verifyStripeWebhook>>;
  try {
    event = await verifyStripeWebhook(body, signature);
  } catch (err: any) {
    console.error("[Stripe Webhook] Signature verification failed:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Step 2 — process event. Always return 200 regardless of internal errors.
  try {
    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object as any;
      const orderId = paymentIntent.metadata?.orderId;

      if (!orderId) {
        console.warn("[Stripe Webhook] payment_intent.succeeded missing orderId in metadata");
        return NextResponse.json({ received: true });
      }

      console.log(`[Stripe Webhook] Payment succeeded for order ${orderId}`);

      const existingOrder = await prisma.order.findUnique({
        where: { id: orderId },
        include: { user: true, items: true },
      });

      if (!existingOrder) {
        console.warn(`[Stripe Webhook] Order ${orderId} not found — skipping`);
        return NextResponse.json({ received: true });
      }

      // Idempotency guard — skip if already marked PAID
      if (existingOrder.paymentStatus === PaymentStatus.PAID) {
        console.log(`[Stripe Webhook] Order ${orderId} already PAID — skipping duplicate event`);
        return NextResponse.json({ received: true });
      }

      const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.ORDER_CONFIRMED,
          paymentStatus: PaymentStatus.PAID,
          paymentMethod: "stripe",
          paymentMethodTitle: "Card Payment (Stripe)",
          stripePaymentIntentId: paymentIntent.id,
        },
        include: { user: true, items: true },
      });

      console.log(`[Stripe Webhook] Order ${orderId} updated to PAID`);

      // Create shipment only if one doesn't already exist
      const existingShipment = await prisma.shipment.findUnique({
        where: { orderId },
      }).catch(() => null);

      if (!existingShipment) {
        const shippingAddress = updatedOrder.shippingAddress as any;
        const countryCode = shippingAddress?.country || "AE";
        const gulfCountries = ["AE", "KW", "SA", "BH", "QA", "OM"];
        const trackingCode = generateTrackingCode();
        let aramexResult = null;

        if (gulfCountries.includes(countryCode.toUpperCase())) {
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
            console.error("[Stripe Webhook] Aramex shipment creation failed:", aramexError);
          }
        }

        const shipmentTracking = aramexResult?.Shipments?.[0]?.ID;
        await prisma.shipment.create({
          data: {
            orderId,
            courier: shipmentTracking ? "ARAMEX" : "GLOBAL_COURIER",
            trackingCode: shipmentTracking || trackingCode,
            trackingUrl: shipmentTracking
              ? `https://www.aramex.com/track/${shipmentTracking}`
              : `https://global-courier.com/track/${trackingCode}`,
            status: "Created",
          },
        }).catch((err) => console.error("[Stripe Webhook] Shipment create error:", err));
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
                <h2 style="color:#333;margin:0 0 5px;font-size:20px;">Order #${updatedOrder.id.substring(0, 8)}</h2>
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
              ${addressLines ? `
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
          subject: `Payment Confirmed! Order #${updatedOrder.id.substring(0, 8)} | SHANFA`,
          html: emailHtml,
        }).catch((err) => console.error("[Stripe Webhook] Customer email failed:", err));
      }

      // Admin notification
      await notifyNewOrder({
        id: updatedOrder.id,
        total: Number(updatedOrder.total) ?? 0,
        currency: updatedOrder.currency || "AED",
        userName: customerName || undefined,
        email: customerEmail || undefined,
      }).catch((err) => console.error("[Stripe Webhook] Pusher notification failed:", err));

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
              </table>
              <p style="margin-top:20px;"><a href="https://shanfaglobal.com/ueadmin/orders/${updatedOrder.id}" style="background:#667eea;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;">View Order →</a></p>
            </div>`,
        }).catch((err) => console.error("[Stripe Webhook] Admin email failed:", err));
      }
    }
  } catch (processingError: any) {
    // Log internally but still return 200 so Stripe stops retrying
    console.error("[Stripe Webhook] Processing error:", processingError.message, processingError);
  }

  return NextResponse.json({ received: true });
}
