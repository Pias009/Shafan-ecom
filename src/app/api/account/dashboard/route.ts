import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { wooApi } from "@/lib/woocommerce";

export async function GET() {
  const session = await getServerAuthSession();
  if (!session?.user?.id || !session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { data: wooOrders } = await wooApi.get("orders", {
      customer: session.user.email, // Search by email if customer ID is unknown
      per_page: 10,
    });

    const orders = wooOrders.map((o: any) => ({
      id: String(o.id),
      status: o.status,
      totalCents: Math.round(parseFloat(o.total) * 100),
      createdAt: o.date_created,
    }));

    const stats = {
      pending: wooOrders.filter((o: any) => o.status === "pending" || o.status === "processing").length,
      shipped: wooOrders.filter((o: any) => o.status === "on-hold").length,
      delivered: wooOrders.filter((o: any) => o.status === "completed").length,
      refunded: wooOrders.filter((o: any) => o.status === "refunded").length,
    };

    return NextResponse.json({ orders, stats });
  } catch (error) {
    console.error("WooCommerce Dashboard API Error:", error);
    return NextResponse.json({ orders: [], stats: { pending: 0, shipped: 0, delivered: 0, refunded: 0 } });
  }
}
