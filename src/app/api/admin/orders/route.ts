import { prisma } from '@/lib/prisma';
import { getServerAuthSession } from '@/lib/auth';
import { getAccessibleStoreIds } from '@/lib/admin-store-guard';

export async function GET() {
  const session = await getServerAuthSession();
  if (!session || !['ADMIN','SUPERADMIN'].includes((session.user as any)?.role)) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Get store IDs the admin can access - enforces strict data segregation
  const accessibleStoreIds = await getAccessibleStoreIds();
  
  // If admin has no store access, return empty array
  if (accessibleStoreIds.length === 0) {
    return new Response(JSON.stringify([]), { headers: { 'Content-Type': 'application/json' } });
  }

  const orders = await (prisma as any).order.findMany({
    where: {
      storeId: { in: accessibleStoreIds }
    },
    select: {
      id: true,
      createdAt: true,
      status: true,
      currency: true,
      totalCents: true,
      shippingCents: true,
      user: { select: { id: true, email: true, name: true } },
      items: { select: { id: true, quantity: true, unitPriceCents: true } },
      store: { select: { code: true, name: true, country: true } },
      shipment: { select: { courier: true, trackingCode: true, status: true } }
    },
    orderBy: { createdAt: 'desc' },
  });
  
  const data = orders.map((o: any) => ({
    id: o.id,
    createdAt: o.createdAt,
    status: o.status,
    currency: o.currency,
    totalCents: o.totalCents,
    shippingCents: o.shippingCents,
    user: o.user,
    store: o.store,
    itemsCount: o.items?.length ?? 0,
    courier: o.shipment?.courier || 'Not assigned',
    trackingCode: o.shipment?.trackingCode || null,
    shipmentStatus: o.shipment?.status || 'Not created'
  }));
  
  return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } });
}
