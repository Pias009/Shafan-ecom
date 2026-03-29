const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  log: ['error'],
});

async function main() {
  try {
    console.log('Connecting to database...');
    // Test connection
    await prisma.$connect();
    console.log('Connected.');
    
    const count = await prisma.product.count();
    console.log(`Total products in database: ${count}`);
    
    const recent = await prisma.product.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, storeId: true, priceCents: true }
    });
    console.log('Recent products:');
    recent.forEach(p => console.log(`  ${p.name} (store: ${p.storeId})`));
    
    // Check for test products
    const testProducts = await prisma.product.findMany({
      where: { name: { contains: '[TEST]' } },
      select: { name: true, storeId: true }
    });
    console.log(`\nTest products: ${testProducts.length}`);
    testProducts.forEach(p => console.log(`  ${p.name} (store: ${p.storeId})`));
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Set timeout
setTimeout(() => {
  console.log('Timeout exceeded');
  process.exit(0);
}, 5000);

main();