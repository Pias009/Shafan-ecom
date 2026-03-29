const { PrismaClient } = require('@prisma/client');

async function fixProductStoreAssignment() {
  console.log('=== FIXING PRODUCT STORE ASSIGNMENT ===\n');
  
  const prisma = new PrismaClient();
  
  try {
    // Get all stores
    const stores = await prisma.store.findMany();
    const storeMap = {};
    stores.forEach(store => {
      storeMap[store.code] = store.id;
    });
    
    console.log('Available stores:');
    stores.forEach(store => {
      console.log(`  - ${store.code}: ${store.name} (ID: ${store.id})`);
    });
    
    // Get all products with their inventory
    const products = await prisma.product.findMany({
      include: {
        store: true,
        storeInventories: {
          include: { store: true }
        }
      }
    });
    
    console.log(`\nProcessing ${products.length} products...\n`);
    
    let fixedCount = 0;
    let inventoryCreatedCount = 0;
    const updates = [];
    
    // Process each product
    for (const product of products) {
      const productUpdates = [];
      
      // CASE 1: Global product (no storeId) but has inventory
      if (!product.storeId && product.storeInventories.length > 0) {
        // Determine store from inventory
        const inventoryStore = product.storeInventories[0].store;
        const storeId = inventoryStore.id;
        
        console.log(`Fixing: "${product.name}"`);
        console.log(`  - Currently: GLOBAL (no store)`);
        console.log(`  - Has inventory in: ${inventoryStore.code}`);
        console.log(`  - Action: Assigning to ${inventoryStore.code} store`);
        
        // Update product with storeId
        await prisma.product.update({
          where: { id: product.id },
          data: { storeId }
        });
        
        productUpdates.push(`Assigned to ${inventoryStore.code} store`);
        fixedCount++;
      }
      
      // CASE 2: Has storeId but no inventory
      else if (product.storeId && product.storeInventories.length === 0) {
        const store = product.store;
        
        console.log(`Fixing: "${product.name}"`);
        console.log(`  - Currently: Assigned to ${store?.code || 'unknown'} store`);
        console.log(`  - No inventory record`);
        console.log(`  - Action: Creating inventory record`);
        
        // Create inventory record
        await prisma.storeInventory.create({
          data: {
            storeId: product.storeId,
            productId: product.id,
            quantity: product.stockQuantity || 10, // Default quantity
            price: (product.priceCents - (product.discountCents || 0)) / 100
          }
        });
        
        productUpdates.push(`Created inventory in ${store?.code || 'unknown'} store`);
        inventoryCreatedCount++;
      }
      
      // CASE 3: Global product with no inventory (assign to UAE as default)
      else if (!product.storeId && product.storeInventories.length === 0) {
        const uaeStoreId = storeMap['UAE'];
        
        if (uaeStoreId) {
          console.log(`Fixing: "${product.name}"`);
          console.log(`  - Currently: GLOBAL (no store, no inventory)`);
          console.log(`  - Action: Assigning to UAE store and creating inventory`);
          
          // Update product with UAE storeId
          await prisma.product.update({
            where: { id: product.id },
            data: { storeId: uaeStoreId }
          });
          
          // Create inventory record
          await prisma.storeInventory.create({
            data: {
              storeId: uaeStoreId,
              productId: product.id,
              quantity: product.stockQuantity || 10,
              price: (product.priceCents - (product.discountCents || 0)) / 100
            }
          });
          
          productUpdates.push(`Assigned to UAE store and created inventory`);
          fixedCount++;
          inventoryCreatedCount++;
        }
      }
      
      if (productUpdates.length > 0) {
        updates.push({
          product: product.name,
          updates: productUpdates
        });
      }
    }
    
    // Summary
    console.log('\n=== SUMMARY ===');
    console.log(`Products fixed (store assignment): ${fixedCount}`);
    console.log(`Inventory records created: ${inventoryCreatedCount}`);
    
    if (updates.length > 0) {
      console.log('\nDetailed changes:');
      updates.forEach((item, index) => {
        console.log(`\n${index + 1}. ${item.product}`);
        item.updates.forEach(update => console.log(`   - ${update}`));
      });
    }
    
    // Verify the fix
    console.log('\n=== VERIFICATION ===');
    
    const afterProducts = await prisma.product.findMany({
      include: {
        store: true,
        storeInventories: {
          include: { store: true }
        }
      }
    });
    
    const globalAfter = afterProducts.filter(p => !p.storeId).length;
    const withInventory = afterProducts.filter(p => p.storeInventories.length > 0).length;
    
    console.log(`Total products: ${afterProducts.length}`);
    console.log(`Global products remaining: ${globalAfter}`);
    console.log(`Products with inventory: ${withInventory}`);
    
    if (globalAfter === 0) {
      console.log('✅ SUCCESS: All products now have store assignment!');
    } else {
      console.log(`⚠️ WARNING: ${globalAfter} products still without store assignment`);
    }
    
    // Check Kuwait store inventory
    const kuwaitStore = await prisma.store.findFirst({
      where: { code: 'KUW' },
      include: { storeInventories: { include: { product: true } } }
    });
    
    if (kuwaitStore) {
      console.log(`\nKuwait Store (${kuwaitStore.code}) inventory after fix:`);
      console.log(`  - Total inventory items: ${kuwaitStore.storeInventories.length}`);
      
      if (kuwaitStore.storeInventories.length > 0) {
        console.log('  - Inventory items:');
        kuwaitStore.storeInventories.forEach((inv, i) => {
          console.log(`    ${i+1}. ${inv.product.name} - Qty: ${inv.quantity}, Price: $${inv.price}`);
        });
      }
    }
    
  } catch (error) {
    console.error('Migration failed:', error.message);
    console.error('Full error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
fixProductStoreAssignment().catch(console.error);