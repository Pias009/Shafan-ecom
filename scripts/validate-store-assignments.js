const { PrismaClient } = require('@prisma/client');

async function validateStoreAssignments() {
  console.log('=== VALIDATING STORE PRODUCT ASSIGNMENTS ===\n');
  
  const prisma = new PrismaClient();
  
  try {
    // 1. Check stores exist
    console.log('1. CHECKING STORES:');
    const stores = await prisma.store.findMany({
      where: { code: { in: ['KUW', 'GLOBAL'] } },
      include: {
        storeInventories: true
      }
    });
    
    console.log(`Found ${stores.length} stores:`);
    stores.forEach(store => {
      console.log(`  - ${store.code} (${store.name}): ${store.storeInventories.length} inventory items`);
    });
    
    // 2. Check products without store assignment
    console.log('\n2. CHECKING PRODUCTS WITHOUT STORE ASSIGNMENT:');
    const productsWithoutStore = await prisma.product.findMany({
      where: {
        storeId: null
      }
    });
    
    console.log(`Products without direct storeId assignment: ${productsWithoutStore.length}`);
    if (productsWithoutStore.length > 0) {
      console.log('  This is OK - products should be assigned via StoreInventory table');
    }
    
    // 3. Check StoreInventory assignments
    console.log('\n3. ANALYZING STORE INVENTORY ASSIGNMENTS:');
    
    const allProducts = await prisma.product.findMany({
      include: {
        storeInventories: {
          include: {
            store: true
          }
        }
      }
    });
    
    const productsByStoreCount = {
      zero: 0,
      one: 0,
      multiple: 0
    };
    
    const storeAssignments = {
      KUW: 0,
      GLOBAL: 0,
      both: 0
    };
    
    allProducts.forEach(product => {
      const storeCount = product.storeInventories.length;
      
      if (storeCount === 0) {
        productsByStoreCount.zero++;
      } else if (storeCount === 1) {
        productsByStoreCount.one++;
        const storeCode = product.storeInventories[0].store.code;
        storeAssignments[storeCode] = (storeAssignments[storeCode] || 0) + 1;
      } else {
        productsByStoreCount.multiple++;
        
        // Check if product is in both stores
        const storeCodes = product.storeInventories.map(inv => inv.store.code);
        const hasKuwait = storeCodes.includes('KUW');
        const hasGlobal = storeCodes.includes('GLOBAL');
        
        if (hasKuwait && hasGlobal) {
          storeAssignments.both++;
          console.log(`  WARNING: Product "${product.name}" (${product.id}) is in BOTH KUW and GLOBAL stores`);
        }
      }
    });
    
    console.log(`\nProduct Store Assignment Summary:`);
    console.log(`  - Products with 0 store assignments: ${productsByStoreCount.zero}`);
    console.log(`  - Products with 1 store assignment: ${productsByStoreCount.one}`);
    console.log(`  - Products with multiple store assignments: ${productsByStoreCount.multiple}`);
    
    console.log(`\nStore Distribution:`);
    console.log(`  - Products in KUW store only: ${storeAssignments.KUW}`);
    console.log(`  - Products in GLOBAL store only: ${storeAssignments.GLOBAL}`);
    console.log(`  - Products in BOTH stores: ${storeAssignments.both}`);
    
    // 4. Check for consistency with user requirements
    console.log('\n4. VALIDATION AGAINST REQUIREMENTS:');
    
    if (storeAssignments.both > 0) {
      console.log(`  ❌ FAIL: ${storeAssignments.both} products are in BOTH stores`);
      console.log(`     Requirement: Kuwait users should see ONLY Kuwait products, non-Kuwait users ONLY Global products`);
      console.log(`     Products in both stores will be visible to all users`);
    } else {
      console.log(`  ✅ PASS: No products are in both stores`);
    }
    
    if (productsByStoreCount.zero > 0) {
      console.log(`  ⚠️  WARNING: ${productsByStoreCount.zero} products have no store assignment`);
      console.log(`     These products will NOT be visible to any users`);
    }
    
    // 5. Sample data for manual verification
    console.log('\n5. SAMPLE PRODUCTS BY STORE:');
    
    const kuwaitProducts = await prisma.storeInventory.findMany({
      where: { store: { code: 'KUW' } },
      include: { product: true },
      take: 5
    });
    
    const globalProducts = await prisma.storeInventory.findMany({
      where: { store: { code: 'GLOBAL' } },
      include: { product: true },
      take: 5
    });
    
    console.log(`\nSample Kuwait products (${kuwaitProducts.length} total):`);
    kuwaitProducts.forEach((inv, i) => {
      console.log(`  ${i+1}. ${inv.product.name} - Qty: ${inv.quantity}, Price: $${inv.price}`);
    });
    
    console.log(`\nSample Global products (${globalProducts.length} total):`);
    globalProducts.forEach((inv, i) => {
      console.log(`  ${i+1}. ${inv.product.name} - Qty: ${inv.quantity}, Price: $${inv.price}`);
    });
    
    // 6. Recommendations
    console.log('\n6. RECOMMENDATIONS:');
    
    if (storeAssignments.both > 0) {
      console.log(`  - Remove duplicate assignments: Products should be in either KUW OR GLOBAL, not both`);
    }
    
    if (productsByStoreCount.zero > 0) {
      console.log(`  - Assign ${productsByStoreCount.zero} unassigned products to appropriate stores`);
    }
    
    console.log(`\n=== VALIDATION COMPLETE ===`);
    
  } catch (error) {
    console.error('Error during validation:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run validation
validateStoreAssignments().catch(console.error);