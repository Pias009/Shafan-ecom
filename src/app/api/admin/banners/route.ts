import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { getServerAuthSession } from '@/lib/auth';

const BannerCreateSchema = z.object({ imageUrl: z.string().url(), title: z.string().optional(), link: z.string().optional(), active: z.boolean().optional() });

export async function GET() {
  const session = await getServerAuthSession();
  if (!session || !['ADMIN','SUPERADMIN'].includes((session.user as any)?.role)) {
    return new Response('Unauthorized', { status: 401 });
  }
  const banners = await (prisma as any).banner.findMany({ select: { id: true, imageUrl: true, title: true, link: true, active: true, createdAt: true } , orderBy: { createdAt: 'desc' } });
  return new Response(JSON.stringify(banners), { headers: { 'Content-Type': 'application/json' } });
}

export async function POST(req: Request) {
  const session = await getServerAuthSession();
  if (!session || !['ADMIN','SUPERADMIN'].includes((session.user as any)?.role)) {
    return new Response('Unauthorized', { status: 401 });
  }
  try {
    const body = await req.json();
    const parsed = BannerCreateSchema.safeParse(body);
    if (!parsed.success) return new Response(JSON.stringify({ error: 'Invalid payload' }), { status: 400 });
    const data = parsed.data;
    const banner = await (prisma as any).banner.upsert({
      where: { imageUrl: data.imageUrl },
      update: { title: data.title, link: data.link, active: data.active ?? true },
      create: data,
    });
    return new Response(JSON.stringify(banner), { status: 201, headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
}
