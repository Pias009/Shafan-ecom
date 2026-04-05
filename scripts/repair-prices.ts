import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- REPAIRING DOUBLED PRICES (890,000 -> 8900) ---');

  // 1. Fix Products (Base Prices)
  const products = await prisma.product.findMany();
  let productCount = 0;
  for (const p of products) {
    if (p.priceCents && Number(p.priceCents) > 500000) { // e.g. 5000.00+ is likely doubled
      await prisma.product.update({
        where: { id: p.id },
        data: { 
          priceCents: Math.round(Number(p.priceCents) / 100),
          discountCents: p.discountCents ? Math.round(Number(p.discountCents) / 100) : undefined
        }
      });
      productCount++;
    }
  }
  console.log(`Updated ${productCount} products.`);

  // 2. Fix Country Prices
  const countryPrices = await prisma.countryPrice.findMany();
  let cpCount = 0;
  for (const cp of countryPrices) {
    if (cp.priceCents && Number(cp.priceCents) > 500000) {
      await prisma.countryPrice.update({
        where: { id: cp.id },
        data: { priceCents: Math.round(Number(cp.priceCents) / 100) }
      });
      cpCount++;
    }
  }
  console.log(`Updated ${cpCount} country prices.`);

  // 3. Fix Recent Orders
  const orders = await prisma.order.findMany({
    where: {
      createdAt: { gte: new Date(Date.now() - 6 * 60 * 60 * 1000) } // Last 6 hours
    }
  });

  let orderCount = 0;
  for (const o of orders) {
    if (Number(o.totalCents) > 500000 || Number(o.subtotalCents) > 500000) {
      await prisma.order.update({
        where: { id: o.id },
        data: {
          totalCents: Math.round(Number(o.totalCents) / 100),
          subtotalCents: Math.round(Number(o.subtotalCents) / 100)
        }
      });
      
      // Also fix order items for this order
      const items = await prisma.orderItem.findMany({
        where: { orderId: o.id }
      });
      for (const item of items) {
        if (Number(item.unitPriceCents) > 500000) {
          await prisma.orderItem.update({
            where: { id: item.id },
            data: { unitPriceCents: Math.round(Number(item.unitPriceCents) / 100) }
          });
        }
      }
      orderCount++;
    }
  }
  console.log(`Updated ${orderCount} orders.`);

  console.log('--- REPAIR COMPLETE ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
