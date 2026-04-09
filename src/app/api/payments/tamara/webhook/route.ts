import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TamaraService } from "@/services/payments/tamara";
import { OrderStatus, PaymentStatus } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    const payload = await request.text();
    const signature = request.headers.get("x-tamara-signature") || "";

    const tamaraService = new TamaraService();
    const webhookPayload = tamaraService.verifyWebhook(payload, signature);

    console.log("Tamara webhook received:", webhookPayload);

    const eventType = webhookPayload?.eventType;
    const orderId = webhookPayload?.orderId;
    const orderReferenceId = webhookPayload?.orderReferenceId;
    const status = webhookPayload?.status;

    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { tamaraCheckoutId: orderId },
          { id: orderReferenceId },
        ],
      },
    });

    if (!order) {
      console.log("Order not found for Tamara webhook:", orderId);
      return NextResponse.json({ received: true });
    }

    switch (eventType) {
      case "order_approved":
      case "payment.approved":
        await prisma.order.update({
          where: { id: order.id },
          data: { status: OrderStatus.PROCESSING, paymentStatus: PaymentStatus.PAID },
        });
        break;

      case "payment.captured":
        await prisma.order.update({
          where: { id: order.id },
          data: { status: OrderStatus.ORDER_CONFIRMED, paymentStatus: PaymentStatus.PAID },
        });
        break;

      case "payment.declined":
      case "order_declined":
        await prisma.order.update({
          where: { id: order.id },
          data: { paymentStatus: PaymentStatus.CANCELLED },
        });
        console.log("Tamara payment declined for order:", order.id);
        break;

      case "order_cancelled":
        await prisma.order.update({
          where: { id: order.id },
          data: { status: OrderStatus.CANCELLED, paymentStatus: PaymentStatus.CANCELLED },
        });
        break;

      case "payment.refunded":
        await prisma.order.update({
          where: { id: order.id },
          data: { status: OrderStatus.REFUNDED, paymentStatus: PaymentStatus.CANCELLED },
        });
        break;

      default:
        console.log("Unhandled Tamara webhook event:", eventType);
    }

    return NextResponse.json({ received: true });

  } catch (error: any) {
    console.error("Tamara webhook error:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
