import { prisma } from '@/lib/prisma';
import { getAdminApiSession } from '@/lib/admin-session';

export async function GET() {
  const session = await getAdminApiSession();
  if (!session) {
    return new Response('Unauthorized', { status: 401 });
  }
  const admins = await prisma.user.findMany({
    where: { NOT: { role: 'USER' } },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
    },
  });
  return new Response(JSON.stringify(admins), {
    headers: { 'Content-Type': 'application/json' },
  });
}
