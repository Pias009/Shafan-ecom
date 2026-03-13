import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Mocking a Courier Server API endpoint
// This would be called by the external courier service to update order statuses
export async function PATCH(req: Request) {
  const { orderId, status } = await req.json().catch(() => ({}));

  if (!orderId || !status) {
    return NextResponse.json({ error: "Missing orderId or status" }, { status: 400 });
  }

  // Validate status
  const validStatuses = ["PENDING_PAYMENT", "PROCESSING", "SHIPPED", "DELIVERED", "REFUNDED", "CANCELLED"];
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  try {
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status },
    });

    return NextResponse.json({ ok: true, order: updatedOrder });
  } catch (error) {
    console.error("Courier API error:", error);
    return NextResponse.json({ error: "Order not found or update failed" }, { status: 404 });
  }
}

// For simulation/testing: get current status
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("orderId");
    if (!orderId) return NextResponse.json({ error: "Missing orderId" }, { status: 400 });

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    return NextResponse.json(order);
}
