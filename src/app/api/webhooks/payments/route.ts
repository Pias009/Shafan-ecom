import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TabbyService } from "@/services/payments/tabby";
import { TamaraService } from "@/services/payments/tamara";
import { OrderStatus, PaymentStatus } from "@prisma/client";
import { createShipmentForOrder } from "@/services/shipping/order-shipment";

export async function POST(request: NextRequest) {
  const tabbySignature = request.headers.get("x-tabby-signature");
  const tamaraSignature = request.headers.get("x-tamara-signature");

  const payload = await request.text();

  try {
    if (tabbySignature) {
      return handleTabbyWebhook(payload, tabbySignature);
    } else if (tamaraSignature) {
      return handleTamaraWebhook(payload, tamaraSignature);
    } else {
      return NextResponse.json({ error: "Unknown payment provider" }, { status: 400 });
    }
  } catch (error: any) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

async function handleTabbyWebhook(payload: string, signature: string) {
  const tabbyService = new TabbyService();
  const webhookPayload = tabbyService.verifyWebhook(payload, signature);
  
  const eventType = webhookPayload?.event?.type;
  const paymentStatus = webhookPayload?.payload?.status;
  const paymentId = webhookPayload?.payload?.id;
  const orderId = webhookPayload?.payload?.order_id || webhookPayload?.payload?.payment_id;

  if (!orderId) return NextResponse.json({ received: true });

  const order = await prisma.order.findFirst({
    where: {
      OR: [{ tabbyPaymentId: paymentId }, { tabbySessionId: paymentId }, { id: orderId }],
    },
  });

  if (!order) return NextResponse.json({ received: true });

  if (eventType === "payment.captured" && paymentStatus === "CAPTURED") {
    await prisma.order.update({
      where: { id: order.id },
      data: { status: OrderStatus.ORDER_CONFIRMED, paymentStatus: PaymentStatus.PAID },
    });
    
    // Trigger Naqel Shipment ONLY AFTER CAPTURE
    try {
      await createShipmentForOrder(order.id);
    } catch (e) {
      console.error("Failed to create Naqel shipment for order:", order.id, e);
    }
  } else if (eventType === "payment.approved" || eventType === "payment.authorization") {
    if (paymentStatus === "AUTHORIZED") {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: OrderStatus.PROCESSING, paymentStatus: PaymentStatus.PAID },
      });
    }
  }

  return NextResponse.json({ received: true });
}

async function handleTamaraWebhook(payload: string, signature: string) {
  const tamaraService = new TamaraService();
  tamaraService.verifyWebhook(payload, signature); // validates signature

  // Parse raw JSON payload to extract event data
  const webhookPayload = JSON.parse(payload) as Record<string, any>;
  
  const eventType = webhookPayload?.event_type ?? webhookPayload?.eventType;
  const tamaraOrderId = webhookPayload?.order_id ?? webhookPayload?.orderId;
  const orderReferenceId = webhookPayload?.order_reference_id ?? webhookPayload?.orderReferenceId;

  const order = await prisma.order.findFirst({
    where: {
      OR: [{ tamaraCheckoutId: tamaraOrderId }, { id: orderReferenceId }],
    },
  });

  if (!order) return NextResponse.json({ received: true });

  if (eventType === "payment.captured") {
    await prisma.order.update({
      where: { id: order.id },
      data: { status: OrderStatus.ORDER_CONFIRMED, paymentStatus: PaymentStatus.PAID },
    });

    // Trigger Naqel Shipment ONLY AFTER CAPTURE
    try {
      await createShipmentForOrder(order.id);
    } catch (e) {
      console.error("Failed to create Naqel shipment for order:", order.id, e);
    }
  } else if (eventType === "order_approved" || eventType === "payment.approved") {
    await prisma.order.update({
      where: { id: order.id },
      data: { status: OrderStatus.PROCESSING, paymentStatus: PaymentStatus.PAID },
    });
  }

  return NextResponse.json({ received: true });
}
