import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminApiSession, getAccessibleStoreIds } from "@/lib/admin-session";

export async function GET() {
  const session = await getAdminApiSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const isSuper = session.user.role === "SUPERADMIN";
    const accessibleStoreIds = await getAccessibleStoreIds();

    const orderWhere: any = {};
    if (!isSuper) {
      orderWhere.OR = [
        { storeId: { in: accessibleStoreIds } },
        { storeId: null }
      ];
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      totalOrders,
      pendingOrders,
      processingOrders,
      deliveredOrders,
      todayOrders,
      allCompletedOrders,
      activeProducts,
      recentOrders
    ] = await Promise.all([
      prisma.order.count({ where: orderWhere }),
      prisma.order.count({ where: { ...orderWhere, status: "PENDING" } }),
      prisma.order.count({ where: { ...orderWhere, status: "PROCESSING" } }),
      prisma.order.count({ where: { ...orderWhere, status: "DELIVERED" } }),
      prisma.order.findMany({
        where: { ...orderWhere, createdAt: { gte: todayStart } },
        select: { total: true, currency: true }
      }),
      prisma.order.findMany({
        where: { ...orderWhere, paymentStatus: "PAID" },
        select: { total: true, currency: true }
      }),
      prisma.product.count({ where: { active: true } }),
      prisma.order.findMany({
        where: orderWhere,
        select: {
          id: true,
          createdAt: true,
          status: true,
          paymentStatus: true,
          currency: true,
          total: true,
          paymentMethod: true,
          paymentMethodTitle: true,
          shippingAddress: true,
          user: { select: { name: true, email: true } },
          items: {
            select: {
              id: true,
              quantity: true,
              unitPrice: true,
              nameSnapshot: true,
              imageSnapshot: true,
            }
          }
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      })
    ]);

    const todayRevenue = todayOrders.reduce((acc, o) => acc + (Number(o.total) || 0), 0);
    const totalRevenue = allCompletedOrders.reduce((acc, o) => acc + (Number(o.total) || 0), 0);

    const formattedRecentOrders = recentOrders.map((o: any) => ({
      id: o.id,
      createdAt: o.createdAt,
      status: o.status,
      paymentStatus: o.paymentStatus,
      currency: o.currency,
      total: o.total,
      paymentMethod: o.paymentMethodTitle || o.paymentMethod,
      customerName: (o.shippingAddress as any)?.fullName || (o.shippingAddress as any)?.first_name || o.user?.name || "Customer",
      customerPhone: (o.shippingAddress as any)?.phone || "",
      itemsCount: o.items?.length || 0,
      items: o.items || []
    }));

    return NextResponse.json({
      metrics: {
        totalOrders,
        pendingOrders,
        processingOrders,
        deliveredOrders,
        todayRevenue: Number(todayRevenue.toFixed(2)),
        totalRevenue: Number(totalRevenue.toFixed(2)),
        activeProducts,
      },
      recentOrders: formattedRecentOrders,
      admin: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        role: session.user.role,
      },
      serverTime: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Mobile dashboard API error:", error);
    return NextResponse.json({ error: error.message || "Failed to load dashboard" }, { status: 500 });
  }
}
