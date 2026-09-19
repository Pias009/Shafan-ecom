import { NextResponse } from "next/server";
import { triggerNotification } from "@/lib/pusher";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    await triggerNotification("admin-notifications", "checkout-entered", {
      itemCount: body.itemCount || 1,
      total: body.total ?? body.totalAmount ?? 0,
      totalAmount: body.totalAmount ?? body.total ?? 0,
      currency: (body.currency || "AED").toUpperCase(),
      country: body.country || "AE",
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
