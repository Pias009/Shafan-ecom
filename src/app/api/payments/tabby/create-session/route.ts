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
            status: { not: "CANCELLED" },
            // Strictly exclude the active session being created
            id: { not: orderId },
          },
          select: {
            id: true,
            createdAt: true,
            total: true,
            currency: true,
            status: true,
            paymentMethod: true,
            email: true,
            shippingAddress: true,
            items: {
              select: {
                nameSnapshot: true,
                quantity: true,
                unitPrice: true,
              },
              take: 5,
            },
          },
          orderBy: { createdAt: "desc" },
          // Up to 10 past orders as required by Tabby pre-scoring spec
          take: 10,
        });

        // Count of successfully completed paid orders for loyalty_level
        loyaltyLevel = pastOrders.filter(
          (o) => o.status === "ORDER_CONFIRMED" || o.status === "DELIVERED"
        ).length;

        if (pastOrders && pastOrders.length > 0) {
          const shippingAddr = order.shippingAddress as any;
          const buyerName = shippingAddr?.first_name
            ? `${shippingAddr.first_name} ${shippingAddr.last_name || ""}`.trim()
            : "Customer";
          const buyerPhone = formatPhone(
            shippingAddr?.phone || (order.billingAddress as any)?.phone
          );

          orderHistory = pastOrders.map((o) => {
            const oCurrency = (o.currency || currency).toUpperCase();
            const oDecimals = ["KWD", "BHD", "OMR"].includes(oCurrency) ? 3 : 2;
            const oAddr = o.shippingAddress as any;
            return {
              purchased_at: o.createdAt.toISOString(),
              amount: Number(o.total || 0).toFixed(oDecimals),
              currency: oCurrency,
              // Map payment method to Tabby-accepted values
              payment_method: (() => {
                const pm = (o.paymentMethod || "card").toLowerCase();
                if (pm === "tabby") return "card";
                if (pm === "tamara") return "card";
                if (pm === "cod") return "cash";
                return "card";
              })(),
              status:
                o.status === "ORDER_CONFIRMED" || o.status === "DELIVERED"
                  ? "complete"
                  : "processing",
              buyer: {
                email: o.email || buyerEmail,
                phone: buyerPhone,
                name: buyerName,
              },
              order: {
                reference_id: o.id,
                items: (o.items || []).map((item) => ({
                  title: item.nameSnapshot || "Product",
                  quantity: item.quantity || 1,
                  unit_price: Number(item.unitPrice || 0).toFixed(oDecimals),
                })),
              },
              shipping_address: {
                city:
                  oAddr?.city ||
                  (countryCode === "KW"
                    ? "Kuwait City"
                    : countryCode === "SA"
                    ? "Riyadh"
                    : "Dubai"),
                address:
                  oAddr?.address_1 ||
                  (countryCode === "KW"
                    ? "Kuwait City"
                    : countryCode === "SA"
                    ? "Riyadh"
                    : "Dubai Mall"),
                zip: oAddr?.postal_code || "00000",
              },
            };
          });
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
    if (order.user?.createdAt) {
      registeredSince = order.user.createdAt.toISOString();
    } else {
      // For guest users default to 1 year ago (safer pre-scoring baseline)
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      registeredSince = oneYearAgo.toISOString();
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
        success: `${process.env.NEXT_PUBLIC_SITE_URL || baseUrl}/checkout/success?order_id=${order.id}&payment=tabby`,
        cancel: `${process.env.NEXT_PUBLIC_SITE_URL || baseUrl}/checkout/payment/${order.id}?status=cancel&orderId=${order.id}&canceled=tabby`,
        failure: `${process.env.NEXT_PUBLIC_SITE_URL || baseUrl}/checkout/payment/${order.id}?status=reject&orderId=${order.id}&rejected=tabby`,
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
        loyalty_level: loyaltyLevel,
      },
      shippingAddress: {
        address: shippingAddress?.address_1 || (countryCode === "KW" ? "Kuwait City" : countryCode === "SA" ? "Riyadh" : "Dubai Mall"),
        city: shippingAddress?.city || (countryCode === "KW" ? "Kuwait City" : countryCode === "SA" ? "Riyadh" : "Dubai"),
        zip: shippingAddress?.postal_code || (countryCode === "SA" ? "12211" : "00000"),
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

    console.log("[Tabby] Session Response status:", session.status);

    const checkoutUrl =
      session.web_url ||
      session.configuration?.available_products?.installments?.[0]?.web_url;

    // ── PRE-SCORING REJECTION: guard before any DB mutation ─────────────────
    // If Tabby rejects (e.g., '2-background-pre-scoring-reject' test credentials
    // or any live rejection), return the official error message and do NOT
    // write tabbySessionId / tabbyPaymentId to the order — the order stays
    // in ORDER_RECEIVED so the customer can retry with another method.
    if (session.status === "REJECTED" || !checkoutUrl) {
      const rejectionCode = session.rejection_reason_code || "NOT_AVAILABLE";
      console.warn(`[Tabby] Session rejected: ${rejectionCode} for order ${orderId}`);
      // Official Tabby user-facing error as per integration docs
      return NextResponse.json(
        {
          success: false,
          status: session.status,
          rejection_reason_code: rejectionCode,
          // Exact message from Tabby integration guide
          error: "Tabby is unable to approve this purchase. Please use an alternative payment method for your order.",
        },
        { status: 400 }
      );
    }
    // ────────────────────────────────────────────────────────────────────────

    // Only update DB after confirming the session is valid and a checkout URL exists
    await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentMethod: "tabby",
        paymentMethodTitle: "Tabby",
        tabbySessionId: session.id,
        tabbyPaymentId: session.payment.id,
        ...(overrideEmail ? { email: overrideEmail } : {}),
        ...(overridePhone
          ? {
              shippingAddress: {
                ...(order.shippingAddress as any),
                phone: overridePhone,
              },
            }
          : {}),
      },
    });

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
