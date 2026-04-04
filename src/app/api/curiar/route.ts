import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";

const COURIER_API_KEY = process.env.COURIER_API_KEY || "shafan-courier-secret-2024";

function verifyCourierAuth(req: Request): boolean {
  const apiKey = req.headers.get("x-api-key");
  return apiKey === COURIER_API_KEY;
}

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

// Courier Server API endpoint - requires x-api-key header
export async function PATCH(req: Request) {
  // Verify API key
  if (!verifyCourierAuth(req)) {
    return NextResponse.json({ error: "Unauthorized - invalid API key" }, { status: 401 });
  }
  
  const { orderId, status } = await req.json().catch(() => ({}));

  if (!orderId || !status) {
    return NextResponse.json({ error: "Missing orderId or status" }, { status: 400 });
  }

  const prismaStatus = statusMap[status] || (Object.values(OrderStatus).includes(status as OrderStatus) ? status as OrderStatus : null);

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

// For simulation/testing: get current status - requires API key
export async function GET(req: Request) {
  // Verify API key
  if (!verifyCourierAuth(req)) {
    return NextResponse.json({ error: "Unauthorized - invalid API key" }, { status: 401 });
  }
  
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
