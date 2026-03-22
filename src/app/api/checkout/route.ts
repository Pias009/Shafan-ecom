import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";

// Helper function to determine courier based on shipping address
function determineCourier(shippingAddress: any): string {
  if (!shippingAddress || !shippingAddress.country) {
    return "GLOBAL_COURIER"; // Default to global courier
  }

  const country = shippingAddress.country.toString().toLowerCase().trim();
  
  // Check if the order is from Kuwait
  if (country === "kuwait" || country === "kw") {
    return "KUWAIT_COURIER";
  }
  
  return "GLOBAL_COURIER";
}

// Helper function to generate tracking code
function generateTrackingCode(courier: string): string {
  const prefix = courier === "KUWAIT_COURIER" ? "KW" : "GL";
  const random = Math.random().toString(36).substring(2, 10).toUpperCase();
  return `${prefix}-${random}-${Date.now().toString().slice(-6)}`;
}

export async function POST(req: Request) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { items, couponCode } = await req.json();

    // 1. Fetch address from Prisma
    const address = await prisma.address.findUnique({
      where: { userId: session.user.id }
    });

    if (!address) {
      return NextResponse.json({ error: "Shipping address not found" }, { status: 400 });
    }

    // 2. Calculate subtotals by fetching real products (critical for safety)
    let subtotalCents = 0;
    const orderItems = [];

    for (const item of items) {
      if (!/^[0-9a-fA-F]{24}$/.test(item.productId)) {
        console.warn(`Skipping invalid product ID in checkout: ${item.productId}`);
        continue;
      }

      const product = await prisma.product.findUnique({
        where: { id: item.productId }
      });
      if (!product) throw new Error("Product not found: " + item.productId);

      const price = product.discountCents ? (product.priceCents - product.discountCents) : product.priceCents;
      subtotalCents += price * item.quantity;
      
      orderItems.push({
        productId: product.id,
        quantity: item.quantity,
        unitPriceCents: price,
        nameSnapshot: product.name,
        imageSnapshot: product.mainImage
      });
    }

    // Determine courier based on shipping address
    const shippingAddress = {
      country: address.country || "BD"
    };
    const courier = determineCourier(shippingAddress);
    const trackingCode = generateTrackingCode(courier);

    // 3. Create Order with shipment
    const order = await prisma.order.create({
      data: {
        userId: session.user.id,
        email: session.user.email,
        status: OrderStatus.PENDING_PAYMENT,
        currency: "usd",
        subtotalCents,
        totalCents: subtotalCents, // Simplified
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
        paymentMethod: "stripe",
        paymentMethodTitle: "Stripe Online",
        items: {
          create: orderItems
        },
        // Create shipment record with selected courier
        shipment: {
          create: {
            courier,
            trackingCode,
            trackingUrl: courier === "KUWAIT_COURIER"
              ? `https://kuwait-courier.com/track/${trackingCode}`
              : `https://global-courier.com/track/${trackingCode}`,
            status: "Created"
          }
        }
      },
      include: {
        shipment: true
      }
    });

    return NextResponse.json({
      orderId: order.id,
      url: `/checkout/payment/${order.id}`,
      courier: order.shipment?.courier,
      trackingCode: order.shipment?.trackingCode
    });
  } catch (error: any) {
    console.error("Prisma Checkout Error:", error.message);
    return NextResponse.json({ error: "Failed to create order in MongoDB" }, { status: 500 });
  }
}
