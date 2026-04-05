import { prisma } from '@/lib/prisma';
import { getAdminApiSession } from '@/lib/admin-session';

export async function GET() {
  const session = await getAdminApiSession();
  if (!session) {
    return new Response('Unauthorized', { status: 401 });
  }
  // Aggregate top products by revenue from order items
  const items = await (prisma as any).orderItem.findMany({ include: { product: true }, select: { product: { select: { id: true, name: true } }, quantity: true, unitPrice: true } });
  const map: Record<string, { name: string; revenue: number }> = {};
  for (const it of items) {
    const pid = it.product?.id ?? it.product?.name;
    const name = it.product?.name ?? 'Unknown';
    const rev = (it.quantity ?? 0) * (Number(it.unitPrice) ?? 0);
    if (!map[pid]) map[pid] = { name, revenue: rev };
    else map[pid].revenue += rev;
  }
  const arr = Object.values(map).sort((a,b)=> b.revenue - a.revenue).slice(0,5);
  return new Response(JSON.stringify(arr.map(a => ({ name: a.name, revenue: a.revenue }))), {
    headers: { 'Content-Type': 'application/json' }
  });
}
