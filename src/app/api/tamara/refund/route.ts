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

    const TAMARA_API_KEY = process.env.TAMARA_API_KEY || process.env.TAMARA_ACCESS_TOKEN;
    const TAMARA_API_URL = process.env.TAMARA_API_URL || "https://api-sandbox.tamara.co";
    
    // 4. Fetch official order details/log from Tamara first (Rule 5 Compliant Check)
    const getOrderUrl = `${TAMARA_API_URL}/orders/${tamaraOrderId}`;
    console.log(`[Tamara Refund Direct] Checking order log from: ${getOrderUrl}`);
    
    let tamaraOrder;
    try {
      const getResponse = await fetch(getOrderUrl, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${TAMARA_API_KEY}`,
          "Tamara-Version": "2.0"
        }
      });
      
      if (!getResponse.ok) {
        throw new Error(`GET order returned status: ${getResponse.status}`);
      }
      
      tamaraOrder = await getResponse.json();
    } catch (fetchErr: any) {
      console.error("[Tamara Refund Direct] Failed to fetch order log from Tamara:", fetchErr.stack || fetchErr);
      return NextResponse.json({ 
        error: "Failed to verify order status on Tamara.", 
        details: fetchErr.message 
      }, { status: 502 });
    }

    const tamaraStatus = (tamaraOrder?.status || "").toLowerCase();
    console.log(`[Tamara Refund Direct] Tamara official order status is: ${tamaraStatus}`);

    // Order state must be explicitly 'captured' or 'fully_captured'
    const allowedStates = ["captured", "fully_captured"];
    if (!allowedStates.includes(tamaraStatus)) {
      const errMsg = `Refund blocked: Order state is '${tamaraOrder?.status || "unknown"}' (not captured or fully_captured).`;
      console.error(`[Tamara Refund Direct] ${errMsg}`);
      return NextResponse.json({ 
        error: errMsg,
        statusOnTamara: tamaraOrder?.status 
      }, { status: 400 });
    }

    // 5. Call Tamara Simplified Refund API
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

    console.log(`[Tamara Refund Direct] Calling ${refundUrl} with payload:`, JSON.stringify(tamaraPayload));

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
      console.error("[Tamara Refund Direct] API Error:", responseData);
      return NextResponse.json({ 
        error: responseData.message || "Tamara API error", 
        details: responseData 
      }, { status: response.status });
    }

    // Update order status in local DB
    await prisma.order.update({
      where: { id: orderId },
      data: { status: "REFUNDED" },
    });

    return NextResponse.json({ 
      success: true, 
      message: "Refund processed successfully",
      data: responseData 
    });

  } catch (error: any) {
    console.error("[Tamara Refund Direct] Server Error:", error.stack || error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
