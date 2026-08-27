import { NextRequest, NextResponse } from "next/server";
import { captureAuthorizedTamaraOrder, capturePendingTamaraCheckout } from "@/services/payments/tamara";

/**
 * Manual/Verification endpoint for Tamara.
 *
 * Server-side verification that checks Tamara API status for a pending checkout or order
 * and captures / promotes to ORDER_CONFIRMED & PAID if approved.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, pendingCheckoutId, tamaraCheckoutId } = body;

    const targetId = pendingCheckoutId || orderId;

    if (!targetId) {
      return NextResponse.json(
        { success: false, error: "orderId or pendingCheckoutId is required" },
        { status: 400 }
      );
    }

    // Try pendingCheckout first
    const pcResult = await capturePendingTamaraCheckout(targetId, {
      tamaraCheckoutId,
    });

    if (pcResult.ok) {
      return NextResponse.json({
        success: true,
        status: pcResult.status || "PAID",
        alreadyCaptured: pcResult.alreadyCaptured ?? false,
      });
    }

    // Fallback to order
    const orderResult = await captureAuthorizedTamaraOrder(targetId, {
      tamaraCheckoutId,
    });

    if (orderResult.ok) {
      return NextResponse.json({
        success: true,
        status: orderResult.status || "PAID",
        alreadyCaptured: orderResult.alreadyCaptured ?? false,
      });
    }

    return NextResponse.json({
      success: false,
      status: pcResult.status || orderResult.status,
      error: pcResult.reason || orderResult.reason,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to verify Tamara payment";
    console.error("[Tamara Verify] Error:", message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
