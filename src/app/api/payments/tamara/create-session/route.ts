import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { TamaraService, TamaraRegion, TamaraCurrency } from "@/services/payments/tamara";

const prisma = new PrismaClient();

const COUNTRY_TO_REGION: Record<string, { region: TamaraRegion; currency: TamaraCurrency }> = {
  AE: { region: "UAE", currency: "AED" },
  SA: { region: "SAU", currency: "SAR" },
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

    if (order.status !== "PENDING_PAYMENT") {
      return NextResponse.json({ error: "Order is not pending payment" }, { status: 400 });
    }

    const countryCode = (order.shippingAddress as any)?.country?.toUpperCase() || "AE";
    const regionConfig = COUNTRY_TO_REGION[countryCode] || COUNTRY_TO_REGION["AE"];
    const { region, currency } = regionConfig;

    const tamaraService = new TamaraService(region);

    const billingAddress = order.billingAddress as any;
    const shippingAddress = order.shippingAddress as any;

    const session = await tamaraService.createSession({
      orderReferenceId: order.id,
      description: `Order #${order.id.substring(0, 8)}`,
      currency,
      locale: "en-US",
      paymentType: "pay_later",
      consumer: {
        firstName: shippingAddress?.first_name || billingAddress?.first_name || "Customer",
        lastName: shippingAddress?.last_name || billingAddress?.last_name || "",
        email: order.email || "",
        phone: shippingAddress?.phone || billingAddress?.phone || "",
        country: countryCode,
      },
      billingAddress: {
        firstName: billingAddress?.first_name || "Customer",
        lastName: billingAddress?.last_name || "",
        line1: billingAddress?.address_1 || "",
        line2: billingAddress?.address_2,
        city: billingAddress?.city || "",
        region: billingAddress?.state || "",
        postcode: billingAddress?.postal_code || "",
        country: billingAddress?.country || countryCode,
        phone: billingAddress?.phone,
      },
      shippingAddress: {
        firstName: shippingAddress?.first_name || "Customer",
        lastName: shippingAddress?.last_name || "",
        line1: shippingAddress?.address_1 || "",
        line2: shippingAddress?.address_2,
        city: shippingAddress?.city || "",
        region: shippingAddress?.state || "",
        postcode: shippingAddress?.postal_code || "",
        country: shippingAddress?.country || countryCode,
        phone: shippingAddress?.phone,
      },
      items: order.items.map((item, index) => ({
        sku: item.productId || `SKU-${index}`,
        name: item.nameSnapshot,
        type: "physical" as const,
        unitPrice: { amount: (item.unitPriceCents / 100).toFixed(2), currency },
        quantity: item.quantity,
        imageUrl: item.imageSnapshot || undefined,
      })),
      totalAmount: { amount: (order.totalCents / 100).toFixed(2), currency },
    });

    await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentMethod: "tamara",
        paymentMethodTitle: `Tamara ${currency === "AED" ? "Pay Later" : "Installments"}`,
        tamaraCheckoutId: session.id,
      },
    });

    return NextResponse.json({
      success: true,
      checkoutId: session.id,
      checkoutUrl: session.checkoutUrl,
      status: session.status,
    });

  } catch (error: any) {
    console.error("Tamara session creation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create Tamara session" },
      { status: 500 }
    );
  }
}
