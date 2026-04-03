import { prisma } from '@/lib/prisma';
import { getAdminApiSession } from '@/lib/admin-session';
import { z } from 'zod';
import { sendOrderEmail } from '@/lib/email';

const EmailSchema = z.object({ type: z.enum(['confirm','shipping']) });

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getAdminApiSession();
  if (!session) {
    return new Response('Unauthorized', { status: 401 });
  }
  try {
    const body = await request.json();
    const parsed = EmailSchema.safeParse(body);
    if (!parsed.success) return new Response(JSON.stringify({ error: 'Invalid payload' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    const order = await (prisma as any).order.findUnique({ where: { id: id }, include: { user: true } });
    const to = order?.user?.email;
    if (!to) return new Response(JSON.stringify({ ok: false, message: 'No recipient email' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    const subject = parsed.data.type === 'confirm' ? 'Your order is received' : 'Shipping update for your order';
    const html = `<p>Order ${id} - ${parsed.data.type}</p>`;
    const ok = await sendOrderEmail(to, subject, html);
    return new Response(JSON.stringify({ ok, to, subject }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch {
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
