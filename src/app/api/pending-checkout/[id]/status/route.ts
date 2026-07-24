import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Poll target for /checkout/success while waiting for a payment webhook to
// promote a PendingCheckout into a real Order. Returns the order inline once
// CONSUMED, so the client doesn't need a second round-trip.
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const pc = await (prisma as any).pendingCheckout.findUnique({ where: { id } });

    if (!pc) {
      return NextResponse.json({ error: "Pending checkout not found" }, { status: 404 });
    }

    if (pc.status === "CONSUMED" && pc.consumedOrderId) {
      const order = await prisma.order.findUnique({
        where: { id: pc.consumedOrderId },
        include: { items: { include: { product: true } } },
      });
      if (order) {
        return NextResponse.json({ status: "CONSUMED", order });
      }
    }

    if (pc.status === "EXPIRED") {
      return NextResponse.json({ status: "EXPIRED" });
    }

    return NextResponse.json({ status: "OPEN" });
  } catch (error) {
    console.error("Fetch PendingCheckout Status Error:", error);
    return NextResponse.json({ error: "Failed to fetch pending checkout status" }, { status: 500 });
  }
}
