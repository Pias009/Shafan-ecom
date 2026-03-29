const { PrismaClient } = require('@prisma/client');

async function analyzeProducts() {
  console.log('=== PRODUCT STORE ASSIGNMENT ANALYSIS ===\n');
  
  const prisma = new PrismaClient();
  
  try {
    // Get all products with detailed information
    const products = await prisma.product.findMany({
      include: {
        store: true,
        storeInventories: {
          include: { store: true }
        },
        countryPrices: true
      },
      orderBy: { name: 'asc' }
    });
    
    console.log(`Total Products: ${products.length}\n`);
    
    // Categorize products
    const globalProducts = [];
    const storeProducts = [];
    const productsWithInventory = [];
    
    products.forEach(product => {
      const productInfo = {
        id: product.id,
        name: product.name,
        store: product.store ? `${product.store.code} (${product.store.name})` : 'GLOBAL',
        storeId: product.storeId,
        inventoryCount: product.storeInventories.length,
        inventories: product.storeInventories.map(inv => ({
          store: inv.store.code,
          quantity: inv.quantity,
          price: inv.price
        })),
        priceCents: product.priceCents,
        countryPrices: product.countryPrices.length
      };
      
      if (product.storeId === null) {
        globalProducts.push(productInfo);
      } else {
        storeProducts.push(productInfo);
      }
      
      if (product.storeInventories.length > 0) {
        productsWithInventory.push(productInfo);
      }
    });
    
    // Display global products (problematic ones)
    console.log('1. GLOBAL PRODUCTS (NO STORE ASSIGNMENT):');
    console.log(`   Count: ${globalProducts.length}\n`);
    
    globalProducts.forEach((product, index) => {
      console.log(`   ${index + 1}. ${product.name}`);
      console.log(`      ID: ${product.id}`);
      console.log(`      Price: $${(product.priceCents / 100).toFixed(2)}`);
      console.log(`      Country Prices: ${product.countryPrices}`);
      console.log(`      Store Inventories: ${product.inventoryCount}`);
      if (product.inventoryCount > 0) {
        product.inventories.forEach(inv => {
          console.log(`        - ${inv.store}: ${inv.quantity} units @ $${inv.price}`);
        });
      }
      console.log('');
    });
    
    // Display store-assigned products
    console.log('2. STORE-ASSIGNED PRODUCTS:');
    console.log(`   Count: ${storeProducts.length}\n`);
    
    storeProducts.forEach((product, index) => {
      console.log(`   ${index + 1}. ${product.name}`);
      console.log(`      Store: ${product.store}`);
      console.log(`      Inventory Records: ${product.inventoryCount}`);
      console.log('');
    });
    
    // Display products with inventory records
    console.log('3. PRODUCTS WITH STORE INVENTORY RECORDS:');
    console.log(`   Count: ${productsWithInventory.length}\n`);
    
    // Analyze store distribution
    console.log('4. STORE DISTRIBUTION ANALYSIS:');
    
    const storeStats = {};
    products.forEach(product => {
      const storeCode = product.store?.code || 'GLOBAL';
      storeStats[storeCode] = (storeStats[storeCode] || 0) + 1;
    });
    
    Object.entries(storeStats).forEach(([store, count]) => {
      console.log(`   ${store}: ${count} products`);
    });
    
    // Check for inconsistencies
    console.log('\n5. INCONSISTENCIES FOUND:');
    
    const inconsistencies = [];
    
    // Check products with storeId but no inventory
    products.forEach(product => {
      if (product.storeId && product.storeInventories.length === 0) {
        inconsistencies.push(`Product "${product.name}" has store assignment (${product.store?.code}) but no inventory record`);
      }
      
      // Check products with inventory but no storeId
      if (!product.storeId && product.storeInventories.length > 0) {
        inconsistencies.push(`Product "${product.name}" is global but has ${product.storeInventories.length} inventory record(s)`);
      }
    });
    
    if (inconsistencies.length === 0) {
      console.log('   No inconsistencies found.');
    } else {
      inconsistencies.forEach((issue, i) => {
        console.log(`   ${i + 1}. ${issue}`);
      });
    }
    
    // Recommendations
    console.log('\n6. RECOMMENDATIONS:');
    console.log(`   a. ${globalProducts.length} global products need store assignment`);
    console.log(`   b. Consider assigning global products to UAE store (default)`);
    console.log(`   c. Ensure Kuwait store has sufficient inventory for "spare store" rendering`);
    console.log(`   d. Update product creation logic to require store selection`);
    
  } catch (error) {
    console.error('Analysis failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeProducts().catch(console.error);