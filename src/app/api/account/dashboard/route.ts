import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const orders = await prisma.order.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    const stats = {
      pending: orders.filter(o => o.status === "PENDING_PAYMENT" || o.status === "PROCESSING").length,
      shipped: orders.filter(o => o.status === "SHIPPED").length,
      delivered: orders.filter(o => o.status === "DELIVERED").length,
      refunded: orders.filter(o => o.status === "REFUNDED").length,
    };

    return NextResponse.json({ orders, stats });
  } catch (error) {
    console.error("Dashboard API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
