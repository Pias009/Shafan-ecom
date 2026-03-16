import { wooApi } from "@/lib/woocommerce";
import { getServerAuthSession } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerAuthSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { action } = await req.json();

  try {
    // 1. Fetch order to verify ownership and conditions
    const { data: order } = await wooApi.get(`orders/${id}`);

    if (order.billing?.email?.toLowerCase() !== session.user.email.toLowerCase()) {
      return NextResponse.json({ error: "Unauthorized access to this order" }, { status: 403 });
    }

    const orderDate = new Date(order.date_created);
    const now = new Date();
    const diffMinutes = (now.getTime() - orderDate.getTime()) / (1000 * 60);

    if (action === "CANCEL") {
      // Rule: Only under 30 minutes and if status is not already completed/cancelled
      if (diffMinutes > 30) {
        return NextResponse.json({ error: "Cancellation period (30 mins) has expired" }, { status: 400 });
      }
      if (["completed", "cancelled", "refunded"].includes(order.status)) {
        return NextResponse.json({ error: `Cannot cancel an order with status: ${order.status}` }, { status: 400 });
      }

      const { data: updated } = await wooApi.put(`orders/${id}`, { status: "cancelled" });
      return NextResponse.json(updated);
    }

    if (action === "REFUND") {
      // Rule: Only if status is 'completed'
      if (order.status !== "completed") {
        return NextResponse.json({ error: "Refunds can only be requested for completed/delivered orders" }, { status: 400 });
      }

      // In a real scenario, this might create a refund record or trigger a notification.
      // For now, we update the status to 'refunded'.
      const { data: updated } = await wooApi.put(`orders/${id}`, { status: "refunded" });
      return NextResponse.json(updated);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("User Order Action Error:", error.response?.data || error.message);
    return NextResponse.json({ error: "Internal Server Error or WooCommerce Update Failed" }, { status: 500 });
  }
}
