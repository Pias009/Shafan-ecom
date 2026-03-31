/**
 * Verification script to test country-based product filtering
 * 
 * This script verifies:
 * 1. Products are created with correct country prices
 * 2. Country-based filtering works correctly
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const SUPPORTED_COUNTRIES = [
  { code: 'AE', name: 'United Arab Emirates', currency: 'AED' },
  { code: 'KW', name: 'Kuwait', currency: 'KWD' },
  { code: 'BH', name: 'Bahrain', currency: 'BHD' },
  { code: 'SA', name: 'Saudi Arabia', currency: 'SAR' },
  { code: 'OM', name: 'Oman', currency: 'OMR' },
  { code: 'QA', name: 'Qatar', currency: 'QAR' },
];

async function verifyProducts() {
  console.log('🔍 Verifying country-based product filtering...\n');

  // Get all products with their country prices
  const products = await prisma.product.findMany({
    include: {
      countryPrices: true
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 10 // Get the 10 most recent products
  });

  console.log(`📦 Found ${products.length} products\n`);

  // Display each product and its country prices
  for (const product of products) {
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`🏷️  ${product.name}`);
    console.log(`   SKU: ${product.sku}`);
    console.log(`   Hot: ${product.hot ? '✅' : '❌'} | Trending: ${product.trending ? '✅' : '❌'}`);
    
    if (product.countryPrices.length > 0) {
      console.log(`   🌍 Available in ${product.countryPrices.length} countries:`);
      
      for (const cp of product.countryPrices) {
        const country = SUPPORTED_COUNTRIES.find(c => c.code === cp.country);
        const price = cp.priceCents / 100;
        console.log(`      • ${country?.name || cp.country} (${cp.country}): ${price} ${cp.currency}`);
      }
    } else {
      console.log(`   🌍 No country prices set`);
    }
  }

  console.log(`\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log('🧪 Country-Based Filtering Test Results:\n');

  // Test filtering for each country
  for (const country of SUPPORTED_COUNTRIES) {
    const visibleProducts = products.filter(product => {
      const hasPrice = product.countryPrices.some(cp => 
        cp.country === country.code && cp.priceCents > 0
      );
      return hasPrice;
    });

    console.log(`📍 ${country.name} (${country.code}):`);
    console.log(`   Products visible: ${visibleProducts.length}`);
    
    if (visibleProducts.length > 0) {
      console.log(`   Product list:`);
      visibleProducts.forEach(p => {
        const cp = p.countryPrices.find(c => c.country === country.code);
        console.log(`      • ${p.name} - ${cp.priceCents / 100} ${cp.currency}`);
      });
    }
    console.log('');
  }

  // Test unsupported country (Bangladesh)
  console.log(`📍 Bangladesh (BD) - UNSUPPORTED:`);
  const bdProducts = products.filter(product => {
    const hasPrice = product.countryPrices.some(cp => 
      cp.country === 'BD' && cp.priceCents > 0
    );
    return hasPrice;
  });
  console.log(`   Products visible: ${bdProducts.length} (should be 0)`);

  console.log(`\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log('✅ Verification Complete!');
  console.log('\n📋 Expected Results:');
  console.log('   • Kuwait (KW): Should see 6 products (3 global + 3 Kuwait-only)');
  console.log('   • UAE (AE): Should see 3 products (global only)');
  console.log('   • Bahrain (BH): Should see 3 products (global only)');
  console.log('   • Saudi Arabia (SA): Should see 3 products (global only)');
  console.log('   • Oman (OM): Should see 3 products (global only)');
  console.log('   • Qatar (QA): Should see 3 products (global only)');
  console.log('   • Bangladesh (BD): Should see 0 products (unsupported country)');
}

verifyProducts()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
