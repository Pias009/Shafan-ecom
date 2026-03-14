import { prisma } from '@/lib/prisma';
import { getServerAuthSession } from '@/lib/auth';
import { z } from 'zod';
import { sendOrderEmail } from '@/lib/email';

const EmailSchema = z.object({ type: z.enum(['confirm','shipping']) });

export async function POST({ params, request }: { params: { id: string }, request: Request }) {
  const session = await getServerAuthSession();
  if (!session || !['ADMIN','SUPERADMIN'].includes((session.user as any)?.role)) {
    return new Response('Unauthorized', { status: 401 });
  }
  try {
    const body = await request.json();
    const parsed = EmailSchema.safeParse(body);
    if (!parsed.success) return new Response(JSON.stringify({ error: 'Invalid payload' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    const order = await (prisma as any).order.findUnique({ where: { id: params.id }, include: { user: true } });
    const to = order?.user?.email;
    if (!to) return new Response(JSON.stringify({ ok: false, message: 'No recipient email' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    const subject = parsed.data.type === 'confirm' ? 'Your order is received' : 'Shipping update for your order';
    const html = `<p>Order ${params.id} - ${parsed.data.type}</p>`;
    const ok = await sendOrderEmail(to, subject, html);
    return new Response(JSON.stringify({ ok, to, subject }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch {
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
