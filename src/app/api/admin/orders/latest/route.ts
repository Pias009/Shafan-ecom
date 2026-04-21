import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminApiSession, getAccessibleStoreIds } from "@/lib/admin-session";

export async function GET() {
  try {
    const session = await getAdminApiSession();
    if (!session) {
      return new Response("Unauthorized", { status: 401 });
    }

    const accessibleStoreIds = await getAccessibleStoreIds();
    if (accessibleStoreIds.length === 0) {
      return NextResponse.json({ id: null });
    }

    const latestOrder = await (prisma as any).order.findFirst({
      where: {
        storeId: { in: accessibleStoreIds }
      },
      select: {
        id: true,
        total: true,
        currency: true,
        billingAddress: true,
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    if (!latestOrder) {
      return NextResponse.json({ id: null });
    }

    const billing = latestOrder.billingAddress as any;

    return NextResponse.json({
      id: latestOrder.id,
      total: latestOrder.total,
      currency: latestOrder.currency,
      customerName: billing?.fullName || billing?.first_name ? `${billing?.first_name || ''} ${billing?.last_name || ''}`.trim() : "A customer"
    });
  } catch (error) {
    console.error("Failed to fetch latest order:", error);
    return NextResponse.json({ id: null }, { status: 500 });
  }
}
