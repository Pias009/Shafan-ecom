import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TabbyService } from "@/services/payments/tabby";
import { OrderStatus, PaymentStatus } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    const payload = await request.text();
    const signature = request.headers.get("x-tabby-signature") || "";

    const tabbyService = new TabbyService();
    const webhookPayload = tabbyService.verifyWebhook(payload, signature);

    console.log("Tabby webhook received:", webhookPayload);

    const eventType = webhookPayload?.event?.type;
    const paymentStatus = webhookPayload?.payload?.status;
    const paymentId = webhookPayload?.payload?.id;
    const orderId = webhookPayload?.payload?.order_id || webhookPayload?.payload?.payment_id;

    if (!orderId) {
      return NextResponse.json({ error: "Order ID not found in webhook" }, { status: 400 });
    }

    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { tabbyPaymentId: paymentId },
          { tabbySessionId: paymentId },
          { id: orderId },
        ],
      },
    });

    if (!order) {
      console.log("Order not found for webhook:", orderId);
      return NextResponse.json({ received: true });
    }

    switch (eventType) {
      case "payment.approved":
      case "payment.authorization":
        if (paymentStatus === "AUTHORIZED") {
          await prisma.order.update({
            where: { id: order.id },
            data: { status: OrderStatus.PROCESSING, paymentStatus: PaymentStatus.PAID },
          });
        }
        break;

      case "payment.captured":
        if (paymentStatus === "CAPTURED") {
          await prisma.order.update({
            where: { id: order.id },
            data: { status: OrderStatus.ORDER_CONFIRMED, paymentStatus: PaymentStatus.PAID },
          });
        }
        break;

      case "payment.declined":
      case "payment.rejected":
        console.log("Tabby payment declined for order:", order.id);
        break;

      case "payment.expired":
        console.log("Tabby payment expired for order:", order.id);
        break;

      case "payment.void":
        await prisma.order.update({
          where: { id: order.id },
          data: { status: "CANCELLED" },
        });
        break;

      default:
        console.log("Unhandled Tabby webhook event:", eventType);
    }

    return NextResponse.json({ received: true });

  } catch (error: any) {
    console.error("Tabby webhook error:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
