import { prisma } from '@/lib/prisma';
import { getServerAuthSession } from '@/lib/auth';

export async function GET() {
  const session = await getServerAuthSession();
  if (!session || !['ADMIN','SUPERADMIN'].includes((session.user as any)?.role)) {
    return new Response('Unauthorized', { status: 401 });
  }
  const orders = await (prisma as any).order.findMany({
    select: {
      id: true,
      createdAt: true,
      status: true,
      currency: true,
      totalCents: true,
      shippingCents: true,
      user: { select: { id: true, email: true, name: true } },
      items: { select: { id: true, quantity: true, unitPriceCents: true } },
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
    itemsCount: o.items?.length ?? 0,
  }));
  return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } });
}
