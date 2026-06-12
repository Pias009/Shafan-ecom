import { NextRequest, NextResponse } from "next/server";
import { captureAuthorizedTabbyOrder } from "@/services/payments/tabby";

/**
 * Manual Retrieve Request endpoint.
 *
 * This performs a server-side Tabby Retrieve Request and captures the payment if
 * it is AUTHORIZED — the same path used by the webhook and the 20-minute cron.
 * It is NOT called from the browser success callback (capture must never be
 * triggered by the frontend redirect); it remains available for admin/manual
 * reconciliation.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, paymentId } = body;

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: "orderId is required" },
        { status: 400 },
      );
    }

    const result = await captureAuthorizedTabbyOrder(orderId, {
      paymentId: paymentId || undefined,
    });

    if (result.ok) {
      return NextResponse.json({
        success: true,
        status: result.status || (result.alreadyCaptured ? "ALREADY_CAPTURED" : "ok"),
        alreadyCaptured: result.alreadyCaptured ?? false,
      });
    }

    return NextResponse.json({
      success: false,
      status: result.status,
      error: result.reason,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to verify payment";
    console.error("[Tabby Verify] Error:", message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
