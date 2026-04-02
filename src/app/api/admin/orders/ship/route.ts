import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";

const COURIER_NAMES: Record<string, string> = {
  naqel: "Naqel Express",
  aramex: "Aramex",
  shanfa: "Shanfa Delivery"
};

export async function POST(req: Request) {
  try {
    const { orderId, courier } = await req.json();

    if (!orderId || !courier) {
      return NextResponse.json({ error: "Missing orderId or courier" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true }
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Generate tracking code
    const trackingCode = `SHF-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // Create shipment record
    const shipment = await prisma.shipment.create({
      data: {
        orderId: order.id,
        courier: COURIER_NAMES[courier] || courier,
        trackingCode,
        trackingUrl: `https://track.${courier}.com/${trackingCode}`,
        status: "Created"
      }
    });

    // Update order status to READY_FOR_PICKUP
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.READY_FOR_PICKUP
      },
      include: { items: true }
    });

    return NextResponse.json({
      success: true,
      message: `Order sent to ${COURIER_NAMES[courier]}`,
      shipment: {
        id: shipment.id,
        courier: shipment.courier,
        trackingCode: shipment.trackingCode,
        trackingUrl: shipment.trackingUrl
      },
      orderStatus: updatedOrder.status
    });

  } catch (error: any) {
    console.error("Ship order error:", error);
    return NextResponse.json({ error: error.message || "Failed to ship order" }, { status: 500 });
  }
}