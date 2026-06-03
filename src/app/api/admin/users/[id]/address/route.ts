import { prisma } from '@/lib/prisma';
import { getAdminApiSession } from '@/lib/admin-session';
import { z } from 'zod';

const AddressSchema = z.object({
  fullName: z.string().trim().min(1).max(100),
  phone: z.string().trim().min(5).max(20),
  email: z.string().email(),
  country: z.string().trim().min(1),
  city: z.string().trim().min(1),
  address1: z.string().trim().min(1),
  address2: z.string().trim().optional().or(z.literal("")),
  postalCode: z.string().trim().optional().or(z.literal("")),
}).transform((data) => ({
  fullName: data.fullName,
  phone: data.phone,
  email: data.email,
  country: data.country,
  city: data.city,
  address1: data.address1,
  address2: data.address2 || "",
  postalCode: data.postalCode || "",
}));

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getAdminApiSession();
  if (!session) {
    return new Response('Unauthorized', { status: 401 });
  }

  const address = await prisma.address.findUnique({
    where: { userId: id },
  });

  return new Response(JSON.stringify(address), { headers: { 'Content-Type': 'application/json' } });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getAdminApiSession();
  if (!session) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = AddressSchema.safeParse(body);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: 'Invalid payload', details: parsed.error.format() }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }

    const address = await prisma.address.upsert({
      where: { userId: id },
      create: { userId: id, ...parsed.data },
      update: parsed.data,
    });

    try {
      await (prisma as any).auditLog.create({
        data: {
          action: 'UPDATE_USER_ADDRESS',
          actorId: (session.user as any).id,
          subjectId: id,
          details: JSON.stringify(parsed.data),
        },
      });
    } catch {}

    return new Response(JSON.stringify(address), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Server error' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
}
