import { prisma } from '@/lib/prisma';
import { getServerAuthSession } from '@/lib/auth';
import { z } from 'zod';

export async function GET({ params }: { params: { id: string } }) {
  const session = await getServerAuthSession();
  if (!session || !['ADMIN','SUPERADMIN'].includes((session.user as any)?.role)) {
    return new Response('Unauthorized', { status: 401 });
  }
  const order = await (prisma as any).order.findUnique({
    where: { id: params.id },
    include: {
      user: { select: { id: true, email: true, name: true } },
      items: { select: { id: true, quantity: true, unitPriceCents: true, product: { select: { id: true, name: true } } } },
      shipment: true,
      coupon: true
    }
  });
  if (!order) return new Response('Not found', { status: 404 });
  return new Response(JSON.stringify(order), { headers: { 'Content-Type': 'application/json' } });
}
