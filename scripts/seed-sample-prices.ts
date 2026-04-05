/**
 * Seed script to populate sample product prices
 * Run with: npx tsx scripts/seed-sample-prices.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding sample product prices...\n');

  try {
    // Get all products
    const products = await prisma.product.findMany({
      include: { countryPrices: true }
    });

    console.log(`Found ${products.length} products`);

    // Sample prices (in AED) - these should be entered via admin panel
    const samplePrices: Record<string, number> = {
      'AE': 199,
      'KW': 12,
      'SA': 249,
      'BH': 12,
      'OM': 12,
      'QA': 249
    };

    // Update country prices for each product
    for (const product of products) {
      console.log(`\nProcessing: ${product.name}`);
      
      // Update default price (if not set)
      if (!product.price || product.price === 0) {
        await prisma.product.update({
          where: { id: product.id },
          data: { price: 199 } // Default fallback price
        });
        console.log(`  Set default price: 199`);
      }

      // Update or create country prices
      for (const [country, price] of Object.entries(samplePrices)) {
        const existingCp = product.countryPrices.find(cp => cp.country === country);
        
        if (existingCp) {
          if (!existingCp.price || existingCp.price === 0) {
            await prisma.countryPrice.update({
              where: { id: existingCp.id },
              data: { price }
            });
            console.log(`  Updated ${country} price: ${price}`);
          }
        } else {
          await prisma.countryPrice.create({
            data: {
              productId: product.id,
              country,
              price,
              currency: country === 'KW' ? 'KWD' : 
                        country === 'SA' ? 'SAR' : 
                        country === 'BH' ? 'BHD' : 
                        country === 'OM' ? 'OMR' : 
                        country === 'QA' ? 'QAR' : 'AED',
              active: true
            }
          });
          console.log(`  Created ${country} price: ${price}`);
        }
      }
    }

    console.log('\n✅ Sample prices seeded successfully!');
    console.log('\nNote: These are sample prices. Update via admin panel for actual values.');

  } catch (error) {
    console.error('Error seeding prices:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
