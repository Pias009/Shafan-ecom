import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";

export async function GET() {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const dbOrders = await prisma.order.findMany({
      where: {
        userId: session.user.id
      },
      include: {
        items: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });

    const orders = dbOrders.map((o) => ({
      id: o.id,
      status: o.status.toLowerCase(),
      totalCents: o.totalCents,
      createdAt: o.createdAt.toISOString(),
      items: o.items.map((it) => ({
        name: it.nameSnapshot,
        quantity: it.quantity,
        total: (it.unitPriceCents * it.quantity / 100).toFixed(2),
      }))
    }));

    const stats = {
      pending: dbOrders.filter((o) => o.status === OrderStatus.PENDING_PAYMENT || o.status === OrderStatus.PROCESSING).length,
      shipped: dbOrders.filter((o) => o.status === OrderStatus.SHIPPED).length,
      delivered: dbOrders.filter((o) => o.status === OrderStatus.DELIVERED).length,
      refunded: dbOrders.filter((o) => o.status === OrderStatus.REFUNDED).length,
    };

    return NextResponse.json({ orders, stats });
  } catch (error) {
    console.error("Dashboard API Error:", error);
    return NextResponse.json({ orders: [], stats: { pending: 0, shipped: 0, delivered: 0, refunded: 0 } });
  }
}
