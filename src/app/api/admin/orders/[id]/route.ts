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
    const { action, status, shippingAddress, billingAddress, items, total, subtotal, deletedItemIds } = body; 

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
      // Block editing if order is in courier process or beyond
      const existingOrder = await prisma.order.findUnique({
        where: { id },
        select: { status: true }
      });

      if (existingOrder) {
        const blockedStatuses: string[] = [
          OrderStatus.IN_TRANSIT,
          OrderStatus.ORDER_PICKED_UP,
          OrderStatus.DELIVERED,
          OrderStatus.CANCELLED,
          OrderStatus.REFUNDED,
        ];
        if (blockedStatuses.includes(existingOrder.status)) {
          return new Response(JSON.stringify({
            error: `Cannot edit order with status "${existingOrder.status}". Order is already in transit, delivered, or cancelled.`
          }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }
      }

      if (status) updateData.status = status;
      if (shippingAddress) updateData.shippingAddress = shippingAddress;
      if (billingAddress) updateData.billingAddress = billingAddress;
      if (typeof total === 'number') updateData.total = total;
      if (typeof subtotal === 'number') updateData.subtotal = subtotal;

      // Handle items update
      if (items && Array.isArray(items)) {
        // 1. Delete removed items
        if (deletedItemIds && Array.isArray(deletedItemIds) && deletedItemIds.length > 0) {
          await (prisma as any).orderItem.deleteMany({
            where: { id: { in: deletedItemIds } }
          });
        }

        // 2. Process each item
        for (const item of items) {
          if (item.id) {
            // Update existing item (quantity + price)
            await (prisma as any).orderItem.update({
              where: { id: item.id },
              data: {
                quantity: item.quantity,
                unitPrice: item.unitPrice,
              }
            });
          } else if (item.productId) {
            // Create new item (admin-added)
            await (prisma as any).orderItem.create({
              data: {
                orderId: id,
                productId: item.productId,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                nameSnapshot: item.nameSnapshot || 'Custom Item',
                imageSnapshot: item.imageSnapshot || '',
                weightSnapshot: item.weightSnapshot || 0,
                weightUnitSnapshot: item.weightUnitSnapshot || 'kg',
                adminAddedAt: new Date(),
              }
            });
          }
        }

        // Recalculate total weight
        const allItems = await (prisma as any).orderItem.findMany({
          where: { orderId: id },
          select: { quantity: true, weightSnapshot: true }
        });
        const totalWeight = allItems.reduce((sum: number, it: any) => {
          return sum + ((it.weightSnapshot || 0) * (it.quantity || 0));
        }, 0);
        updateData.totalWeight = totalWeight;
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
