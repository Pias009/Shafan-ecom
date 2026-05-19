import { NextRequest, NextResponse } from "next/server";
import { TamaraService } from "@/services/payments/tamara";
import { TamaraCurrency } from "@/services/payments/tamara/types";
import { getAdminApiSession } from "@/lib/admin-session";
import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const session = await getAdminApiSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orderId, amount, currency, comment } = await req.json();

    if (!orderId || !amount || !currency) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (!order.tamaraCheckoutId) {
      return NextResponse.json({ error: "Order was not paid via Tamara" }, { status: 400 });
    }

    const tamaraService = new TamaraService();

    // 1. Fetch official order details/log from Tamara first (Rule 5 Compliant Refund Check)
    console.log(`[Tamara Refund] Fetching official order log from Tamara for checkout ID: ${order.tamaraCheckoutId}`);
    let tamaraOrder;
    try {
      tamaraOrder = await tamaraService.getOrder(order.tamaraCheckoutId);
    } catch (fetchErr: any) {
      console.error("[Tamara Refund] Failed to fetch order log from Tamara:", fetchErr.stack || fetchErr);
      return NextResponse.json({ 
        error: "Failed to verify order status on Tamara.", 
        details: fetchErr.message 
      }, { status: 502 });
    }

    const tamaraStatus = (tamaraOrder?.status || "").toLowerCase();
    console.log(`[Tamara Refund] Tamara official order status is: ${tamaraStatus}`);

    // Order state must be explicitly 'captured' or 'fully_captured'
    const allowedStates = ["captured", "fully_captured"];
    if (!allowedStates.includes(tamaraStatus)) {
      const errMsg = `Refund blocked: Order state is '${tamaraOrder?.status || "unknown"}' (not captured or fully_captured).`;
      console.error(`[Tamara Refund] ${errMsg}`);
      return NextResponse.json({ 
        error: errMsg,
        statusOnTamara: tamaraOrder?.status 
      }, { status: 400 });
    }

    // 2. Dispatch refund order to Tamara
    console.log(`[Tamara Refund] Dispatching refund to Tamara...`);
    const decimals = ["KWD", "BHD", "OMR"].includes(currency.toUpperCase()) ? 3 : 2;
    const formattedAmount = Number(amount).toFixed(decimals);

    const result = await tamaraService.refundPayment({
      orderId: order.tamaraCheckoutId,
      totalAmount: {
        amount: formattedAmount,
        currency: currency.toUpperCase() as TamaraCurrency,
      },
      comment: comment || "Refund requested by admin",
    });

    // 3. Update order status to REFUNDED in DB
    await prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.REFUNDED },
    });

    console.log(`[Tamara Refund] Refund successfully processed for order ${orderId}`);
    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error("[Tamara Refund] route error:", error.stack || error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
