import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { wooApi } from "@/lib/woocommerce";

export async function GET() {
  const session = await getServerAuthSession();
  if (!session?.user?.id || !session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    let customers = [];
    try {
      // Shorter timeout for customer lookup to fail fast
      const res = await wooApi.get("customers", { email: session.user.email });
      customers = res.data;
    } catch (e) {
      console.warn("Customer lookup timed out or failed:", e);
    }
    
    let queryParams: any = { 
      per_page: 6, // Even leaner for dashboard stability
      orderby: 'date',
      order: 'desc'
    };
    
    if (customers && customers.length > 0) {
      queryParams.customer = customers[0].id;
    } else {
      queryParams.search = session.user.email;
    }

    let wooOrders = [];
    try {
      const res = await wooApi.get("orders", queryParams);
      wooOrders = res.data;
    } catch (e) {
      console.warn("Orders fetch timed out or failed:", e);
    }

    const orders = wooOrders.map((o: any) => ({
      id: String(o.id),
      status: o.status,
      totalCents: Math.round(parseFloat(o.total) * 100),
      createdAt: o.date_created,
      items: o.line_items.map((it: any) => ({
        name: it.name,
        quantity: it.quantity,
        total: it.total,
        // WooCommerce line items don't have images by default in the list view, 
        // but we can try to fetch them or just show names for now.
        // Actually, we can get product images if we need but let's stick to names first for performance.
      }))
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
