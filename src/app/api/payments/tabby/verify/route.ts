import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TabbyService, TabbyRegion, TabbyCurrency } from "@/services/payments/tabby";
import { OrderStatus } from "@prisma/client";
import { notifyNewOrder } from "@/lib/pusher";
import { sendEmail } from "@/lib/email";

async function notifyPaymentConfirmed(orderId: string) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) return;

    const shippingAddress = order.shippingAddress as any;
    const customerName = shippingAddress?.first_name
      ? `${shippingAddress.first_name} ${shippingAddress.last_name || ""}`
      : "Customer";

    await notifyNewOrder({
      id: order.id,
      total: order.total ?? 0,
      currency: order.currency,
      userName: customerName,
      email: order.email || undefined,
    }).catch((err) => console.error("Pusher notification failed:", err));

    if (process.env.ADMIN_EMAIL) {
      const adminItemsList = order.items
        .map((item: any) => `${item.nameSnapshot || "Product"} x${item.quantity}`)
        .join(", ");

      await sendEmail({
        to: process.env.ADMIN_EMAIL,
        subject: `Tabby Payment Confirmed — Order #${order.id} — ${order.currency?.toUpperCase()} ${order.total?.toFixed(2)}`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2 style="color: #333;">Payment Confirmed via Tabby!</h2>
            <table style="border-collapse: collapse; width: 100%; max-width: 500px;">
              <tr><td style="padding: 8px 0; color: #666;">Order ID</td><td style="padding: 8px 0;"><strong>#${order.id}</strong></td></tr>
              <tr><td style="padding: 8px 0; color: #666;">Customer</td><td style="padding: 8px 0;">${order.email || customerName}</td></tr>
              <tr><td style="padding: 8px 0; color: #666;">Amount</td><td style="padding: 8px 0;"><strong style="font-size: 18px;">${order.currency?.toUpperCase()} ${order.total?.toFixed(2)}</strong></td></tr>
              <tr><td style="padding: 8px 0; color: #666;">Payment</td><td style="padding: 8px 0;">Tabby</td></tr>
              <tr><td style="padding: 8px 0; color: #666;">Items</td><td style="padding: 8px 0;">${adminItemsList}</td></tr>
            </table>
            <p style="margin-top: 20px;"><a href="${process.env.NEXTAUTH_URL || "https://www.shanfaglobal.com"}/ueadmin/orders/${order.id}" style="background: #3ECF8E; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none;">View Order</a></p>
          </div>
        `,
      }).catch(console.error);
    }
  } catch (err) {
    console.error("Failed to send post-payment notification:", err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, paymentId } = body;

    if (!orderId || !paymentId) {
      return NextResponse.json(
        { success: false, error: "orderId and paymentId are required" },
        { status: 400 },
      );
    }

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }

    // Check if order is already confirmed/paid
    if (order.status === OrderStatus.ORDER_CONFIRMED || order.paymentStatus === "PAID") {
      return NextResponse.json({ success: true, message: "Order already processed" });
    }

    const shippingAddr = (order.shippingAddress ?? {}) as Record<string, unknown>;
    const countryCode = String(shippingAddr.country || "AE").toUpperCase();
    const regionMap: Record<string, TabbyRegion> = { AE: "UAE", SA: "KSA", KW: "Kuwait" };
    const region: TabbyRegion = regionMap[countryCode] || "UAE";
    const tabbyService = new TabbyService(region);

    // Retrieve payment status from Tabby
    const payment = await tabbyService.getPayment(paymentId);

    if (payment.status === "AUTHORIZED") {
      // Capture the authorized payment
      await tabbyService.capturePayment(
        paymentId,
        Number(order.total || 0),
        (order.currency || "AED") as TabbyCurrency,
      );

      await prisma.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.ORDER_CONFIRMED,
          paymentStatus: "PAID" as any,
        },
      });

      console.log(`[Tabby Verify] Payment verified and captured for order ${orderId}`);

      await notifyPaymentConfirmed(orderId);

      return NextResponse.json({
        success: true,
        status: "CAPTURED",
        message: "Payment verified and captured successfully",
      });
    } else if (payment.status === "CAPTURED" || payment.status === "CLOSED") {
      // Payment already captured
      await prisma.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.ORDER_CONFIRMED,
          paymentStatus: "PAID" as any,
        },
      });

      await notifyPaymentConfirmed(orderId);

      return NextResponse.json({
        success: true,
        status: payment.status,
        message: "Payment already captured",
      });
    } else if (payment.status === "REJECTED" || payment.status === "EXPIRED") {
      return NextResponse.json({
        success: false,
        status: payment.status,
        error: `Payment status is ${payment.status}`,
      });
    }

    return NextResponse.json({
      success: true,
      status: payment.status,
      message: `Payment status: ${payment.status}`,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to verify payment";
    console.error("[Tabby Verify] Error:", message);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
