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

        // Send confirmation email to client
        const customerEmail = updatedOrder.email || updatedOrder.user?.email;
        if (customerEmail) {
          sendEmail({
            to: customerEmail,
            subject: `Order Confirmation #${updatedOrder.id}`,
            html: `
              <h1>Thank you for your order!</h1>
              <p>We've received your payment for order #${updatedOrder.id}.</p>
              <p>Total Paid: ${(updatedOrder.total || 0).toFixed(2)} ${updatedOrder.currency.toUpperCase()}</p>
              <p>We are now processing your order and will ship it soon!</p>
            `
          }).catch(console.error);
        }

        // Send notification to admin (Optional)
        if (process.env.ADMIN_EMAIL) {
          sendEmail({
            to: process.env.ADMIN_EMAIL,
            subject: `New PAID Order - #${updatedOrder.id}`,
            html: `<p>New order paid. Customer: ${customerEmail || 'Guest'}. Amount: ${(updatedOrder.total || 0).toFixed(2)} ${updatedOrder.currency.toUpperCase()}</p>`
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
