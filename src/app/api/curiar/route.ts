import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";

// Map internal statuses if needed, but we should use OrderStatus directly
const statusMap: Record<string, OrderStatus> = {
  "ORDER_RECEIVED": OrderStatus.ORDER_RECEIVED,
  "ORDER_CONFIRMED": OrderStatus.ORDER_CONFIRMED,
  "PROCESSING": OrderStatus.PROCESSING,
  "READY_FOR_PICKUP": OrderStatus.READY_FOR_PICKUP,
  "ORDER_PICKED_UP": OrderStatus.ORDER_PICKED_UP,
  "IN_TRANSIT": OrderStatus.IN_TRANSIT,
  "DELIVERED": OrderStatus.DELIVERED,
  "CANCELLED": OrderStatus.CANCELLED
};

// Courier Server API endpoint
export async function PATCH(req: Request) {
  const { orderId, status } = await req.json().catch(() => ({}));

  if (!orderId || !status) {
    return NextResponse.json({ error: "Missing orderId or status" }, { status: 400 });
  }

  const prismaStatus = statusMap[status] || (Object.values(OrderStatus).includes(status as any) ? status as OrderStatus : null);

  if (!prismaStatus) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  try {
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: prismaStatus,
      },
    });

    return NextResponse.json({ ok: true, order: updatedOrder });
  } catch (error: any) {
    console.error("Prisma Courier API error:", error.message);
    return NextResponse.json({ error: "Order not found or update failed in database" }, { status: 404 });
  }
}

// For simulation/testing: get current status
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("orderId");
    if (!orderId) return NextResponse.json({ error: "Missing orderId" }, { status: 400 });

    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId }
      });
      if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
      return NextResponse.json(order);
    } catch (error) {
      return NextResponse.json({ error: "Failed to fetch order" }, { status: 500 });
    }
}
