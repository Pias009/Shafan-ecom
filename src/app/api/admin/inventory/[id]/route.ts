import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminApiSession } from '@/lib/admin-session';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminApiSession();
  if (!session) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const { quantity } = body;

    if (typeof quantity !== 'number') {
      return NextResponse.json({ error: 'Invalid quantity' }, { status: 400 });
    }

    const updated = await prisma.storeInventory.update({
      where: { id },
      data: { quantity },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("INVENTORY_UPDATE_ERROR:", error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
