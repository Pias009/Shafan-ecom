import { getAdminApiSession } from "@/lib/admin-session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getAdminApiSession();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    // Get all completed/delivered orders for revenue calculation (always in AED)
    const revenueOrders = await prisma.order.findMany({
      where: {
        status: {
          in: ['DELIVERED', 'ORDER_CONFIRMED', 'PROCESSING', 'READY_FOR_PICKUP', 'ORDER_PICKED_UP', 'IN_TRANSIT']
        }
      },
      select: {
        total: true,
        currency: true
      }
    });

    // Calculate revenue in AED (convert from different currencies if needed)
    let totalRevenueAED = 0;
    const conversionRates: Record<string, number> = {
      'AED': 1,
      'USD': 3.67,
      'SAR': 0.98,
      'KWD': 12.0,
      'BHD': 9.75,
      'QAR': 1.01,
      'OMR': 9.55,
    };

    revenueOrders.forEach(order => {
      const rate = conversionRates[order.currency?.toUpperCase()] || 1;
      totalRevenueAED += Number(order.total) * rate;
    });

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
      ORDER_RECEIVED: 0,
      ORDER_CONFIRMED: 0,
      PROCESSING: 0,
      READY_FOR_PICKUP: 0,
      ORDER_PICKED_UP: 0,
      IN_TRANSIT: 0,
      DELIVERED: 0,
      CANCELLED: 0,
      REFUNDED: 0,
    };

    ordersByStatus.forEach((item) => {
      if (counts[item.status] !== undefined) {
        counts[item.status] = item._count._all;
      }
    });

    // Get total products out of stock
    const outOfStockCount = await prisma.product.count({
      where: {
        stockQuantity: {
          lte: 0
        }
      }
    });

    return new Response(
      JSON.stringify({
        users: usersCount,
        products: productsCount,
        banners: bannersCount,
        orders: ordersCount,
        ordersByStatus: counts,
        revenue: {
          totalAED: Number(totalRevenueAED.toFixed(2)),
          currency: 'AED'
        },
        outOfStock: outOfStockCount
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