import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany({
    take: 10,
    select: {
      id: true,
      name: true,
      priceCents: true,
      discountCents: true,
      countryPrices: true
    }
  });

  console.log('--- PRODUCT SAMPLES ---');
  products.forEach(p => {
    console.log(`Product: ${p.id} | Name: ${p.name}`);
    console.log(`  priceCents: ${p.priceCents} (Type: ${typeof p.priceCents})`);
    console.log(`  discountCents: ${p.discountCents} (Type: ${typeof p.discountCents})`);
    if (p.countryPrices && p.countryPrices.length > 0) {
      console.log('  Country Prices:');
      p.countryPrices.forEach((cp: any) => {
        console.log(`    ${cp.country}: ${cp.priceCents} (Type: ${typeof cp.priceCents})`);
      });
    }
    console.log('---');
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
