import { prisma } from '@/lib/prisma';
import { getAdminApiSession } from '@/lib/admin-session';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getAdminApiSession();
  if (!session) {
    return new Response('Unauthorized', { status: 401 });
  }
  try {
    const updated = await (prisma as any).order.update({ where: { id: id }, data: { status: 'REFUNDED' } });
    await (prisma as any).auditLog.create({ data: { action: 'ORDER_REFUNDED', actorId: (session.user as any).id, subjectId: id } });
    return new Response(JSON.stringify(updated), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch {
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
}
