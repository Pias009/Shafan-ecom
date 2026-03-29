#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['error']
});

async function quickCheck() {
  console.log('Quick check for slug issues...');
  
  try {
    // Just check a few products
    const products = await prisma.product.findMany({
      take: 10,
      select: { id: true, name: true, slug: true, createdAt: true },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`\nLatest 10 products:`);
    products.forEach(p => {
      console.log(`  - "${p.name}" (slug: ${p.slug || 'NULL'})`);
    });
    
    // Check specifically for null slugs
    const nullCount = await prisma.product.count({
      where: { slug: null }
    });
    
    console.log(`\nTotal products with null slugs: ${nullCount}`);
    
    if (nullCount > 0) {
      const firstNull = await prisma.product.findFirst({
        where: { slug: null },
        select: { id: true, name: true }
      });
      console.log(`Example: "${firstNull?.name}" (ID: ${firstNull?.id})`);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
    console.log('\nDone.');
  }
}

// Add timeout
setTimeout(() => {
  console.log('Timeout reached');
  process.exit(1);
}, 5000);

quickCheck();