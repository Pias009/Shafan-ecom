import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { OrderStatus, PaymentStatus } from "@prisma/client";
import { createAramexShipment } from "@/lib/shipping/aramex";
import { sendEmail } from "@/lib/email";

function generateTrackingCode(): string {
  const prefix = "GL";
  const random = Math.random().toString(36).substring(2, 10).toUpperCase();
  return `${prefix}-${random}-${Date.now().toString().slice(-6)}`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true }
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.paymentMethod && order.paymentMethod !== "cod" && order.paymentMethod !== "stripe") {
      return NextResponse.json({ error: "Order already has a payment method" }, { status: 400 });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentMethod: "cod",
        paymentMethodTitle: "Cash on Delivery",
        paymentStatus: PaymentStatus.PENDING,
        status: OrderStatus.ORDER_RECEIVED,
      },
      include: { items: true, shipment: true }
    });

    // Create shipment for COD order
    let trackingCode = generateTrackingCode();
    let trackingUrl = `https://global-courier.com/track/${trackingCode}`;

    try {
      const shippingAddress = updatedOrder.shippingAddress as any;
      const countryCode = shippingAddress?.country || "AE";
      const gulfCountries = ['AE', 'KW', 'SA', 'BH', 'QA', 'OM'];

      let aramexResult = null;
      if (gulfCountries.includes(countryCode?.toUpperCase())) {
        try {
          aramexResult = await createAramexShipment({
            orderId: orderId,
            recipientName: `${shippingAddress?.first_name || ''} ${shippingAddress?.last_name || ''}`.trim() || "Customer",
            recipientPhone: shippingAddress?.phone || "+971048387827",
            recipientEmail: updatedOrder.email || "customer@email.com",
            recipientAddress: shippingAddress?.address_1 || "Address",
            recipientCity: shippingAddress?.city || "City",
            recipientCountry: countryCode,
            productCode: "PDS",
            weight: 0.5,
            description: `SHANFA Order ${orderId}`,
            pieces: updatedOrder.items?.length || 1,
          });
        } catch (aramexError) {
          console.error("Aramex shipment creation failed:", aramexError);
        }
      }

      try {
        if (aramexResult?.Shipments?.[0]?.ID) {
          const awbCode = aramexResult.Shipments[0].ID;
          trackingCode = awbCode;
          trackingUrl = `https://www.aramex.com/track/${awbCode}`;
          await prisma.shipment.create({
            data: {
              orderId: orderId,
              courier: "ARAMEX",
              trackingCode: awbCode,
              trackingUrl,
              status: "Pending"
            }
          });
        } else {
          await prisma.shipment.create({
            data: {
              orderId: orderId,
              courier: "GLOBAL_COURIER",
              trackingCode,
              trackingUrl,
              status: "Pending"
            }
          });
        }
      } catch (shipmentError) {
        console.error("Shipment record creation failed:", shipmentError);
      }
    } catch (shipmentError) {
      console.error("Shipment process failed:", shipmentError);
    }

    // ─── Send confirmation email to customer after COD is confirmed ───────────
    const shippingAddr = updatedOrder.shippingAddress as any;
    const customerEmail = updatedOrder.email || shippingAddr?.email;
    const customerName = shippingAddr?.first_name
      ? `${shippingAddr.first_name} ${shippingAddr.last_name || ''}`.trim()
      : 'Customer';

    if (customerEmail && !updatedOrder.emailConfirmationSent) {
      await prisma.order.update({
        where: { id: orderId },
        data: { emailConfirmationSent: true }
      }).catch(() => {});

      const DOMAIN = 'https://shanafaglobal.com';
      const orderUrl = `${DOMAIN}/account/orders/${updatedOrder.id}`;

      const itemsHtml = updatedOrder.items.map((item: any) => {
        const itemTotal = (Number(item.unitPrice) * item.quantity).toFixed(2);
        return `
          <tr>
            <td style="padding: 12px 8px; border-bottom: 1px solid #eee;">
              <div>
                <div style="font-weight: 500; color: #333;">${item.nameSnapshot || 'Product'}</div>
              </div>
            </td>
            <td style="padding: 12px 8px; border-bottom: 1px solid #eee; text-align: center; color: #666;">x${item.quantity}</td>
            <td style="padding: 12px 8px; border-bottom: 1px solid #eee; text-align: right; color: #333;">${(updatedOrder.currency || 'aed').toUpperCase()} ${itemTotal}</td>
          </tr>
        `;
      }).join('');

      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px 30px; border-radius: 16px 16px 0 0;">
            <h1 style="color: white; margin: 0 0 10px; font-size: 28px;">Order Confirmed! 🎉</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 0; font-size: 16px;">Your Cash on Delivery order has been placed</p>
          </div>

          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 16px 16px; border: 1px solid #e9ecef;">
            <p style="color: #495057; font-size: 16px; margin: 0 0 20px;">Hello <strong>${customerName}</strong>,</p>
            <p style="color: #495057; margin: 0 0 24px;">Thank you for your order! Please have the payment ready upon delivery.</p>

            <div style="background: white; padding: 24px; border-radius: 12px; margin: 0 0 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                <div>
                  <h2 style="color: #333; margin: 0 0 5px; font-size: 20px;">Order #${updatedOrder.id.substring(0, 8)}</h2>
                  <p style="color: #6c757d; margin: 0; font-size: 13px;">${new Date(updatedOrder.createdAt).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
                <span style="background: #ffc107; color: #000; padding: 8px 16px; border-radius: 20px; font-size: 12px; font-weight: 600;">Cash on Delivery</span>
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 13px;">
                <div style="background: #f8f9fa; padding: 12px; border-radius: 8px;">
                  <span style="color: #6c757d;">Payment Method</span>
                  <div style="color: #333; font-weight: 600;">Cash on Delivery</div>
                </div>
                <div style="background: #f8f9fa; padding: 12px; border-radius: 8px;">
                  <span style="color: #6c757d;">Estimated Delivery</span>
                  <div style="color: #333; font-weight: 600;">2-3 business days</div>
                </div>
              </div>
            </div>

            <div style="background: white; padding: 24px; border-radius: 12px; margin: 0 0 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
              <h3 style="color: #333; margin: 0 0 16px; font-size: 16px;">Order Items</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr style="border-bottom: 2px solid #dee2e6;">
                    <th style="padding: 8px; text-align: left; color: #6c757d; font-size: 11px; text-transform: uppercase;">Product</th>
                    <th style="padding: 8px; text-align: center; color: #6c757d; font-size: 11px; text-transform: uppercase;">Qty</th>
                    <th style="padding: 8px; text-align: right; color: #6c757d; font-size: 11px; text-transform: uppercase;">Price</th>
                  </tr>
                </thead>
                <tbody>${itemsHtml}</tbody>
              </table>
              <div style="border-top: 2px solid #dee2e6; margin-top: 16px; padding-top: 16px;">
                <table style="width: 100%;">
                  <tr><td style="padding: 4px 0; color: #6c757d;">Subtotal</td><td style="padding: 4px 0; text-align: right;">${(updatedOrder.currency || 'aed').toUpperCase()} ${Number(updatedOrder.subtotal).toFixed(2)}</td></tr>
                  <tr><td style="padding: 4px 0; color: #6c757d;">Shipping</td><td style="padding: 4px 0; text-align: right;">${(updatedOrder.currency || 'aed').toUpperCase()} ${Number(updatedOrder.shipping).toFixed(2)}</td></tr>
                  <tr style="font-weight: bold; font-size: 18px;">
                    <td style="padding: 12px 0 0;">Total</td>
                    <td style="padding: 12px 0 0; text-align: right; color: #d97706;">${(updatedOrder.currency || 'aed').toUpperCase()} ${Number(updatedOrder.total).toFixed(2)}</td>
                  </tr>
                </table>
              </div>
            </div>

            ${shippingAddr ? `
            <div style="background: white; padding: 24px; border-radius: 12px; margin: 0 0 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
              <h3 style="color: #333; margin: 0 0 12px; font-size: 16px;">Shipping Address</h3>
              <p style="color: #495057; margin: 0; line-height: 1.6;">
                ${shippingAddr.first_name || ''} ${shippingAddr.last_name || ''}<br>
                ${shippingAddr.address_1 || ''}<br>
                ${shippingAddr.city || ''}, ${shippingAddr.country || ''}<br>
                ${shippingAddr.phone ? `📞 ${shippingAddr.phone}` : ''}
              </p>
            </div>` : ''}

            <div style="display: flex; gap: 12px; margin: 24px 0;">
              <a href="${orderUrl}" style="flex: 1; background: #d97706; color: white; padding: 16px 24px; border-radius: 10px; text-align: center; text-decoration: none; font-weight: 600; font-size: 14px;">📋 View My Order</a>
              <a href="${trackingUrl}" style="flex: 1; background: #28a745; color: white; padding: 16px 24px; border-radius: 10px; text-align: center; text-decoration: none; font-weight: 600; font-size: 14px;">🚚 Track Order</a>
            </div>

            <p style="color: #6c757d; font-size: 12px; text-align: center; margin: 24px 0 0;">
              Thank you for shopping with SHANFA GLOBAL!<br>
              <a href="${DOMAIN}" style="color: #d97706;">shanafaglobal.com</a>
            </p>
          </div>
        </div>
      `;

      await sendEmail({
        to: customerEmail,
        subject: `Order Confirmed #${updatedOrder.id.substring(0, 8)} — Cash on Delivery | SHANFA`,
        html: emailHtml,
      }).catch((err) => {
        console.error("[COD Email] Failed to send confirmation:", err);
        prisma.order.update({
          where: { id: orderId },
          data: { emailConfirmationSent: false }
        }).catch(() => {});
      });

      console.log(`[COD Email] Confirmation sent to ${customerEmail} for order ${orderId}`);
    }

    // Notify admin of new COD order
    if (process.env.ADMIN_EMAIL) {
      const adminItemsList = updatedOrder.items.map((item: any) => `${item.nameSnapshot || 'Product'} x${item.quantity}`).join(', ');
      await sendEmail({
        to: process.env.ADMIN_EMAIL,
        subject: `New COD Order #${updatedOrder.id.substring(0, 8)} — ${Number(updatedOrder.total).toFixed(2)} ${(updatedOrder.currency || 'aed').toUpperCase()}`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2 style="color: #d97706;">New Cash on Delivery Order! 💵</h2>
            <table style="border-collapse: collapse; width: 100%; max-width: 500px;">
              <tr><td style="padding: 8px 0; color: #666;">Order ID</td><td style="padding: 8px 0;"><strong>#${updatedOrder.id}</strong></td></tr>
              <tr><td style="padding: 8px 0; color: #666;">Customer</td><td style="padding: 8px 0;">${customerEmail || 'Guest'} — ${customerName}</td></tr>
              <tr><td style="padding: 8px 0; color: #666;">Amount</td><td style="padding: 8px 0;"><strong style="font-size: 18px;">${(updatedOrder.currency || 'aed').toUpperCase()} ${Number(updatedOrder.total).toFixed(2)}</strong></td></tr>
              <tr><td style="padding: 8px 0; color: #666;">Items</td><td style="padding: 8px 0;">${adminItemsList}</td></tr>
            </table>
            <p style="margin-top: 20px;"><a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/ueadmin/orders/${updatedOrder.id}" style="background: #d97706; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none;">View Order →</a></p>
          </div>
        `
      }).catch(console.error);
    }

    return NextResponse.json({
      success: true,
      orderId: updatedOrder.id,
      status: updatedOrder.status,
      paymentMethod: "cod",
      message: "Order placed successfully with Cash on Delivery"
    });

  } catch (error: any) {
    console.error("=== COD Payment Error ===");
    console.error(error);
    const errorMessage = error?.message || "Payment failed. Please try again.";
    return NextResponse.json({ error: errorMessage, details: error.toString() }, { status: 500 });
  }
}
