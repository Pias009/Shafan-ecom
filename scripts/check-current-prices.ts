/**
 * Data Migration Script: Check current pricing data
 * 
 * Run with: npx tsx scripts/check-current-prices.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Checking data format...\n');

  try {
    // Check products using any type to bypass strict checks
    const products: any = await prisma.product.findMany({
      take: 10,
      select: { id: true, name: true, price: true }
    });
    
    console.log('Sample Products:');
    for (const p of products) {
      console.log(`  ${p.name}: price=${p.price}`);
    }
    
    // Check country prices
    const countryPrices: any = await prisma.countryPrice.findMany({
      take: 10,
      select: { id: true, productId: true, price: true, country: true }
    });
    
    console.log('\nSample CountryPrices:');
    for (const cp of countryPrices) {
      console.log(`  ${cp.country}: price=${cp.price}`);
    }
    
    // Check orders
    const orders: any = await prisma.order.findMany({
      take: 5,
      select: { id: true, total: true, subtotal: true }
    });
    
    console.log('\nSample Orders:');
    for (const o of orders) {
      console.log(`  Order ${o.id}: total=${o.total}, subtotal=${o.subtotal}`);
    }
    
    // Count products with null/0 price
    const nullPriceCount = products.filter((p: any) => !p.price || p.price === 0).length;
    console.log(`\nProducts with null/0 price: ${nullPriceCount}/${products.length}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
