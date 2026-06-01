import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const guestEmail = url.searchParams.get("email");
  const session = await getServerAuthSession();
  
  if (!session?.user?.id && !guestEmail) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const dbOrders = await prisma.order.findMany({
      where: session?.user?.id 
        ? { userId: session.user.id } 
        : { email: guestEmail || "" },
      include: {
        items: {
          include: {
            product: {
              select: { slug: true, mainImage: true, images: true }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });

    const orders = dbOrders.map((o: any) => ({
      id: o.id,
      status: o.status,
      total: o.total,
      totalCents: o.total,
      currency: o.currency || 'AED',
      createdAt: o.createdAt.toISOString(),
      paymentStatus: o.paymentStatus,
      paymentMethod: o.paymentMethodTitle,
      shipping: o.shipping,
      subtotal: o.subtotal,
      discount: o.discount,
      taxAmount: o.taxAmount,
      taxRate: o.taxRate,
      trackingUrl: o.trackingUrl,
      trackingId: o.trackingId,
      shipment: o.shipment ? {
        courier: (o.shipment as any)?.courier,
        trackingCode: (o.shipment as any)?.trackingCode,
        trackingUrl: (o.shipment as any)?.trackingUrl,
      } : null,
      shippingAddress: o.shippingAddress || {},
      items: o.items.map((it: any) => ({
        id: it.id,
        name: it.nameSnapshot || "Unknown Product",
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        total: (Number(it.unitPrice) * it.quantity).toFixed(2),
        image: it.imageSnapshot || (it.product as any)?.mainImage || (it.product as any)?.images?.[0] || null,
        productSlug: (it.product as any)?.slug || it.productId,
      }))
    }));

    const stats = {
      pending: dbOrders.filter((o) => o.status === "ORDER_RECEIVED" || o.status === "PROCESSING").length,
      shipped: dbOrders.filter((o) => ["READY_FOR_PICKUP", "ORDER_PICKED_UP", "IN_TRANSIT"].includes(o.status)).length,
      delivered: dbOrders.filter((o) => o.status === "DELIVERED").length,
      refunded: dbOrders.filter((o) => o.status === "REFUNDED").length,
    };

    return NextResponse.json({ orders, stats });
  } catch (error) {
    console.error("Dashboard API Error:", error);
    return NextResponse.json({ orders: [], stats: { pending: 0, shipped: 0, delivered: 0, refunded: 0 } });
  }
}
