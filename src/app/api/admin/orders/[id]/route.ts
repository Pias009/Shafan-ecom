import { prisma } from '@/lib/prisma';
import { getAdminApiSession } from '@/lib/admin-session';
import { OrderStatus, ReturnStatus } from '@prisma/client';

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

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  try {
    const session = await getAdminApiSession();
    if (!session) {
      return new Response('Unauthorized', { status: 401 });
    }
    
    const body = await request.json();
    const { action, status, reason } = body; 

    let updateData: any = {};
    
    switch (action) {
      case 'APPROVE_CANCEL':
        updateData = { 
          status: OrderStatus.CANCELLED,
          cancelRequest: false,
        };
        break;
      case 'REJECT_CANCEL':
        updateData = { 
          cancelRequest: false,
        };
        break;
      case 'APPROVE_RETURN':
        updateData = { 
          returnStatus: ReturnStatus.APPROVED,
        };
        break;
      case 'REJECT_RETURN':
        updateData = { 
          returnStatus: ReturnStatus.REJECTED,
          returnRequest: false,
        };
        break;
      case 'COMPLETE_RETURN':
        updateData = { 
          status: OrderStatus.REFUNDED,
          returnStatus: ReturnStatus.COMPLETED,
          returnRequest: false,
        };
        break;
      default:
        if (status) updateData.status = status;
    }

    const order = await prisma.order.update({
      where: { id },
      data: updateData
    });

    return new Response(JSON.stringify(order), { headers: { 'Content-Type': 'application/json' } });
  } catch (error: any) {
    console.error('Order PATCH error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
