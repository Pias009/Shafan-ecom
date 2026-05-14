import { NextRequest, NextResponse } from "next/server";
import { getAdminApiSession } from "@/lib/admin-session";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    // 1. Security check
    const session = await getAdminApiSession();
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPERADMIN')) {
      return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 401 });
    }

    // 2. Parse payload
    const { orderId, amount, currency, comment } = await req.json();

    if (!orderId || !amount || !currency) {
      return NextResponse.json({ error: "Missing required fields (orderId, amount, currency)" }, { status: 400 });
    }

    // 3. Find order in DB to get Tamara Checkout ID
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const tamaraOrderId = order.tamaraCheckoutId;
    if (!tamaraOrderId) {
      return NextResponse.json({ error: "Order does not have a Tamara checkout ID" }, { status: 400 });
    }

    // 4. Call Tamara Simplified Refund API
    const TAMARA_API_KEY = process.env.TAMARA_API_KEY || process.env.TAMARA_ACCESS_TOKEN;
    const TAMARA_API_URL = process.env.TAMARA_API_URL || "https://api-sandbox.tamara.co";
    
    // User specified URL: https://api-sandbox.tamara.co/api/v2/payments/{order_id}/refund
    // Note: The 'order_id' here is the Tamara Order ID (checkoutId)
    const refundUrl = `${TAMARA_API_URL}/api/v2/payments/${tamaraOrderId}/refund`;

    const decimals = ["KWD", "BHD", "OMR"].includes(currency.toUpperCase()) ? 3 : 2;
    const formattedAmount = Number(amount).toFixed(decimals);

    const tamaraPayload = {
      total_amount: {
        amount: formattedAmount,
        currency: currency.toUpperCase(),
      },
      comment: comment || "Refunded via Admin Dashboard"
    };

    console.log(`[Tamara Refund] Calling ${refundUrl} with payload:`, JSON.stringify(tamaraPayload));

    const response = await fetch(refundUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${TAMARA_API_KEY}`,
        "Tamara-Version": "2.0"
      },
      body: JSON.stringify(tamaraPayload),
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error("[Tamara Refund] API Error:", responseData);
      return NextResponse.json({ 
        error: responseData.message || "Tamara API error", 
        details: responseData 
      }, { status: response.status });
    }

    // 5. Update order in DB if necessary (e.g. record the refund)
    // For now, we'll just return success
    return NextResponse.json({ 
      success: true, 
      message: "Refund processed successfully",
      data: responseData 
    });

  } catch (error: any) {
    console.error("[Tamara Refund] Server Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
