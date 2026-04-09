import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { OrderStatus, PaymentStatus } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const { orderId } = await req.json();

    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true }
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.paymentMethod && order.paymentMethod !== "cod" && order.paymentMethod !== "stripe") {
      return NextResponse.json({ error: "Order already has a payment method" }, { status: 400 });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentMethod: "cod",
        paymentMethodTitle: "Cash on Delivery",
        paymentStatus: PaymentStatus.PENDING,
        status: OrderStatus.ORDER_RECEIVED,
      },
      include: { items: true, shipment: true }
    });

    return NextResponse.json({
      success: true,
      orderId: updatedOrder.id,
      status: updatedOrder.status,
      paymentMethod: "cod",
      message: "Order placed successfully with Cash on Delivery"
    });

  } catch (error: any) {
    console.error("COD Payment Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
