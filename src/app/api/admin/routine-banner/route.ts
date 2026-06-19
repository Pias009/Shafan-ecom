import { prisma } from '@/lib/prisma';
import { getAdminApiSession } from '@/lib/admin-session';
import { revalidatePath } from 'next/cache';
import { NextRequest } from 'next/server';

export async function GET() {
  try {
    const banners = await (prisma as any).routineBanner.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return Response.json(banners);
  } catch (error) {
    console.error('ROUTINE_BANNER_GET_ERROR:', error);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getAdminApiSession();
  if (!session) return new Response('Unauthorized', { status: 401 });

  try {
    const data = await req.json();
    const { title, subtitle, imageUrl, linkUrl, active } = data;

    if (!title) {
      return Response.json({ error: 'title is required' }, { status: 400 });
    }

    const banner = await (prisma as any).routineBanner.create({
      data: { title, subtitle, imageUrl, linkUrl, active: active ?? true },
    });

    revalidatePath('/');
    revalidatePath('/products/routine');

    return Response.json(banner, { status: 201 });
  } catch (error) {
    console.error('ROUTINE_BANNER_POST_ERROR:', error);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const session = await getAdminApiSession();
  if (!session) return new Response('Unauthorized', { status: 401 });

  try {
    const data = await req.json();
    const { id, title, subtitle, imageUrl, linkUrl, active } = data;

    if (!id) return Response.json({ error: 'id is required' }, { status: 400 });

    const banner = await (prisma as any).routineBanner.update({
      where: { id },
      data: { title, subtitle, imageUrl, linkUrl, active },
    });

    revalidatePath('/');
    revalidatePath('/products/routine');

    return Response.json(banner);
  } catch (error) {
    console.error('ROUTINE_BANNER_PUT_ERROR:', error);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getAdminApiSession();
  if (!session) return new Response('Unauthorized', { status: 401 });

  try {
    const { id } = await req.json();
    if (!id) return Response.json({ error: 'id is required' }, { status: 400 });

    await (prisma as any).routineBanner.delete({ where: { id } });

    revalidatePath('/');
    revalidatePath('/products/routine');

    return Response.json({ success: true });
  } catch (error) {
    console.error('ROUTINE_BANNER_DELETE_ERROR:', error);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}
