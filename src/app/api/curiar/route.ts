import { NextResponse } from "next/server";
import { wooApi } from "@/lib/woocommerce";

// Map internal statuses to WooCommerce statuses
const statusMap: Record<string, string> = {
  "PENDING_PAYMENT": "pending",
  "PROCESSING": "processing",
  "SHIPPED": "on-hold", // WooCommerce doesn't have a default "shipped" but often uses on-hold or completed
  "DELIVERED": "completed",
  "REFUNDED": "refunded",
  "CANCELLED": "cancelled"
};

// Courier Server API endpoint
export async function PATCH(req: Request) {
  const { orderId, status } = await req.json().catch(() => ({}));

  if (!orderId || !status) {
    return NextResponse.json({ error: "Missing orderId or status" }, { status: 400 });
  }

  const wooStatus = statusMap[status] || status;

  try {
    const { data: updatedOrder } = await wooApi.put(`orders/${orderId}`, {
      status: wooStatus,
    });

    return NextResponse.json({ ok: true, order: updatedOrder });
  } catch (error: any) {
    console.error("WooCommerce Courier API error:", error?.response?.data || error.message);
    return NextResponse.json({ error: "Order not found or update failed on WooCommerce" }, { status: 404 });
  }
}

// For simulation/testing: get current status
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("orderId");
    if (!orderId) return NextResponse.json({ error: "Missing orderId" }, { status: 400 });

    try {
      const { data: order } = await wooApi.get(`orders/${orderId}`);
      return NextResponse.json(order);
    } catch (error) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
}
