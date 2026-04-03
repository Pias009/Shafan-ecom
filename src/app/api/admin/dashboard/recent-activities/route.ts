import { prisma } from '@/lib/prisma';
import { getAdminApiSession } from '@/lib/admin-session';

export async function GET() {
  const session = await getAdminApiSession();
  if (!session) {
    return new Response('Unauthorized', { status: 401 });
  }
  const logs = await (prisma as any).auditLog.findMany({ take: 8, orderBy: { createdAt: 'desc' } });
  const enriched = await Promise.all(logs.map(async (log: any) => {
    const actor = await (prisma as any).user.findUnique({ where: { id: log.actorId }, select: { email: true, name: true } });
    return {
      id: log.id,
      action: log.action,
      actor: actor?.email ?? log.actorId,
      createdAt: log.createdAt,
      details: log.details,
    };
  }));
  return new Response(JSON.stringify(enriched), { headers: { 'Content-Type': 'application/json' } });
}
