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

    let countryCode = (order.shippingAddress as any)?.country?.toUpperCase() || "AE";

    // AUTO-CORRECTION FOR TESTING FROM BANGLADESH
    if (countryCode === "BD" || process.env.NODE_ENV === "development") {
      console.log("DEBUG: Auto-correcting Bangladesh/Dev address to UAE for Tabby testing");
      countryCode = "AE";
    }

    const regionConfig = COUNTRY_TO_REGION[countryCode] || COUNTRY_TO_REGION["AE"];
    const { region, currency } = regionConfig;

    const tabbyService = new TabbyService(region);

    const billingAddress = order.billingAddress as any;
    const shippingAddress = order.shippingAddress as any;

    const formatPhone = (raw: string | undefined) => {
      // If testing from Bangladesh, use a guaranteed Tabby sandbox test number
      if (countryCode === "AE" && (order.shippingAddress as any)?.country?.toUpperCase() === "BD") {
        return "+97150000001";
      }
      const phone = raw || "501234567";
      const clean = phone.replace(/^(\+971|971|\+966|966|0)/, "");
      return `${countryCode === "SA" ? "+966" : "+971"}${clean}`;
    };

    const session = await tabbyService.createSession({
      amount: Number(order.total),
      currency,
      orderId: order.id,
      orderReferenceId: order.id,
      description: `Order #${order.id.substring(0, 8)}`,
      buyer: {
        email: (() => {
          if (countryCode === "AE" && process.env.NODE_ENV === "development") {
            return "otp.success@tabby.ai";
          }
          return order.email || "test@example.com";
        })(),
        phone: formatPhone(shippingAddress?.phone || billingAddress?.phone),
        name: shippingAddress?.first_name
          ? `${shippingAddress.first_name} ${shippingAddress.last_name || ""}`.trim()
          : billingAddress?.first_name
            ? `${billingAddress.first_name} ${billingAddress.last_name || ""}`.trim()
            : "Test Customer",
      },
      shippingAddress: {
        address: shippingAddress?.address_1 || "Dubai Mall",
        city: shippingAddress?.city || "Dubai",
        zip: shippingAddress?.postal_code || "00000",
      },
      items: order.items.map((item) => ({
        title: item.nameSnapshot,
        description: item.nameSnapshot,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice).toFixed(2),
        imageUrl: item.imageSnapshot || undefined,
      })),
      taxAmount: Number(order.taxAmount || 0),
      shippingAmount: Number(order.shipping || 0),
      discountAmount: Number(order.discount || 0),
      metadata: {
        order_id: order.id,
      },
    });

    await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentMethod: "tabby",
        paymentMethodTitle: `Tabby ${currency === "AED" ? "Pay in 4" : "Installments"}`,
        tabbySessionId: session.id,
        tabbyPaymentId: session.payment.id,
      },
    });

    console.log("Tabby Session Response:", JSON.stringify(session, null, 2));

    // In Tabby V2, the web_url is often nested inside the available products array
    const checkoutUrl = session.web_url || session.configuration?.available_products?.installments?.[0]?.web_url;

    // If Tabby rejects the session, they won't provide a web_url
    if (session.status === "REJECTED" || !checkoutUrl) {
      return NextResponse.json({
        success: false,
        status: session.status,
        error: `Tabby rejected this session: ${session.rejection_reason_code || "Not available for this order"}`,
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      paymentId: session.payment?.id,
      checkoutUrl: checkoutUrl,
      status: session.status,
    });

  } catch (error: any) {
    console.error("Tabby session creation error:", error);
    return new NextResponse(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to create Tabby session"
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}
