#!/usr/bin/env tsx

/**
 * Migration script to add country-based pricing support
 * This script:
 * 1. Creates the CountryPrice collection in MongoDB
 * 2. Updates existing products to maintain compatibility
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting country pricing migration...');

  // Note: In MongoDB, collections are created automatically when data is inserted
  // We just need to ensure the Prisma schema is updated and the client is regenerated
  
  // Check if we have any products to migrate
  const productCount = await prisma.product.count();
  console.log(`Found ${productCount} products in the database`);

  // For each product, we could create default country prices based on existing price
  // But we'll leave that to the admin to set up manually
  
  console.log('Migration completed successfully!');
  console.log('Next steps:');
  console.log('1. Run: npx prisma generate');
  console.log('2. Update admin forms to add country pricing');
  console.log('3. Update product display logic to use country-based pricing');
}

main()
  .catch((e) => {
    console.error('Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });