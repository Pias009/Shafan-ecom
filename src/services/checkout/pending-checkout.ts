import { prisma } from "@/lib/prisma";
import { OrderStatus, PaymentStatus } from "@prisma/client";

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
  items: PendingCheckoutItemSnapshot[];
  discountId?: string | null;
  discountAmount?: number | null;
  couponCode?: string | null;
  referralSource?: string | null;
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
      items: input.items,
      discountId: input.discountId || null,
      discountAmount: input.discountAmount || null,
      couponCode: input.couponCode || null,
      referralSource: input.referralSource || null,
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

  // Atomic claim — only one caller can move OPEN -> CONSUMED.
  const claim = await (prisma as any).pendingCheckout.updateMany({
    where: { id: pendingCheckoutId, status: "OPEN" },
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

  const order = await prisma.order.create({
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

  // Decrement stock now that the order is real.
  for (const item of items) {
    const product = await prisma.product.findUnique({ where: { id: item.productId } });
    if (product && product.stockQuantity !== null) {
      await prisma.product.update({
        where: { id: item.productId },
        data: { stockQuantity: Math.max(0, product.stockQuantity - item.quantity) },
      });
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

  // Create shipment.
  const trackingCode = generateTrackingCode();
  const shipment = await prisma.shipment.create({
    data: {
      orderId: order.id,
      courier: "GLOBAL_COURIER",
      trackingCode,
      trackingUrl: `https://global-courier.com/track/${trackingCode}`,
      status: "Created",
    },
  });

  await (prisma as any).pendingCheckout.update({
    where: { id: pendingCheckoutId },
    data: { consumedOrderId: order.id },
  });

  return { order: { ...order, shipment }, alreadyPromoted: false };
}

export async function expirePendingCheckout(pendingCheckoutId: string) {
  await (prisma as any).pendingCheckout.updateMany({
    where: { id: pendingCheckoutId, status: "OPEN" },
    data: { status: "EXPIRED" },
  });
}
