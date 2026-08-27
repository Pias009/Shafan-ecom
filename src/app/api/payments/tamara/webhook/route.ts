import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  TamaraService,
  capturePendingTamaraCheckout,
  captureAuthorizedTamaraOrder,
  notifyPaymentConfirmed,
} from "@/services/payments/tamara";
import { OrderStatus, PaymentStatus } from "@prisma/client";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { expirePendingCheckout } from "@/services/checkout/pending-checkout";

const NOTIFICATION_KEY_FALLBACK = "b6a80876-6b88-4692-8949-7f34578e3c89";

export async function POST(request: NextRequest) {
  try {
    const payload = await request.text();

    let token = "";
    const authHeader = request.headers.get("authorization") || request.headers.get("Authorization");
    if (authHeader) {
      if (authHeader.toLowerCase().startsWith("bearer ")) {
        token = authHeader.substring(7).trim();
      } else {
        token = authHeader.trim();
      }
    }
    if (!token) {
      const { searchParams } = new URL(request.url);
      token = searchParams.get("tamaraToken") || searchParams.get("token") || "";
    }
    if (!token) {
      console.error("[Tamara Webhook] Missing Authorization header/token");
      return NextResponse.json({ error: "Missing Authorization" }, { status: 401 });
    }

    const notificationKey = (
      process.env.TAMARA_NOTIFICATION_TOKEN ||
      process.env.TAMARA_NOTIFICATION_KEY ||
      NOTIFICATION_KEY_FALLBACK
    ).trim();

    let decoded: any = null;

    // 1. Standard JWT verify
    try {
      decoded = jwt.verify(token, notificationKey, {
        algorithms: ["HS256"],
        ignoreExpiration: true,
      });
    } catch (jwtErr: any) {
      console.warn("[Tamara Webhook] Standard JWT verify notice:", jwtErr.message);
    }

    // 2. Fallback manual HMAC-SHA256 comparison if jwt.verify failed
    if (!decoded) {
      try {
        const parts = token.split(".");
        if (parts.length === 3) {
          const [header, jwtPayload, sig] = parts;
          const calculatedSig = crypto
            .createHmac("sha256", notificationKey)
            .update(`${header}.${jwtPayload}`)
            .digest("base64url");

          const sigBuf = Buffer.from(sig);
          const calcBuf = Buffer.from(calculatedSig);

          if (sigBuf.length === calcBuf.length && crypto.timingSafeEqual(sigBuf, calcBuf)) {
            decoded = JSON.parse(Buffer.from(jwtPayload, "base64url").toString());
          }
        }
      } catch (fallbackErr: any) {
        console.error("[Tamara Webhook] Manual signature verification error:", fallbackErr.message);
      }
    }

    if (!decoded) {
      console.error("[Tamara Webhook] Signature verification failed.");
      return NextResponse.json({ error: "Invalid Signature" }, { status: 401 });
    }

    console.log("[Tamara Webhook] Signature verified successfully.");

    const webhookPayload = JSON.parse(payload) as Record<string, any>;
    console.log("[Tamara Webhook] Payload:", webhookPayload);

    const eventType = (webhookPayload?.event_type ?? webhookPayload?.eventType ?? "").toLowerCase();
    const orderId = webhookPayload?.order_id ?? webhookPayload?.orderId;
    const orderReferenceId = webhookPayload?.order_reference_id ?? webhookPayload?.orderReferenceId;

    const baseOrderId = orderReferenceId?.includes("-") ? orderReferenceId.split("-")[0] : orderReferenceId;
    const isValidObjectId = baseOrderId && /^[0-9a-fA-F]{24}$/.test(baseOrderId);

    // Prefer PendingCheckout first
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
          console.log(`[Tamara Webhook] Processing payment approval for PendingCheckout ${pendingCheckout.id}...`);
          const result = await capturePendingTamaraCheckout(pendingCheckout.id, {
            tamaraCheckoutId: orderId,
            knownStatus: eventType,
          });
          console.log(`[Tamara Webhook] Promotion result:`, result);
          break;
        }

        case "payment.declined":
        case "order_declined":
        case "order_cancelled":
        case "order_canceled":
        case "order_expired": {
          console.log(`[Tamara Webhook] Expiring PendingCheckout ${pendingCheckout.id} due to ${eventType}`);
          await expirePendingCheckout(pendingCheckout.id);
          break;
        }

        default:
          console.log(`[Tamara Webhook] Unhandled event: ${eventType}`);
      }

      return NextResponse.json({ received: true });
    }

    // Fallback to existing Order
    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { tamaraCheckoutId: orderId },
          ...(isValidObjectId ? [{ id: baseOrderId }] : []),
        ],
      },
    });

    if (!order) {
      console.warn("[Tamara Webhook] Neither PendingCheckout nor Order found for orderId:", orderId, "ref:", baseOrderId);
      return NextResponse.json({ received: true });
    }

    switch (eventType) {
      case "order_approved":
      case "order_authorised":
      case "order_authorized":
      case "payment.approved":
      case "payment.authorized":
      case "payment.captured": {
        const result = await captureAuthorizedTamaraOrder(order.id, {
          tamaraCheckoutId: orderId,
          knownStatus: eventType,
        });
        console.log(`[Tamara Webhook] Order update result:`, result);
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

      default:
        console.log(`[Tamara Webhook] Unhandled event for Order: ${eventType}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("[Tamara Webhook] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
