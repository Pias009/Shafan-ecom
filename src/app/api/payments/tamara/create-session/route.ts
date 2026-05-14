import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TamaraService, TamaraRegion, TamaraCurrency } from "@/services/payments/tamara";

const COUNTRY_TO_REGION: Record<string, { region: TamaraRegion; currency: TamaraCurrency; phonePrefix: string }> = {
  AE: { region: "UAE", currency: "AED", phonePrefix: "+971" },
  SA: { region: "SAU", currency: "SAR", phonePrefix: "+966" },
  KW: { region: "KWT", currency: "KWD", phonePrefix: "+965" },
  BH: { region: "BHR", currency: "BHD", phonePrefix: "+973" },
  QA: { region: "QAT", currency: "QAR", phonePrefix: "+974" },
  OM: { region: "OMN", currency: "OMR", phonePrefix: "+968" },
};

export async function POST(request: NextRequest) {
  try {
    let body;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
    }

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

    if (order.status !== "ORDER_RECEIVED" && order.paymentStatus === "PAID") {
      return NextResponse.json({ error: "Order is already processed" }, { status: 400 });
    }

    let countryCode = (order.shippingAddress as any)?.country?.toUpperCase() || "AE";
    
    // FORCE UAE FOR SANDBOX OR DEVELOPMENT ONLY
    const isSandbox = (process.env.TAMARA_API_URL || "").includes("sandbox");
    if (isSandbox || process.env.NODE_ENV === "development") {
      countryCode = "AE";
    }

    const regionConfig = COUNTRY_TO_REGION[countryCode] || COUNTRY_TO_REGION["AE"];
    let { region, currency, phonePrefix } = regionConfig;

    // USE ORDER CURRENCY IF IT'S A VALID GULF CURRENCY SUPPORTED BY TAMARA
    const orderCurrency = (order.currency || "AED").toUpperCase() as TamaraCurrency;
    const supportedCurrencies: TamaraCurrency[] = ["AED", "SAR", "KWD", "BHD", "QAR", "OMR"];
    
    if (supportedCurrencies.includes(orderCurrency)) {
      currency = orderCurrency;
      
      // IMPORTANT: If we are using a non-AED currency, we SHOULD NOT force AE as the country
      // as Tamara will reject AED/KWD mismatch. 
      // Only force AE if the order was already AE or if we are in a completely unsupported country.
      if (countryCode === "AE" && currency !== "AED") {
        // Find correct country for this currency
        const revMap: Record<string, string> = { KWD: "KW", SAR: "SA", BHD: "BH", OMR: "OM", QAR: "QA" };
        if (revMap[currency]) countryCode = revMap[currency];
      }
    }

    const tamaraService = new TamaraService();
    const billingAddress = order.billingAddress as any;
    const shippingAddress = order.shippingAddress as any;

    const decimals = ["KWD", "BHD", "OMR"].includes(currency.toUpperCase()) ? 3 : 2;

    const toFixed = (val: any) => {
      if (val === null || val === undefined) return `0.${"0".repeat(decimals)}`;
      try {
        const num = Number(val.toString());
        return isNaN(num) ? `0.${"0".repeat(decimals)}` : num.toFixed(decimals);
      } catch (e) {
        return `0.${"0".repeat(decimals)}`;
      }
    };

    const formatPhone = (raw: string | undefined) => {
      // Use test number if country was forced to AE for Bangladesh testing
      if (countryCode === "AE" && (order.shippingAddress as any)?.country?.toUpperCase() === "BD") {
        return "+971500000001";
      }
      const phone = raw || "501234567";
      // Remove non-digits
      const digits = phone.replace(/\D/g, "");
      // Remove leading zero or country codes
      const clean = digits.replace(/^(971|966|965|973|974|968|0)/, "");
      return `${phonePrefix}${clean}`;
    };

    const getBaseUrl = () => {
      // Priority: env variable > request header (host) > fallback
      let url = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL;
      
      if (!url && request.headers.get("x-forwarded-host")) {
        const host = request.headers.get("x-forwarded-host");
        const proto = request.headers.get("x-forwarded-proto") || "https";
        url = `${proto}://${host}`;
      } else if (!url && request.headers.get("host")) {
        const host = request.headers.get("host");
        const protocol = host?.includes("localhost") ? "http" : "https";
        url = `${protocol}://${host}`;
      }
      
      if (!url) url = "https://www.shanfaglobal.com";
      if (!url.startsWith("http")) url = `https://${url}`;
      return url.replace(/\/$/, "");
    };

    const baseUrl = getBaseUrl();
    console.log("DEBUG: Using Base URL for Tamara:", baseUrl);

    // ALWAYS add a suffix to avoid "duplicate reference ID" errors on Tamara
    const uniqueRefId = `${order.id}-${Date.now().toString().slice(-4)}`;

    const session = await tamaraService.createSession({
      orderReferenceId: uniqueRefId,
      description: `Order #${order.id.substring(order.id.length - 8)}`,
      currency,
      locale: "en-US",
      paymentType: "pay_later",
      consumer: {
        firstName: shippingAddress?.first_name || billingAddress?.first_name || "Customer",
        lastName: shippingAddress?.last_name || billingAddress?.last_name || "User",
        email: order.email || "customer@example.com",
        phone: formatPhone(shippingAddress?.phone || billingAddress?.phone),
        country: countryCode,
      },
      billingAddress: {
        firstName: billingAddress?.first_name || "Customer",
        lastName: billingAddress?.last_name || "User",
        line1: billingAddress?.address_1 || "Address Line 1",
        line2: billingAddress?.address_2,
        city: billingAddress?.city || "City",
        region: billingAddress?.state || "Region",
        postcode: billingAddress?.postal_code || "00000",
        country: countryCode,
        phone: formatPhone(billingAddress?.phone),
      },
      shippingAddress: {
        firstName: shippingAddress?.first_name || "Customer",
        lastName: shippingAddress?.last_name || "User",
        line1: shippingAddress?.address_1 || "Address Line 1",
        line2: shippingAddress?.address_2,
        city: shippingAddress?.city || "City",
        region: shippingAddress?.state || "Region",
        postcode: shippingAddress?.postal_code || "00000",
        country: countryCode,
        phone: formatPhone(shippingAddress?.phone),
      },
      items: order.items.map((item, index) => {
        const qty = item.quantity || 1;
        const up = Number(item.unitPrice || 0);

        return {
          sku: item.productId || `SKU-${index}`,
          name: item.nameSnapshot || "Product Item",
          type: "physical" as const,
          unitPrice: { amount: up.toFixed(decimals), currency },
          quantity: qty,
          imageUrl: item.imageSnapshot || undefined,
        };
      }),
      totalAmount: { amount: toFixed(order.total), currency },
      shippingAmount: { amount: toFixed(order.shipping), currency },
      taxAmount: { amount: toFixed(order.taxAmount), currency },
      discount: order.discount ? {
        amount: toFixed(order.discount),
        currency,
        name: "Order Discount"
      } : undefined,
      merchantUrls: {
        success: `${baseUrl}/checkout/success?order_id=${order.id}&payment=tamara`,
        cancel: `${baseUrl}/checkout/payment/${order.id}?canceled=tamara`,
        failure: `${baseUrl}/checkout/payment/${order.id}?failed=tamara`,
        notification: `${baseUrl}/api/payments/tamara/webhook`,
      },
    });

    await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentMethod: "tamara",
        paymentMethodTitle: `Tamara ${currency} Installments`,
        tamaraCheckoutId: session.checkout_id,
      },
    });

    return NextResponse.json({
      success: true,
      checkoutId: session.checkout_id,
      checkoutUrl: session.checkout_url,
      status: session.status,
    }, {
      headers: { "Cache-Control": "no-store" }
    });

  } catch (error: any) {
    console.error("Tamara Production Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create Tamara session" },
      { 
        status: 500,
        headers: { "Cache-Control": "no-store" }
      }
    );
  }
}
