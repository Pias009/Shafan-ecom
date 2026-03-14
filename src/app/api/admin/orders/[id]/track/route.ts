import { prisma } from '@/lib/prisma';
import { getServerAuthSession } from '@/lib/auth';
import { z } from 'zod';

const TrackSchema = z.object({ trackingCode: z.string().optional(), trackingUrl: z.string().optional(), courier: z.string().optional() });

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerAuthSession();
  if (!session || !['ADMIN','SUPERADMIN'].includes((session.user as any)?.role)) {
    return new Response('Unauthorized', { status: 401 });
  }
  try {
    const body = await request.json();
    const parsed = TrackSchema.safeParse(body);
    if (!parsed.success) return new Response(JSON.stringify({ error: 'Invalid payload' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    let shipment = await (prisma as any).shipment.findUnique({ where: { orderId: id } });
    if (!shipment) {
      shipment = await (prisma as any).shipment.create({ data: { orderId: id, courier: parsed.data.courier ?? '', trackingCode: parsed.data.trackingCode ?? '', trackingUrl: parsed.data.trackingUrl ?? '', status: 'Created' } });
    } else {
      shipment = await (prisma as any).shipment.update({ where: { id: shipment.id }, data: { trackingCode: parsed.data.trackingCode, trackingUrl: parsed.data.trackingUrl, courier: parsed.data.courier } });
    }
    return new Response(JSON.stringify(shipment), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch {
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
