import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TabbyService, TabbyRegion, TabbyCurrency } from "@/services/payments/tabby";
import { OrderStatus, PaymentStatus } from "@prisma/client";
import { notifyNewOrder } from "@/lib/pusher";
import { sendEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { paymentId, orderId, amount, currency } = body;

    if (!paymentId || !orderId) {
      return NextResponse.json(
        { success: false, error: "paymentId and orderId are required" },
        { status: 400 },
      );
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 },
      );
    }

    // Idempotency: never capture twice — protects against double-charge
    if (
      order.status === OrderStatus.ORDER_CONFIRMED ||
      order.paymentStatus === PaymentStatus.PAID
    ) {
      return NextResponse.json({
        success: true,
        message: "Order already captured",
        alreadyCaptured: true,
      });
    }

    const shippingAddr = (order.shippingAddress ?? {}) as Record<string, unknown>;
    const countryCode = String(shippingAddr.country || "AE").toUpperCase();
    const regionMap: Record<string, TabbyRegion> = {
      AE: "UAE",
      SA: "KSA",
      KW: "Kuwait",
    };
    const region: TabbyRegion = regionMap[countryCode] || "UAE";

    const decimals = ["KWD", "BHD", "OMR"].includes(currency?.toUpperCase() || order.currency || "AED") ? 3 : 2;
    const captureAmount = amount ?? Number(order.total || 0);
    const captureCurrency = (currency || order.currency || "AED").toUpperCase() as TabbyCurrency;

    const tabbyService = new TabbyService(region);

    console.log(
      `[Tabby Capture] Capturing payment ${paymentId} for order ${orderId}: ${captureAmount.toFixed(decimals)} ${captureCurrency}`,
    );

    const captureResult = await tabbyService.capturePayment(paymentId, captureAmount, captureCurrency);

    console.log(
      `[Tabby Capture] Result for order ${orderId}: status=${captureResult.status}`,
    );

    if (captureResult.status === "CAPTURED" || captureResult.status === "AUTHORIZED") {
      await prisma.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.ORDER_CONFIRMED,
          paymentStatus: PaymentStatus.PAID,
        },
      });

      const updatedOrder = await prisma.order.findUnique({
        where: { id: orderId },
        include: { items: true },
      });

      if (updatedOrder) {
        const shipAddr = (updatedOrder.shippingAddress ?? {}) as Record<string, unknown>;
        const firstName = String(shipAddr.first_name || "");
        const lastName = String(shipAddr.last_name || "");
        const customerName = firstName ? `${firstName} ${lastName}`.trim() : "Customer";

        await notifyNewOrder({
          id: updatedOrder.id,
          total: updatedOrder.total ?? 0,
          currency: updatedOrder.currency,
          userName: customerName,
          email: updatedOrder.email || undefined,
        }).catch((err) => console.error("[Tabby Capture] Pusher error:", err));

        if (process.env.ADMIN_EMAIL) {
          const adminItemsList = updatedOrder.items
            .map((item) => `${item.nameSnapshot || "Product"} x${item.quantity}`)
            .join(", ");

          await sendEmail({
            to: process.env.ADMIN_EMAIL,
            subject: `Tabby Captured — Order #${updatedOrder.id} — ${updatedOrder.currency?.toUpperCase()} ${updatedOrder.total?.toFixed(2)}`,
            html: `
              <div style="font-family: Arial, sans-serif; padding: 20px;">
                <h2 style="color: #333;">Payment Captured via Tabby!</h2>
                <table style="border-collapse: collapse; width: 100%; max-width: 500px;">
                  <tr><td style="padding: 8px 0; color: #666;">Order ID</td><td style="padding: 8px 0;"><strong>#${updatedOrder.id}</strong></td></tr>
                  <tr><td style="padding: 8px 0; color: #666;">Customer</td><td style="padding: 8px 0;">${updatedOrder.email || customerName}</td></tr>
                  <tr><td style="padding: 8px 0; color: #666;">Amount</td><td style="padding: 8px 0;"><strong style="font-size: 18px;">${updatedOrder.currency?.toUpperCase()} ${updatedOrder.total?.toFixed(2)}</strong></td></tr>
                  <tr><td style="padding: 8px 0; color: #666;">Payment</td><td style="padding: 8px 0;">Tabby</td></tr>
                  <tr><td style="padding: 8px 0; color: #666;">Items</td><td style="padding: 8px 0;">${adminItemsList}</td></tr>
                </table>
                <p style="margin-top: 20px;"><a href="${process.env.NEXTAUTH_URL || "https://www.shanfaglobal.com"}/ueadmin/orders/${updatedOrder.id}" style="background: #3ECF8E; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none;">View Order</a></p>
              </div>
            `,
          }).catch(console.error);
        }
      }

      return NextResponse.json({
        success: true,
        status: captureResult.status,
        message: "Payment captured successfully",
      });
    }

    console.warn(
      `[Tabby Capture] Unexpected status for order ${orderId}: ${captureResult.status}`,
    );

    return NextResponse.json(
      {
        success: false,
        status: captureResult.status,
        error: `Capture returned unexpected status: ${captureResult.status}`,
      },
      { status: 500 },
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to capture payment";
    console.error("[Tabby Capture] Error:", message);
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 },
    );
  }
}
