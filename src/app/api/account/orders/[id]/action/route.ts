import { prisma } from "@/lib/prisma";
import { getServerAuthSession } from "@/lib/auth";
import { NextResponse } from "next/server";
import { OrderStatus, ReturnStatus } from "@prisma/client";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerAuthSession();
  const { id } = await params;
  const { action, reason, guestEmail } = await req.json();

  try {
    // 1. Fetch order
    const order = await (prisma as any).order.findUnique({
      where: { id },
      include: { user: true }
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // 2. Verify ownership
    const userEmail = session?.user?.email?.toLowerCase() || guestEmail?.toLowerCase();
    const orderEmail = order.email?.toLowerCase() || order.user?.email?.toLowerCase();

    if (!userEmail || userEmail !== orderEmail) {
      return NextResponse.json({ error: "Unauthorized access to this order" }, { status: 403 });
    }

    const orderDate = new Date(order.createdAt);
    const now = new Date();
    const diffMinutes = (now.getTime() - orderDate.getTime()) / (1000 * 60);
    const diffDays = (now.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24);

    if (action === "CANCEL") {
      if ([OrderStatus.DELIVERED, OrderStatus.CANCELLED, OrderStatus.REFUNDED].includes(order.status)) {
        return NextResponse.json({ error: `Cannot cancel an order with status: ${order.status}` }, { status: 400 });
      }

      // Rule: Under 30 minutes -> Auto-approve
      if (diffMinutes <= 30) {
        const updated = await prisma.order.update({
          where: { id },
          data: { 
            status: OrderStatus.CANCELLED,
            cancelReason: reason || "Auto-approved (within 30 mins)",
            cancelRequestedAt: now
          }
        });
        return NextResponse.json({ message: "Order cancelled successfully", order: updated });
      } else {
        // Over 30 minutes -> Request for Admin
        const updated = await prisma.order.update({
          where: { id },
          data: { 
            cancelRequest: true,
            cancelReason: reason || "Customer requested cancellation",
            cancelRequestedAt: now
          }
        });
        return NextResponse.json({ message: "Cancellation request sent to admin", order: updated });
      }
    }

    if (action === "RETURN") {
      // Rule: Only if status is 'delivered' and within 7 days
      if (order.status !== OrderStatus.DELIVERED) {
        return NextResponse.json({ error: "Returns can only be requested for delivered orders" }, { status: 400 });
      }
      
      if (diffDays > 7) {
        return NextResponse.json({ error: "Return period (7 days) has expired" }, { status: 400 });
      }

      const updated = await prisma.order.update({
        where: { id },
        data: { 
          returnRequest: true,
          returnReason: reason || "Customer requested return",
          returnRequestedAt: now,
          returnStatus: ReturnStatus.PENDING
        }
      });
      return NextResponse.json({ message: "Return request sent to admin", order: updated });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("User Order Action Error:", error.message);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
