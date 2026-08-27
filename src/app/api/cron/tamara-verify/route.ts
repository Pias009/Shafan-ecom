import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { captureAuthorizedTamaraOrder, capturePendingTamaraCheckout } from "@/services/payments/tamara";
import { OrderStatus, PaymentStatus } from "@prisma/client";

const CRON_SECRET = process.env.CRON_SECRET;

/**
 * Tamara Verification Fallback Cron (runs periodically via Vercel Crons).
 *
 * Scans recent pending Tamara checkouts/orders to ensure payments approved on Tamara
 * are captured and promoted even if webhooks were delayed or missed.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const since = new Date(Date.now() - 6 * 60 * 60 * 1000); // 6 hours lookback

  // PendingCheckouts not yet promoted to a real Order
  const pendingCheckouts = await (prisma as any).pendingCheckout.findMany({
    where: {
      paymentMethod: "tamara",
      tamaraCheckoutId: { not: null },
      status: "OPEN",
      createdAt: { gte: since },
    },
    select: { id: true, tamaraCheckoutId: true },
    take: 100,
  });

  // Orders created directly, still PENDING
  const pendingOrders = await prisma.order.findMany({
    where: {
      paymentMethod: "tamara",
      tamaraCheckoutId: { not: null },
      status: OrderStatus.ORDER_RECEIVED,
      paymentStatus: PaymentStatus.PENDING,
      createdAt: { gte: since },
    },
    select: { id: true, tamaraCheckoutId: true },
    take: 100,
  });

  const results: Array<{ orderId: string; status: string }> = [];
  let captured = 0;

  for (const pc of pendingCheckouts) {
    try {
      const result = await capturePendingTamaraCheckout(pc.id, {
        tamaraCheckoutId: pc.tamaraCheckoutId || undefined,
      });
      if (result.ok && result.captured) captured += 1;
      results.push({
        orderId: pc.id,
        status: result.ok ? result.status || "ok" : result.reason,
      });
    } catch (err) {
      console.error(`[Tamara Cron] Failed to process pending checkout ${pc.id}:`, err);
      results.push({ orderId: pc.id, status: "error" });
    }
  }

  for (const order of pendingOrders) {
    try {
      const result = await captureAuthorizedTamaraOrder(order.id, {
        tamaraCheckoutId: order.tamaraCheckoutId || undefined,
      });
      if (result.ok && result.captured) captured += 1;
      results.push({
        orderId: order.id,
        status: result.ok ? result.status || "ok" : result.reason,
      });
    } catch (err) {
      console.error(`[Tamara Cron] Failed to process order ${order.id}:`, err);
      results.push({ orderId: order.id, status: "error" });
    }
  }

  return NextResponse.json({
    success: true,
    scanned: pendingCheckouts.length + pendingOrders.length,
    captured,
    results,
  });
}
