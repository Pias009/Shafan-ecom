import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { captureAuthorizedTabbyOrder, capturePendingTabbyCheckout } from "@/services/payments/tabby";
import { OrderStatus, PaymentStatus } from "@prisma/client";
import { alertLateCronCaptures } from "@/lib/cron-alerts";

const CRON_SECRET = process.env.CRON_SECRET;

/**
 * Retrieve Request fallback (daily via vercel.json crons — the Hobby plan
 * allows one run per day, fired anywhere within the scheduled hour).
 *
 * Covers the corner case where the browser never returns to the success
 * callback (closed tab, network drop) AND the webhook is missed. For each
 * pending Tabby order it calls the Retrieve Request and captures if AUTHORIZED.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 25h: covers the full gap between two daily runs (up to 24h59m with the
  // Hobby ±59 min jitter). Overlap is harmless — captured checkouts leave OPEN.
  const since = new Date(Date.now() - 25 * 60 * 60 * 1000);

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
  const capturedIds: string[] = [];

  for (const pc of pendingCheckouts) {
    try {
      const result = await capturePendingTabbyCheckout(pc.id, {
        paymentId: pc.tabbyPaymentId || undefined,
      });
      if (result.ok && result.captured) capturedIds.push(pc.id);
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
      if (result.ok && result.captured) capturedIds.push(order.id);
      results.push({
        orderId: order.id,
        status: result.ok ? result.status || "ok" : result.reason,
      });
    } catch (err) {
      console.error(`[Tabby Cron] Failed to process order ${order.id}:`, err);
      results.push({ orderId: order.id, status: "error" });
    }
  }

  await alertLateCronCaptures("Tabby", capturedIds);

  return NextResponse.json({
    success: true,
    scanned: pendingCheckouts.length + pendingOrders.length,
    captured: capturedIds.length,
    results,
  });
}
