import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { getServerAuthSession } from '@/lib/auth';

const UserCreateSchema = z.object({ email: z.string().email(), name: z.string().optional(), password: z.string().min(6), role: z.enum(['USER','ADMIN','SUPERADMIN']).optional() });

export async function GET() {
  const session = await getServerAuthSession();
  if (!session || !['ADMIN','SUPERADMIN'].includes((session.user as any)?.role)) {
    return new Response('Unauthorized', { status: 401 });
  }
  const users = await (prisma as any).user.findMany({ select: { id: true, email: true, name: true, role: true, createdAt: true } , orderBy: { createdAt: 'desc' } });
  return new Response(JSON.stringify(users), { headers: { 'Content-Type': 'application/json' } });
}

export async function POST(req: Request) {
  const session = await getServerAuthSession();
  if (!session || !['ADMIN','SUPERADMIN'].includes((session.user as any)?.role)) {
    return new Response('Unauthorized', { status: 401 });
  }
  try {
    const body = await req.json();
    const parsed = UserCreateSchema.safeParse(body);
    if (!parsed.success) return new Response(JSON.stringify({ error: 'Invalid payload' }), { status: 400 });
    const { email, name, password, role } = parsed.data;
    const hashed = await (await import('bcryptjs')).default.hash(password, 10);
    const user = await (prisma as any).user.upsert({
      where: { email },
      update: { name, passwordHash: hashed, role: (role ?? 'USER') },
      create: { email, name, passwordHash: hashed, role: (role ?? 'USER') },
    });
    return new Response(JSON.stringify({ id: user.id, email: user.email }), { status: 201, headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
}
