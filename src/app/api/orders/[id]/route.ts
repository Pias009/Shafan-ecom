import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerAuthSession();

  try {
    const { id } = await params;
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Allow unauthenticated access for pending payment orders (checkout flow)
    // Only require auth if user is logged in AND trying to access someone else's order
    if (session?.user?.id && order.userId && order.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized access to order" }, { status: 403 });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("Fetch Order Error:", error);
    return NextResponse.json({ error: "Failed to fetch order details" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { status } = await req.json();

    if (status !== 'CANCELLED') {
      return NextResponse.json({ error: "Only cancellation is allowed via this endpoint" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status: 'CANCELLED' as any },
    });

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error("Update Order Error:", error);
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}
