import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- FIXING DOUBLED PRICES (X100 ERROR) ---');

  // 1. Fix Products
  const products = await prisma.product.findMany();
  for (const p of products) {
    const updates: any = {};
    if (p.priceCents && Number(p.priceCents) > 100000) {
      updates.priceCents = Math.round(Number(p.priceCents) / 100);
    }
    if (p.discountCents && Number(p.discountCents) > 100000) {
      updates.discountCents = Math.round(Number(p.discountCents) / 100);
    }

    if (Object.keys(updates).length > 0) {
      await prisma.product.update({ where: { id: p.id }, data: updates });
      console.log(`Fixed product: ${p.name} (${p.id})`);
    }
  }

  // 2. Fix CountryPrices
  const countryPrices = await prisma.countryPrice.findMany();
  for (const cp of countryPrices) {
    if (Number(cp.priceCents) > 100000) {
      await prisma.countryPrice.update({
        where: { id: cp.id },
        data: { priceCents: Math.round(Number(cp.priceCents) / 100) }
      });
      console.log(`Fixed country price: ${cp.country} for product ${cp.productId}`);
    }
  }

  // 3. Fix Recent Orders
  const orders = await prisma.order.findMany({
    where: {
      createdAt: { gte: new Date(Date.now() - 4 * 60 * 60 * 1000) }
    },
    include: { items: true }
  });

  for (const o of orders) {
    const updates: any = {};
    if (Number(o.totalCents) > 100000) {
      updates.totalCents = Math.round(Number(o.totalCents) / 100);
    }
    if (Number(o.subtotalCents) > 100000) {
      updates.subtotalCents = Math.round(Number(o.subtotalCents) / 100);
    }

    if (Object.keys(updates).length > 0) {
      await prisma.order.update({ where: { id: o.id }, data: updates });
      for (const item of o.items) {
        if (Number(item.unitPriceCents) > 100000) {
          await prisma.orderItem.update({
            where: { id: item.id },
            data: { unitPriceCents: Math.round(Number(item.unitPriceCents) / 100) }
          });
        }
      }
      console.log(`Fixed order: ${o.id}`);
    }
  }

  console.log('--- DONE ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
