import { prisma } from '@/lib/prisma';
import { getAdminApiSession } from '@/lib/admin-session';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  try {
    const session = await getAdminApiSession();
    if (!session) {
      return new Response('Unauthorized', { status: 401 });
    }
    
    const order = await (prisma as any).order.findUnique({
      where: { id: id },
      include: {
        user: { select: { id: true, email: true, name: true } },
        items: { select: { id: true, quantity: true, unitPrice: true, product: { select: { id: true, name: true } } } },
        shipment: true,
        coupon: true
      }
    });
    
    if (!order) {
      return new Response(JSON.stringify({ error: 'Order not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }
    
    return new Response(JSON.stringify(order), { headers: { 'Content-Type': 'application/json' } });
  } catch (error: any) {
    console.error('Order API error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
