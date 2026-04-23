import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { OrderStatus } from '@prisma/client';
import { getAccessibleStoreIds } from '@/lib/admin-session';

export const dynamic = 'force-dynamic';

const PENDING_HOURS_THRESHOLD = 24;

async function checkStuckOrders() {
  const now = new Date();
  const threshold = new Date(now.getTime() - PENDING_HOURS_THRESHOLD * 60 * 60 * 1000);
  
  const stuckStatuses = [
    OrderStatus.ORDER_RECEIVED,
    OrderStatus.ORDER_CONFIRMED,
    OrderStatus.PROCESSING,
  ];

  const stuckOrders = await prisma.order.findMany({
    where: {
      status: { in: stuckStatuses },
      createdAt: { lte: threshold },
      reminderSent: false,
    },
    include: {
      user: true,
      store: true,
    },
    orderBy: { createdAt: 'asc' },
    take: 10,
  });

  return stuckOrders;
}

export async function GET(request: NextRequest) {
  try {
    const { getAdminApiSession } = await import('@/lib/admin-session');
    const adminSession = await getAdminApiSession();
    
    if (!adminSession) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accessibleStoreIds = await getAccessibleStoreIds();
    const stuckOrders = await checkStuckOrders();

    const now = new Date();
    const threshold = new Date(now.getTime() - PENDING_HOURS_THRESHOLD * 60 * 60 * 1000);

    const pendingCount = await prisma.order.count({
      where: {
        status: { in: [OrderStatus.ORDER_RECEIVED, OrderStatus.ORDER_CONFIRMED, OrderStatus.PROCESSING] },
        storeId: { in: accessibleStoreIds },
      },
    });

    const stuckCount = stuckOrders.length;

    const notifications = stuckOrders.map((order: any) => ({
      id: order.id,
      orderNumber: order.id.slice(-8).toUpperCase(),
      customerName: order.user?.name || order.user?.email || 'Guest',
      customerEmail: order.email || order.user?.email,
      status: order.status,
      createdAt: order.createdAt,
      hoursPending: Math.round((now.getTime() - new Date(order.createdAt).getTime()) / (1000 * 60 * 60)),
      total: order.total,
      currency: order.currency,
    }));

    return NextResponse.json({
      hasStuckOrders: stuckCount > 0,
      stuckCount,
      pendingCount,
      thresholdHours: PENDING_HOURS_THRESHOLD,
      notifications,
    });
  } catch (error) {
    console.error('Error checking stuck orders:', error);
    return NextResponse.json({ error: 'Failed to check orders' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { getAdminApiSession } = await import('@/lib/admin-session');
    const adminSession = await getAdminApiSession();
    
    if (!adminSession) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { orderId, action } = body;

    if (action === 'markChecked') {
      const order = await prisma.order.update({
        where: { id: orderId },
        data: {
          adminChecked: true,
          adminCheckedAt: new Date(),
        },
      });

      return NextResponse.json({ success: true, order });
    }

    if (action === 'sendReminder') {
      const order = await prisma.order.update({
        where: { id: orderId },
        data: {
          reminderSent: true,
          reminderSentAt: new Date(),
        },
      });

      return NextResponse.json({ success: true, order });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}