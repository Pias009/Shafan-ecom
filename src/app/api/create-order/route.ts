import { NextResponse } from "next/server";
import { getServerAuthSession, getAdminAuthSession } from "@/lib/auth";
import { getAdminSession } from "@/lib/admin-session";
import { prisma } from "@/lib/prisma";
import { OrderStatus, PaymentStatus } from "@prisma/client";
import { COUNTRY_CONFIG } from "@/lib/address-config";
import { cookies } from "next/headers";
import { createPendingCheckout } from "@/services/checkout/pending-checkout";
import { convertCurrency } from "@/lib/currency-rates";

// Delivery fee configuration by country (Using global config)
const DELIVERY_CONFIG = COUNTRY_CONFIG;

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
    const fee = subtotal >= defaultConfig.freeDelivery ? 0 : defaultConfig.deliveryFee;
    return { fee: fee, freeDelivery: fee === 0 };
  }
  
  // Check if order qualifies for free delivery
  if (subtotal >= config.freeDelivery) {
    return { fee: 0, freeDelivery: true };
  }
  
  return { fee: config.deliveryFee, freeDelivery: false };
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
  
  if (countryPrice && Number(countryPrice.price) > 0) {
    // Check for country-specific discount price
    if (countryPrice.discountPrice && Number(countryPrice.discountPrice) > 0 && Number(countryPrice.discountPrice) < Number(countryPrice.price)) {
      return { price: Number(countryPrice.discountPrice), source: 'country_discount_price' };
    }
    return { price: Number(countryPrice.price), source: 'country_price' };
  }
  
  // Finally use base product price (converted if source currency differs)
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { price: true, discountPrice: true, currency: true, weight: true, weightUnit: true } as any
  });
  
  if (product) {
    const basePrice = (product.discountPrice && Number(product.discountPrice) > 0 && Number(product.discountPrice) < Number(product.price))
      ? Number(product.discountPrice)
      : Number(product.price);
    
    const baseCurrency = (product as any).currency || 'AED';
    const targetCurrency = getCurrencyForCountry(countryCode);
    const converted = convertCurrency(basePrice, baseCurrency, targetCurrency);
    
    return { price: converted, source: 'base_price_converted' };
  }
  
  return { price: 0, source: 'none' };
}

// Validate and apply discount from coupon code
async function applyDiscount(
  couponCode: string | undefined,
  countryCode: string,
  subtotal: number,
  userId?: string,
  userEmail?: string
): Promise<{ discount: number; discountCodeUsed?: string; error?: string }> {
  if (!couponCode) {
    return { discount: 0 };
  }

  try {
    // Find discount by code
    const discount = await (prisma as any).discount.findUnique({
      where: { code: couponCode.toUpperCase() },
    });

    if (!discount) {
      console.warn(`Discount code not found: ${couponCode}`);
      return { discount: 0, error: "Code not found" };
    }

    // Check if discount is active
    if (!discount.active || discount.status !== "ACTIVE") {
      console.warn(`Discount code is not active: ${couponCode}`);
      return { discount: 0, error: "Code not active" };
    }

    // Check if discount is valid for the country
    if (discount.countries && discount.countries.length > 0 && !discount.countries.includes(countryCode)) {
      console.warn(`Discount code not valid for country: ${countryCode}`);
      return { discount: 0, error: "Not valid for this country" };
    }

    // Check if discount is within valid date range
    const now = new Date();
    if (discount.startDate && new Date(discount.startDate) > now) {
      console.warn(`Discount code not yet valid: ${couponCode}`);
      return { discount: 0, error: "Code not yet valid" };
    }
    if (discount.endDate && new Date(discount.endDate) < now) {
      console.warn(`Discount code expired: ${couponCode}`);
      return { discount: 0, error: "Code has expired" };
    }

    // Check minimum order value
    if (discount.minimumOrderValue && subtotal < discount.minimumOrderValue) {
      console.warn(`Order doesn't meet minimum for discount: ${couponCode}`);
      return { discount: 0, error: `Minimum order ${discount.minimumOrderValue.toFixed(2)} required` };
    }

    // Check max total uses (global limit)
    if (discount.maxUses) {
      const totalUsageCount = await (prisma as any).discountUsage.count({
        where: { discountId: discount.id },
      });
      if (totalUsageCount >= discount.maxUses) {
        console.warn(`Discount code has reached max total uses: ${couponCode}`);
        return { discount: 0, error: "Code usage limit reached" };
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
        return { discount: 0, error: `You can only use this code ${discount.maxUsesPerUser} time(s)` };
      }

      // For SINGLE_USE coupons - only one use per user ever
      if (usageType === "SINGLE_USE" && userUsageCount > 0) {
        console.warn(`SINGLE_USE coupon already used by user: ${couponCode}`);
        return { discount: 0, error: "This code can only be used once per customer" };
      }
    }

    // Calculate discount amount
    let rawDiscount = 0;
    if (discount.discountType === "PERCENTAGE") {
      rawDiscount = (subtotal * discount.value) / 100;
    } else if (discount.discountType === "FIXED_AMOUNT") {
      rawDiscount = discount.value;
    } else if (discount.discountType === "FREE_SHIPPING") {
      rawDiscount = 0;
    }

    // Apply discount cap if configured
    let discountAmount = rawDiscount;
    const countryMaxLimits = discount.countryMaxLimits as Record<string, number> | null;
    const maxCap = countryMaxLimits?.[countryCode] || discount.maxLimitAmount;
    
    if (maxCap && maxCap > 0) {
      discountAmount = Math.min(rawDiscount, maxCap);
    } else if (discount.maxLimitAmount && discount.maxLimitAmount > 0) {
      discountAmount = Math.min(rawDiscount, discount.maxLimitAmount);
    }

    discountAmount = Math.min(discountAmount, subtotal);

    return { discount: discountAmount, discountCodeUsed: discount.id };
  } catch (error) {
    console.error("Error applying discount:", error);
    return { discount: 0 };
  }
}

export async function POST(req: Request) {
  try {
    const userSession = await getServerAuthSession();
    const adminSessionCookie = await getAdminSession();
    const adminAuthSession = await getAdminAuthSession();

    const isUserAdmin = 
      userSession?.user?.role === 'ADMIN' || 
      userSession?.user?.role === 'SUPERADMIN' ||
      adminSessionCookie?.role === 'ADMIN' ||
      adminSessionCookie?.role === 'SUPERADMIN' ||
      adminAuthSession?.user?.role === 'ADMIN' ||
      adminAuthSession?.user?.role === 'SUPERADMIN';

    const session = userSession || (adminSessionCookie || adminAuthSession?.user ? { user: adminSessionCookie || adminAuthSession?.user } : null);

    const body = await req.json();
    
    const cookieStore = await cookies();
    const referralSource = cookieStore.get('referral_source')?.value || null;
    
    console.log(JSON.stringify(body, null, 2));
    
    const {
      items,
      billing,
      shipping,
      payment_method,
      payment_method_title,
      payment_status,
      couponCode,
      storeCode,
      country,
      total: clientTotal,
      subtotal: clientSubtotal,
      shippingFee: clientShippingFee,
      discountAmount: clientDiscount,
      isAdminCreated,
    } = body;

    // Allow guest orders

    // Validate items array
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
            address_1: userAddress.address1,
            address_2: userAddress.address2 || "",
            postalCode: userAddress.postalCode,
            // New field names for forward compatibility
            street_road: userAddress.address1,
            house_building: userAddress.address2 || "",
            city_name: userAddress.city,
            area_name: (userAddress as any).area_name || "",
          };
          
          if (!finalBilling) finalBilling = addressJson;
          if (!finalShipping) finalShipping = addressJson;
        }
      }
    }

    // Ensure addresses have the normalized country code for payment gateway compatibility
    if (finalBilling) finalBilling.country = finalBilling.country || countryCode;
    if (finalShipping) finalShipping.country = finalShipping.country || countryCode;

    // Normalize address field names: map new field names alongside legacy ones
    function normalizeAddressFields(addr: Record<string, any>) {
      if (!addr) return {};
      return {
        ...addr,
        address_1: addr.street_road || addr.address_1 || addr.address1 || "",
        address_2: addr.house_building || addr.address_2 || addr.address2 || "",
        city: addr.city_name || addr.city || "",
        street_road: addr.street_road || addr.address_1 || addr.address1 || "",
        house_building: addr.house_building || addr.address_2 || addr.address2 || "",
        city_name: addr.city_name || addr.city || "",
        area_name: addr.area_name || "",
      };
    }
    if (finalBilling) finalBilling = normalizeAddressFields(finalBilling);
    if (finalShipping) finalShipping = normalizeAddressFields(finalShipping);

    if (!finalBilling || !finalShipping) {
      return NextResponse.json({ error: "Shipping address is required to place an order." }, { status: 400 });
    }

    // Get currency for the country
    const currency = getCurrencyForCountry(countryCode);

    // Calculate totals with improved price lookup
    let subtotal = 0;
    let totalWeight = 0;
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
            },
            productCategories: {
              include: {
                category: true
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
            },
            productCategories: {
              include: {
                category: true
              }
            }
          }
        });
      }

      if (!product) {
        throw new Error(`Product not found: ${productId || productSlug}`);
      }

      const itemQuantity = typeof item.quantity === 'number' && item.quantity > 0 ? item.quantity : 1;

      // Check stock availability
      if (product.stockQuantity !== null && product.stockQuantity <= 0) {
        throw new Error(`Product "${product.name}" is out of stock. Please remove it from your cart.`);
      }
      if (product.stockQuantity !== null && product.stockQuantity < itemQuantity) {
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

      // Determine the canonical price from the database (STRICT price checking)
      const dbPrice = await getProductPrice(product.id, countryCode, productStoreCode);
      const canonicalPrice = dbPrice.price;
      const priceSource = dbPrice.source;
      
      // LOGGING: Getting the row data for price validation
      console.log(`[PRICE_CHECK] Item: ${product.name} | DB Price: ${canonicalPrice} | Source: ${priceSource} | Request Price: ${item.price || 'N/A'}`);
      
      if (item.price && item.price > 0 && item.price !== canonicalPrice) {
        console.warn(`[PRICE_MISMATCH] Item: ${product.name} | Request: ${item.price} | DB: ${canonicalPrice}. USING DB PRICE.`);
      }
      
      const unitPrice = canonicalPrice;
      
      if (unitPrice <= 0) {
        throw new Error(`Invalid price for product ${product.name}. Please contact support.`);
      }
      
      const itemTotal = unitPrice * itemQuantity;
      subtotal += itemTotal;

      // Calculate weight contributions
      if (product.weight) {
        const itemWeight = Number(product.weight) * itemQuantity;
        // Convert all weights to KG for totalWeight calculation
        if (product.weightUnit === 'g') {
          totalWeight += itemWeight / 1000;
        } else {
          totalWeight += itemWeight;
        }
      }

      const rawCategory =
        (product as any)?.productCategories?.[0]?.category?.name ||
        (product as any)?.categoryName ||
        "General";

      orderItemsData.push({
        productId: product.id || "unknown",
        quantity: itemQuantity,
        unitPrice: unitPrice,
        nameSnapshot: product?.name || "Unknown Product",
        imageSnapshot: product?.mainImage || null,
        categoryNameSnapshot: typeof rawCategory === "string" ? rawCategory : "General",
        weightSnapshot: product.weight || 0,
        weightUnitSnapshot: product.weightUnit || 'kg',
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
    if (subtotal <= 0) {
      return NextResponse.json({ error: "Order total must be greater than 0. Please check product prices." }, { status: 400 });
    }

    // Calculate delivery fee based on country
    let { fee: shippingFee, freeDelivery } = calculateDeliveryFee(countryCode, subtotal);
    
    // Check if minimum order requirement is met (Skip for Admins to allow manual order flexibility)
    const deliveryConfig = (DELIVERY_CONFIG as any)[countryCode.toUpperCase()];
    
    if (!isUserAdmin && deliveryConfig && subtotal < deliveryConfig.minOrder) {
      const currencySymbol = getCurrencyForCountry(countryCode);
      const minOrder = deliveryConfig.minOrder;
      return NextResponse.json({
        error: `Minimum order value is ${currencySymbol} ${minOrder} for ${countryCode.toUpperCase()}. Current order: ${currencySymbol} ${subtotal}`,
        minOrderRequired: true,
        minOrder: deliveryConfig.minOrder,
        currency: getCurrencyForCountry(countryCode)
      }, { status: 400 });
    }

    // Apply discount from coupon code (wrapped in try-catch to prevent crashes)
    let discount = 0;
    let couponCodeApplied = null;
    let discountIdApplied: string | null = null;

    if (couponCode) {
      try {
        const discountResult = await applyDiscount(
          couponCode,
          countryCode,
          subtotal,
          session?.user?.id || undefined,
          session?.user?.email || undefined
        );
        discount = discountResult.discount || 0;
        couponCodeApplied = couponCode;
        discountIdApplied = discountResult.discountCodeUsed || null;
        console.log(`Coupon applied: ${couponCode} -> discount: ${discount}`);
      } catch (discountError: any) {
        console.error("Discount application failed, proceeding without discount:", discountError?.message);
        discount = 0; // Proceed without discount rather than failing
      }
    }

    // Final total = (Subtotal + Shipping) - Discount
    const effectiveSubtotal = (isUserAdmin && typeof clientSubtotal === 'number') ? clientSubtotal : subtotal;
    const effectiveShipping = (isUserAdmin && typeof clientShippingFee === 'number') ? clientShippingFee : shippingFee;
    const effectiveDiscount = (isUserAdmin && typeof clientDiscount === 'number') ? clientDiscount : discount;

    // Tax calculation
    const countryTaxRate = (COUNTRY_CONFIG[countryCode]?.taxRate) || 0;
    const preTaxTotal = effectiveSubtotal + effectiveShipping - effectiveDiscount;
    const taxAmount = Math.round(preTaxTotal * countryTaxRate * 100) / 100;

    let effectiveTotal = (isUserAdmin && typeof clientTotal === 'number' && clientTotal > 0) 
      ? clientTotal 
      : (preTaxTotal + taxAmount);
    
    // Round total based on currency (KWD, BHD, OMR = 3 decimals, others = 2 decimals)
    const highDecimalsCurrencies = ['KWD', 'BHD', 'OMR'];
    const decimals = highDecimalsCurrencies.includes(currency.toUpperCase()) ? 3 : 2;
    
    const finalTotal = Math.round(effectiveTotal * Math.pow(10, decimals)) / Math.pow(10, decimals);
    const finalSubtotal = Math.round(effectiveSubtotal * Math.pow(10, decimals)) / Math.pow(10, decimals);
    
    if (isNaN(finalTotal) || finalTotal < 0) {
      throw new Error("Invalid order total calculated. Please check your cart items.");
    }

    // Admin-created orders (e.g. phone/manual orders placed from /ueadmin)
    // are real orders immediately — there is no payment webhook that will
    // ever promote them, so they must bypass the PendingCheckout indirection
    // used by customer-facing checkout. Gated to admins only.
    if (isAdminCreated && isUserAdmin) {
      const customerEmail = billing?.email || shipping?.email || null;
      let targetUserId: string | null = null;
      if (customerEmail) {
        const existingUser = await prisma.user.findUnique({
          where: { email: customerEmail },
          select: { id: true }
        });
        if (existingUser) {
          targetUserId = existingUser.id;
        }
      }

      const order = await prisma.order.create({
        data: {
          userId: targetUserId,
          email: customerEmail || session?.user?.email || null,
          status: OrderStatus.ORDER_RECEIVED,
          paymentStatus: (payment_status as PaymentStatus) || PaymentStatus.PENDING,
          currency: currency.toLowerCase(),
          subtotal: finalSubtotal,
          shipping: effectiveShipping,
          discount: effectiveDiscount,
          taxRate: countryTaxRate,
          taxAmount: taxAmount,
          total: finalTotal,
          billingAddress: finalBilling || {},
          shippingAddress: finalShipping || {},
          paymentMethod: payment_method || null,
          paymentMethodTitle: payment_method_title || "Pending Selection",
          totalWeight,
          ...(couponCodeApplied ? { couponCode: couponCodeApplied, discountAmount: effectiveDiscount } : {}),
          ...(orderStoreId ? { storeId: orderStoreId } : {}),
          referralSource,
          items: {
            create: orderItemsData.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              nameSnapshot: item.nameSnapshot,
              imageSnapshot: item.imageSnapshot,
              weightSnapshot: item.weightSnapshot,
              weightUnitSnapshot: item.weightUnitSnapshot,
            })),
          },
        },
        include: { items: true },
      });

      const trackingCode = `GL-${Math.random().toString(36).substring(2, 10).toUpperCase()}-${Date.now().toString().slice(-6)}`;
      const shipment = await prisma.shipment.create({
        data: {
          orderId: order.id,
          courier: "GLOBAL_COURIER",
          trackingCode,
          trackingUrl: `https://global-courier.com/track/${trackingCode}`,
          status: "Created",
        },
      });

      for (const item of orderItemsData) {
        const product = await prisma.product.findUnique({ where: { id: item.productId } });
        if (product && product.stockQuantity !== null) {
          await prisma.product.update({
            where: { id: item.productId },
            data: { stockQuantity: Math.max(0, product.stockQuantity - item.quantity) },
          });
        }
      }

      return NextResponse.json({
        success: true,
        orderId: order.id,
        subtotal: finalSubtotal,
        shipping: effectiveShipping,
        total: order.total,
        currency: order.currency,
        status: order.status,
        freeDelivery,
        courier: shipment.courier,
        trackingCode: shipment.trackingCode,
        paymentMethod: payment_method,
      });
    }

    // No Order is created here. A lightweight PendingCheckout snapshot is
    // stored instead — the real Order (with Shipment + stock decrement) is
    // only created once a payment webhook confirms payment (Stripe/Tabby/
    // Tamara) or the user explicitly confirms Cash on Delivery
    // (see src/services/checkout/pending-checkout.ts::promoteToOrder).
    const pendingCheckout = await createPendingCheckout({
      userId: session?.user?.id || null,
      email: session?.user?.email || billing?.email || null,
      storeId: orderStoreId,
      currency: currency.toLowerCase(),
      subtotal: finalSubtotal,
      shipping: effectiveShipping,
      discount: effectiveDiscount,
      taxRate: countryTaxRate,
      taxAmount: taxAmount,
      total: finalTotal,
      totalWeight,
      paymentMethod: payment_method || null,
      paymentMethodTitle: payment_method_title || "Pending Selection",
      billingAddress: finalBilling || {},
      shippingAddress: finalShipping || {},
      items: orderItemsData,
      discountId: discountIdApplied,
      discountAmount: couponCodeApplied ? effectiveDiscount : null,
      couponCode: couponCodeApplied,
      referralSource,
    });

    return NextResponse.json({
      success: true,
      pendingCheckoutId: pendingCheckout.id,
      subtotal: finalSubtotal,
      shipping: effectiveShipping,
      total: pendingCheckout.total,
      currency: pendingCheckout.currency,
      status: "ORDER_RECEIVED",
      freeDelivery,
      paymentMethod: payment_method
    });
  } catch (error: any) {
    console.error("=== CREATE ORDER ERROR ===");
    console.error(error);
    
    // Return more specific error messages
    let errorMessage = "An unexpected error occurred. Please try again.";
    let errorStatus = 500;
    
    if (error?.message) {
      errorMessage = error.message;
      
      // Map common Prisma/MongoDB errors to 400
      if (errorMessage.includes("ObjectId") || errorMessage.includes("Invalid")) {
        errorMessage = "Invalid data format. Please refresh your cart and try again.";
        errorStatus = 400;
      } else if (errorMessage.includes("required") || errorMessage.includes("must be")) {
        errorStatus = 400;
      }
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    
    return NextResponse.json({ 
      error: errorMessage || "Order creation failed",
      message: errorMessage || "Order creation failed"
    }, { status: errorStatus });
  }
}
