import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";
import { notifyNewOrder } from "@/lib/pusher";
import { COUNTRY_CONFIG } from "@/lib/address-config";

// Helper function to determine courier based on shipping address
function determineCourier(shippingAddress: any): string {
  return "GLOBAL_COURIER";
}

// Helper function to generate tracking code
function generateTrackingCode(): string {
  const prefix = "GL";
  const random = Math.random().toString(36).substring(2, 10).toUpperCase();
  return `${prefix}-${random}-${Date.now().toString().slice(-6)}`;
}

// Helper to get currency for country
function getCurrencyForCountry(country: string): string {
  const currencies: Record<string, string> = {
    AE: 'AED',
    KW: 'KWD',
    SA: 'SAR',
    BH: 'BHD',
    OM: 'OMR',
    QA: 'QAR',
    BD: 'BDT',
  };
  return currencies[country?.toUpperCase()] || 'USD';
}

export async function POST(req: Request) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { items, country: requestCountry } = await req.json();

    // 1. Fetch address from Prisma
    const address = await prisma.address.findUnique({
      where: { userId: session.user.id }
    });

    if (!address) {
      return NextResponse.json({ error: "Shipping address not found" }, { status: 400 });
    }

    // Use country from request or address
    const countryCode = (requestCountry || address.country || 'AE').toUpperCase();
    const currency = getCurrencyForCountry(countryCode);
    const countryConfig = COUNTRY_CONFIG[countryCode as keyof typeof COUNTRY_CONFIG];

    if (!countryConfig) {
      return NextResponse.json({ error: `Unsupported country: ${countryCode}` }, { status: 400 });
    }

    // 2. Calculate subtotals by fetching real products with country pricing (strict DB prices)
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      if (!/^[0-9a-fA-F]{24}$/.test(item.productId)) {
        console.warn(`Skipping invalid product ID in checkout: ${item.productId}`);
        continue;
      }

      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        include: {
          countryPrices: {
            where: { country: countryCode, active: true }
          }
        }
      });
      if (!product) throw new Error("Product not found: " + item.productId);

      // STRICT PRICE VALIDATION
      let price = 0;
      if (product.countryPrices && product.countryPrices.length > 0) {
        const cp = product.countryPrices[0] as any;
        const discountPriceVal = cp.discountPrice ?? product.discountPrice;
        const hasDiscount = !!(discountPriceVal && Number(discountPriceVal) > 0 && Number(discountPriceVal) < Number(cp.price));
        
        price = hasDiscount ? Number(discountPriceVal) : Number(cp.price) || 0;
      }
      
      if (price <= 0) {
        return NextResponse.json({ 
          error: `Product "${product.name}" is not available for ${countryCode}.` 
        }, { status: 400 });
      }

      subtotal += price * item.quantity;
      
      orderItems.push({
        productId: product.id,
        quantity: item.quantity,
        unitPrice: price,
        nameSnapshot: product.name,
        imageSnapshot: product.mainImage
      });
    }

    // Validate total
    if (subtotal <= 0) {
      return NextResponse.json({ error: "Order total must be greater than 0." }, { status: 400 });
    }

    // Calculate Shipping
    const shippingFee = subtotal >= countryConfig.freeDelivery ? 0 : countryConfig.deliveryFee;
    
    // Calculate Tax
    const taxRate = countryConfig.taxRate || 0;
    const preTaxTotal = subtotal + shippingFee;
    const taxAmount = Math.round(preTaxTotal * taxRate * 100) / 100;
    const total = preTaxTotal + taxAmount;

    const courier = determineCourier({ country: countryCode });
    const trackingCode = generateTrackingCode();

    // 3. Create Order (payment pending - will be set at payment step)
    const order = await prisma.order.create({
      data: {
        userId: session.user.id,
        email: session.user.email,
        status: OrderStatus.ORDER_RECEIVED,
        paymentStatus: "PENDING" as any,
        currency: currency.toLowerCase(),
        subtotal,
        shipping: shippingFee,
        taxRate,
        taxAmount,
        total,
        billingAddress: {
          first_name: address.fullName?.split(" ")[0] || "",
          last_name: address.fullName?.split(" ").slice(1).join(" ") || "",
          address_1: address.address1 || "",
          address_2: address.address2 || "",
          city: address.city || "",
          postcode: address.postalCode || "",
          country: address.country || countryCode,
          email: session.user.email,
          phone: address.phone || "",
        },
        shippingAddress: {
          first_name: address.fullName?.split(" ")[0] || "",
          last_name: address.fullName?.split(" ").slice(1).join(" ") || "",
          address_1: address.address1 || "",
          address_2: address.address2 || "",
          city: address.city || "",
          postcode: address.postalCode || "",
          country: address.country || countryCode,
        },
        items: {
          create: orderItems
        },
      },
      include: {
        items: true,
      }
    });

    // Trigger real-time notification to admin panel
    notifyNewOrder({
      id: order.id,
      total: Number(order.total) || 0,
      currency: order.currency || "aed",
      userName: session.user.name || undefined,
      email: session.user.email || undefined,
    }).catch(console.error);

    return NextResponse.json({
      orderId: order.id,
      url: `/checkout/payment/${order.id}`,
    });
  } catch (error: any) {
    console.error("Prisma Checkout Error:", error.message);
    return NextResponse.json({ error: "Failed to create order in MongoDB" }, { status: 500 });
  }
}
