import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TamaraService, TamaraRegion, TamaraCurrency } from "@/services/payments/tamara";

const COUNTRY_TO_REGION: Record<string, { region: TamaraRegion; currency: TamaraCurrency }> = {
  AE: { region: "UAE", currency: "AED" },
  SA: { region: "SAU", currency: "SAR" },
  KW: { region: "KWT", currency: "KWD" },
  BH: { region: "BHR", currency: "BHD" },
  QA: { region: "QAT", currency: "QAR" },
  OM: { region: "OMN", currency: "OMR" },
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
      console.log("DEBUG: Auto-correcting Bangladesh/Dev address to UAE for Tamara testing");
      countryCode = "AE";
    }

    const regionConfig = COUNTRY_TO_REGION[countryCode] || COUNTRY_TO_REGION["AE"];
    const { region, currency } = regionConfig;

    const tamaraService = new TamaraService();

    const billingAddress = order.billingAddress as any;
    const shippingAddress = order.shippingAddress as any;

    const formatPhone = (raw: string | undefined) => {
      // If testing from Bangladesh, use a guaranteed Tamara sandbox test number
      if (countryCode === "AE" && (order.shippingAddress as any)?.country?.toUpperCase() === "BD") {
        return "+971500000001";
      }
      const phone = raw || "501234567";
      const clean = phone.replace(/^(\+971|971|\+966|966|0)/, "");
      return `${countryCode === "SA" ? "+966" : "+971"}${clean}`;
    };

    const session = await tamaraService.createSession({
      orderReferenceId: order.id,
      description: `Order #${order.id.substring(0, 8)}`,
      currency,
      locale: "en-US",
      paymentType: "pay_later",
      consumer: {
        firstName: shippingAddress?.first_name || billingAddress?.first_name || "Customer",
        lastName: shippingAddress?.last_name || billingAddress?.last_name || "",
        email: order.email || "test@example.com",
        phone: formatPhone(shippingAddress?.phone || billingAddress?.phone),
        country: countryCode,
      },
      billingAddress: {
        firstName: billingAddress?.first_name || "Customer",
        lastName: billingAddress?.last_name || "",
        line1: billingAddress?.address_1 || "Dubai Mall",
        line2: billingAddress?.address_2,
        city: billingAddress?.city || "Dubai",
        region: billingAddress?.state || "Dubai",
        postcode: billingAddress?.postal_code || "00000",
        country: countryCode,
        phone: formatPhone(billingAddress?.phone),
      },
      shippingAddress: {
        firstName: shippingAddress?.first_name || "Customer",
        lastName: shippingAddress?.last_name || "",
        line1: shippingAddress?.address_1 || "Dubai Mall",
        line2: shippingAddress?.address_2,
        city: shippingAddress?.city || "Dubai",
        region: shippingAddress?.state || "Dubai",
        postcode: shippingAddress?.postal_code || "00000",
        country: countryCode,
        phone: formatPhone(shippingAddress?.phone),
      },
      items: order.items.map((item, index) => ({
        sku: item.productId || `SKU-${index}`,
        name: item.nameSnapshot,
        type: "physical" as const,
        unitPrice: { amount: Number(item.unitPrice).toFixed(2), currency },
        quantity: item.quantity,
        imageUrl: item.imageSnapshot || undefined,
      })),
      totalAmount: { amount: Number(order.total).toFixed(2), currency },
      shippingAmount: { amount: Number(order.shipping || 0).toFixed(2), currency },
      taxAmount: { amount: Number(order.taxAmount || 0).toFixed(2), currency },
      discount: order.discount ? {
        amount: Number(order.discount).toFixed(2),
        currency,
        name: "Order Discount"
      } : undefined,
      merchantUrls: {
        success: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/success?order_id=${order.id}&payment=tamara`,
        cancel: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/payment/${order.id}?canceled=tamara`,
        failure: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/payment/${order.id}?failed=tamara`,
        notification: `${process.env.NEXT_PUBLIC_BASE_URL}/api/payments/tamara/webhook`,
      },
    });

    await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentMethod: "tamara",
        paymentMethodTitle: `Tamara ${currency === "AED" ? "Pay Later" : "Installments"}`,
        tamaraCheckoutId: session.checkout_id,
      },
    });

    return NextResponse.json({
      success: true,
      checkoutId: session.checkout_id,
      checkoutUrl: session.checkout_url,
      status: session.status,
    });

  } catch (error: any) {
    console.error("Tamara session creation error:", error);
    
    // Include debug info so we can diagnose env var issues on Vercel
    const tamaraUrl = process.env.TAMARA_API_URL || "NOT SET (using default sandbox)";
    const tokenPresent = !!process.env.TAMARA_ACCESS_TOKEN;
    const tokenPrefix = process.env.TAMARA_ACCESS_TOKEN?.substring(0, 20) || "MISSING";
    
    return NextResponse.json(
      { 
        error: error.message || "Failed to create Tamara session",
        debug: {
          tamara_api_url: tamaraUrl,
          token_present: tokenPresent,
          token_prefix: tokenPrefix + "...",
        }
      },
      { status: 500 }
    );
  }
}
