import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TabbyService, TabbyRegion, TabbyCurrency } from "@/services/payments/tabby";
import { getCurrencyDivisor } from "@/lib/product-utils";

const COUNTRY_TO_REGION: Record<string, { region: TabbyRegion; currency: TabbyCurrency }> = {
  AE: { region: "UAE", currency: "AED" },
  SA: { region: "KSA", currency: "SAR" },
  KW: { region: "Kuwait", currency: "KWD" },
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.status !== "ORDER_RECEIVED") {
      return NextResponse.json({ error: "Order is not pending payment" }, { status: 400 });
    }

    const countryCode = (order.shippingAddress as any)?.country?.toUpperCase() || "AE";
    const regionConfig = COUNTRY_TO_REGION[countryCode] || COUNTRY_TO_REGION["AE"];
    const { region, currency } = regionConfig;

    const tabbyService = new TabbyService(region);

    const billingAddress = order.billingAddress as any;
    const shippingAddress = order.shippingAddress as any;

    const divisor = getCurrencyDivisor(order.currency || currency);
    
    const session = await tabbyService.createSession({
      amount: Number(order.total),
      currency,
      orderId: order.id,
      orderReferenceId: order.id,
      description: `Order #${order.id.substring(0, 8)}`,
      buyer: {
        email: order.email || "",
        phone: shippingAddress?.phone || billingAddress?.phone || "",
        name: shippingAddress?.first_name 
          ? `${shippingAddress.first_name} ${shippingAddress.last_name || ""}`.trim()
          : billingAddress?.first_name
          ? `${billingAddress.first_name} ${billingAddress.last_name || ""}`.trim()
          : "",
      },
      shippingAddress: {
        address: shippingAddress?.address_1,
        city: shippingAddress?.city,
        zip: shippingAddress?.postal_code,
      },
      items: order.items.map((item) => ({
        title: item.nameSnapshot,
        description: item.nameSnapshot,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice).toFixed(2),
        imageUrl: item.imageSnapshot || undefined,
      })),
      metadata: {
        order_id: order.id,
      },
    });

    await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentMethod: "tabby",
        paymentMethodTitle: `Tabby ${currency === "AED" ? "Pay in 4" : "Installments"}`,
        tabbySessionId: session.session.id,
        tabbyPaymentId: session.payment.id,
      },
    });

    return NextResponse.json({
      success: true,
      sessionId: session.session.id,
      paymentId: session.payment.id,
      webUrl: session.webUrl,
      status: session.session.status,
      availableProducts: session.configuration.availableProducts,
    });

  } catch (error: any) {
    console.error("Tabby session creation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create Tabby session" },
      { status: 500 }
    );
  }
}
