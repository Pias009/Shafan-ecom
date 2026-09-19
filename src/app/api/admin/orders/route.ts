import { prisma } from '@/lib/prisma';
import { getAdminApiSession, getAccessibleStoreIds } from '@/lib/admin-session';

export async function GET(req: Request) {
  const session = await getAdminApiSession();
  if (!session) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const statusFilter = searchParams.get('status');
  const limit = Math.min(200, parseInt(searchParams.get('limit') || '100', 10));

  const isSuper = session.user.role === 'SUPERADMIN';
  const accessibleStoreIds = await getAccessibleStoreIds();
  
  if (!isSuper && accessibleStoreIds.length === 0) {
    return new Response(JSON.stringify([]), { headers: { 'Content-Type': 'application/json' } });
  }

  const whereClause: any = {};
  if (!isSuper) {
    whereClause.OR = [
      { storeId: { in: accessibleStoreIds } },
      { storeId: null }
    ];
  }
  if (statusFilter && statusFilter !== 'ALL') {
    whereClause.status = statusFilter;
  }

  const orders = await (prisma as any).order.findMany({
    where: whereClause,
    select: {
      id: true,
      createdAt: true,
      status: true,
      paymentStatus: true,
      currency: true,
      total: true,
      subtotal: true,
      shipping: true,
      paymentMethod: true,
      paymentMethodTitle: true,
      shippingAddress: true,
      billingAddress: true,
      user: { select: { id: true, email: true, name: true } },
      items: { 
        select: { 
          id: true, 
          quantity: true, 
          unitPrice: true,
          nameSnapshot: true,
          imageSnapshot: true,
          categoryNameSnapshot: true,
        } 
      },
      store: { select: { code: true, name: true, country: true } },
      shipment: { select: { courier: true, trackingCode: true, status: true } }
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
  
  const data = orders.map((o: any) => ({
    id: o.id,
    createdAt: o.createdAt,
    status: o.status,
    paymentStatus: o.paymentStatus,
    currency: o.currency,
    total: o.total,
    subtotal: o.subtotal,
    shipping: o.shipping,
    paymentMethod: o.paymentMethod,
    paymentMethodTitle: o.paymentMethodTitle,
    shippingAddress: o.shippingAddress,
    billingAddress: o.billingAddress,
    customerName: (o.shippingAddress as any)?.fullName || (o.shippingAddress as any)?.first_name || o.user?.name || 'Customer',
    customerPhone: (o.shippingAddress as any)?.phone || '',
    user: o.user,
    store: o.store,
    items: o.items || [],
    itemsCount: o.items?.length ?? 0,
    courier: o.shipment?.courier || 'Not assigned',
    trackingCode: o.shipment?.trackingCode || null,
    shipmentStatus: o.shipment?.status || 'Not created'
  }));
  
  return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } });
}
