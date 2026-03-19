import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerAuthSession();
  const isAdmin = session && ["ADMIN", "SUPERADMIN"].includes((session.user as any)?.role);
  if (!session || !isAdmin) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const [usersCount, productsCount, bannersCount, ordersCount, ordersByStatus] = await Promise.all([
      prisma.user.count(),
      prisma.product.count(),
      prisma.offerBanner.count(),
      prisma.order.count(),
      prisma.order.groupBy({
        by: ['status'],
        _count: {
          _all: true
        }
      })
    ]);

    const counts: Record<string, number> = {
      PENDING_PAYMENT: 0,
      PAID: 0,
      PROCESSING: 0,
      SHIPPED: 0,
      DELIVERED: 0,
      CANCELLED: 0,
      REFUNDED: 0,
    };

    ordersByStatus.forEach((item) => {
      if (counts[item.status] !== undefined) {
        counts[item.status] = item._count._all;
      }
    });

    return new Response(
      JSON.stringify({
        users: usersCount,
        products: productsCount,
        banners: bannersCount,
        orders: ordersCount,
        ordersByStatus: counts,
      }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Admin Dashboard Error:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch dashboard data" }), { status: 500 });
  }
}
