import { prisma } from "@/lib/prisma";
import { OrderStatus, PaymentStatus } from "@prisma/client";
import { computeReadyBy, DELIVERY_METHOD_PICKUP, type PickupDetails } from "@/lib/pickup";
import { sendServerPurchase } from "@/lib/ga-server";

const PENDING_CHECKOUT_TTL_MS = 24 * 60 * 60 * 1000;

export type PendingCheckoutItemSnapshot = {
  productId: string;
  quantity: number;
  unitPrice: number;
  nameSnapshot: string;
  imageSnapshot: string | null;
  categoryNameSnapshot: string;
  weightSnapshot: number;
  weightUnitSnapshot: string;
};

export type CreatePendingCheckoutInput = {
  userId?: string | null;
  email?: string | null;
  storeId?: string | null;
  currency: string;
  subtotal: number;
  shipping: number;
  discount: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  totalWeight?: number;
  paymentMethod?: string | null;
  paymentMethodTitle?: string | null;
  billingAddress: any;
  shippingAddress: any;
  deliveryMethod?: string | null;
  pickupDetails?: PickupDetails | null;
  items: PendingCheckoutItemSnapshot[];
  discountId?: string | null;
  discountAmount?: number | null;
  couponCode?: string | null;
  referralSource?: string | null;
  gaClientId?: string | null;
  gaSessionId?: string | null;
};

export async function createPendingCheckout(input: CreatePendingCheckoutInput) {
  const pendingCheckout = await (prisma as any).pendingCheckout.create({
    data: {
      userId: input.userId || null,
      email: input.email || null,
      storeId: input.storeId || null,
      currency: input.currency,
      subtotal: input.subtotal,
      shipping: input.shipping,
      discount: input.discount,
      taxRate: input.taxRate,
      taxAmount: input.taxAmount,
      total: input.total,
      totalWeight: input.totalWeight || 0,
      paymentMethod: input.paymentMethod || null,
      paymentMethodTitle: input.paymentMethodTitle || "Pending Selection",
      billingAddress: input.billingAddress || {},
      shippingAddress: input.shippingAddress || {},
      deliveryMethod: input.deliveryMethod || null,
      pickupDetails: input.pickupDetails || null,
      items: input.items,
      discountId: input.discountId || null,
      discountAmount: input.discountAmount || null,
      couponCode: input.couponCode || null,
      referralSource: input.referralSource || null,
      gaClientId: input.gaClientId || null,
      gaSessionId: input.gaSessionId || null,
      status: "OPEN",
      expiresAt: new Date(Date.now() + PENDING_CHECKOUT_TTL_MS),
    },
  });

  return pendingCheckout;
}

function generateTrackingCode(): string {
  const prefix = "GL";
  const random = Math.random().toString(36).substring(2, 10).toUpperCase();
  return `${prefix}-${random}-${Date.now().toString().slice(-6)}`;
}

export type PromoteToOrderOptions = {
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  paymentMethod?: string;
  paymentMethodTitle?: string;
  stripePaymentIntentId?: string;
  tabbyPaymentId?: string;
  tabbySessionId?: string;
  tamaraCheckoutId?: string;
};

/**
 * Convert a PendingCheckout into a real Order. Idempotent: if the
 * PendingCheckout has already been consumed (e.g. duplicate webhook
 * delivery), returns the previously-created Order instead of creating
 * a second one.
 */
export async function promoteToOrder(pendingCheckoutId: string, opts: PromoteToOrderOptions) {
  const pc = await (prisma as any).pendingCheckout.findUnique({ where: { id: pendingCheckoutId } });
  if (!pc) {
    throw new Error(`PendingCheckout not found: ${pendingCheckoutId}`);
  }

  // Atomic claim — only one caller can move OPEN/EXPIRED -> CONSUMED.
  const claimedFrom = pc.status;
  const claim = await (prisma as any).pendingCheckout.updateMany({
    where: { id: pendingCheckoutId, status: { in: ["OPEN", "EXPIRED"] } },
    data: { status: "CONSUMED" },
  });

  if (claim.count !== 1) {
    // Already consumed by a concurrent/duplicate call — return the existing Order.
    const existing = await (prisma as any).pendingCheckout.findUnique({ where: { id: pendingCheckoutId } });
    if (existing?.consumedOrderId) {
      const existingOrder = await prisma.order.findUnique({
        where: { id: existing.consumedOrderId },
        include: { items: true, shipment: true },
      });
      if (existingOrder) return { order: existingOrder, alreadyPromoted: true };
    }
    throw new Error(`PendingCheckout ${pendingCheckoutId} is not OPEN and has no consumedOrderId`);
  }

  const items = (pc.items as unknown as PendingCheckoutItemSnapshot[]) || [];
  const isPickup = pc.deliveryMethod === DELIVERY_METHOD_PICKUP;
  // Ready-by counts from when the order becomes real, not when checkout began.
  const pickupDetails: PickupDetails | null = isPickup && pc.pickupDetails
    ? {
        ...(pc.pickupDetails as PickupDetails),
        readyBy: computeReadyBy(Number((pc.pickupDetails as PickupDetails).readyInDays) || 0).toISOString(),
      }
    : null;

  // If the Order can't be created, release the claim so the webhook retry,
  // return-page verify or cron can try again. Leaving it CONSUMED with no
  // consumedOrderId would orphan a paid checkout for good.
  let order;
  try {
    order = await prisma.order.create({
      data: {
        userId: pc.userId || null,
        email: pc.email || null,
        storeId: pc.storeId || null,
        status: opts.status,
        paymentStatus: opts.paymentStatus,
        currency: pc.currency,
        subtotal: pc.subtotal,
        shipping: pc.shipping,
        discount: pc.discount,
        taxRate: pc.taxRate,
        taxAmount: pc.taxAmount,
        total: pc.total,
        totalWeight: pc.totalWeight || 0,
        billingAddress: pc.billingAddress || {},
        shippingAddress: pc.shippingAddress || {},
        deliveryMethod: pc.deliveryMethod || null,
        pickupDetails: (pickupDetails as any) ?? undefined,
        paymentMethod: opts.paymentMethod || pc.paymentMethod || null,
        paymentMethodTitle: opts.paymentMethodTitle || pc.paymentMethodTitle || null,
        stripePaymentIntentId: opts.stripePaymentIntentId || null,
        tabbyPaymentId: opts.tabbyPaymentId || pc.tabbyPaymentId || null,
        tabbySessionId: opts.tabbySessionId || pc.tabbySessionId || null,
        tamaraCheckoutId: opts.tamaraCheckoutId || pc.tamaraCheckoutId || null,
        ...(pc.couponCode ? { couponCode: pc.couponCode, discountAmount: pc.discountAmount } : {}),
        referralSource: pc.referralSource || null,
        items: {
          create: items.map((item) => ({
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
  } catch (err) {
    await (prisma as any).pendingCheckout.updateMany({
      where: { id: pendingCheckoutId, status: "CONSUMED", consumedOrderId: null },
      data: { status: claimedFrom === "EXPIRED" ? "EXPIRED" : "OPEN" },
    }).catch((revertErr: any) => console.error("[promoteToOrder] claim revert failed:", revertErr));
    throw err;
  }

  // Link the Order immediately — from here on duplicates return this Order,
  // so nothing below may leave the checkout unlinked.
  await (prisma as any).pendingCheckout.update({
    where: { id: pendingCheckoutId },
    data: { consumedOrderId: order.id },
  });

  // Decrement stock now that the order is real. Non-fatal: the payment is
  // already taken, so a stock write must never undo the order.
  for (const item of items) {
    try {
      const product = await prisma.product.findUnique({ where: { id: item.productId } });
      if (product && product.stockQuantity !== null) {
        await prisma.product.update({
          where: { id: item.productId },
          data: { stockQuantity: Math.max(0, product.stockQuantity - item.quantity) },
        });
      }
    } catch (err) {
      console.error(`[promoteToOrder] stock decrement failed for ${item.productId} (order ${order.id}):`, err);
    }
  }

  // Record discount usage now that a real order exists.
  if (pc.discountId) {
    await (prisma as any).discountUsage.create({
      data: {
        discountId: pc.discountId,
        userId: pc.userId || null,
        orderId: order.id,
        email: pc.email || null,
        amountSaved: pc.discountAmount || 0,
      },
    }).catch((err: any) => console.error("[promoteToOrder] discountUsage.create failed:", err));

    await (prisma as any).discount.update({
      where: { id: pc.discountId },
      data: { uses: { increment: 1 } },
    }).catch((err: any) => console.error("[promoteToOrder] discount.uses increment failed:", err));
  }

  // Create shipment (pickup orders get a non-courier record, no tracking URL).
  // Non-fatal: the Stripe/COD flows upsert a shipment afterwards if missing.
  const trackingCode = generateTrackingCode();
  const shipment = await prisma.shipment.create({
    data: isPickup
      ? {
          orderId: order.id,
          courier: "STORE_PICKUP",
          trackingCode,
          trackingUrl: null,
          status: "Created",
        }
      : {
          orderId: order.id,
          courier: "GLOBAL_COURIER",
          trackingCode,
          trackingUrl: `https://global-courier.com/track/${trackingCode}`,
          status: "Created",
        },
  }).catch((err: any) => {
    console.error(`[promoteToOrder] shipment.create failed for order ${order.id}:`, err);
    return null;
  });

  // GA4 purchase from the server — the browser event is lost whenever the
  // buyer leaves /checkout/success early. Never throws; no-op without GA4_API_SECRET.
  await sendServerPurchase({
    id: order.id,
    total: order.total,
    currency: order.currency,
    shipping: order.shipping,
    taxAmount: order.taxAmount,
    couponCode: pc.couponCode,
    paymentMethod: order.paymentMethod,
    items: order.items,
    gaClientId: pc.gaClientId,
    gaSessionId: pc.gaSessionId,
  });

  return { order: { ...order, shipment }, alreadyPromoted: false };
}

/**
 * Repair a checkout left CONSUMED with no consumedOrderId (a promotion that
 * crashed before this was made safe). Links it to the Order that holds the same
 * Stripe PaymentIntent if one exists, otherwise reopens it so it can be
 * promoted again. Skips recent rows, which may be a promotion still running.
 * Returns true if the checkout is now OPEN and ready to promote.
 */
export async function recoverStuckPendingCheckout(pendingCheckoutId: string, stripePaymentIntentId: string): Promise<boolean> {
  const pc = await (prisma as any).pendingCheckout.findUnique({
    where: { id: pendingCheckoutId },
    select: { status: true, consumedOrderId: true, updatedAt: true },
  });
  if (!pc || pc.status !== "CONSUMED" || pc.consumedOrderId) return false;
  if (Date.now() - new Date(pc.updatedAt).getTime() < 10 * 60 * 1000) return false;

  const existingOrder = await prisma.order.findFirst({
    where: { stripePaymentIntentId },
    select: { id: true },
  });
  if (existingOrder) {
    await (prisma as any).pendingCheckout.update({
      where: { id: pendingCheckoutId },
      data: { consumedOrderId: existingOrder.id },
    });
    return false;
  }

  const reopened = await (prisma as any).pendingCheckout.updateMany({
    where: { id: pendingCheckoutId, status: "CONSUMED", consumedOrderId: null },
    data: { status: "OPEN" },
  });
  return reopened.count === 1;
}

/**
 * Re-open an EXPIRED checkout so the customer can retry payment (e.g. they
 * cancelled on Tamara/Tabby/Stripe and came back to pick another method).
 * Returns false if the checkout is already CONSUMED (a real Order exists).
 */
export async function reopenPendingCheckoutForRetry(pendingCheckoutId: string): Promise<boolean> {
  const pc = await (prisma as any).pendingCheckout.findUnique({
    where: { id: pendingCheckoutId },
    select: { status: true },
  });
  if (!pc || pc.status === "CONSUMED") return false;
  if (pc.status === "EXPIRED") {
    await (prisma as any).pendingCheckout.updateMany({
      where: { id: pendingCheckoutId, status: "EXPIRED" },
      data: { status: "OPEN", expiresAt: new Date(Date.now() + PENDING_CHECKOUT_TTL_MS) },
    });
  }
  return true;
}

export async function expirePendingCheckout(pendingCheckoutId: string) {
  await (prisma as any).pendingCheckout.updateMany({
    where: { id: pendingCheckoutId, status: "OPEN" },
    data: { status: "EXPIRED" },
  });
}
