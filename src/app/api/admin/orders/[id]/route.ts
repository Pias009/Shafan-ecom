import { prisma } from '@/lib/prisma';
import { getAdminApiSession } from '@/lib/admin-session';
import { OrderStatus, ReturnStatus, PaymentStatus } from '@prisma/client';
import { TamaraService } from '@/services/payments/tamara';
import { TamaraCurrency } from '@/services/payments/tamara/types';

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
    const { action, status, shippingAddress, billingAddress, items, total, subtotal } = body; 

    let updateData: any = {};
    
    if (action) {
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
      }
    } else {
      // Manual updates from admin panel
      if (status) updateData.status = status;
      if (shippingAddress) updateData.shippingAddress = shippingAddress;
      if (billingAddress) updateData.billingAddress = billingAddress;
      if (typeof total === 'number') updateData.total = total;
      if (typeof subtotal === 'number') updateData.subtotal = subtotal;

      // Handle items update
      if (items && Array.isArray(items)) {
        // Delete old items and create new ones (simplest way to handle updates for complex items)
        // Or we can update them individually if we have IDs.
        // Assuming items have IDs, we update quantity.
        for (const item of items) {
          if (item.id) {
            await (prisma as any).orderItem.update({
              where: { id: item.id },
              data: {
                quantity: item.quantity,
                // price can also be updated if needed
              }
            });
          }
        }
      }
    }

    const order = await prisma.order.update({
      where: { id },
      data: updateData
    });

    // Handle Tamara lifecycle triggers if status changed to ORDER_CONFIRMED
    if (updateData.status === OrderStatus.ORDER_CONFIRMED && order.tamaraCheckoutId) {
      try {
        const tamaraService = new TamaraService();
        console.log(`[Admin] Triggering Tamara authorise/capture for order ${id}`);
        
        // 1. Authorise (mandatory first step for some Tamara flows)
        await tamaraService.authoriseOrder(order.tamaraCheckoutId).catch(e => {
          console.warn("[Tamara] Authorise already done or failed:", e.message);
        });

        // 2. Capture (triggers funds transfer)
        await tamaraService.capturePayment({
          orderId: order.tamaraCheckoutId,
          totalAmount: {
            amount: (order.total ?? 0).toString(),
            currency: (order.currency ?? "AED").toUpperCase() as TamaraCurrency
          },
          shippingInfo: {
            shipping_company: "Naqel",
            tracking_number: (order as any).trackingId || "PENDING",
            tracking_url: (order as any).trackingUrl || ""
          }
        });

        console.log(`[Admin] Tamara payment captured for order ${id}`);
        
        // Update payment status
        await prisma.order.update({
          where: { id },
          data: { paymentStatus: PaymentStatus.PAID }
        });
      } catch (err: any) {
        console.error(`[Admin] Tamara trigger failed for order ${id}:`, err.message);
      }
    }

    return new Response(JSON.stringify(order), { headers: { 'Content-Type': 'application/json' } });
  } catch (error: any) {
    console.error('Order PATCH error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
