import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OrderStatus, PaymentStatus } from "@prisma/client";
import { COUNTRY_CONFIG } from "@/lib/address-config";
import { revalidatePath } from "next/cache";
import { sendEmail } from "@/lib/email";
import { notifyNewOrder } from "@/lib/pusher";

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
    return { price: Number(countryPrice.price), source: 'country_price' };
  }
  
  // Finally use base product price
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { price: true, discountPrice: true, weight: true, weightUnit: true }
  });
  
  if (product) {
    const basePrice = product.discountPrice
      ? Number(product.price) - Number(product.discountPrice)
      : Number(product.price);
    return { price: basePrice, source: 'base_price' };
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

    // Check max uses per order (usually 1)
    if (discount.maxUsesPerOrder && discount.maxUsesPerOrder > 1) {
      console.log(`Coupon allows up to ${discount.maxUsesPerOrder} uses per order`);
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

    // Apply discount cap if configured (maximum discount amount to prevent excessive losses on large orders)
    let discountAmount = rawDiscount;
    const countryMaxLimits = discount.countryMaxLimits as Record<string, number> | null;
    
    // Use country-specific cap if available, otherwise use global cap
    const maxCap = countryMaxLimits?.[countryCode] || discount.maxLimitAmount;
    if (maxCap && maxCap > 0) {
      discountAmount = Math.min(rawDiscount, maxCap);
      console.log(`Discount capped: ${rawDiscount} -> ${discountAmount} (cap: ${maxCap} for ${countryCode})`);
    } else if (discount.maxLimitAmount && discount.maxLimitAmount > 0) {
      discountAmount = Math.min(rawDiscount, discount.maxLimitAmount);
      console.log(`Discount capped: ${rawDiscount} -> ${discountAmount} (global cap: ${discount.maxLimitAmount})`);
    }

    // Cap discount at subtotal (can't exceed order total)
    discountAmount = Math.min(discountAmount, subtotal);

    console.log(`Applied discount ${couponCode}: ${discountAmount} (type: ${usageType})`);

    return { discount: discountAmount, discountCodeUsed: discount.id };
  } catch (error) {
    console.error("Error applying discount:", error);
    return { discount: 0 };
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerAuthSession();
    const body = await req.json();
    
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
      discountAmount: clientDiscount 
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
            address1: userAddress.address1,
            address2: userAddress.address2 || "",
            postalCode: userAddress.postalCode
          };
          
          if (!finalBilling) finalBilling = addressJson;
          if (!finalShipping) finalShipping = addressJson;
        }
      }
    }

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

      orderItemsData.push({
        productId: product.id || "unknown",
        quantity: itemQuantity,
        unitPrice: unitPrice,
        nameSnapshot: product?.name || "Unknown Product",
        imageSnapshot: product?.mainImage || null,
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
    const isUserAdmin = session?.user?.role === 'ADMIN' || session?.user?.role === 'SUPERADMIN';
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
        console.log(`Coupon applied: ${couponCode} -> discount: ${discount}`);
      } catch (discountError: any) {
        console.error("Discount application failed, proceeding without discount:", discountError?.message);
        discount = 0; // Proceed without discount rather than failing
      }
    }

    // Final total = (Subtotal + Shipping) - Discount
    // For admin orders, use client-provided values if they are valid numbers
    const effectiveSubtotal = (isUserAdmin && typeof clientSubtotal === 'number') ? clientSubtotal : subtotal;
    const effectiveShipping = (isUserAdmin && typeof clientShippingFee === 'number') ? clientShippingFee : shippingFee;
    const effectiveDiscount = (isUserAdmin && typeof clientDiscount === 'number') ? clientDiscount : discount;

    // Tax calculation (excluding — applied on top of subtotal+shipping-discount)
    const countryTaxRate = (COUNTRY_CONFIG[countryCode]?.taxRate) || 0;
    const preTaxTotal = effectiveSubtotal + effectiveShipping - effectiveDiscount;
    const taxAmount = Math.round(preTaxTotal * countryTaxRate * 100) / 100;

    const effectiveTotal = (isUserAdmin && typeof clientTotal === 'number') 
      ? clientTotal 
      : preTaxTotal + taxAmount;
    
    // Round total based on currency (KWD, BHD, OMR = 3 decimals, others = 2 decimals)
    const highDecimalsCurrencies = ['KWD', 'BHD', 'OMR'];
    const decimals = highDecimalsCurrencies.includes(currency.toUpperCase()) ? 3 : 2;
    const finalTotal = Math.round(effectiveTotal * Math.pow(10, decimals)) / Math.pow(10, decimals);
    const finalSubtotal = Math.round(effectiveSubtotal * Math.pow(10, decimals)) / Math.pow(10, decimals);
    
    console.log(`Order totals after rounding | Subtotal: ${finalSubtotal} | Shipping: ${effectiveShipping} | Discount: ${effectiveDiscount} | Total: ${finalTotal}`);

    // Server-side price validation (prevent tampering)
    console.log(`Price validation: clientTotal=${clientTotal}, serverTotal=${finalSubtotal + effectiveShipping - effectiveDiscount}`);

    // Determine courier based on shipping address
    const courier = determineCourier(shipping);
    const trackingCode = generateTrackingCode();

    // Create the order in Prisma with PENDING paymentStatus
    // For COD: order is created immediately (paymentStatus PENDING)
    // For Stripe: order will be created, webhook will update to PAID
    const isCOD = payment_method?.toLowerCase() === 'cod';
    const orderStatus = isCOD ? OrderStatus.ORDER_RECEIVED : OrderStatus.ORDER_RECEIVED;
    
    const order = await prisma.order.create({
      data: {
        userId: session?.user?.id || null,
        email: session?.user?.email || billing?.email || null,
        status: orderStatus,
        paymentStatus: (payment_status?.toUpperCase() as PaymentStatus) || PaymentStatus.PENDING,
        currency: currency.toLowerCase(),
        subtotal: finalSubtotal,
        shipping: effectiveShipping,
        discount: effectiveDiscount,
        taxRate: countryTaxRate,
        taxAmount: taxAmount,
        total: finalTotal,
        billingAddress: billing || {},
        shippingAddress: shipping || {},
        paymentMethod: payment_method || "stripe",
        paymentMethodTitle: payment_method_title || "Credit Card (Stripe)",
        totalWeight,
        // Store coupon info if applied
        ...(couponCodeApplied ? { couponCode: couponCodeApplied, discountAmount: effectiveDiscount } : {}),
        // Assign store to order if determined from products
        ...(orderStoreId ? { storeId: orderStoreId } : {}),
        items: {
          create: orderItemsData
        },
      },
      include: {
        items: true,
      }
    });

    // Create shipment record separately
    const shipment = await (prisma as any).shipment.create({
      data: {
        orderId: order.id,
        courier,
        trackingCode,
        trackingUrl: `https://global-courier.com/track/${trackingCode}`,
        status: "Created"
      }
    });

    // Trigger real-time notification for admin
    await notifyNewOrder({
      id: order.id,
      total: order.total ?? 0,
      currency: order.currency,
      userName: shipping?.first_name ? `${shipping.first_name} ${shipping.last_name || ''}` : undefined,
      email: order.email || undefined,
    }).catch(err => console.error("Pusher notification failed:", err));

    // Decrement stock for each ordered item
    for (const orderItem of orderItemsData) {
      const product = await prisma.product.findUnique({
        where: { id: orderItem.productId }
      });
      if (product && product.stockQuantity !== null) {
        await prisma.product.update({
          where: { id: orderItem.productId },
          data: {
            stockQuantity: Math.max(0, product.stockQuantity - orderItem.quantity)
          }
        });
      }
    }

    revalidatePath('/ueadmin/orders');

    // NOTE: Customer confirmation email is NOT sent here.
    // It is sent AFTER payment is confirmed:
    //   - COD: sent in /api/payments/cod after "Confirm Cash on Delivery" is clicked
    //   - Stripe: sent in /api/payments/stripe/webhook after payment_intent.succeeded
    const customerEmail = session?.user?.email || billing?.email || shipping?.email || order.email;
    const customerName = shipping?.first_name 
      ? `${shipping.first_name} ${shipping.last_name || ''}` 
      : 'Customer';

    if (false) {
      // Placeholder block — email logic moved to payment confirmation routes
      console.log(`[Order Email] Deferred for order ${order.id} to ${customerEmail}`);

      const DOMAIN = 'https://shanafaglobal.com';
      const DASHBOARD_URL = `${DOMAIN}/account`;
      const TRACKING_URL = shipment?.trackingUrl || `${DOMAIN}/account/orders/${order.id}`;
      
      // Prepare order items with full details
      const orderItems = order.items.map((item: any) => ({
        id: item.productId,
        name: item.name || item.product?.name || 'Product',
        quantity: item.quantity,
        price: item.unitPrice || item.price,
        brand: item.product?.brand?.name,
        imageUrl: item.product?.mainImage || item.imageUrl,
      }));

      // Enhanced email HTML with tracking and links
      const orderUrl = `${DOMAIN}/account/orders/${order.id}`;
      const paymentMethodText = isCOD ? 'Cash on Delivery' : (order.paymentMethodTitle || 'Credit Card');
      const paymentStatusText = isCOD ? 'Cash on Delivery' : 'Paid';
      const deliveryEstimate = '2-3 business days';

      const itemsHtml = orderItems.map((item: any) => {
        const itemTotal = (item.price * item.quantity).toFixed(2);
        const productUrl = `${DOMAIN}/product/${item.id}`;
        return `
          <tr>
            <td style="padding: 12px 8px; border-bottom: 1px solid #eee;">
              <div style="display: flex; align-items: center; gap: 12px;">
                ${item.imageUrl ? `<img src="${item.imageUrl}" alt="${item.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 6px;" />` : ''}
                <div>
                  <a href="${productUrl}" style="font-weight: 500; color: #333; text-decoration: none;">${item.name}</a>
                  ${item.brand ? `<div style="font-size: 11px; color: #888; text-transform: uppercase;">${item.brand}</div>` : ''}
                </div>
              </div>
            </td>
            <td style="padding: 12px 8px; border-bottom: 1px solid #eee; text-align: center; color: #666;">x${item.quantity}</td>
            <td style="padding: 12px 8px; border-bottom: 1px solid #eee; text-align: right; color: #333;">${order.currency.toUpperCase()} ${itemTotal}</td>
          </tr>
        `;
      }).join('');

      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; border-radius: 16px 16px 0 0;">
            <h1 style="color: white; margin: 0 0 10px; font-size: 28px;">Order Confirmed! 🎉</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 0; font-size: 16px;">Thank you for shopping with SHANFA</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 16px 16px; border: 1px solid #e9ecef;">
            <p style="color: #495057; font-size: 16px; margin: 0 0 20px;">Hello <strong>${customerName}</strong>,</p>
            
            <div style="background: white; padding: 24px; border-radius: 12px; margin: 0 0 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                <div>
                  <h2 style="color: #333; margin: 0 0 5px; font-size: 20px;">Order #${order.id}</h2>
                  <p style="color: #6c757d; margin: 0; font-size: 13px;">${new Date(order.createdAt).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
                <div style="text-align: right;">
                  <span style="background: ${isCOD ? '#ffc107' : '#28a745'}; color: ${isCOD ? '#000' : '#fff'}; padding: 8px 16px; border-radius: 20px; font-size: 12px; font-weight: 600; display: inline-block;">${paymentStatusText}</span>
                  <p style="color: #6c757d; margin: 8px 0 0; font-size: 12px;">📦 Est. delivery: ${deliveryEstimate}</p>
                </div>
              </div>
              
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 13px;">
                <div style="background: #f8f9fa; padding: 12px; border-radius: 8px;">
                  <span style="color: #6c757d;">Payment Method</span>
                  <div style="color: #333; font-weight: 600;">${paymentMethodText}</div>
                </div>
                <div style="background: #f8f9fa; padding: 12px; border-radius: 8px;">
                  <span style="color: #6c757d;">Estimated Delivery</span>
                  <div style="color: #333; font-weight: 600;">${deliveryEstimate}</div>
                </div>
              </div>
            </div>
            
            <div style="background: white; padding: 24px; border-radius: 12px; margin: 0 0 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
              <h3 style="color: #333; margin: 0 0 16px; font-size: 16px;">Order Items</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr style="border-bottom: 2px solid #dee2e6;">
                    <th style="padding: 8px; text-align: left; color: #6c757d; font-size: 11px; text-transform: uppercase;">Product</th>
                    <th style="padding: 8px; text-align: center; color: #6c757d; font-size: 11px; text-transform: uppercase;">Qty</th>
                    <th style="padding: 8px; text-align: right; color: #6c757d; font-size: 11px; text-transform: uppercase;">Price</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>
              
              <div style="border-top: 2px solid #dee2e6; margin-top: 16px; padding-top: 16px;">
                <table style="width: 100%;">
                  <tr><td style="padding: 4px 0; color: #6c757d;">Subtotal</td><td style="padding: 4px 0; text-align: right; color: #333;">${order.currency.toUpperCase()} ${order.subtotal?.toFixed(2)}</td></tr>
                  <tr><td style="padding: 4px 0; color: #6c757d;">Shipping</td><td style="padding: 4px 0; text-align: right; color: #333;">${order.currency.toUpperCase()} ${order.shipping?.toFixed(2)}</td></tr>
                  ${order.discountAmount ? `<tr><td style="padding: 4px 0; color: #28a745;">Discount</td><td style="padding: 4px 0; text-align: right; color: #28a745;">-${order.currency.toUpperCase()} ${(order.discountAmount ?? 0).toFixed(2)}</td></tr>` : ''}
                  <tr style="font-weight: bold; font-size: 18px; border-top: 2px solid #333; margin-top: 8px;">
                    <td style="padding: 12px 0 0;">Total</td>
                    <td style="padding: 12px 0 0; text-align: right; color: #667eea;">${order.currency.toUpperCase()} ${order.total?.toFixed(2)}</td>
                  </tr>
                </table>
              </div>
            </div>
            
            ${shipping ? `
            <div style="background: white; padding: 24px; border-radius: 12px; margin: 0 0 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
              <h3 style="color: #333; margin: 0 0 12px; font-size: 16px;">Shipping Address</h3>
              <p style="color: #495057; margin: 0; line-height: 1.6;">
                ${shipping.first_name} ${shipping.last_name || ''}<br>
                ${shipping.address_1 || ''}<br>
                ${shipping.city || ''}, ${shipping.country || ''}<br>
                ${shipping.phone ? `📞 ${shipping.phone}` : ''}
              </p>
            </div>` : ''}
            
            <div style="display: flex; gap: 12px; margin: 24px 0;">
              <a href="${orderUrl}" style="flex: 1; background: #667eea; color: white; padding: 16px 24px; border-radius: 10px; text-align: center; text-decoration: none; font-weight: 600; font-size: 14px;">📋 My Orders</a>
              <a href="${TRACKING_URL}" style="flex: 1; background: #28a745; color: white; padding: 16px 24px; border-radius: 10px; text-align: center; text-decoration: none; font-weight: 600; font-size: 14px;">🚚 Track Order</a>
            </div>
            
            <div style="background: #f8f9fa; padding: 16px; border-radius: 8px; margin: 16px 0;">
              <p style="color: #6c757d; margin: 0 0 8px; font-size: 13px;"><strong>Need Help?</strong></p>
              <p style="margin: 0; font-size: 13px;">
                <a href="${DOMAIN}/contact" style="color: #667eea;">Contact Support</a> · 
                <a href="${DASHBOARD_URL}" style="color: #667eea;">My Dashboard</a> · 
                <a href="${DOMAIN}/returns" style="color: #667eea;">Returns</a>
              </p>
            </div>
            
            <p style="color: #6c757d; font-size: 12px; text-align: center; margin: 24px 0 0;">
              Thank you for shopping with SHANFA GLOBAL!<br>
              <a href="${DOMAIN}" style="color: #667eea;">shanafaglobal.com</a>
            </p>
          </div>
        </div>
      `;

      await sendEmail({
        to: customerEmail,
        subject: `Order Confirmed #${order.id} - SHANFA`,
        html: emailHtml,
      }).catch((err) => {
        console.error("Failed to send order email:", err);
        // If email failed, reset the flag so it can be retried
        prisma.order.update({
          where: { id: order.id },
          data: { emailConfirmationSent: false }
        }).catch(() => {});
      });
    } else {
      console.log(`[Order Email] Skipping email - already sent or no email address for order ${order.id}`);
    }

    // Always notify admin of new orders (both COD and prepaid)
    if (process.env.ADMIN_EMAIL) {
      const adminItemsList = order.items.map((item: any) => `${item.name || 'Product'} x${item.quantity}`).join(', ');
      await sendEmail({
        to: process.env.ADMIN_EMAIL,
        subject: isCOD ? `New COD Order #${order.id} - ${order.total?.toFixed(2)} ${order.currency.toUpperCase()}` : `New Order #${order.id} - PAID ${order.total?.toFixed(2)} ${order.currency.toUpperCase()}`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2 style="color: #333;">New Order Received! ${isCOD ? '💵 Cash on Delivery' : '✅ Paid'}</h2>
            <table style="border-collapse: collapse; width: 100%; max-width: 500px;">
              <tr><td style="padding: 8px 0; color: #666;">Order ID</td><td style="padding: 8px 0;"><strong>#${order.id}</strong></td></tr>
              <tr><td style="padding: 8px 0; color: #666;">Customer</td><td style="padding: 8px 0;">${customerEmail || 'Guest'}</td></tr>
              <tr><td style="padding: 8px 0; color: #666;">Amount</td><td style="padding: 8px 0;"><strong style="font-size: 18px;">${order.currency.toUpperCase()} ${order.total?.toFixed(2)}</strong></td></tr>
              <tr><td style="padding: 8px 0; color: #666;">Payment</td><td style="padding: 8px 0;">${isCOD ? 'Cash on Delivery' : 'Credit Card'}</td></tr>
              <tr><td style="padding: 8px 0; color: #666;">Items</td><td style="padding: 8px 0;">${adminItemsList}</td></tr>
            </table>
            <p style="margin-top: 20px;"><a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/ueadmin/orders/${order.id}" style="background: #667eea; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none;">View Order</a></p>
          </div>
        `
      }).catch(console.error);
    }

    return NextResponse.json({
      orderId: order.id,
      subtotal: finalSubtotal,
      shipping: effectiveShipping,
      total: order.total,
      currency: order.currency,
      status: order.status,
      freeDelivery,
      courier: shipment?.courier,
      trackingCode: shipment?.trackingCode
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
    }
    
    return NextResponse.json({ error: errorMessage }, { status: errorStatus });
  }
}
