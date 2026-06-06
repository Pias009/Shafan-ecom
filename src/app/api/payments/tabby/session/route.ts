import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TabbyService, TabbyRegion, TabbyCurrency, TabbyOrderHistoryEntry } from "@/services/payments/tabby";

const COUNTRY_TO_REGION: Record<string, { region: TabbyRegion; currency: TabbyCurrency }> = {
  AE: { region: "UAE", currency: "AED" },
  SA: { region: "KSA", currency: "SAR" },
  KW: { region: "Kuwait", currency: "KWD" },
};

const TABBY_REJECTION_ERRORS: Record<string, string> = {
  "2-background-pre-scoring-reject":
    "Sorry, Tabby is unable to approve this purchase. Please use an alternative payment method for your order.",
  not_available:
    "Sorry, Tabby is unable to approve this purchase. Please use an alternative payment method for your order.",
  order_amount_too_high:
    "This purchase is above your current spending limit with Tabby, try a smaller cart or use another payment method",
  order_amount_too_low:
    "The purchase amount is below the minimum amount required to use Tabby, try adding more items or use another payment method",
  REJECTED:
    "Sorry, Tabby is unable to approve this purchase. Please use an alternative payment method for your order.",
};

function getTabbyErrorMessage(rejectionCode: string): string {
  for (const [key, msg] of Object.entries(TABBY_REJECTION_ERRORS)) {
    if (rejectionCode.includes(key) || key.includes(rejectionCode)) {
      return msg;
    }
  }
  return "Sorry, Tabby is unable to approve this purchase. Please use an alternative payment method for your order.";
}

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
                  include: { category: true },
                },
              },
            },
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

    const shippingAddr = (order.shippingAddress ?? {}) as Record<string, unknown>;
    const billingAddr = (order.billingAddress ?? {}) as Record<string, unknown>;

    let countryCode = String(shippingAddr.country || "AE").toUpperCase();
    if (countryCode === "BD" || process.env.NODE_ENV === "development") {
      countryCode = "AE";
    }

    const regionConfig = COUNTRY_TO_REGION[countryCode] || COUNTRY_TO_REGION["AE"];
    let { region, currency } = regionConfig;

    const orderCurrency = (order.currency || "AED").toUpperCase() as TabbyCurrency;
    const supportedCurrencies: TabbyCurrency[] = ["AED", "SAR", "KWD"];
    if (supportedCurrencies.includes(orderCurrency)) {
      currency = orderCurrency;
      if (countryCode === "AE" && currency === "SAR") countryCode = "SA";
      if (countryCode === "AE" && currency === "KWD") countryCode = "KW";
    }

    if (process.env.NODE_ENV === "development") {
      region = "UAE";
      currency = "AED";
    }

    const decimals = ["KWD", "BHD", "OMR"].includes(currency) ? 3 : 2;
    const tabbyService = new TabbyService(region);

    const getStr = (obj: Record<string, unknown>, key: string, fallback = ""): string =>
      String(obj[key] ?? fallback);

    const formatPhone = (raw: string | undefined): string => {
      if (process.env.NODE_ENV === "development") return "+971500000001";
      const phone = raw || "501234567";
      const digits = phone.replace(/\D/g, "");
      const clean = digits.replace(/^(971|966|965|973|974|968|0)/, "");
      const prefixes: Record<string, string> = {
        AE: "+971", SA: "+966", KW: "+965", BH: "+973", QA: "+974", OM: "+968",
      };
      return `${prefixes[countryCode] || "+971"}${clean}`;
    };

    const getBaseUrl = (): string => {
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
    const buyerEmail = order.email || order.user?.email;

    let registeredSince: string | null = null;
    let loyaltyLevel = 0;
    let orderHistory: TabbyOrderHistoryEntry[] = [];

    if (order.user?.createdAt) {
      registeredSince = order.user.createdAt.toISOString();
    } else {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      registeredSince = sixMonthsAgo.toISOString();
    }

    if (buyerEmail) {
      try {
        const pastOrders = await prisma.order.findMany({
          where: {
            email: buyerEmail,
            // Include orders in ANY status (paid, cancelled, etc.) per Tabby spec
            id: { not: orderId },
          },
          select: {
            id: true,
            createdAt: true,
            total: true,
            currency: true,
            paymentMethod: true,
            paymentStatus: true,
            status: true,
            email: true,
            shippingAddress: true,
            items: {
              select: {
                nameSnapshot: true,
                quantity: true,
                unitPrice: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        });

        loyaltyLevel = pastOrders.filter(
          (o) => o.paymentStatus === "PAID" && (o.status === "ORDER_CONFIRMED" || o.status === "DELIVERED")
        ).length;

        orderHistory = pastOrders.map((o) => {
          const addr = (o.shippingAddress ?? {}) as Record<string, unknown>;
          return {
            purchased_at: o.createdAt.toISOString(),
            amount: Number(o.total || 0).toFixed(decimals),
            currency: o.currency || currency,
            payment_method: (() => {
              const pm = (o.paymentMethod || "card").toLowerCase();
              if (pm === "cod") return "cod";
              return "card";
            })(),
            status: (() => {
              if (o.status === "ORDER_CONFIRMED" || o.status === "DELIVERED") return "complete";
              if (o.status === "CANCELLED") return "canceled";
              if (o.paymentStatus === "PAID") return "complete";
              return "processing";
            })(),
            buyer: {
              email: o.email || buyerEmail,
              phone: formatPhone(getStr(addr, "phone")),
              name: getStr(addr, "first_name") + (getStr(addr, "last_name") ? ` ${getStr(addr, "last_name")}` : ""),
            },
            order: {
              reference_id: o.id,
              items: o.items.map((item) => ({
                title: item.nameSnapshot,
                quantity: item.quantity,
                unit_price: Number(item.unitPrice || 0).toFixed(decimals),
              })),
            },
            shipping_address: {
              city: getStr(addr, "city"),
              address: getStr(addr, "address_1"),
              zip: getStr(addr, "postal_code"),
            },
          };
        });
      } catch (err) {
        console.error("[Tabby Session] Failed to fetch order history:", err);
      }
    }

    const calculatedItemsTotal = order.items.reduce(
      (sum, item) => sum + (Number(item.unitPrice || 0) * (item.quantity || 1)),
      0,
    );
    const calculatedTotal = Number(
      (
        calculatedItemsTotal +
        Number(order.shipping || 0) +
        Number(order.taxAmount || 0) -
        Number(order.discount || 0)
      ).toFixed(decimals),
    );

    const buyerName =
      getStr(shippingAddr, "first_name") +
      (getStr(shippingAddr, "last_name") ? ` ${getStr(shippingAddr, "last_name")}` : "");
    const fallbackBuyerName =
      getStr(billingAddr, "first_name") +
      (getStr(billingAddr, "last_name") ? ` ${getStr(billingAddr, "last_name")}` : "");

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
        cancel: `${baseUrl}/checkout/payment/${order.id}?status=cancel&orderId=${order.id}&canceled=tabby`,
        failure: `${baseUrl}/checkout/payment/${order.id}?status=reject&orderId=${order.id}&rejected=tabby`,
      },
      buyer: {
        email: (() => {
          if (overrideEmail) return overrideEmail;
          if (countryCode === "AE" && process.env.NODE_ENV === "development") {
            return "otp.success@tabby.ai";
          }
          return order.email || "test@example.com";
        })(),
        phone: formatPhone(overridePhone || getStr(shippingAddr, "phone") || getStr(billingAddr, "phone")),
        name: buyerName || fallbackBuyerName || "Test Customer",
        registered_since: registeredSince ?? undefined,
        loyalty_level: loyaltyLevel,
      },
      shippingAddress: {
        address: getStr(shippingAddr, "address_1") || (countryCode === "KW" ? "Kuwait City" : countryCode === "SA" ? "Riyadh" : "Dubai Mall"),
        city: getStr(shippingAddr, "city") || (countryCode === "KW" ? "Kuwait City" : countryCode === "SA" ? "Riyadh" : "Dubai"),
        zip: getStr(shippingAddr, "postal_code") || (countryCode === "SA" ? "12211" : "00000"),
      },
      items: order.items.map((item) => {
        const qty = item.quantity || 1;
        const up = Number(item.unitPrice || 0);
        const productWithCategories = item.product as unknown as {
          productCategories?: Array<{ category?: { name?: string } }>;
          categoryName?: string;
        };
        const rawCategory =
          productWithCategories?.productCategories?.[0]?.category?.name ||
          productWithCategories?.categoryName ||
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

    const checkoutUrl =
      session.web_url ||
      session.configuration?.available_products?.installments?.[0]?.web_url;

    if (session.status === "REJECTED" || !checkoutUrl) {
      const rejectionCode = session.rejection_reason_code || "REJECTED";
      const userMessage = getTabbyErrorMessage(rejectionCode);

      console.warn(`[Tabby Session] Rejected: ${rejectionCode} for order ${orderId}`);

      return NextResponse.json(
        {
          success: false,
          status: session.status,
          rejection_reason_code: rejectionCode,
          error: userMessage,
        },
        { status: 400 },
      );
    }

    await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentMethod: "tabby",
        paymentMethodTitle: "Pay later with Tabby",
        tabbySessionId: session.id,
        tabbyPaymentId: session.payment.id,
        ...(overrideEmail ? { email: overrideEmail } : {}),
        ...(overridePhone
          ? {
              shippingAddress: {
                ...shippingAddr,
                phone: overridePhone,
              },
            }
          : {}),
      },
    });

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      paymentId: session.payment.id,
      checkoutUrl,
      status: session.status,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create Tabby session";
    console.error("[Tabby Session] Creation error:", message);
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 },
    );
  }
}
