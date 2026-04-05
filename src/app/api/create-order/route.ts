import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";
import { COUNTRY_CONFIG } from "@/lib/address-config";

// Delivery fee configuration by country (Using global config)
const DELIVERY_CONFIG = COUNTRY_CONFIG;

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

// Calculate delivery fee based on country and subtotal
function calculateDeliveryFee(countryCode: string, subtotal: number): { fee: number; freeDelivery: boolean } {
  const config = (DELIVERY_CONFIG as any)[countryCode.toUpperCase()];
  
  if (!config) {
    // Default to UAE config if country not found
    const defaultConfig = (DELIVERY_CONFIG as any)['AE'];
    const fee = subtotal >= defaultConfig.freeDeliveryCents ? 0 : defaultConfig.deliveryFeeCents;
    return { fee: fee, freeDelivery: fee === 0 };
  }
  
  // Check if order qualifies for free delivery
  if (subtotal >= config.freeDeliveryCents) {
    return { fee: 0, freeDelivery: true };
  }
  
  return { fee: config.deliveryFeeCents, freeDelivery: false };
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

// Get price for a product - check all possible sources (Returns raw currency units)
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
      return { price: Number(inventory.price), source: 'store_inventory' };
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
  
  if (countryPrice && Number(countryPrice.priceCents) > 0) {
    return { price: Number(countryPrice.priceCents), source: 'country_price' };
  }
  
  // Finally use base product price
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { priceCents: true, discountCents: true }
  });
  
  if (product) {
    const basePrice = product.discountCents 
      ? Number(product.priceCents) - Number(product.discountCents) 
      : Number(product.priceCents);
    return { price: basePrice, source: 'base_price' };
  }
  
  return { price: 0, source: 'none' };
}

// Validate and apply discount from coupon code
async function applyDiscount(
  couponCode: string | undefined,
  countryCode: string,
  subtotalCents: number,
  userId?: string,
  userEmail?: string
): Promise<{ discountCents: number; discountCodeUsed?: string; error?: string }> {
  if (!couponCode) {
    return { discountCents: 0 };
  }

  try {
    // Find discount by code
    const discount = await (prisma as any).discount.findUnique({
      where: { code: couponCode.toUpperCase() },
    });

    if (!discount) {
      console.warn(`Discount code not found: ${couponCode}`);
      return { discountCents: 0, error: "Code not found" };
    }

    // Check if discount is active
    if (!discount.active || discount.status !== "ACTIVE") {
      console.warn(`Discount code is not active: ${couponCode}`);
      return { discountCents: 0, error: "Code not active" };
    }

    // Check if discount is valid for the country
    if (discount.countries && discount.countries.length > 0 && !discount.countries.includes(countryCode)) {
      console.warn(`Discount code not valid for country: ${countryCode}`);
      return { discountCents: 0, error: "Not valid for this country" };
    }

    // Check if discount is within valid date range
    const now = new Date();
    if (discount.startDate && new Date(discount.startDate) > now) {
      console.warn(`Discount code not yet valid: ${couponCode}`);
      return { discountCents: 0, error: "Code not yet valid" };
    }
    if (discount.endDate && new Date(discount.endDate) < now) {
      console.warn(`Discount code expired: ${couponCode}`);
      return { discountCents: 0, error: "Code has expired" };
    }

    // Check minimum order value
    if (discount.minimumOrderValue && subtotalCents < discount.minimumOrderValue) {
      console.warn(`Order doesn't meet minimum for discount: ${couponCode}`);
      return { discountCents: 0, error: `Minimum order ${(discount.minimumOrderValue / 100).toFixed(2)} required` };
    }

    // Check max total uses (global limit)
    if (discount.maxUses) {
      const totalUsageCount = await (prisma as any).discountUsage.count({
        where: { discountId: discount.id },
      });
      if (totalUsageCount >= discount.maxUses) {
        console.warn(`Discount code has reached max total uses: ${couponCode}`);
        return { discountCents: 0, error: "Code usage limit reached" };
      }
    }

    // Check per-user usage limits (SINGLE_USE or MULTI_USE)
    const usageType = discount.usageType || "MULTI_USE";
    
    if (userId || userEmail) {
      // Check user's usage count for this discount
      const userUsageCount = await (prisma as any).discountUsage.count({
        where: {
          discountId: discount.id,
          OR: userId ? [{ userId }] : [{ email: userEmail }],
        },
      });

      // Check maxUsesPerUser limit
      if (discount.maxUsesPerUser && userUsageCount >= discount.maxUsesPerUser) {
        console.warn(`User has reached max uses for this discount: ${couponCode}`);
        return { discountCents: 0, error: `You can only use this code ${discount.maxUsesPerUser} time(s)` };
      }

      // For SINGLE_USE coupons - only one use per user ever
      if (usageType === "SINGLE_USE" && userUsageCount > 0) {
        console.warn(`SINGLE_USE coupon already used by user: ${couponCode}`);
        return { discountCents: 0, error: "This code can only be used once per customer" };
      }
    }

    // Check max uses per order (usually 1)
    if (discount.maxUsesPerOrder && discount.maxUsesPerOrder > 1) {
      console.log(`Coupon allows up to ${discount.maxUsesPerOrder} uses per order`);
    }

    // Calculate discount amount (Using raw units)
    let discountAmount = 0;
    if (discount.discountType === "PERCENTAGE") {
      discountAmount = (subtotalCents * discount.value) / 100;
    } else if (discount.discountType === "FIXED_AMOUNT") {
      discountAmount = discount.value; // Stored as raw units
    } else if (discount.discountType === "FREE_SHIPPING") {
      discountAmount = 0;
    }

    // Cap discount at subtotal
    discountAmount = Math.min(discountAmount, subtotalCents);

    console.log(`Applied discount ${couponCode}: ${discountAmount} (type: ${usageType})`);

    return { discountCents: discountAmount, discountCodeUsed: discount.id };
  } catch (error) {
    console.error("Error applying discount:", error);
    return { discountCents: 0 };
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerAuthSession();
    const body = await req.json();
    const { items, billing, shipping, payment_method, payment_method_title, couponCode, storeCode, country } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    // Get normalized country code for validation - prioritize direct country param, then shipping, then billing
    const countryCode = normalizeCountryCode(country || shipping?.country || billing?.country);
    
    // Validate that the country accepts orders
    const selectedCountry = COUNTRY_CONFIG[countryCode];
    if (!selectedCountry || !selectedCountry.active) {
      return NextResponse.json(
        {
          error: `Unfortunately, we do not currently accept orders from ${selectedCountry?.name || countryCode}. Please select a different delivery country.`,
          countryNotAllowed: true,
          requestedCountry: countryCode,
        },
        { status: 400 }
      );
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

    // Get currency for the country
    const currency = getCurrencyForCountry(countryCode);

    // Calculate totals with improved price lookup
    let subtotalCents = 0;
    const orderItemsData = [];
    let orderStoreId: string | null = null;
    let orderStoreCode: string | null | undefined = null;

    for (const item of items) {
      const productId = item.productId;
      const productSlug = item.slug;

      console.log('Processing item:', JSON.stringify(item));

      let product = null;

      // Try to find product by productId (MongoDB ObjectId)
      if (productId && /^[0-9a-fA-F]{24}$/.test(productId)) {
        product = await prisma.product.findUnique({
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
      }

      // If not found by productId, try by slug
      if (!product && productSlug) {
        product = await prisma.product.findUnique({
          where: { slug: productSlug },
          include: {
            store: true,
            storeInventories: {
              include: {
                store: true
              }
            }
          }
        });
      }

      if (!product) {
        throw new Error(`Product not found: ${productId || productSlug}`);
      }

      // Check stock availability
      if (product.stockQuantity !== null && product.stockQuantity <= 0) {
        throw new Error(`Product "${product.name}" is out of stock. Please remove it from your cart.`);
      }
      if (product.stockQuantity !== null && product.stockQuantity < item.quantity) {
        throw new Error(`Not enough stock for "${product.name}". Available: ${product.stockQuantity}`);
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
        unitPriceCents = dbPrice.price;
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

    // Calculate delivery fee based on country
    const { fee: shippingCents, freeDelivery } = calculateDeliveryFee(countryCode, subtotalCents);
    
    // Check if minimum order requirement is met
    const deliveryConfig = (DELIVERY_CONFIG as any)[countryCode.toUpperCase()];
    if (deliveryConfig && subtotalCents < deliveryConfig.minOrderCents) {
      const currencySymbol = getCurrencyForCountry(countryCode);
      const minOrder = deliveryConfig.minOrderCents;
      return NextResponse.json({ 
        error: `Minimum order value is ${currencySymbol} ${minOrder} for ${countryCode.toUpperCase()}. Current order: ${currencySymbol} ${subtotalCents}`,
        minOrderRequired: true,
        minOrderCents: deliveryConfig.minOrderCents,
        currency: getCurrencyForCountry(countryCode)
      }, { status: 400 });
    }

    // Apply discount from coupon code
    const { discountCents } = await applyDiscount(
      couponCode,
      countryCode,
      subtotalCents,
      session?.user?.id || undefined,
      session?.user?.email || undefined
    );

    const totalCents = subtotalCents + shippingCents - discountCents;

    // Determine courier based on shipping address
    const courier = determineCourier(shipping);
    const trackingCode = generateTrackingCode();

    // Create the order in Prisma
    const order = await prisma.order.create({
      data: {
        userId: session?.user?.id || null,
        email: session?.user?.email || billing?.email || null,
        status: OrderStatus.ORDER_RECEIVED,
        currency: currency.toLowerCase(),
        subtotalCents,
        shippingCents,
        discountCents,
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
            trackingUrl: `https://global-courier.com/track/${trackingCode}`,
            status: "Created"
          }
        }
      },
      include: {
        items: true,
        shipment: true
      }
    });

    // Decrement stock for each ordered item
    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId }
      });
      if (product && product.stockQuantity !== null) {
        await prisma.product.update({
          where: { id: item.productId },
          data: {
            stockQuantity: Math.max(0, product.stockQuantity - item.quantity)
          }
        });
      }
    }

    return NextResponse.json({
      orderId: order.id,
      subtotal: subtotalCents,
      shipping: shippingCents,
      total: order.totalCents,
      currency: order.currency,
      status: order.status,
      freeDelivery,
      courier: order.shipment?.courier,
      trackingCode: order.shipment?.trackingCode
    });
  } catch (error: any) {
    console.error("Create Order Route Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
