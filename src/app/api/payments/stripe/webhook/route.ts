import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { verifyStripeWebhook } from "@/services/payments/stripe/payment-service";
import { prisma } from "@/lib/prisma";
import { OrderStatus, PaymentStatus } from "@prisma/client";
import { sendEmail } from "@/lib/email";
import { createAramexShipment } from "@/lib/shipping/aramex";

function generateTrackingCode(): string {
  const prefix = "GL";
  const random = Math.random().toString(36).substring(2, 10).toUpperCase();
  return `${prefix}-${random}-${Date.now().toString().slice(-6)}`;
}

export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get("stripe-signature") || "";

  try {
    const event = await verifyStripeWebhook(body, signature);

    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object as any;
      const orderId = paymentIntent.metadata.orderId;

      if (orderId) {
        console.log(`Payment succeeded for Order ID: ${orderId}. Updating Prisma status...`);
        
        // Fetch order to get shipping info for shipment
        const existingOrder = await prisma.order.findUnique({
          where: { id: orderId },
          include: { user: true }
        });
        
        if (!existingOrder) {
          console.log(`Order ${orderId} not found`);
          return NextResponse.json({ received: true });
        }
        
        const updatedOrder = await prisma.order.update({
          where: { id: orderId },
          data: { 
            status: OrderStatus.ORDER_CONFIRMED,
            paymentStatus: PaymentStatus.PAID,
            paymentMethod: "stripe",
            paymentMethodTitle: "Credit Card (Stripe)",
            stripePaymentIntentId: paymentIntent.id
          },
          include: { 
            user: true, 
            items: true 
          }
        });

        console.log(`Order ${orderId} updated to PAID:`, updatedOrder.paymentStatus);

        // Create shipment for the paid order
        const shippingAddress = updatedOrder.shippingAddress as any;
        const countryCode = shippingAddress?.country || "AE";
        const gulfCountries = ['AE', 'KW', 'SA', 'BH', 'QA', 'OM'];
        const trackingCode = generateTrackingCode();
        
        let aramexResult = null;
        if (gulfCountries.includes(countryCode.toUpperCase())) {
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

        // Create shipment record
        if (aramexResult?.Shipments?.[0]?.ID) {
          await prisma.shipment.create({
            data: {
              orderId: orderId,
              courier: "ARAMEX",
              trackingCode: aramexResult.Shipments[0].ID,
              trackingUrl: `https://www.aramex.com/track/${aramexResult.Shipments[0].ID}`,
              status: "Created"
            }
          });
        } else {
          await prisma.shipment.create({
            data: {
              orderId: orderId,
              courier: "GLOBAL_COURIER",
              trackingCode: trackingCode,
              trackingUrl: `https://global-courier.com/track/${trackingCode}`,
              status: "Created"
            }
          });
        }

        // Send full confirmation email to customer (only if not already sent)
        const customerEmail = updatedOrder.email || updatedOrder.user?.email;
        const shippingAddr = updatedOrder.shippingAddress as any;
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
          const trackingUrl = aramexResult?.Shipments?.[0]?.ID
            ? `https://www.aramex.com/track/${aramexResult.Shipments[0].ID}`
            : `https://global-courier.com/track/${trackingCode}`;

          const itemsHtml = updatedOrder.items.map((item: any) => {
            const itemTotal = (Number(item.unitPrice) * item.quantity).toFixed(2);
            return `
              <tr>
                <td style="padding: 12px 8px; border-bottom: 1px solid #eee;">
                  <div style="font-weight: 500; color: #333;">${item.nameSnapshot || 'Product'}</div>
                </td>
                <td style="padding: 12px 8px; border-bottom: 1px solid #eee; text-align: center; color: #666;">x${item.quantity}</td>
                <td style="padding: 12px 8px; border-bottom: 1px solid #eee; text-align: right; color: #333;">${(updatedOrder.currency || 'aed').toUpperCase()} ${itemTotal}</td>
              </tr>
            `;
          }).join('');

          const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 40px 30px; border-radius: 16px 16px 0 0;">
                <h1 style="color: white; margin: 0 0 10px; font-size: 28px;">Payment Confirmed! ✅</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 0; font-size: 16px;">Your order is confirmed and being processed</p>
              </div>
              <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 16px 16px; border: 1px solid #e9ecef;">
                <p style="color: #495057; font-size: 16px; margin: 0 0 20px;">Hello <strong>${customerName}</strong>,</p>
                <p style="color: #495057; margin: 0 0 24px;">Your payment was successful. We're now preparing your order!</p>

                <div style="background: white; padding: 24px; border-radius: 12px; margin: 0 0 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                    <div>
                      <h2 style="color: #333; margin: 0 0 5px; font-size: 20px;">Order #${updatedOrder.id.substring(0, 8)}</h2>
                      <p style="color: #6c757d; margin: 0; font-size: 13px;">${new Date(updatedOrder.createdAt).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                    <span style="background: #28a745; color: #fff; padding: 8px 16px; border-radius: 20px; font-size: 12px; font-weight: 600;">Paid ✅</span>
                  </div>
                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 13px;">
                    <div style="background: #f8f9fa; padding: 12px; border-radius: 8px;">
                      <span style="color: #6c757d;">Payment Method</span>
                      <div style="color: #333; font-weight: 600;">Credit Card (Stripe)</div>
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
                        <td style="padding: 12px 0 0;">Total Paid</td>
                        <td style="padding: 12px 0 0; text-align: right; color: #28a745;">${(updatedOrder.currency || 'aed').toUpperCase()} ${Number(updatedOrder.total).toFixed(2)}</td>
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
                  <a href="${orderUrl}" style="flex: 1; background: #28a745; color: white; padding: 16px 24px; border-radius: 10px; text-align: center; text-decoration: none; font-weight: 600; font-size: 14px;">📋 View My Order</a>
                  <a href="${trackingUrl}" style="flex: 1; background: #667eea; color: white; padding: 16px 24px; border-radius: 10px; text-align: center; text-decoration: none; font-weight: 600; font-size: 14px;">🚚 Track Order</a>
                </div>

                <p style="color: #6c757d; font-size: 12px; text-align: center; margin: 24px 0 0;">
                  Thank you for shopping with SHANFA GLOBAL! 💚<br>
                  <a href="${DOMAIN}" style="color: #28a745;">shanafaglobal.com</a>
                </p>
              </div>
            </div>
          `;

          await sendEmail({
            to: customerEmail,
            subject: `Payment Confirmed! Order #${updatedOrder.id.substring(0, 8)} | SHANFA`,
            html: emailHtml,
          }).catch(console.error);

          console.log(`[Stripe Webhook] Confirmation email sent to ${customerEmail} for order ${orderId}`);
        } else if (updatedOrder.emailConfirmationSent) {
          console.log(`[Stripe Webhook] Email already sent for order ${orderId}, skipping...`);
        }

        // Send notification to admin (Optional) - always notify admin of payment
        if (process.env.ADMIN_EMAIL) {
          await sendEmail({
            to: process.env.ADMIN_EMAIL,
            subject: `Payment Received - Order #${updatedOrder.id} - ${(updatedOrder.total || 0).toFixed(2)} ${updatedOrder.currency.toUpperCase()}`,
            html: `
              <div style="font-family: Arial, sans-serif; padding: 20px;">
                <h2 style="color: #28a745;">Payment Received! ✅</h2>
                <table style="border-collapse: collapse; width: 100%; max-width: 500px;">
                  <tr><td style="padding: 8px 0; color: #666;">Order ID</td><td style="padding: 8px 0;"><strong>#${updatedOrder.id}</strong></td></tr>
                  <tr><td style="padding: 8px 0; color: #666;">Customer</td><td style="padding: 8px 0;">${customerEmail || 'Guest'}</td></tr>
                  <tr><td style="padding: 8px 0; color: #666;">Amount</td><td style="padding: 8px 0;"><strong style="font-size: 18px; color: #28a745;">${updatedOrder.currency.toUpperCase()} ${(updatedOrder.total || 0).toFixed(2)}</strong></td></tr>
                </table>
                <p style="margin-top: 20px;"><a href="https://shanfa-store.com/ueadmin/orders/${updatedOrder.id}" style="background: #667eea; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none;">View Order →</a></p>
              </div>
            `
          }).catch(console.error);
        }
      }

    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Stripe Webhook Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
