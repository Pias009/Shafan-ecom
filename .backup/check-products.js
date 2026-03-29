const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkProducts() {
  console.log('Checking products in database...\n');
  
  const products = await prisma.product.findMany({
    include: {
      store: true,
      countryPrices: true,
      storeInventories: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });
  
  console.log(`Found ${products.length} products (latest 10):`);
  products.forEach(p => {
    console.log(`- ${p.name} (ID: ${p.id})`);
    console.log(`  Store: ${p.store?.code || 'GLOBAL'}`);
    console.log(`  Price: ${p.priceCents} cents`);
    console.log(`  Country prices: ${p.countryPrices.length}`);
    if (p.countryPrices.length > 0) {
      p.countryPrices.forEach(cp => {
        console.log(`    ${cp.country}: ${cp.priceCents} ${cp.currency}`);
      });
    }
    console.log('');
  });
  
  // Check for Kuwait store products specifically
  const kuwaitProducts = await prisma.product.findMany({
    where: { store: { code: 'KUW' } },
    include: { store: true },
  });
  
  console.log(`\nKuwait store products: ${kuwaitProducts.length}`);
  kuwaitProducts.forEach(p => {
    console.log(`- ${p.name} (ID: ${p.id})`);
  });
  
  // Check for global products (storeId null)
  const globalProducts = await prisma.product.findMany({
    where: { storeId: null },
  });
  
  console.log(`\nGlobal products (no store): ${globalProducts.length}`);
  globalProducts.forEach(p => {
    console.log(`- ${p.name} (ID: ${p.id})`);
  });
  
  await prisma.$disconnect();
}

checkProducts().catch(console.error);