import { wooApi } from "@/lib/woocommerce";
import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerAuthSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = params;
    const { data: order } = await wooApi.get(`orders/${id}`);

    // Security check: Ensure this order belongs to the logged-in user
    if (order.billing.email !== session.user.email) {
      return NextResponse.json({ error: "Unauthorized access to order" }, { status: 403 });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("Fetch Order Error:", error);
    return NextResponse.json({ error: "Failed to fetch order details" }, { status: 500 });
  }
}
