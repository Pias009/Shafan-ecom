import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const orderId = '69f5906c1ad52c4dc81ac54e';
  
  const order = await prisma.order.findUnique({
    where: { id: orderId }
  });

  if (!order) {
    console.error('Order not found');
    return;
  }

  console.log('Current Order Data:', {
    id: order.id,
    subtotal: order.subtotal,
    shipping: order.shipping,
    taxAmount: order.taxAmount,
    total: order.total,
  });

  const newTotal = (order.subtotal || 0) + (order.shipping || 0) + (order.taxAmount || 0) - (order.discount || 0);
  
  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: {
      total: newTotal
    }
  });

  console.log('Updated Order Data:', {
    id: updatedOrder.id,
    total: updatedOrder.total,
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
