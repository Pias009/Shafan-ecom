import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TabbyService, TabbyRegion, TabbyCurrency } from "@/services/payments/tabby";

const COUNTRY_TO_REGION: Record<string, { region: TabbyRegion; currency: TabbyCurrency }> = {
  AE: { region: "UAE", currency: "AED" },
  SA: { region: "KSA", currency: "SAR" },
  KW: { region: "Kuwait", currency: "KWD" },
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, phone: overridePhone, email: overrideEmail } = body;

    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: {
              include: {
                productCategories: {
                  include: {
                    category: true
                  }
                }
              }
            }
          },
        },
        user: true,
      },
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
      if (countryCode === "AE" && currency === "SAR") countryCode = "SA";
      if (countryCode === "AE" && currency === "KWD") countryCode = "KW";
    }

    // IN DEVELOPMENT: Force UAE region and AED currency
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
      if (countryCode === "AE" && (order.shippingAddress as any)?.country?.toUpperCase() === "BD") {
        const randomDigits = Math.floor(1000000 + Math.random() * 9000000);
        return `+97150${randomDigits}`;
      }
      const phone = raw || "501234567";
      const digits = phone.replace(/\D/g, "");
      const clean = digits.replace(/^(971|966|965|973|974|968|0)/, "");
      const prefixes: Record<string, string> = {
        AE: "+971", SA: "+966", KW: "+965", BH: "+973", QA: "+974", OM: "+968",
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

    // ── Fetch buyer history for Tabby pre-scoring ──────────────────────────────
    let orderHistory: any[] = [];
    let registeredSince: string | null = null;
    let loyaltyLevel = 0;

    const buyerEmail = order.email || order.user?.email;

    if (buyerEmail) {
      try {
        const pastOrders = await prisma.order.findMany({
          where: {
            email: buyerEmail,
            paymentStatus: "PAID",
            status: { not: "CANCELLED" }
          },
          select: {
            createdAt: true,
            total: true,
            status: true
          },
          orderBy: { createdAt: "desc" },
          take: 5
        });
        
        if (pastOrders && pastOrders.length > 0) {
          orderHistory = pastOrders.map(o => ({
            purchased_at: o.createdAt.toISOString(),
            amount: Number(o.total || 0).toFixed(decimals),
            status: o.status === "ORDER_CONFIRMED" || o.status === "DELIVERED" ? "complete" : "processing"
          }));
        } else {
          orderHistory = [];
        }
      } catch (err) {
        console.error("Failed to fetch order history for Tabby:", err);
        orderHistory = [];
      }
    } else {
      orderHistory = [];
    }

    // registered_since: use user account creation date, or order creation as fallback
    // registered_since: use user account creation date, or a date at least 6 months old for pre-scoring
    if (order.user?.createdAt) {
      registeredSince = order.user.createdAt.toISOString();
    } else {
      // For guests/new users, simulate an older account to avoid risk loops
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      registeredSince = sixMonthsAgo.toISOString();
    }
    // ─────────────────────────────────────────────────────────────────────────

    const calculatedItemsTotal = order.items.reduce((sum, item) => sum + (Number(item.unitPrice || 0) * (item.quantity || 1)), 0);
    const calculatedTotal = Number((calculatedItemsTotal + Number(order.shipping || 0) + Number(order.taxAmount || 0) - Number(order.discount || 0)).toFixed(decimals));

    const session = await tabbyService.createSession({
      amount: calculatedTotal,
      currency,
      orderId: order.id,
      orderReferenceId:
        process.env.NODE_ENV === "development"
          ? `${order.id}-${Date.now().toString().slice(-4)}`
          : order.id,
      description: `Order #${order.id.substring(0, 8)}`,
      merchant_urls: {
        success: `${baseUrl}/checkout/success?order_id=${order.id}&payment=tabby`,
        cancel: `${baseUrl}/checkout/payment/${order.id}?canceled=tabby`,
        failure: `${baseUrl}/checkout/payment/${order.id}?rejected=tabby`,
      },
      buyer: {
        email: (() => {
          if (overrideEmail) return overrideEmail;
          if (countryCode === "AE" && process.env.NODE_ENV === "development") {
            return "otp.success@tabby.ai";
          }
          return order.email || "test@example.com";
        })(),
        phone: formatPhone(overridePhone || shippingAddress?.phone || billingAddress?.phone),
        name: shippingAddress?.first_name
          ? `${shippingAddress.first_name} ${shippingAddress.last_name || ""}`.trim()
          : billingAddress?.first_name
            ? `${billingAddress.first_name} ${billingAddress.last_name || ""}`.trim()
            : "Test Customer",
        // Tabby pre-scoring fields
        registered_since: registeredSince,
        loyalty_level: process.env.NODE_ENV === "development" ? 0 : loyaltyLevel,
      },
      shippingAddress: {
        address: shippingAddress?.address_1 || "Dubai Mall",
        city: shippingAddress?.city || "Dubai",
        zip: shippingAddress?.postal_code || "00000",
      },
      items: order.items.map((item) => {
        const qty = item.quantity || 1;
        const up = Number(item.unitPrice || 0);
        // Resolve real category from product relation
        const rawCategory =
          (item.product as any)?.productCategories?.[0]?.category?.name ||
          (item.product as any)?.categoryName ||
          "General";
        const category = typeof rawCategory === "string" ? rawCategory : "General";

        return {
          title: item.nameSnapshot,
          description: item.nameSnapshot,
          quantity: qty,
          unitPrice: up.toFixed(decimals),
          imageUrl: item.imageSnapshot || undefined,
          category,
        };
      }),
      order_history: orderHistory,
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
        paymentMethodTitle: "Tabby | Pay in 4 interest-free payments",
        tabbySessionId: session.id,
        tabbyPaymentId: session.payment.id,
        // Update order details if overrides provided
        ...(overrideEmail ? { email: overrideEmail } : {}),
        ...(overridePhone ? {
          shippingAddress: {
            ...(order.shippingAddress as any),
            phone: overridePhone
          }
        } : {}),
      },
    });

    console.log("Tabby Session Response:", JSON.stringify(session, null, 2));

    const checkoutUrl =
      session.web_url ||
      session.configuration?.available_products?.installments?.[0]?.web_url;

    // Pre-scoring rejection: do NOT mark order as confirmed
    if (session.status === "REJECTED" || !checkoutUrl) {
      const rejectionCode = session.rejection_reason_code || "NOT_AVAILABLE";
      console.warn(`[Tabby] Session rejected: ${rejectionCode} for order ${orderId}`);
      return NextResponse.json(
        {
          success: false,
          status: session.status,
          rejection_reason_code: rejectionCode,
          error: `Tabby rejected this session: ${rejectionCode}`,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      paymentId: session.payment?.id,
      checkoutUrl,
      status: session.status,
    });
  } catch (error: any) {
    console.error("Tabby session creation error:", error);
    return new NextResponse(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to create Tabby session",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
