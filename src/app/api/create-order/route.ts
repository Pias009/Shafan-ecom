import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";

// Helper function to determine courier based on shipping address
function determineCourier(shippingAddress: any): string {
  if (!shippingAddress || !shippingAddress.country) {
    return "GLOBAL"; // Default to global courier
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
  try {
    const session = await getServerAuthSession();
    const body = await req.json();
    const { items, billing, shipping, payment_method, payment_method_title, couponCode } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    // Fetch user's address if not provided in request
    let finalBilling = billing;
    let finalShipping = shipping;
    
    if (!finalBilling || !finalShipping) {
      if (session?.user?.id) {
        const userAddress = await prisma.address.findUnique({
          where: { userId: session.user.id }
        });
        
        if (userAddress) {
          // Convert Prisma address to JSON object
          const addressJson = {
            fullName: userAddress.fullName,
            phone: userAddress.phone,
            email: userAddress.email,
            country: userAddress.country,
            city: userAddress.city,
            address1: userAddress.address1,
            address2: userAddress.address2 || "",
            postalCode: userAddress.postalCode
          };
          
          if (!finalBilling) finalBilling = addressJson;
          if (!finalShipping) finalShipping = addressJson;
        }
      }
    }

    // Calculate totals
    let subtotalCents = 0;
    const orderItemsData = [];
    let orderStoreId: string | null = null;
    let orderStoreCode: string | null | undefined = null;

    for (const item of items) {
      const productId = item.productId;
      
      // Sanity check: Ensure productId is a valid MongoDB ObjectId (24 chars hex)
      // Old WooCommerce IDs like "34263" will trigger Malformed ObjectID in Prisma
      if (!/^[0-9a-fA-F]{24}$/.test(productId)) {
        console.warn(`Skipping invalid product ID: ${productId}`);
        continue; // Or throw a specific error
      }

      const product = await prisma.product.findUnique({
        where: { id: productId },
        include: {
          store: true,
          storeInventories: {
            include: {
              store: true
            }
          }
        }
      });

      if (!product) {
        throw new Error(`Product not found: ${item.productId}`);
      }

      // Determine which store this product belongs to
      let productStoreId = product.storeId;
      let productStoreCode = product.store?.code;
      
      // If product doesn't have direct store assignment, check store inventories
      if (!productStoreId && product.storeInventories.length > 0) {
        // Use the first store inventory as the product's store
        productStoreId = product.storeInventories[0].storeId;
        productStoreCode = product.storeInventories[0].store.code;
      }

      // Track store for validation
      if (productStoreId) {
        // Check if this is a Kuwait store product
        if (productStoreCode === 'KUW') {
          // Validate shipping address is Kuwait
          const shippingCountry = shipping?.country?.toString().toLowerCase().trim();
          if (!shippingCountry || (shippingCountry !== 'kuwait' && shippingCountry !== 'kw')) {
            throw new Error('Kuwait products can only be ordered from Kuwait addresses');
          }
        }
      }

      const unitPriceCents = product.discountCents
        ? (product.priceCents - product.discountCents)
        : product.priceCents;
      
      const itemTotal = unitPriceCents * item.quantity;
      subtotalCents += itemTotal;

      orderItemsData.push({
        productId: product.id,
        quantity: item.quantity,
        unitPriceCents: unitPriceCents,
        nameSnapshot: product.name,
        imageSnapshot: product.mainImage,
      });

      // Track the store for this product (for order assignment)
      if (productStoreId) {
        // Store the storeId to assign to order later
        // For mixed store orders, we need to handle this differently
        // For now, we'll use the first product's store
        if (!orderStoreId) {
          orderStoreId = productStoreId;
          orderStoreCode = productStoreCode;
        } else if (orderStoreId !== productStoreId) {
          // Mixed store order - for now, reject or handle appropriately
          throw new Error('Cannot mix products from different stores in a single order');
        }
      }
    }

    if (orderItemsData.length === 0) {
      return NextResponse.json({ error: "No valid items found in cart. Your cart may contain outdated product data." }, { status: 400 });
    }

    const totalCents = subtotalCents; // For now, no shipping/tax logic here, but could be added

    // Determine courier based on shipping address
    const courier = determineCourier(shipping);
    const trackingCode = generateTrackingCode(courier);

    // Create the order in Prisma
    const order = await prisma.order.create({
      data: {
        userId: session?.user?.id || null,
        email: session?.user?.email || billing?.email || null,
        status: OrderStatus.PENDING_PAYMENT,
        currency: "usd", // Default to usd, or get from products
        subtotalCents,
        totalCents,
        billingAddress: billing || {},
        shippingAddress: shipping || {},
        paymentMethod: payment_method || "stripe",
        paymentMethodTitle: payment_method_title || "Credit Card (Stripe)",
        // Assign store to order if determined from products
        ...(orderStoreId ? { storeId: orderStoreId } : {}),
        items: {
          create: orderItemsData
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
        items: true,
        shipment: true
      }
    });

    return NextResponse.json({
      orderId: order.id,
      total: order.totalCents / 100,
      currency: order.currency,
      status: order.status,
      courier: order.shipment?.courier,
      trackingCode: order.shipment?.trackingCode
    });
  } catch (error: any) {
    console.error("Create Order Route Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
