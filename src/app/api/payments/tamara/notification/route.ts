import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { captureAuthorizedTamaraOrder, capturePendingTamaraCheckout } from "@/services/payments/tamara";
import { OrderStatus, PaymentStatus } from "@prisma/client";
import crypto from "crypto";
import { expirePendingCheckout } from "@/services/checkout/pending-checkout";

const NOTIFICATION_KEY_FALLBACK = "b6a80876-6b88-4692-8949-7f34578e3c89";

export async function POST(request: NextRequest) {
  try {
    const payload = await request.text();
    const authHeader = request.headers.get("authorization") || request.headers.get("Authorization");
    const queryToken = request.nextUrl.searchParams.get("tamaraToken");

    let token = "";
    if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
      token = authHeader.substring(7).trim();
    } else if (queryToken) {
      token = queryToken.trim();
    } else if (authHeader) {
      token = authHeader.trim();
    }

    const parts = token.split(".");
    if (parts.length !== 3) {
      console.error("[Tamara Notification] JWT must have 3 parts, got:", parts.length);
      return NextResponse.json({ error: "Invalid Signature" }, { status: 401 });
    }

    const [header, jwtPayload, signature] = parts;
    const dataToSign = `${header}.${jwtPayload}`;
    const notificationKey = (
      process.env.TAMARA_NOTIFICATION_TOKEN ||
      process.env.TAMARA_NOTIFICATION_KEY ||
      NOTIFICATION_KEY_FALLBACK
    ).trim();

    const calculatedSignature = crypto
      .createHmac("sha256", notificationKey)
      .update(dataToSign)
      .digest("base64url");

    const sigBuffer = Buffer.from(signature);
    const calcBuffer = Buffer.from(calculatedSignature);

    let isValid = false;
    if (sigBuffer.length === calcBuffer.length) {
      isValid = crypto.timingSafeEqual(sigBuffer, calcBuffer);
    }

    if (!isValid) {
      console.error("[Tamara Notification] Invalid HS256 signature detected.");
      return NextResponse.json({ error: "Invalid Signature" }, { status: 401 });
    }

    const webhookPayload = JSON.parse(payload) as Record<string, any>;
    console.log("[Tamara Notification] Payload received:", webhookPayload);

    const eventType = (webhookPayload?.event_type ?? webhookPayload?.eventType ?? "").toLowerCase();
    const orderId = webhookPayload?.order_id ?? webhookPayload?.orderId;
    const orderReferenceId = webhookPayload?.order_reference_id ?? webhookPayload?.orderReferenceId;

    const baseOrderId = orderReferenceId?.includes('-') ? orderReferenceId.split('-')[0] : orderReferenceId;
    const isValidObjectId = baseOrderId && /^[0-9a-fA-F]{24}$/.test(baseOrderId);

    // Prefer PendingCheckout
    const pendingCheckout = await (prisma as any).pendingCheckout.findFirst({
      where: {
        OR: [
          { tamaraCheckoutId: orderId },
          ...(isValidObjectId ? [{ id: baseOrderId }] : []),
        ],
      },
    });

    if (pendingCheckout) {
      switch (eventType) {
        case "order_approved":
        case "order_authorised":
        case "order_authorized":
        case "payment.approved":
        case "payment.authorized":
        case "payment.captured": {
          await capturePendingTamaraCheckout(pendingCheckout.id, {
            tamaraCheckoutId: orderId,
            knownStatus: eventType,
          });
          break;
        }

        case "payment.declined":
        case "order_declined":
        case "order_cancelled":
        case "order_canceled":
        case "order_expired": {
          await expirePendingCheckout(pendingCheckout.id);
          break;
        }
      }

      return NextResponse.json({ received: true });
    }

    // Fallback to Order
    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { tamaraCheckoutId: orderId },
          ...(isValidObjectId ? [{ id: baseOrderId }] : []),
        ],
      },
    });

    if (!order) {
      console.warn("[Tamara Notification] Order not found in DB for checkout ID:", orderId, "or ref:", baseOrderId);
      return NextResponse.json({ received: true });
    }

    switch (eventType) {
      case "order_approved":
      case "order_authorised":
      case "order_authorized":
      case "payment.approved":
      case "payment.authorized":
      case "payment.captured": {
        await captureAuthorizedTamaraOrder(order.id, {
          tamaraCheckoutId: orderId,
          knownStatus: eventType,
        });
        break;
      }

      case "payment.declined":
      case "order_declined":
      case "order_cancelled":
      case "order_canceled":
      case "order_expired": {
        await prisma.order.update({
          where: { id: order.id },
          data: { paymentStatus: PaymentStatus.CANCELLED },
        });
        break;
      }

      case "payment.refunded": {
        await prisma.order.update({
          where: { id: order.id },
          data: { status: OrderStatus.REFUNDED, paymentStatus: PaymentStatus.CANCELLED },
        });
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("[Tamara Notification] error:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
