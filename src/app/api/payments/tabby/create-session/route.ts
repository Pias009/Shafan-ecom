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
    let { region, currency } = regionConfig;

    // SYNC CURRENCY WITH ORDER IF SUPPORTED
    const orderCurrency = (order.currency || "AED").toUpperCase() as TabbyCurrency;
    const supportedCurrencies: TabbyCurrency[] = ["AED", "SAR", "KWD"];
    if (supportedCurrencies.includes(orderCurrency)) {
      currency = orderCurrency;
      // Ensure country matches currency
      if (countryCode === "AE" && currency === "SAR") countryCode = "SA";
      if (countryCode === "AE" && currency === "KWD") countryCode = "KW";
    }

    // IN DEVELOPMENT: Force UAE region and AED currency for the test key to work
    if (process.env.NODE_ENV === "development") {
      region = "UAE";
      currency = "AED";
      console.log("DEBUG: Forcing Tabby to UAE/AED for localhost testing");
    }

    const decimals = ["KWD", "BHD", "OMR"].includes(currency) ? 3 : 2;
    const tabbyService = new TabbyService(region);

    const billingAddress = order.billingAddress as any;
    const shippingAddress = order.shippingAddress as any;

    const formatPhone = (raw: string | undefined) => {
      // If testing from Bangladesh, use a guaranteed Tabby sandbox test number
      if (countryCode === "AE" && (order.shippingAddress as any)?.country?.toUpperCase() === "BD") {
        return "+97150000001";
      }
      const phone = raw || "501234567";
      // Remove non-digits
      const digits = phone.replace(/\D/g, "");
      // Remove leading zero or country codes
      const clean = digits.replace(/^(971|966|965|973|974|968|0)/, "");
      
      const prefixes: Record<string, string> = {
        AE: "+971",
        SA: "+966",
        KW: "+965",
        BH: "+973",
        QA: "+974",
        OM: "+968"
      };
      
      return `${prefixes[countryCode] || "+971"}${clean}`;
    };

    const getBaseUrl = () => {
      let url = process.env.NEXT_PUBLIC_BASE_URL;
      if (!url && request.headers.get("host")) {
        const host = request.headers.get("host");
        const protocol = host?.includes("localhost") ? "http" : "https";
        url = `${protocol}://${host}`;
      }
      if (!url) url = "https://www.shanfaglobal.com";
      if (!url.startsWith("http")) url = `https://${url}`;
      return url.replace(/\/$/, "");
    };

    const baseUrl = getBaseUrl();

    const session = await tabbyService.createSession({
      amount: Number(order.total),
      currency,
      orderId: order.id,
      // Add random suffix in development to avoid duplicate order reference errors
      orderReferenceId: process.env.NODE_ENV === "development" ? `${order.id}-${Date.now().toString().slice(-4)}` : order.id,
      description: `Order #${order.id.substring(0, 8)}`,
      merchant_urls: {
        success: `${baseUrl}/checkout/success?order_id=${order.id}&payment=tabby`,
        cancel: `${baseUrl}/checkout/payment/${order.id}?canceled=tabby`,
        failure: `${baseUrl}/checkout/payment/${order.id}?rejected=tabby`,
      },
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
      items: order.items.map((item) => {
        const qty = item.quantity || 1;
        const up = Number(item.unitPrice || 0);

        return {
          title: item.nameSnapshot,
          description: item.nameSnapshot,
          quantity: qty,
          unitPrice: up.toFixed(decimals), // Use the same decimal precision as the total
          imageUrl: item.imageSnapshot || undefined,
        };
      }),
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
