import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { orderId, courier, trackingCode, trackingUrl } = body;

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

    // Use provided tracking code or generate one
    const finalTrackingCode = trackingCode || `SHF-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // Check if shipment already exists
    const existingShipment = await prisma.shipment.findUnique({
      where: { orderId }
    });

    let shipment;
    if (existingShipment) {
      // Update existing shipment
      shipment = await prisma.shipment.update({
        where: { orderId },
        data: {
          courier,
          trackingCode: finalTrackingCode,
          trackingUrl: trackingUrl || `https://track shipments.com/${finalTrackingCode}`,
          status: "Shipped"
        }
      });
    } else {
      // Create new shipment record
      shipment = await prisma.shipment.create({
        data: {
          orderId: order.id,
          courier,
          trackingCode: finalTrackingCode,
          trackingUrl: trackingUrl || `https://track shipments.com/${finalTrackingCode}`,
          status: "Shipped"
        }
      });
    }

    // Update order status to IN_TRANSIT if not already further along
    let newStatus = order.status;
    const canShipToTransit = ['ORDER_RECEIVED', 'ORDER_CONFIRMED', 'PROCESSING', 'READY_FOR_PICKUP'].includes(order.status);
    if (canShipToTransit) {
      const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.IN_TRANSIT },
        include: { items: true }
      });
      newStatus = updatedOrder.status;
    }

    return NextResponse.json({
      success: true,
      message: `Shipment created with ${courier}`,
      shipment: {
        id: shipment.id,
        courier: shipment.courier,
        trackingCode: shipment.trackingCode,
        trackingUrl: shipment.trackingUrl,
        status: shipment.status
      },
      orderStatus: newStatus
    });

  } catch (error: any) {
    console.error("Ship order error:", error);
    return NextResponse.json({ error: error.message || "Failed to create shipment" }, { status: 500 });
  }
}