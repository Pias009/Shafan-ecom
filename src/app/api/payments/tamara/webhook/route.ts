import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { TamaraService } from "@/services/payments/tamara";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const payload = await request.text();
    const signature = request.headers.get("x-tamara-signature") || "";

    const tamaraService = new TamaraService();
    const webhookPayload = tamaraService.verifyWebhook(payload, signature);

    console.log("Tamara webhook received:", webhookPayload);

    const eventType = webhookPayload.eventType;
    const orderId = webhookPayload.orderId;
    const orderReferenceId = webhookPayload.orderReferenceId;
    const status = webhookPayload.status;

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
          data: { status: "PROCESSING" },
        });
        break;

      case "payment.captured":
        await prisma.order.update({
          where: { id: order.id },
          data: { status: "ORDER_CONFIRMED" },
        });
        break;

      case "payment.declined":
      case "order_declined":
        console.log("Tamara payment declined for order:", order.id);
        break;

      case "order_cancelled":
        await prisma.order.update({
          where: { id: order.id },
          data: { status: "CANCELLED" },
        });
        break;

      case "payment.refunded":
        await prisma.order.update({
          where: { id: order.id },
          data: { status: "REFUNDED" },
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
