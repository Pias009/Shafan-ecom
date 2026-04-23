import { prisma } from '@/lib/prisma';
import { getAdminApiSession } from '@/lib/admin-session';
import { revalidatePath } from 'next/cache';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getAdminApiSession();
  
  if (!session) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const data = await request.json();
    const { trending } = data;

    if (typeof trending !== 'boolean') {
      return new Response(JSON.stringify({ error: 'trending must be a boolean' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const updated = await prisma.product.update({
      where: { id },
      data: { trending }
    });

    revalidatePath('/');
    revalidatePath('/products');
    revalidatePath('/ueadmin/trending');
    
    return new Response(JSON.stringify(updated), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('TRENDING_UPDATE_ERROR:', error);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}