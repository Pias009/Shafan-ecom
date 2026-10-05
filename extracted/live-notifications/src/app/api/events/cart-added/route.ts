import { NextResponse } from "next/server";
import { triggerNotification } from "@/lib/pusher";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    await triggerNotification("admin-notifications", "cart-added", {
      productId: body.productId || "",
      productName: body.name || body.productName || "Product",
      quantity: body.quantity || 1,
      price: body.price || 0,
      currency: body.currency || "AED",
      country: body.country || "AE",
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
