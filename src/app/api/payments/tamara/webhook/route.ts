import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TamaraService } from "@/services/payments/tamara";
import { OrderStatus, PaymentStatus } from "@prisma/client";
import { notifyNewOrder } from "@/lib/pusher";
import { sendEmail } from "@/lib/email";
import jwt from "jsonwebtoken";
import { promoteToOrder, expirePendingCheckout } from "@/services/checkout/pending-checkout";

const NOTIFICATION_KEY_FALLBACK = "b6a80876-6b88-4692-8949-7f34578e3c89";

async function notifyTamaraOrderConfirmed(orderId: string, eventType: string) {
  const updatedOrder = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!updatedOrder) return;

  const shippingAddress = updatedOrder.shippingAddress as any;
  const customerName = shippingAddress?.first_name
    ? `${shippingAddress.first_name} ${shippingAddress.last_name || ""}`
    : "Customer";

  await notifyNewOrder({
    id: updatedOrder.id,
    total: updatedOrder.total ?? 0,
    currency: updatedOrder.currency,
    userName: customerName,
    email: updatedOrder.email || undefined,
  }).catch((err) => console.error("Pusher notification failed:", err));

  if (process.env.ADMIN_EMAIL) {
    const adminItemsList = updatedOrder.items
      .map((item: any) => `${item.nameSnapshot || "Product"} x${item.quantity}`)
      .join(", ");

    await sendEmail({
      to: process.env.ADMIN_EMAIL,
      subject: `✅ Tamara Payment Confirmed — Order #${updatedOrder.id} — ${updatedOrder.currency.toUpperCase()} ${updatedOrder.total?.toFixed(2)}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #333;">✅ Payment Confirmed via Tamara!</h2>
          <table style="border-collapse: collapse; width: 100%; max-width: 500px;">
            <tr><td style="padding: 8px 0; color: #666;">Order ID</td><td style="padding: 8px 0;"><strong>#${updatedOrder.id}</strong></td></tr>
            <tr><td style="padding: 8px 0; color: #666;">Customer</td><td style="padding: 8px 0;">${updatedOrder.email || customerName}</td></tr>
            <tr><td style="padding: 8px 0; color: #666;">Amount</td><td style="padding: 8px 0;"><strong style="font-size: 18px;">${updatedOrder.currency.toUpperCase()} ${updatedOrder.total?.toFixed(2)}</strong></td></tr>
            <tr><td style="padding: 8px 0; color: #666;">Payment</td><td style="padding: 8px 0;">Tamara (${eventType})</td></tr>
            <tr><td style="padding: 8px 0; color: #666;">Items</td><td style="padding: 8px 0;">${adminItemsList}</td></tr>
          </table>
          <p style="margin-top: 20px;"><a href="${process.env.NEXTAUTH_URL || "https://www.shanfaglobal.com"}/ueadmin/orders/${updatedOrder.id}" style="background: #667eea; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none;">View Order</a></p>
        </div>
      `,
    }).catch(console.error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.text();

    let token = "";
    const authHeader = request.headers.get("authorization") || request.headers.get("Authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }
    if (!token) {
      const { searchParams } = new URL(request.url);
      token = searchParams.get("tamaraToken") || "";
    }
    if (!token) {
      console.error("[Tamara Webhook] Missing Authorization");
      return NextResponse.json({ error: "Missing Authorization" }, { status: 401 });
    }

    const notificationKey = (
      process.env.TAMARA_NOTIFICATION_TOKEN ||
      process.env.TAMARA_NOTIFICATION_KEY ||
      NOTIFICATION_KEY_FALLBACK
    ).trim();

    let decoded: any;
    try {
      decoded = jwt.verify(token, notificationKey, { algorithms: ["HS256"] });
    } catch (jwtErr: any) {
      console.error("[Tamara Webhook] JWT verification failed:", jwtErr.message);
      return NextResponse.json({ error: "Invalid Signature" }, { status: 401 });
    }

    console.log("[Tamara Webhook] Signature verified.");

    const webhookPayload = JSON.parse(payload) as Record<string, any>;
    console.log("[Tamara Webhook] Payload:", webhookPayload);

    const eventType = webhookPayload?.event_type ?? webhookPayload?.eventType;
    const orderId = webhookPayload?.order_id ?? webhookPayload?.orderId;
    const orderReferenceId = webhookPayload?.order_reference_id ?? webhookPayload?.orderReferenceId;

    const baseOrderId = orderReferenceId?.includes("-") ? orderReferenceId.split("-")[0] : orderReferenceId;
    const isValidObjectId = baseOrderId && /^[0-9a-fA-F]{24}$/.test(baseOrderId);

    // Prefer the new PendingCheckout path (order not yet created).
    const pendingCheckout = await (prisma as any).pendingCheckout.findFirst({
      where: {
        OR: [
          { tamaraCheckoutId: orderId },
          ...(isValidObjectId ? [{ id: baseOrderId }] : []),
        ],
      },
    });

    let paymentConfirmed = false;
    let confirmedOrderId: string | null = null;

    if (pendingCheckout) {
      const tamaraService = new TamaraService();

      switch (eventType) {
        case "order_approved":
        case "payment.approved":
          try {
            if (pendingCheckout.status !== "OPEN") {
              console.log(`[Tamara Webhook] Pending checkout ${pendingCheckout.id} already processed. Skipping.`);
              break;
            }

            console.log(`[Tamara Webhook] Step 1: Authorising order ${orderId}...`);
            const authResult = await tamaraService.authoriseOrder(orderId);
            console.log(`[Tamara Webhook] Authorise success:`, authResult);

            console.log(`[Tamara Webhook] Step 2: Capturing payment for order ${orderId}...`);
            const decimals = ["BHD", "KWD", "OMR"].includes(pendingCheckout.currency.toUpperCase()) ? 3 : 2;
            const formattedTotal = Number(pendingCheckout.total || 0).toFixed(decimals);
            const pcItems = (pendingCheckout.items as any[]) || [];

            const captureItems = pcItems.map((item: any) => {
              const itemTotal = (Number(item.unitPrice || 0) * item.quantity).toFixed(decimals);
              return {
                name: item.nameSnapshot || "Product",
                quantity: item.quantity,
                reference_id: item.productId,
                sku: item.productId,
                unit_price: {
                  amount: Number(item.unitPrice || 0).toFixed(decimals),
                  currency: pendingCheckout.currency.toUpperCase() as any,
                },
                total_amount: {
                  amount: itemTotal,
                  currency: pendingCheckout.currency.toUpperCase() as any,
                },
                type: "Physical",
              };
            });

            await tamaraService.capturePayment({
              orderId: orderId,
              totalAmount: {
                amount: formattedTotal,
                currency: pendingCheckout.currency.toUpperCase() as any,
              },
              shippingInfo: {
                shipping_company: "Standard Delivery",
                tracking_number: orderId,
              },
              items: captureItems,
            });

            console.log(`[Tamara Webhook] Step 3: Promoting pending checkout ${pendingCheckout.id} to a real order...`);
            const { order: promoted } = await promoteToOrder(pendingCheckout.id, {
              paymentStatus: PaymentStatus.PAID,
              status: OrderStatus.ORDER_CONFIRMED,
              paymentMethod: "tamara",
              tamaraCheckoutId: orderId,
            });
            paymentConfirmed = true;
            confirmedOrderId = promoted.id;
          } catch (pipelineErr: any) {
            console.error(`[Tamara Webhook] Authorise/capture pipeline failed for ${orderId}:`, pipelineErr);
            paymentConfirmed = false;
          }
          break;

        case "payment.captured": {
          if (pendingCheckout.status !== "OPEN") {
            console.log(`[Tamara Webhook] Pending checkout ${pendingCheckout.id} already processed. Skipping.`);
            break;
          }
          const { order: promoted } = await promoteToOrder(pendingCheckout.id, {
            paymentStatus: PaymentStatus.PAID,
            status: OrderStatus.ORDER_CONFIRMED,
            paymentMethod: "tamara",
            tamaraCheckoutId: orderId,
          });
          paymentConfirmed = true;
          confirmedOrderId = promoted.id;
          break;
        }

        case "payment.declined":
        case "order_declined":
        case "order_cancelled":
          await expirePendingCheckout(pendingCheckout.id);
          break;

        case "payment.refunded":
          // A refund on a PendingCheckout that was never promoted is a no-op —
          // there is no Order to refund yet.
          break;

        default:
          console.log("[Tamara Webhook] Unhandled event:", eventType);
      }

      if (paymentConfirmed && confirmedOrderId) {
        await notifyTamaraOrderConfirmed(confirmedOrderId, eventType);
      }

      return NextResponse.json({ received: true });
    }

    // Fall back to a legacy/already-promoted Order (idempotent replay, or an
    // in-flight checkout from before this cutover).
    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { tamaraCheckoutId: orderId },
          ...(isValidObjectId ? [{ id: baseOrderId }] : []),
        ],
      },
      include: { items: true },
    });

    if (!order) {
      console.warn("[Tamara Webhook] Order not found for checkout ID:", orderId, "ref:", baseOrderId);
      return NextResponse.json({ received: true });
    }

    const tamaraService = new TamaraService();

    switch (eventType) {
      case "order_approved":
      case "payment.approved":
        try {
          if (order.paymentStatus === PaymentStatus.PAID || order.status === OrderStatus.ORDER_CONFIRMED) {
            console.log(`[Tamara Webhook] Order ${order.id} already paid. Skipping.`);
            paymentConfirmed = false;
            break;
          }

          console.log(`[Tamara Webhook] Step 1: Authorising order ${orderId}...`);
          const authResult = await tamaraService.authoriseOrder(orderId);
          console.log(`[Tamara Webhook] Authorise success:`, authResult);

          console.log(`[Tamara Webhook] Step 2: Capturing payment for order ${orderId}...`);
          const decimals = ["BHD", "KWD", "OMR"].includes(order.currency.toUpperCase()) ? 3 : 2;
          const formattedTotal = Number(order.total || 0).toFixed(decimals);

          const captureItems = order.items.map((item: any) => {
            const itemTotal = (Number(item.unitPrice || 0) * item.quantity).toFixed(decimals);
            return {
              name: item.nameSnapshot || "Product",
              quantity: item.quantity,
              reference_id: item.productId,
              sku: item.productId,
              unit_price: {
                amount: Number(item.unitPrice || 0).toFixed(decimals),
                currency: order.currency.toUpperCase() as any,
              },
              total_amount: {
                amount: itemTotal,
                currency: order.currency.toUpperCase() as any,
              },
              type: "Physical",
            };
          });

          await tamaraService.capturePayment({
            orderId: orderId,
            totalAmount: {
              amount: formattedTotal,
              currency: order.currency.toUpperCase() as any,
            },
            shippingInfo: {
              shipping_company: "Standard Delivery",
              tracking_number: orderId,
            },
            items: captureItems,
          });

          console.log(`[Tamara Webhook] Step 3: Updating DB for order ${order.id}...`);
          await prisma.order.update({
            where: { id: order.id },
            data: { status: OrderStatus.ORDER_CONFIRMED, paymentStatus: PaymentStatus.PAID },
          });
          paymentConfirmed = true;
          confirmedOrderId = order.id;
        } catch (pipelineErr: any) {
          console.error(`[Tamara Webhook] Authorise/capture pipeline failed for ${orderId}:`, pipelineErr);
          paymentConfirmed = false;
        }
        break;

      case "payment.captured":
        if (order.paymentStatus === PaymentStatus.PAID || order.status === OrderStatus.ORDER_CONFIRMED) {
          console.log(`[Tamara Webhook] Order ${order.id} already paid. Skipping.`);
          paymentConfirmed = false;
          break;
        }
        await prisma.order.update({
          where: { id: order.id },
          data: { status: OrderStatus.ORDER_CONFIRMED, paymentStatus: PaymentStatus.PAID },
        });
        paymentConfirmed = true;
        confirmedOrderId = order.id;
        break;

      case "payment.declined":
      case "order_declined":
        await prisma.order.update({
          where: { id: order.id },
          data: { paymentStatus: PaymentStatus.CANCELLED },
        });
        break;

      case "order_cancelled":
        await prisma.order.update({
          where: { id: order.id },
          data: { paymentStatus: PaymentStatus.CANCELLED },
        });
        break;

      case "payment.refunded":
        await prisma.order.update({
          where: { id: order.id },
          data: { status: OrderStatus.REFUNDED, paymentStatus: PaymentStatus.CANCELLED },
        });
        break;

      default:
        console.log("[Tamara Webhook] Unhandled event:", eventType);
    }

    if (paymentConfirmed && confirmedOrderId) {
      await notifyTamaraOrderConfirmed(confirmedOrderId, eventType);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("[Tamara Webhook] error:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
