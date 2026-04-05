import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Checking all price-related data...\n');

  try {
    // Check products with ALL fields
    const products: any = await prisma.product.findMany({ take: 3 });
    console.log('Sample Product (full):');
    console.log(JSON.stringify(products[0], null, 2));

    // Check country prices with all fields
    const countryPrices: any = await prisma.countryPrice.findMany({ take: 3 });
    console.log('\n\nSample CountryPrice (full):');
    console.log(JSON.stringify(countryPrices[0], null, 2));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
