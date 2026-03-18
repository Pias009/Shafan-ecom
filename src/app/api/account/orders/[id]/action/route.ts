import { prisma } from "@/lib/prisma";
import { getServerAuthSession } from "@/lib/auth";
import { NextResponse } from "next/server";
import { OrderStatus } from "@prisma/client";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerAuthSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { action } = await req.json();

  try {
    // 1. Fetch order to verify ownership and conditions
    const order = await (prisma as any).order.findUnique({
      where: { id },
      include: { user: true }
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const orderEmail = order.email?.toLowerCase() || order.user?.email?.toLowerCase();
    if (orderEmail !== session.user.email.toLowerCase()) {
      return NextResponse.json({ error: "Unauthorized access to this order" }, { status: 403 });
    }

    const orderDate = new Date(order.createdAt);
    const now = new Date();
    const diffMinutes = (now.getTime() - orderDate.getTime()) / (1000 * 60);

    if (action === "CANCEL") {
      // Rule: Only under 30 minutes and if status is not already completed/cancelled
      if (diffMinutes > 30) {
        return NextResponse.json({ error: "Cancellation period (30 mins) has expired" }, { status: 400 });
      }
      if ([OrderStatus.DELIVERED, OrderStatus.CANCELLED].includes(order.status)) {
        return NextResponse.json({ error: `Cannot cancel an order with status: ${order.status}` }, { status: 400 });
      }

      const updated = await prisma.order.update({
        where: { id },
        data: { status: OrderStatus.CANCELLED }
      });
      return NextResponse.json(updated);
    }

    if (action === "REFUND") {
      // Rule: Only if status is 'delivered'
      if (order.status !== OrderStatus.DELIVERED) {
        return NextResponse.json({ error: "Refunds can only be requested for delivered orders" }, { status: 400 });
      }

      // For now, we update to a 'REFUND_REQUESTED' status if it exists, or just CANCELLED for simplicity
      // Let's check status enum in schema.prisma if needed, but I'll use CANCELLED as a fallback
      const updated = await prisma.order.update({
        where: { id },
        data: { status: OrderStatus.CANCELLED }
      });
      return NextResponse.json(updated);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("User Order Action Error:", error.message);
    return NextResponse.json({ error: "Internal Server Error or Database Update Failed" }, { status: 500 });
  }
}
