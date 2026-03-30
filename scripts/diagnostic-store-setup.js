const { PrismaClient } = require('@prisma/client');

async function diagnosticStoreSetup() {
  console.log('=== DIAGNOSTIC: STORE SETUP ANALYSIS ===\n');
  
  const prisma = new PrismaClient();
  
  try {
    // 1. List ALL stores
    console.log('1. ALL STORES IN DATABASE:');
    const allStores = await prisma.store.findMany({
      include: {
        storeInventories: true
      },
      orderBy: { code: 'asc' }
    });
    
    console.log(`Total stores: ${allStores.length}`);
    allStores.forEach(store => {
      console.log(`  - ${store.code} (${store.name}):`);
      console.log(`    Country: ${store.country}, Region: ${store.region}`);
      console.log(`    Currency: ${store.currency}, Active: ${store.active}`);
      console.log(`    Inventory items: ${store.storeInventories.length}`);
    });
    
    // 2. Check for required stores
    console.log('\n2. REQUIRED STORES CHECK:');
    const requiredStores = ['KUW', 'GLOBAL'];
    const existingStoreCodes = allStores.map(s => s.code);
    
    requiredStores.forEach(storeCode => {
      if (existingStoreCodes.includes(storeCode)) {
        console.log(`  ✅ ${storeCode} store exists`);
      } else {
        console.log(`  ❌ ${storeCode} store MISSING - needs to be created`);
      }
    });
    
    // 3. Check middleware store codes
    console.log('\n3. MIDDLEWARE STORE CODE COMPATIBILITY:');
    console.log('   Middleware sets store_code cookie to:');
    console.log('   - "KUW" for Kuwait (country code "KW")');
    console.log('   - "GLOBAL" for other countries');
    
    // 4. Check product distribution
    console.log('\n4. PRODUCT DISTRIBUTION ANALYSIS:');
    
    const allProducts = await prisma.product.findMany({
      include: {
        storeInventories: {
          include: {
            store: true
          }
        }
      }
    });
    
    console.log(`Total products: ${allProducts.length}`);
    
    // Count products by store
    const storeProductCount = {};
    allStores.forEach(store => {
      storeProductCount[store.code] = 0;
    });
    
    allProducts.forEach(product => {
      product.storeInventories.forEach(inv => {
        const storeCode = inv.store.code;
        storeProductCount[storeCode] = (storeProductCount[storeCode] || 0) + 1;
      });
    });
    
    console.log('\nProducts per store:');
    Object.entries(storeProductCount).forEach(([storeCode, count]) => {
      console.log(`  - ${storeCode}: ${count} products`);
    });
    
    // Products without any store assignment
    const productsWithoutStore = allProducts.filter(p => p.storeInventories.length === 0);
    console.log(`\nProducts without ANY store assignment: ${productsWithoutStore.length}`);
    if (productsWithoutStore.length > 0) {
      console.log('  These products will NOT be visible to any users!');
      productsWithoutStore.slice(0, 3).forEach(p => {
        console.log(`    - ${p.name} (${p.id})`);
      });
      if (productsWithoutStore.length > 3) {
        console.log(`    ... and ${productsWithoutStore.length - 3} more`);
      }
    }
    
    // 5. Check for demo/test data
    console.log('\n5. DEMO/TEST DATA CHECK:');
    const demoProducts = allProducts.filter(p => 
      p.name.includes('Demo') || 
      p.name.includes('Test') || 
      p.name.includes('Example')
    );
    console.log(`Demo/test products: ${demoProducts.length}`);
    
    // 6. Recommendations
    console.log('\n6. RECOMMENDATIONS:');
    
    // Check if GLOBAL store exists
    if (!existingStoreCodes.includes('GLOBAL')) {
      console.log('  - CREATE GLOBAL store with code "GLOBAL"');
      console.log('    This store is for non-Kuwait users');
    }
    
    // Check if products are missing from GLOBAL store
    const globalStore = allStores.find(s => s.code === 'GLOBAL');
    if (globalStore && storeProductCount['GLOBAL'] === 0) {
      console.log('  - ADD PRODUCTS to GLOBAL store');
      console.log('    Global store exists but has no products');
    }
    
    // Check for products without store assignment
    if (productsWithoutStore.length > 0) {
      console.log(`  - ASSIGN ${productsWithoutStore.length} products to appropriate stores`);
    }
    
    // Check store configuration
    const kuwaitStore = allStores.find(s => s.code === 'KUW');
    if (kuwaitStore) {
      if (kuwaitStore.country !== 'KW') {
        console.log(`  - UPDATE KUW store country from "${kuwaitStore.country}" to "KW"`);
      }
      if (kuwaitStore.currency !== 'KWD') {
        console.log(`  - CONSIDER updating KUW store currency to "KWD" (currently: ${kuwaitStore.currency})`);
      }
    }
    
    if (globalStore) {
      if (globalStore.currency !== 'USD') {
        console.log(`  - CONSIDER updating GLOBAL store currency to "USD" (currently: ${globalStore.currency})`);
      }
    }
    
    console.log('\n=== DIAGNOSTIC COMPLETE ===');
    
  } catch (error) {
    console.error('Error during diagnostic:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run diagnostic
diagnosticStoreSetup().catch(console.error);