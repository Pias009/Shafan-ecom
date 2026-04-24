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

        // Send confirmation email to client (only if not already sent)
        const customerEmail = updatedOrder.email || updatedOrder.user?.email;
        if (customerEmail && !updatedOrder.emailConfirmationSent) {
          // Mark as sent first
          await prisma.order.update({
            where: { id: orderId },
            data: { emailConfirmationSent: true }
          }).catch(() => {});
          
          const orderUrl = `https://shanfa-store.com/account/orders/${updatedOrder.id}`;
          const trackingUrl = `https://global-courier.com/track/${trackingCode}`;
          
          await sendEmail({
            to: customerEmail,
            subject: `Payment Confirmed! Order #${updatedOrder.id} - SHANFA`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 40px 30px; border-radius: 16px 16px 0 0; text-align: center;">
                  <h1 style="color: white; margin: 0 0 10px; font-size: 28px;">Payment Confirmed! ✅</h1>
                  <p style="color: rgba(255,255,255,0.9); margin: 0; font-size: 16px;">Your payment has been received</p>
                </div>
                <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 16px 16px; border: 1px solid #e9ecef;">
                  <h2 style="color: #333; margin: 0 0 20px;">Order #${updatedOrder.id}</h2>
                  <div style="background: white; padding: 20px; border-radius: 12px; margin: 0 0 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
                    <p style="color: #495057; margin: 0;"><strong>Total Paid:</strong> <span style="font-size: 24px; color: #28a745;">${updatedOrder.currency.toUpperCase()} ${(updatedOrder.total || 0).toFixed(2)}</span></p>
                    <p style="color: #6c757d; margin: 10px 0 0; font-size: 13px;">Payment confirmed. We're now processing your order!</p>
                  </div>
                  <div style="display: flex; gap: 12px;">
                    <a href="${orderUrl}" style="flex: 1; background: #28a745; color: white; padding: 16px 24px; border-radius: 10px; text-align: center; text-decoration: none; font-weight: 600;">📋 View Order</a>
                    <a href="${trackingUrl}" style="flex: 1; background: #667eea; color: white; padding: 16px 24px; border-radius: 10px; text-align: center; text-decoration: none; font-weight: 600;">🚚 Track Order</a>
                  </div>
                  <p style="color: #6c757d; font-size: 12px; text-align: center; margin: 24px 0 0;">Thank you for shopping with SHANFA! 💚</p>
                </div>
              </div>
            `
          }).catch(console.error);
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
