const { PrismaClient } = require('@prisma/client');

async function verifySpareStoreRendering() {
  console.log('=== VERIFYING SPARE STORE RENDERING IMPROVEMENT ===\n');
  
  const prisma = new PrismaClient();
  
  try {
    // Simulate what the Kuwait inventory page would display
    console.log('1. SIMULATING KUWAIT INVENTORY PAGE DISPLAY:\n');
    
    const kuwaitStore = await prisma.store.findFirst({
      where: { code: 'KUW' },
      include: { 
        storeInventories: { 
          include: { 
            product: {
              include: {
                countryPrices: {
                  where: { country: 'KW' }
                }
              }
            }
          },
          orderBy: { product: { name: 'asc' } }
        }
      }
    });
    
    if (!kuwaitStore) {
      console.log('❌ ERROR: Kuwait store not found!');
      return;
    }
    
    console.log(`Store: ${kuwaitStore.name} (${kuwaitStore.code})`);
    console.log(`Region: ${kuwaitStore.region}`);
    console.log(`Currency: ${kuwaitStore.currency}`);
    console.log(`Active: ${kuwaitStore.active ? 'Yes' : 'No'}`);
    console.log(`\nInventory Items (${kuwaitStore.storeInventories.length}):\n`);
    
    if (kuwaitStore.storeInventories.length === 0) {
      console.log('⚠️ WARNING: No inventory items found - spare store will render empty!');
    } else {
      // Display in a table-like format
      console.log('No. | Product Name | Quantity | Price | Country Price');
      console.log('----|--------------|----------|-------|---------------');
      
      kuwaitStore.storeInventories.forEach((inv, index) => {
        const product = inv.product;
        const kwPrice = product.countryPrices[0];
        const countryPrice = kwPrice ? `$${(kwPrice.priceCents / 100).toFixed(2)} (KW)` : `$${inv.price} (default)`;
        
        console.log(`${(index + 1).toString().padEnd(3)} | ${product.name.substring(0, 30).padEnd(30)} | ${inv.quantity.toString().padEnd(8)} | $${inv.price.toFixed(2).padEnd(5)} | ${countryPrice}`);
      });
    }
    
    // Check order collections for Kuwait
    console.log('\n2. KUWAIT ORDER COLLECTIONS:\n');
    
    const kuwaitOrders = await prisma.order.findMany({
      where: { storeId: kuwaitStore.id },
      include: {
        user: { select: { email: true } },
        items: { include: { product: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });
    
    console.log(`Total Kuwait orders: ${kuwaitOrders.length}\n`);
    
    if (kuwaitOrders.length === 0) {
      console.log('No orders found for Kuwait store.');
    } else {
      kuwaitOrders.forEach((order, index) => {
        console.log(`Order ${index + 1}:`);
        console.log(`  - ID: ${order.id}`);
        console.log(`  - Customer: ${order.user?.email || 'Unknown'}`);
        console.log(`  - Status: ${order.status}`);
        console.log(`  - Total: $${(order.totalCents / 100).toFixed(2)}`);
        console.log(`  - Items: ${order.items.length}`);
        console.log(`  - Created: ${order.createdAt.toISOString().split('T')[0]}`);
        console.log('');
      });
    }
    
    // Check product availability for rendering
    console.log('3. PRODUCT RENDERING ANALYSIS:\n');
    
    const allKuwaitProducts = await prisma.product.findMany({
      where: { storeId: kuwaitStore.id },
      include: {
        storeInventories: {
          where: { storeId: kuwaitStore.id }
        }
      }
    });
    
    console.log(`Products assigned to Kuwait store: ${allKuwaitProducts.length}`);
    
    const productsWithImages = allKuwaitProducts.filter(p => p.images && p.images.length > 0);
    const productsWithStock = allKuwaitProducts.filter(p => {
      const inventory = p.storeInventories[0];
      return inventory && inventory.quantity > 0;
    });
    
    console.log(`- With images: ${productsWithImages.length}/${allKuwaitProducts.length}`);
    console.log(`- In stock: ${productsWithStock.length}/${allKuwaitProducts.length}`);
    
    // Check for potential rendering issues
    console.log('\n4. POTENTIAL RENDERING ISSUES:\n');
    
    const issues = [];
    
    if (kuwaitStore.storeInventories.length < 3) {
      issues.push(`Kuwait store has only ${kuwaitStore.storeInventories.length} inventory items (may appear sparse)`);
    }
    
    if (productsWithImages.length < allKuwaitProducts.length) {
      issues.push(`${allKuwaitProducts.length - productsWithImages.length} products missing images`);
    }
    
    if (productsWithStock.length < allKuwaitProducts.length) {
      issues.push(`${allKuwaitProducts.length - productsWithStock.length} products are out of stock`);
    }
    
    if (kuwaitOrders.length === 0) {
      issues.push('No orders found for Kuwait store - order collections will be empty');
    }
    
    if (issues.length === 0) {
      console.log('✅ No rendering issues detected.');
      console.log('✅ Spare store (Kuwait) should render properly with:');
      console.log(`   - ${kuwaitStore.storeInventories.length} inventory items`);
      console.log(`   - ${allKuwaitProducts.length} assigned products`);
      console.log(`   - ${kuwaitOrders.length} order records`);
    } else {
      console.log('⚠️ Potential rendering issues:');
      issues.forEach((issue, i) => console.log(`   ${i+1}. ${issue}`));
    }
    
    // Final assessment
    console.log('\n=== FINAL ASSESSMENT ===');
    
    if (kuwaitStore.storeInventories.length >= 3 && 
        productsWithImages.length === allKuwaitProducts.length &&
        kuwaitOrders.length > 0) {
      console.log('✅ EXCELLENT: Spare store rendering should work perfectly!');
      console.log('✅ The Kuwait inventory page will display products properly.');
      console.log('✅ Order collections will show relevant Kuwait orders.');
    } else if (kuwaitStore.storeInventories.length > 0) {
      console.log('✅ ACCEPTABLE: Spare store will render with some content.');
      console.log('⚠️  Some improvements could be made (see issues above).');
    } else {
      console.log('❌ PROBLEMATIC: Spare store may render empty or with errors.');
    }
    
  } catch (error) {
    console.error('Verification failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

verifySpareStoreRendering().catch(console.error);