import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Starting Price Migration ---');

  // 1. Update Products
  const products = await prisma.product.findMany();
  console.log(`Checking ${products.length} products...`);
  
  for (const product of products) {
    // If the price is relatively small (e.g., less than 1,000,000), it's likely in the old "whole number" format
    // 1,000,000 cents is 10,000 AED/KWD. Most skincare products are less than that.
    // However, the user specifically mentioned 9000, so we should definitely target that.
    if (product.priceCents > 0 && product.priceCents < 1000000) {
      console.log(`Updating product "${product.name}": ${product.priceCents} -> ${product.priceCents * 100}`);
      await (prisma.product as any).update({
        where: { id: product.id },
        data: {
          priceCents: product.priceCents * 100,
          discountCents: product.discountCents ? product.discountCents * 100 : 0,
        },
      });
    }
  }

  // 2. Update CountryPrices
  const countryPrices = await prisma.countryPrice.findMany();
  console.log(`Checking ${countryPrices.length} country prices...`);

  for (const cp of countryPrices) {
    if (cp.priceCents && cp.priceCents > 0 && cp.priceCents < 1000000) {
      console.log(`Updating country price for ${cp.country} (Product ID: ${cp.productId}): ${cp.priceCents} -> ${cp.priceCents * 100}`);
      await (prisma.countryPrice as any).update({
        where: { id: cp.id },
        data: {
          priceCents: cp.priceCents * 100,
        },
      });
    }
  }

  console.log('--- Price Migration Completed ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
