import { prisma } from '@/lib/prisma';
import { getServerAuthSession } from '@/lib/auth';

function toCSV(rows: any[]) {
  if (!rows.length) return '';
  const header = Object.keys(rows[0]).join(',');
  const body = rows.map(r => Object.values(r).map(v => JSON.stringify(v)).join(',')).join('\n');
  return header + '\n' + body;
}

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
      user: { select: { email: true, name: true } },
    },
  });
  const rows = orders.map((o: any) => ({ id: o.id, date: o.createdAt, status: o.status, currency: o.currency, total: (o.totalCents ?? 0) / 100, customer: o.user?.name ?? o.user?.email }));
  const csv = toCSV(rows);
  return new Response(csv, { headers: { 'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename="orders.csv"' } });
}
