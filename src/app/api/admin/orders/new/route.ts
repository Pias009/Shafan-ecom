import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAccessibleStoreIds } from "@/lib/admin-session";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const session = await getServerAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const sinceTimestamp = searchParams.get('since');
    
    const accessibleStoreIds = await getAccessibleStoreIds();
    
    const sinceDate = sinceTimestamp 
      ? new Date(parseInt(sinceTimestamp))
      : new Date(Date.now() - 5 * 60 * 1000); // Default: last 5 minutes

    const newOrders = await (prisma as any).order.findMany({
      where: {
        storeId: { in: accessibleStoreIds },
        createdAt: { gte: sinceDate }
      },
      select: {
        id: true,
        createdAt: true,
        total: true,
        currency: true,
        status: true,
        paymentStatus: true,
        paymentMethod: true,
        items: true,
        email: true,
        shipping: true,
        user: { select: { name: true, email: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      orders: newOrders,
      timestamp: Date.now(),
      count: newOrders.length
    });
  } catch (error) {
    console.error('Error checking new orders:', error);
    return NextResponse.json({ error: "Failed to check orders" }, { status: 500 });
  }
}