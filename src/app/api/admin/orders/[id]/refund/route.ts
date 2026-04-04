import { prisma } from '@/lib/prisma';
import { getAdminApiSession } from '@/lib/admin-api-session';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getAdminApiSession();
  if (!session) {
    return new Response('Unauthorized', { status: 401 });
  }
  try {
    const updated = await prisma.order.update({ where: { id: id }, data: { status: 'REFUNDED' } });
    await prisma.auditLog.create({ data: { action: 'ORDER_REFUNDED', actorId: session.user.id, subjectId: id } });
    return new Response(JSON.stringify(updated), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error: any) {
    console.error('Refund error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Server error' }), { status: 500 });
  }
}
