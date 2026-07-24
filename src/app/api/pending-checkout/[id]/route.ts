import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Returns a PendingCheckout in the same shape /api/orders/[id] returns an
// Order, so the checkout payment page can render either interchangeably.
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const pc = await (prisma as any).pendingCheckout.findUnique({ where: { id } });

    if (!pc) {
      return NextResponse.json({ error: "Pending checkout not found" }, { status: 404 });
    }

    const items = (pc.items as any[]) || [];

    return NextResponse.json({
      id: pc.id,
      pendingCheckoutId: pc.id,
      isPendingCheckout: true,
      status: pc.status === "OPEN" ? "ORDER_RECEIVED" : pc.status,
      paymentStatus: "PENDING",
      currency: pc.currency,
      subtotal: pc.subtotal,
      shipping: pc.shipping,
      discount: pc.discount,
      taxRate: pc.taxRate,
      taxAmount: pc.taxAmount,
      total: pc.total,
      totalWeight: pc.totalWeight,
      billingAddress: pc.billingAddress,
      shippingAddress: pc.shippingAddress,
      paymentMethod: pc.paymentMethod,
      paymentMethodTitle: pc.paymentMethodTitle,
      email: pc.email,
      createdAt: pc.createdAt,
      items: items.map((item, idx) => ({
        id: `${pc.id}-${idx}`,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        nameSnapshot: item.nameSnapshot,
        imageSnapshot: item.imageSnapshot,
        weightSnapshot: item.weightSnapshot,
        weightUnitSnapshot: item.weightUnitSnapshot,
      })),
    });
  } catch (error) {
    console.error("Fetch PendingCheckout Error:", error);
    return NextResponse.json({ error: "Failed to fetch pending checkout" }, { status: 500 });
  }
}

// Cancel/expire a pending checkout on Stripe/Tamara cancel-return redirects
// (mirrors /api/orders/[id] PATCH's cancel-only contract).
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { status } = await req.json();

    if (status !== "CANCELLED" && status !== "EXPIRED") {
      return NextResponse.json({ error: "Only cancellation is allowed via this endpoint" }, { status: 400 });
    }

    const pc = await (prisma as any).pendingCheckout.findUnique({ where: { id } });
    if (!pc) {
      return NextResponse.json({ error: "Pending checkout not found" }, { status: 404 });
    }

    // Never touch a PendingCheckout that's already been promoted to a real Order.
    if (pc.status === "OPEN") {
      await (prisma as any).pendingCheckout.update({
        where: { id },
        data: { status: "EXPIRED" },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update PendingCheckout Error:", error);
    return NextResponse.json({ error: "Failed to update pending checkout" }, { status: 500 });
  }
}
