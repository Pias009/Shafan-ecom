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
  // MASTER TRY-CATCH to prevent any 500 without a message
  try {
    let body;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 });
    }

    const { orderId } = body;
    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }

    console.log(`[Tamara Session] Starting for Order ID: ${orderId}`);

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      console.error(`[Tamara Session] Order not found: ${orderId}`);
      return NextResponse.json({ error: `Order not found: ${orderId}` }, { status: 404 });
    }

    // Safety check for status
    if (order.status !== "ORDER_RECEIVED" && order.paymentStatus === "PAID") {
      return NextResponse.json({ error: "Order is already paid" }, { status: 400 });
    }

    let countryCode = (order.shippingAddress as any)?.country?.toUpperCase() || "AE";
    
    // AUTO-CORRECTION FOR TESTING FROM BANGLADESH
    if (countryCode === "BD" || process.env.NODE_ENV === "development") {
      console.log("DEBUG: Auto-correcting Bangladesh/Dev address to UAE for Tamara testing");
      countryCode = "AE";
    }

    const regionConfig = COUNTRY_TO_REGION[countryCode] || COUNTRY_TO_REGION["AE"];
    const { region, currency, phonePrefix } = regionConfig;

    const tamaraService = new TamaraService();
    const billingAddress = order.billingAddress as any;
    const shippingAddress = order.shippingAddress as any;

    const toFixed = (val: any) => {
      if (val === null || val === undefined) return "0.00";
      try {
        const num = Number(val.toString());
        return isNaN(num) ? "0.00" : num.toFixed(2);
      } catch (e) {
        return "0.00";
      }
    };

    const formatPhone = (raw: string | undefined) => {
      // If testing from Bangladesh, use a guaranteed Tamara sandbox test number
      if (countryCode === "AE" && (order.shippingAddress as any)?.country?.toUpperCase() === "BD") {
        return "+971500000001";
      }
      const phone = raw || "501234567";
      const clean = phone.replace(/^(\+971|971|\+966|966|\+965|965|\+973|973|\+974|974|\+968|968|0)/, "");
      return `${phonePrefix}${clean}`;
    };

    const getBaseUrl = () => {
      let url = process.env.NEXT_PUBLIC_BASE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://www.shanfaglobal.com");
      if (!url.startsWith("http")) url = `https://${url}`;
      return url.replace(/\/$/, "");
    };

    const baseUrl = getBaseUrl();

    console.log(`[Tamara Session] Creating session for ${order.id} in ${region} (${currency})`);

    const session = await tamaraService.createSession({
      orderReferenceId: order.id,
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
        let up = Number(item.unitPrice || 0);
        
        // SMART MATH FIX: If (unitPrice * qty) is way higher than the order total, 
        // it means unitPrice is likely the subtotal for that line item.
        if (up * qty > (order.total || 0) && up > 0) {
          up = up / qty;
        }

        return {
          sku: item.productId || `SKU-${index}`,
          name: item.nameSnapshot || "Product Item",
          type: "physical" as const,
          unitPrice: { amount: up.toFixed(2), currency },
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
      headers: {
        "Cache-Control": "no-store, max-age=0",
      }
    });

  } catch (error: any) {
    console.error("CRITICAL Tamara error:", error);
    
    return NextResponse.json(
      { 
        error: error.message || (typeof error === 'object' ? JSON.stringify(error) : String(error)) || "Unknown Tamara Error",
        debug: {
          url: process.env.TAMARA_API_URL,
          token_present: !!process.env.TAMARA_ACCESS_TOKEN,
          base_url: process.env.NEXT_PUBLIC_BASE_URL,
          vercel_url: process.env.VERCEL_URL
        }
      },
      { 
        status: 500,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        }
      }
    );
  }
}
