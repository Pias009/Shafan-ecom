import { NextRequest, NextResponse } from "next/server";
import { TamaraService } from "@/services/payments/tamara";
import { TamaraCurrency } from "@/services/payments/tamara/types";
import { getAdminApiSession } from "@/lib/admin-session";
import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const session = await getAdminApiSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orderId, amount, currency, comment } = await req.json();

    if (!orderId || !amount || !currency) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (!order.tamaraCheckoutId) {
      return NextResponse.json({ error: "Order was not paid via Tamara" }, { status: 400 });
    }

    const tamaraService = new TamaraService();
    const result = await tamaraService.refundPayment({
      orderId: order.tamaraCheckoutId,
      totalAmount: {
        amount: amount.toString(),
        currency: currency.toUpperCase() as TamaraCurrency,
      },
      comment: comment || "Refund requested by admin",
    });

    // Update order status to REFUNDED if full refund, or just log if partial
    // For simplicity, we mark as REFUNDED
    await prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.REFUNDED },
    });

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error("Tamara refund route error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
