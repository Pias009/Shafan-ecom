import { prisma } from '@/lib/prisma';
import { getServerAuthSession } from '@/lib/auth';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

const UpdateSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  role: z.enum(['USER','ADMIN','SUPERADMIN']).optional(),
  password: z.string().min(6).optional()
});

export async function GET({ params }: { params: { id: string } }) {
  const session = await getServerAuthSession();
  if (!session || !['ADMIN','SUPERADMIN'].includes((session.user as any)?.role)) {
    return new Response('Unauthorized', { status: 401 });
  }
  const user = await (prisma as any).user.findUnique({ where: { id: params.id }, select: { id: true, email: true, name: true, role: true } });
  if (!user) return new Response('Not found', { status: 404 });
  return new Response(JSON.stringify(user), { headers: { 'Content-Type': 'application/json' } });
}

export async function POST({ params, request }: { params: { id: string }, request: Request }) {
  const session = await getServerAuthSession();
  if (!session || !['ADMIN','SUPERADMIN'].includes((session.user as any)?.role)) {
    return new Response('Unauthorized', { status: 401 });
  }
  try {
    let data: any;
    const contentType = request.headers.get('content-type') ?? '';
    if (contentType.includes('application/json')) {
      data = await request.json();
    } else {
      const form = await request.formData();
      data = Object.fromEntries(form.entries());
    }
    const parsed = UpdateSchema.safeParse(data);
    if (!parsed.success) return new Response(JSON.stringify({ error: 'Invalid payload' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    const updates: any = {};
    if (typeof parsed.data.name !== 'undefined') updates.name = parsed.data.name;
    if (typeof parsed.data.email !== 'undefined') {
      // ensure email uniqueness
      const existing = await (prisma as any).user.findFirst({ where: { email: parsed.data.email } });
      if (existing && existing.id !== params.id) {
        return new Response(JSON.stringify({ error: 'Email already in use' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      }
      updates.email = parsed.data.email;
    }
    if (typeof parsed.data.role !== 'undefined') updates.role = parsed.data.role;
    if (typeof parsed.data.password !== 'undefined') {
      updates.passwordHash = await bcrypt.hash(parsed.data.password, 10);
    }
    if (Object.keys(updates).length === 0) {
      return new Response(JSON.stringify({ error: 'No fields to update' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    const updated = await (prisma as any).user.update({ where: { id: params.id }, data: updates });
    // Audit log for the update
    try {
      await (prisma as any).auditLog.create({
        data: {
          action: 'UPDATE_USER',
          actorId: (session.user as any).id,
          subjectId: params.id,
          details: JSON.stringify(updates),
        },
      });
    } catch {
      // ignore audit logging failures for now
    }
    // Redirect back to users list after update
    return new Response(JSON.stringify(updated), { status: 303, headers: { 'Location': '/ueadmin/users' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
