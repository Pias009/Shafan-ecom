import { prisma } from '@/lib/prisma';
import { getServerAuthSession } from '@/lib/auth';

export async function GET() {
  const session = await getServerAuthSession();
  // Super Admin gate
  if (!session || session.user?.role !== 'SUPERADMIN') {
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
