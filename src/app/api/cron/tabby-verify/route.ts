import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { captureAuthorizedTabbyOrder, capturePendingTabbyCheckout } from "@/services/payments/tabby";
import { OrderStatus, PaymentStatus } from "@prisma/client";

const CRON_SECRET = process.env.CRON_SECRET;

/**
 * Retrieve Request fallback (runs every 20 minutes via vercel.json crons).
 *
 * Covers the corner case where the browser never returns to the success
 * callback (closed tab, network drop) AND the webhook is missed. For each
 * pending Tabby order it calls the Retrieve Request and captures if AUTHORIZED.
 * A Tabby checkout session expires ~30 minutes after creation, so we only scan a
 * recent window.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Look back far enough to catch a payment authorized just before expiry, but
  // not so far that we keep polling long-dead sessions.
  const since = new Date(Date.now() - 6 * 60 * 60 * 1000); // 6 hours

  // New path — PendingCheckouts not yet promoted to a real Order.
  const pendingCheckouts = await (prisma as any).pendingCheckout.findMany({
    where: {
      paymentMethod: "tabby",
      tabbyPaymentId: { not: null },
      status: "OPEN",
      createdAt: { gte: since },
    },
    select: { id: true, tabbyPaymentId: true },
    take: 100,
  });

  // Legacy path — Orders created up-front before this cutover, still PENDING.
  const pendingOrders = await prisma.order.findMany({
    where: {
      paymentMethod: "tabby",
      tabbyPaymentId: { not: null },
      status: OrderStatus.ORDER_RECEIVED,
      paymentStatus: PaymentStatus.PENDING,
      createdAt: { gte: since },
    },
    select: { id: true, tabbyPaymentId: true },
    take: 100,
  });

  const results: Array<{ orderId: string; status: string }> = [];
  let captured = 0;

  for (const pc of pendingCheckouts) {
    try {
      const result = await capturePendingTabbyCheckout(pc.id, {
        paymentId: pc.tabbyPaymentId || undefined,
      });
      if (result.ok && result.captured) captured += 1;
      results.push({
        orderId: pc.id,
        status: result.ok ? result.status || "ok" : result.reason,
      });
    } catch (err) {
      console.error(`[Tabby Cron] Failed to process pending checkout ${pc.id}:`, err);
      results.push({ orderId: pc.id, status: "error" });
    }
  }

  for (const order of pendingOrders) {
    try {
      const result = await captureAuthorizedTabbyOrder(order.id, {
        paymentId: order.tabbyPaymentId || undefined,
      });
      if (result.ok && result.captured) captured += 1;
      results.push({
        orderId: order.id,
        status: result.ok ? result.status || "ok" : result.reason,
      });
    } catch (err) {
      console.error(`[Tabby Cron] Failed to process order ${order.id}:`, err);
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
