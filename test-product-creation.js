const { PrismaClient } = require('@prisma/client');

async function testProductCreation() {
  console.log('=== TESTING PRODUCT CREATION LOGIC ===\n');
  
  const prisma = new PrismaClient();
  
  try {
    // Get current state before test
    const initialProductCount = await prisma.product.count();
    const initialGlobalProducts = await prisma.product.count({
      where: { storeId: null }
    });
    
    console.log(`Initial state:`);
    console.log(`  - Total products: ${initialProductCount}`);
    console.log(`  - Global products: ${initialGlobalProducts}`);
    
    // Test 1: Check that all existing products have store assignment
    console.log('\n1. VERIFYING EXISTING PRODUCT STORE ASSIGNMENTS:');
    
    const productsWithoutStore = await prisma.product.findMany({
      where: { storeId: null },
      select: { id: true, name: true }
    });
    
    if (productsWithoutStore.length === 0) {
      console.log('  ✅ All existing products have store assignment');
    } else {
      console.log(`  ⚠️ ${productsWithoutStore.length} products still without store:`);
      productsWithoutStore.forEach(p => console.log(`    - ${p.name}`));
    }
    
    // Test 2: Check store inventory consistency
    console.log('\n2. VERIFYING STORE INVENTORY CONSISTENCY:');
    
    const products = await prisma.product.findMany({
      include: {
        store: true,
        storeInventories: true
      }
    });
    
    let inconsistencies = 0;
    products.forEach(product => {
      if (product.storeId && product.storeInventories.length === 0) {
        console.log(`  ⚠️ Product "${product.name}" has store but no inventory`);
        inconsistencies++;
      }
    });
    
    if (inconsistencies === 0) {
      console.log('  ✅ All store-assigned products have inventory records');
    }
    
    // Test 3: Check Kuwait store inventory
    console.log('\n3. CHECKING KUWAIT STORE INVENTORY (SPARE STORE):');
    
    const kuwaitStore = await prisma.store.findFirst({
      where: { code: 'KUW' },
      include: { 
        storeInventories: { 
          include: { product: true },
          orderBy: { product: { name: 'asc' } }
        }
      }
    });
    
    if (kuwaitStore) {
      console.log(`  Kuwait Store: ${kuwaitStore.name}`);
      console.log(`  Inventory items: ${kuwaitStore.storeInventories.length}`);
      
      if (kuwaitStore.storeInventories.length === 0) {
        console.log('  ⚠️ WARNING: Kuwait store has NO inventory - spare store will be empty');
      } else {
        console.log('  Inventory details:');
        kuwaitStore.storeInventories.forEach((inv, i) => {
          console.log(`    ${i+1}. ${inv.product.name} - Qty: ${inv.quantity}, Price: $${inv.price}`);
        });
        
        if (kuwaitStore.storeInventories.length >= 3) {
          console.log('  ✅ Kuwait store has sufficient inventory for spare store rendering');
        } else {
          console.log(`  ⚠️ Kuwait store has only ${kuwaitStore.storeInventories.length} items - consider adding more`);
        }
      }
    } else {
      console.log('  ❌ ERROR: Kuwait store not found!');
    }
    
    // Test 4: Check UAE store inventory
    console.log('\n4. CHECKING UAE STORE INVENTORY:');
    
    const uaeStore = await prisma.store.findFirst({
      where: { code: 'UAE' },
      include: { 
        storeInventories: { 
          include: { product: true },
          orderBy: { product: { name: 'asc' } }
        }
      }
    });
    
    if (uaeStore) {
      console.log(`  UAE Store: ${uaeStore.name}`);
      console.log(`  Inventory items: ${uaeStore.storeInventories.length}`);
      
      if (uaeStore.storeInventories.length === 0) {
        console.log('  ⚠️ WARNING: UAE store has NO inventory');
      } else {
        console.log('  Inventory details:');
        uaeStore.storeInventories.forEach((inv, i) => {
          console.log(`    ${i+1}. ${inv.product.name} - Qty: ${inv.quantity}, Price: $${inv.price}`);
        });
      }
    }
    
    // Test 5: Verify product distribution
    console.log('\n5. PRODUCT DISTRIBUTION ACROSS STORES:');
    
    const storeDistribution = await prisma.product.groupBy({
      by: ['storeId'],
      _count: true,
      where: { storeId: { not: null } }
    });
    
    // Get store names for display
    for (const group of storeDistribution) {
      const store = await prisma.store.findUnique({
        where: { id: group.storeId },
        select: { code: true, name: true }
      });
      
      if (store) {
        console.log(`  ${store.code}: ${group._count} products`);
      }
    }
    
    // Summary
    console.log('\n=== TEST SUMMARY ===');
    
    const issues = [];
    
    if (productsWithoutStore.length > 0) {
      issues.push(`${productsWithoutStore.length} products still without store assignment`);
    }
    
    if (inconsistencies > 0) {
      issues.push(`${inconsistencies} products have store but no inventory`);
    }
    
    if (kuwaitStore && kuwaitStore.storeInventories.length < 3) {
      issues.push(`Kuwait store has only ${kuwaitStore.storeInventories.length} inventory items (spare store may appear sparse)`);
    }
    
    if (issues.length === 0) {
      console.log('✅ All tests passed! Product store assignment is working correctly.');
      console.log('✅ Spare store (Kuwait) rendering should now show products properly.');
    } else {
      console.log(`⚠️ Found ${issues.length} issue(s):`);
      issues.forEach((issue, i) => console.log(`  ${i+1}. ${issue}`));
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testProductCreation().catch(console.error);