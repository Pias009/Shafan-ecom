import { wooApi } from "@/lib/woocommerce";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerAuthSession();
  const isAdmin = session && ["ADMIN", "SUPERADMIN"].includes((session.user as any)?.role);
  if (!session || !isAdmin) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    // Users and Banners still in Prisma (WooCommerce handles customers)
    const usersCount = (prisma as any).user?.count ? await (prisma as any).user.count() : 0;
    const bannersCount = (prisma as any).banner?.count ? await (prisma as any).banner.count() : 0;

    // Products and Orders from WooCommerce
    const { headers: productHeaders } = await wooApi.get("products", { per_page: 1 });
    const productsCount = parseInt(productHeaders["x-wp-total"] || "0");

    const { data: allOrders, headers: orderHeaders } = await wooApi.get("orders", { per_page: 100 });
    const ordersCount = parseInt(orderHeaders["x-wp-total"] || "0");

    const counts: Record<string, number> = {
      PENDING_PAYMENT: 0,
      PAID: 0,
      PROCESSING: 0,
      SHIPPED: 0,
      DELIVERED: 0,
      CANCELLED: 0,
      REFUNDED: 0,
    };

    const statusInverseMap: Record<string, string> = {
      pending: "PENDING_PAYMENT",
      processing: "PROCESSING",
      "on-hold": "SHIPPED",
      completed: "DELIVERED",
      cancelled: "CANCELLED",
      refunded: "REFUNDED",
      failed: "CANCELLED",
    };

    allOrders.forEach((o: any) => {
      const s = statusInverseMap[o.status];
      if (s) counts[s] += 1;
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
    console.error("WooCommerce Admin Dashboard Error:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch from WooCommerce" }), { status: 500 });
  }
}
