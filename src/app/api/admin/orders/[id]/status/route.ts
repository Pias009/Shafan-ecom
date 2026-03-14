import { wooApi } from "@/lib/woocommerce";
import { getServerAuthSession } from "@/lib/auth";
import { z } from "zod";

const StatusSchema = z.object({
  status: z.enum([
    "PENDING", 
    "PROCESSING", 
    "ON_HOLD", 
    "COMPLETED", 
    "CANCELLED", 
    "REFUNDED", 
    "FAILED",
    "PENDING_PAYMENT",
    "PAID",
    "SHIPPED",
    "DELIVERED"
  ]).optional(),
});

const statusMap: Record<string, string> = {
  PENDING: "pending",
  PENDING_PAYMENT: "pending",
  PROCESSING: "processing",
  PAID: "processing",
  ON_HOLD: "on-hold",
  SHIPPED: "on-hold",
  COMPLETED: "completed",
  DELIVERED: "completed",
  CANCELLED: "cancelled",
  REFUNDED: "refunded",
  FAILED: "failed",
};

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerAuthSession();
  const user = session?.user as any;
  if (!session || !["ADMIN", "SUPERADMIN"].includes(user?.role)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const parsed = StatusSchema.safeParse(body);
    if (!parsed.success || !parsed.data.status) {
      return new Response(JSON.stringify({ error: "Invalid payload or status" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const wooStatus = statusMap[parsed.data.status];

    const { data: updatedOrder } = await wooApi.put(`orders/${id}`, {
      status: wooStatus,
    });

    return new Response(JSON.stringify(updatedOrder), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("WooCommerce Admin Order Update Error:", e?.response?.data || e.message);
    return new Response(JSON.stringify({ error: "Server error or WooCommerce update failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
