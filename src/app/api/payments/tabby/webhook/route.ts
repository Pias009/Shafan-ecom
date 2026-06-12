import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { captureAuthorizedTabbyOrder } from "@/services/payments/tabby";

// Tabby uses a custom header for webhook verification (not HMAC).
// The header title is "X-Tabby-Secret" and the value must match TABBY_WEBHOOK_SECRET.
function verifyTabbyHeader(request: NextRequest): boolean {
  const secret = process.env.TABBY_WEBHOOK_SECRET;
  if (!secret) return true; // skip verification if not configured
  const headerValue = request.headers.get("x-tabby-secret") || "";
  return headerValue === secret;
}

export async function POST(request: NextRequest) {
  if (!verifyTabbyHeader(request)) {
    console.warn("[Tabby Webhook] Header verification failed");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rawPayload = await request.text();

  try {
    const body = JSON.parse(rawPayload);
    const eventType = body?.event?.type || body?.type;
    const paymentStatus = body?.payload?.status || body?.status;
    const paymentId = body?.payload?.id || body?.id;
    const orderId = body?.metadata?.order_id || body?.payload?.order_id || body?.payload?.order?.reference_id;

    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { tabbyPaymentId: paymentId },
          { tabbySessionId: paymentId },
          ...(orderId ? [{ id: orderId }] : []),
        ],
      },
    });

    if (!order) {
      return NextResponse.json({ received: true });
    }

    // Webhook payloads use lowercase statuses (e.g. "authorized"); normalise.
    const normalizedStatus = (paymentStatus || "").toUpperCase();

    // Capture is performed server-side via the shared helper — never from the
    // browser success callback. The helper is idempotent and re-verifies status.
    if (eventType === "payment.authorized" || normalizedStatus === "AUTHORIZED") {
      console.log(`[Tabby Webhook] Payment AUTHORIZED for ${order.id}. Verifying + capturing...`);
      // Re-verify via a fresh Retrieve Request before capturing (don't trust the
      // payload status blindly).
      const result = await captureAuthorizedTabbyOrder(order.id, { paymentId });
      if (!result.ok) {
        console.error(`[Tabby Webhook] Capture not completed for ${order.id}:`, result.reason);
      }
    } else if (normalizedStatus === "CAPTURED" || normalizedStatus === "CLOSED") {
      await captureAuthorizedTabbyOrder(order.id, { paymentId, knownStatus: normalizedStatus });
    } else if (normalizedStatus === "REJECTED" || normalizedStatus === "FAILED" || normalizedStatus === "EXPIRED") {
      await prisma.order.update({
        where: { id: order.id },
        data: { paymentStatus: "CANCELLED" as any },
      });
    }

    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ received: true });
  }
}
