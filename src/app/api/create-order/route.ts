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

// Normalize country code to 2-letter format
function normalizeCountryCode(country: string | undefined): string {
  if (!country) return 'AE';
  
  const countryMap: Record<string, string> = {
    'AE': 'AE', 'UAE': 'AE', 'UNITED ARAB EMIRATES': 'AE',
    'KW': 'KW', 'KUWAIT': 'KW',
    'SA': 'SA', 'SAUDI': 'SA', 'SAUDI ARABIA': 'SA',
    'BH': 'BH', 'BAHRAIN': 'BH',
    'OM': 'OM', 'OMAN': 'OM',
    'QA': 'QA', 'QATAR': 'QA',
    'BD': 'BD', 'BANGLADESH': 'BD',
  };
  
  return countryMap[country.toUpperCase()] || 'AE';
}

// Get price for a product - check all possible sources
async function getProductPrice(productId: string, countryCode: string, storeCode?: string) {
  // First try store inventory price if store is specified
  if (storeCode) {
    const inventory = await (prisma as any).storeInventory.findFirst({
      where: {
        productId: productId,
        store: { code: storeCode }
      }
    });
    
    if (inventory && inventory.price > 0) {
      return { priceCents: Math.round(inventory.price * 100), source: 'store_inventory' };
    }
  }
  
  // Then try country-specific price
  const countryPrice = await (prisma as any).countryPrice.findFirst({
    where: {
      productId: productId,
      country: countryCode.toUpperCase(),
      active: true
    }
  });
  
  if (countryPrice && countryPrice.priceCents > 0) {
    return { priceCents: countryPrice.priceCents, source: 'country_price' };
  }
  
  // Finally use base product price
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { priceCents: true, discountCents: true }
  });
  
  if (product) {
    const basePrice = product.discountCents 
      ? product.priceCents - product.discountCents 
      : product.priceCents;
    return { priceCents: basePrice, source: 'base_price' };
  }
  
  return { priceCents: 0, source: 'none' };
}

export async function POST(req: Request) {
  try {
    const session = await getServerAuthSession();
    const body = await req.json();
    const { items, billing, shipping, payment_method, payment_method_title, couponCode, storeCode, country } = body;

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

    // Get normalized country code for pricing - prioritize direct country param, then shipping, then billing
    const countryCode = normalizeCountryCode(country || shipping?.country || billing?.country);
    const currency = getCurrencyForCountry(countryCode);

    // Calculate totals with improved price lookup
    let subtotalCents = 0;
    const orderItemsData = [];
    let orderStoreId: string | null = null;
    let orderStoreCode: string | null | undefined = null;

    for (const item of items) {
      const productId = item.productId;
      
      // Sanity check: Ensure productId is a valid MongoDB ObjectId (24 chars hex)
      if (!/^[0-9a-fA-F]{24}$/.test(productId)) {
        console.warn(`Skipping invalid product ID: ${productId}`);
        continue;
      }

      // Get product with all relations
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
        productStoreId = product.storeInventories[0].storeId;
        productStoreCode = product.storeInventories[0].store.code;
      }

      // Track store for validation
      if (productStoreId) {
        if (productStoreCode === 'KUW') {
          const shippingCountry = shipping?.country?.toString().toLowerCase().trim();
          if (!shippingCountry || (shippingCountry !== 'kuwait' && shippingCountry !== 'kw')) {
            throw new Error('Kuwait products can only be ordered from Kuwait addresses');
          }
        }
      }

      // Use price from cart item if provided, otherwise lookup from database
      let unitPriceCents = 0;
      let priceSource = 'cart_item';
      
      if (item.unitPriceCents && item.unitPriceCents > 0) {
        // Use the price that was calculated in the cart
        unitPriceCents = item.unitPriceCents;
      } else {
        // Fallback to database lookup
        const dbPrice = await getProductPrice(productId, countryCode, productStoreCode);
        unitPriceCents = dbPrice.priceCents;
        priceSource = dbPrice.source;
      }
      
      console.log(`Price for ${product.name}: ${unitPriceCents} cents (source: ${priceSource})`);

      if (unitPriceCents <= 0) {
        throw new Error(`Invalid price for product ${product.name}. Please contact support.`);
      }
      
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
        if (!orderStoreId) {
          orderStoreId = productStoreId;
          orderStoreCode = productStoreCode;
        } else if (orderStoreId !== productStoreId) {
          throw new Error('Cannot mix products from different stores in a single order');
        }
      }
    }

    if (orderItemsData.length === 0) {
      return NextResponse.json({ error: "No valid items found in cart. Your cart may contain outdated product data." }, { status: 400 });
    }

    // Validate total
    if (subtotalCents <= 0) {
      return NextResponse.json({ error: "Order total must be greater than 0. Please check product prices." }, { status: 400 });
    }

    const totalCents = subtotalCents;

    // Determine courier based on shipping address
    const courier = determineCourier(shipping);
    const trackingCode = generateTrackingCode(courier);

    // Create the order in Prisma
    const order = await prisma.order.create({
      data: {
        userId: session?.user?.id || null,
        email: session?.user?.email || billing?.email || null,
        status: OrderStatus.ORDER_RECEIVED,
        currency: currency.toLowerCase(),
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
