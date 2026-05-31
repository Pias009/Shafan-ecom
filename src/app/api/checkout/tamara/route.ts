import { NextRequest, NextResponse } from "next/server";

const CURRENCY_TO_COUNTRY: Record<string, string> = {
  AED: "AE",
  SAR: "SA",
  KWD: "KW",
  BHD: "BH",
  QAR: "QA",
  OMR: "OM",
};

const LANG_TO_LOCALE: Record<string, string> = {
  en: "en_US",
  ar: "ar_SA",
};

export async function POST(request: NextRequest) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
    }

    const { cartItems, totalAmount, currency, customerDetails, lang } = body;

    if (!cartItems?.length) {
      return NextResponse.json({ error: "cartItems is required" }, { status: 400 });
    }
    if (totalAmount === undefined || totalAmount === null) {
      return NextResponse.json({ error: "totalAmount is required" }, { status: 400 });
    }
    if (!currency) {
      return NextResponse.json({ error: "currency is required" }, { status: 400 });
    }
    if (!customerDetails?.firstName || !customerDetails?.lastName) {
      return NextResponse.json({ error: "customerDetails.firstName and customerDetails.lastName are required" }, { status: 400 });
    }

    const normalisedCurrency = currency.toUpperCase();
    const countryCode = CURRENCY_TO_COUNTRY[normalisedCurrency] || "AE";
    const locale = LANG_TO_LOCALE[lang] || "en_US";

    const toFixed = (val: unknown): string => {
      const num = Number(val ?? 0);
      return Number.isNaN(num) ? "0.000" : num.toFixed(3);
    };

    const baseUrl = (
      process.env.NEXT_PUBLIC_BASE_URL ||
      process.env.NEXTAUTH_URL ||
      "https://www.shanfaglobal.com"
    ).replace(/\/$/, "");

    const orderRef = `chk-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    const items = cartItems.map((item: Record<string, unknown>, idx: number) => {
      const unitPrice = Number(item.price ?? 0);
      const qty = Number(item.quantity ?? 1);
      return {
        reference_id: item.id || `ITEM-${idx}`,
        sku: item.sku || item.id || `SKU-${idx}`,
        name: item.name || "Product",
        type: "Physical",
        unit_price: {
          amount: unitPrice.toFixed(3),
          currency: normalisedCurrency,
        },
        quantity: qty,
        total_amount: {
          amount: (unitPrice * qty).toFixed(3),
          currency: normalisedCurrency,
        },
        image_url: item.imageUrl || undefined,
      };
    });

    const consumer = {
      first_name: customerDetails.firstName,
      last_name: customerDetails.lastName,
      email: customerDetails.email || "customer@example.com",
      phone_number: customerDetails.phone || "+971500000001",
    };

    const address = {
      first_name: customerDetails.firstName,
      last_name: customerDetails.lastName,
      address_line1: customerDetails.addressLine1 || "Address Line 1",
      address_line2: customerDetails.addressLine2 || "",
      city: customerDetails.city || "City",
      region: customerDetails.region || "",
      postal_code: customerDetails.postalCode || "",
      country_code: countryCode,
      phone_number: customerDetails.phone || "+971500000001",
    };

    const payload = {
      order_reference_id: orderRef,
      description: `Order ${orderRef}`,
      country_code: countryCode,
      locale,
      payment_type: "pay_later",
      items,
      consumer,
      billing_address: { ...address },
      shipping_address: { ...address },
      total_amount: { amount: toFixed(totalAmount), currency: normalisedCurrency },
      shipping_amount: { amount: toFixed(customerDetails.shippingAmount ?? 0), currency: normalisedCurrency },
      tax_amount: { amount: toFixed(customerDetails.taxAmount ?? 0), currency: normalisedCurrency },
      discount: {
        amount: toFixed(customerDetails.discountAmount ?? 0),
        currency: normalisedCurrency,
        name: customerDetails.discountName || "Discount",
      },
      merchant_url: {
        success: `${baseUrl}/cart?tamara_status=success&ref=${orderRef}`,
        cancel: `${baseUrl}/cart?tamara_status=cancel&ref=${orderRef}`,
        failure: `${baseUrl}/cart?tamara_status=failure&ref=${orderRef}`,
        notification: `${baseUrl}/api/payments/tamara/webhook`,
      },
    };

    const tamaraApiUrl = (process.env.TAMARA_API_URL || "https://api-sandbox.tamara.co").trim();
    const accessToken = (process.env.TAMARA_ACCESS_TOKEN || "").trim();

    if (!accessToken) {
      return NextResponse.json({ error: "Tamara access token not configured" }, { status: 500 });
    }

    const response = await fetch(`${tamaraApiUrl}/checkout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        "Tamara-Version": "2.0",
      },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();

    if (!response.ok) {
      let errorData: Record<string, unknown>;
      try {
        errorData = JSON.parse(responseText);
      } catch {
        errorData = { message: responseText };
      }

      console.error("[Tamara Checkout] API error:", JSON.stringify(errorData, null, 2));

      const message =
        (errorData.message as string) ||
        (errorData.errors as Array<{ message: string }>)?.[0]?.message ||
        `Tamara API responded with status ${response.status}`;

      return NextResponse.json(
        { error: message },
        { status: response.status }
      );
    }

    let data: Record<string, unknown>;
    try {
      data = JSON.parse(responseText);
    } catch {
      return NextResponse.json({ error: "Invalid response from Tamara API" }, { status: 502 });
    }

    return NextResponse.json({
      success: true,
      checkoutId: data.checkout_id,
      checkoutUrl: data.checkout_url,
      status: data.status,
    });
  } catch (error: unknown) {
    console.error("[Tamara Checkout] Unexpected error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
