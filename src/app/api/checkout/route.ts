import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";

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
    const countryCode = requestCountry || address.country || 'AE';
    const currency = getCurrencyForCountry(countryCode);


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
            where: { country: countryCode.toUpperCase(), active: true }
          }
        }
      });
      if (!product) throw new Error("Product not found: " + item.productId);

      // STRICT PRICE VALIDATION: Only use DB price for selected country
      // No multipliers or conversions - database is the ONLY source of truth
      let price = 0;
      if (product.countryPrices && product.countryPrices.length > 0) {
        price = Number(product.countryPrices[0].price) || 0;
      }
      
      // If no country-specific price exists, reject the order
      if (price <= 0) {
        return NextResponse.json({ 
          error: `Product "${product.name}" is not available for ${countryCode}. Please select a different shipping country.` 
        }, { status: 400 });
      }

      // CRITICAL: Validate that the client-submitted price matches the DB price
      // If user manipulated the price client-side, reject the transaction
      const clientSubmittedPrice = item.unitPrice;
      if (clientSubmittedPrice && Math.abs(clientSubmittedPrice - price) > 0.01) {
        console.warn(`Price mismatch for product ${product.id}: client=${clientSubmittedPrice}, db=${price}`);
        return NextResponse.json({ 
          error: `Price validation failed for "${product.name}". Please refresh and try again.` 
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
      return NextResponse.json({ error: "Order total must be greater than 0. Please check product prices." }, { status: 400 });
    }

    // Determine courier based on shipping address
    const shippingAddress = {
      country: address.country || "BD"
    };
    const courier = determineCourier(shippingAddress);
    const trackingCode = generateTrackingCode();

    const total = subtotal;

    // 3. Create Order (payment pending - will be set at payment step)
    const order = await prisma.order.create({
      data: {
        userId: session.user.id,
        email: session.user.email,
        status: OrderStatus.ORDER_RECEIVED,
        paymentStatus: "PENDING" as any,
        currency: currency.toLowerCase(),
        subtotal,
        total,
        billingAddress: {
          first_name: address.fullName?.split(" ")[0] || "",
          last_name: address.fullName?.split(" ").slice(1).join(" ") || "",
          address_1: address.address1 || "",
          address_2: address.address2 || "",
          city: address.city || "",
          postcode: address.postalCode || "",
          country: address.country || "BD",
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
          country: address.country || "BD",
        },
        // paymentMethod set by user at payment step
        items: {
          create: orderItems
        },
      },
      include: {
        items: true,
      }
    });

    return NextResponse.json({
      orderId: order.id,
      url: `/checkout/payment/${order.id}`,
    });
  } catch (error: any) {
    console.error("Prisma Checkout Error:", error.message);
    return NextResponse.json({ error: "Failed to create order in MongoDB" }, { status: 500 });
  }
}
