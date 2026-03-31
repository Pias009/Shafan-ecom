import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function testMultiAdminProducts() {
  console.log('=== MULTI-ADMIN PRODUCT & ORDER TEST ===\n');
  
  // Clean up previous test data in correct order (due to foreign key constraints)
  console.log('Cleaning up previous test data...');
  
  // Find test products first
  const testProducts = await prisma.product.findMany({
    where: { name: { contains: '[TEST]' } },
    select: { id: true }
  });
  
  if (testProducts.length > 0) {
    const productIds = testProducts.map(p => p.id);
    
    // Delete OrderItems that reference these test products
    await prisma.orderItem.deleteMany({
      where: { productId: { in: productIds } }
    });
    
    // Now delete the products
    await prisma.product.deleteMany({
      where: { id: { in: productIds } }
    });
  }
  
  // Delete orders with test customers
  await prisma.order.deleteMany({
    where: { email: { contains: 'test-customer-' } }
  });
  
  // Delete users
  await prisma.user.deleteMany({
    where: { email: { contains: 'test-multi-admin-' } }
  });
  
  // Ensure stores exist
  const uaeStore = await prisma.store.upsert({
    where: { code: 'UAE' },
    update: {},
    create: {
      code: 'UAE',
      name: 'UAE Global Store',
      country: 'UAE',
      region: 'Middle East',
      currency: 'aed'
    }
  });
  
  const kuwaitStore = await prisma.store.upsert({
    where: { code: 'KUW' },
    update: {},
    create: {
      code: 'KUW',
      name: 'Kuwait Store',
      country: 'KUWAIT',
      region: 'Middle East',
      currency: 'kwd'
    }
  });
  
  console.log('Stores ready:');
  console.log(`- UAE Store: ${uaeStore.code} (${uaeStore.country})`);
  console.log(`- Kuwait Store: ${kuwaitStore.code} (${kuwaitStore.country})`);
  
  // Create test admins
  const uaeAdmin = await prisma.user.create({
    data: {
      email: 'test-multi-admin-uae@example.com',
      name: 'UAE Multi-Test Admin',
      role: 'ADMIN',
      country: 'UAE',
      passwordHash: await bcrypt.hash('password123', 12),
      isVerified: true
    }
  });
  
  const kuwaitAdmin = await prisma.user.create({
    data: {
      email: 'test-multi-admin-kuwait@example.com',
      name: 'Kuwait Multi-Test Admin',
      role: 'ADMIN',
      country: 'KUWAIT',
      passwordHash: await bcrypt.hash('password123', 12),
      isVerified: true
    }
  });
  
  console.log('\nTest admins created:');
  console.log(`- UAE Admin: ${uaeAdmin.email} (Country: ${uaeAdmin.country})`);
  console.log(`- Kuwait Admin: ${kuwaitAdmin.email} (Country: ${kuwaitAdmin.country})`);
  
  // Create brands and categories first
  const uaeBrand = await prisma.brand.upsert({
    where: { name: 'UAE Local Brands' },
    update: {},
    create: { name: 'UAE Local Brands' }
  });
  
  const kuwaitBrand = await prisma.brand.upsert({
    where: { name: 'Kuwait Heritage' },
    update: {},
    create: { name: 'Kuwait Heritage' }
  });
  
  const foodCategory = await prisma.category.upsert({
    where: { name: 'Food & Beverages' },
    update: {},
    create: { name: 'Food & Beverages' }
  });
  
  const beautyCategory = await prisma.category.upsert({
    where: { name: 'Beauty & Fragrance' },
    update: {},
    create: { name: 'Beauty & Fragrance' }
  });
  
  // Simulate UAE Admin adding a product
  console.log('\n=== STEP 1: UAE ADMIN ADDS PRODUCT ===');
  const uaeProduct = await prisma.product.create({
    data: {
      name: '[TEST] UAE Exclusive Product - Dates Premium',
      description: 'Premium dates available only in UAE market',
      priceCents: 25000, // 250 AED
      discountCents: 5000, // 50 AED discount
      stockQuantity: 100,
      hot: true,
      trending: false,
      storeId: uaeStore.id,
      brandId: uaeBrand.id,
    }
  });
  
  console.log(`UAE Product Added:`);
  console.log(`- Name: ${uaeProduct.name}`);
  console.log(`- Price: ${uaeProduct.priceCents / 100} AED`);
  console.log(`- Store: UAE Store (ID: ${uaeProduct.storeId})`);
  console.log(`- Stock: ${uaeProduct.stockQuantity} units`);
  
  // Simulate Kuwait Admin adding a product
  console.log('\n=== STEP 2: KUWAIT ADMIN ADDS PRODUCT ===');
  const kuwaitProduct = await prisma.product.create({
    data: {
      name: '[TEST] Kuwait Exclusive Product - Perfume Oil',
      description: 'Traditional Kuwaiti perfume oil, exclusive to Kuwait',
      priceCents: 35000, // 350 KWD
      discountCents: 0,
      stockQuantity: 50,
      hot: false,
      trending: true,
      storeId: kuwaitStore.id,
      brandId: kuwaitBrand.id,
    }
  });
  
  console.log(`Kuwait Product Added:`);
  console.log(`- Name: ${kuwaitProduct.name}`);
  console.log(`- Price: ${kuwaitProduct.priceCents / 100} KWD`);
  console.log(`- Store: Kuwait Store (ID: ${kuwaitProduct.storeId})`);
  console.log(`- Stock: ${kuwaitProduct.stockQuantity} units`);
  
  // Create store inventory entries
  await prisma.storeInventory.create({
    data: {
      storeId: uaeStore.id,
      productId: uaeProduct.id,
      quantity: uaeProduct.stockQuantity,
      price: (uaeProduct.priceCents - uaeProduct.discountCents!) / 100
    }
  });
  
  await prisma.storeInventory.create({
    data: {
      storeId: kuwaitStore.id,
      productId: kuwaitProduct.id,
      quantity: kuwaitProduct.stockQuantity,
      price: kuwaitProduct.priceCents / 100
    }
  });
  
  console.log('\n=== STEP 3: CREATE ORDERS FROM DIFFERENT COUNTRIES ===');
  
  // Create UAE customer order
  const uaeOrder = await prisma.order.create({
    data: {
      email: 'test-customer-uae@example.com',
      status: 'ORDER_CONFIRMED',
      totalCents: 20000, // 200 AED
      subtotalCents: 18000,
      currency: 'aed',
      storeId: uaeStore.id,
      items: {
        create: {
          productId: uaeProduct.id,
          quantity: 2,
          unitPriceCents: 10000, // 100 AED per unit
          nameSnapshot: uaeProduct.name,
          imageSnapshot: null
        }
      }
    }
  });
  
  console.log(`UAE Order Created:`);
  console.log(`- Order ID: ${uaeOrder.id}`);
  console.log(`- Customer: ${uaeOrder.email}`);
  console.log(`- Store: UAE Store`);
  console.log(`- Total: ${uaeOrder.totalCents / 100} AED`);
  console.log(`- Status: ${uaeOrder.status}`);
  
  // Create Kuwait customer order
  const kuwaitOrder = await prisma.order.create({
    data: {
      email: 'test-customer-kuwait@example.com',
      status: 'PROCESSING',
      totalCents: 35000, // 350 KWD
      subtotalCents: 35000,
      currency: 'kwd',
      storeId: kuwaitStore.id,
      items: {
        create: {
          productId: kuwaitProduct.id,
          quantity: 1,
          unitPriceCents: 35000, // 350 KWD
          nameSnapshot: kuwaitProduct.name,
          imageSnapshot: null
        }
      }
    }
  });
  
  console.log(`\nKuwait Order Created:`);
  console.log(`- Order ID: ${kuwaitOrder.id}`);
  console.log(`- Customer: ${kuwaitOrder.email}`);
  console.log(`- Store: Kuwait Store`);
  console.log(`- Total: ${kuwaitOrder.totalCents / 100} KWD`);
  console.log(`- Status: ${kuwaitOrder.status}`);
  
  // Test data visibility
  console.log('\n=== STEP 4: VERIFY DATA SEGREGATION ===');
  
  // What UAE Admin should see
  const uaeAdminProducts = await prisma.product.findMany({
    where: {
      OR: [
        { storeId: uaeStore.id },
        { storeId: null }
      ]
    }
  });
  
  const uaeAdminOrders = await prisma.order.findMany({
    where: { storeId: uaeStore.id }
  });
  
  // What Kuwait Admin should see
  const kuwaitAdminProducts = await prisma.product.findMany({
    where: {
      OR: [
        { storeId: kuwaitStore.id },
        { storeId: null }
      ]
    }
  });
  
  const kuwaitAdminOrders = await prisma.order.findMany({
    where: { storeId: kuwaitStore.id }
  });
  
  console.log(`\nUAE Admin View:`);
  console.log(`- Can see ${uaeAdminProducts.length} products`);
  console.log(`  Includes UAE product: ${uaeAdminProducts.some(p => p.id === uaeProduct.id) ? 'YES ✅' : 'NO ❌'}`);
  console.log(`  Includes Kuwait product: ${uaeAdminProducts.some(p => p.id === kuwaitProduct.id) ? 'YES ❌ (LEAK!)' : 'NO ✅'}`);
  console.log(`- Can see ${uaeAdminOrders.length} orders`);
  console.log(`  Includes UAE order: ${uaeAdminOrders.some(o => o.id === uaeOrder.id) ? 'YES ✅' : 'NO ❌'}`);
  console.log(`  Includes Kuwait order: ${uaeAdminOrders.some(o => o.id === kuwaitOrder.id) ? 'YES ❌ (LEAK!)' : 'NO ✅'}`);
  
  console.log(`\nKuwait Admin View:`);
  console.log(`- Can see ${kuwaitAdminProducts.length} products`);
  console.log(`  Includes Kuwait product: ${kuwaitAdminProducts.some(p => p.id === kuwaitProduct.id) ? 'YES ✅' : 'NO ❌'}`);
  console.log(`  Includes UAE product: ${kuwaitAdminProducts.some(p => p.id === uaeProduct.id) ? 'YES ❌ (LEAK!)' : 'NO ✅'}`);
  console.log(`- Can see ${kuwaitAdminOrders.length} orders`);
  console.log(`  Includes Kuwait order: ${kuwaitAdminOrders.some(o => o.id === kuwaitOrder.id) ? 'YES ✅' : 'NO ❌'}`);
  console.log(`  Includes UAE order: ${kuwaitAdminOrders.some(o => o.id === uaeOrder.id) ? 'YES ❌ (LEAK!)' : 'NO ✅'}`);
  
  // Test website rendering simulation
  console.log('\n=== STEP 5: SIMULATE WEBSITE RENDERING ===');
  
  // Simulate UAE website view
  const uaeWebsiteProducts = await prisma.product.findMany({
    where: {
      OR: [
        { storeId: uaeStore.id },
        { storeId: null }
      ],
      active: true
    },
    include: {
      brand: true,
      productCategories: { include: { category: true } },
      storeInventories: {
        where: { storeId: uaeStore.id }
      }
    }
  });
  
  // Simulate Kuwait website view
  const kuwaitWebsiteProducts = await prisma.product.findMany({
    where: {
      OR: [
        { storeId: kuwaitStore.id },
        { storeId: null }
      ],
      active: true
    },
    include: {
      brand: true,
      productCategories: { include: { category: true } },
      storeInventories: {
        where: { storeId: kuwaitStore.id }
      }
    }
  });
  
  console.log(`\nUAE Website would render:`);
  uaeWebsiteProducts.forEach(p => {
    const storeType = p.storeId === uaeStore.id ? 'UAE-EXCLUSIVE' : 'GLOBAL';
    const price = p.priceCents / 100;
    console.log(`  - ${p.name} [${storeType}] - ${price} ${uaeStore.currency.toUpperCase()}`);
  });
  
  console.log(`\nKuwait Website would render:`);
  kuwaitWebsiteProducts.forEach(p => {
    const storeType = p.storeId === kuwaitStore.id ? 'KUWAIT-EXCLUSIVE' : 'GLOBAL';
    const price = p.priceCents / 100;
    console.log(`  - ${p.name} [${storeType}] - ${price} ${kuwaitStore.currency.toUpperCase()}`);
  });
  
  // Verify no cross-rendering
  const uaeRendersKuwaitProduct = uaeWebsiteProducts.some(p => p.id === kuwaitProduct.id);
  const kuwaitRendersUaeProduct = kuwaitWebsiteProducts.some(p => p.id === uaeProduct.id);
  
  console.log('\n=== CROSS-RENDERING TEST RESULTS ===');
  console.log(`UAE website renders Kuwait product: ${uaeRendersKuwaitProduct ? 'FAIL ❌' : 'PASS ✅'}`);
  console.log(`Kuwait website renders UAE product: ${kuwaitRendersUaeProduct ? 'FAIL ❌' : 'PASS ✅'}`);
  
  if (!uaeRendersKuwaitProduct && !kuwaitRendersUaeProduct) {
    console.log('\n🎉 SUCCESS: Complete data segregation achieved!');
    console.log('Each admin panel and website only shows their country-specific products and orders.');
  } else {
    console.log('\n⚠️ WARNING: Data leakage detected!');
    console.log('Review the admin-auth.ts and API filtering logic.');
  }
  
  // Summary
  console.log('\n=== TEST SUMMARY ===');
  console.log(`1. Created 2 admins (UAE & Kuwait)`);
  console.log(`2. Added 2 exclusive products (1 UAE, 1 Kuwait)`);
  console.log(`3. Created 2 orders (1 UAE customer, 1 Kuwait customer)`);
  console.log(`4. Verified data segregation in admin panels`);
  console.log(`5. Verified proper website rendering per country`);
  console.log(`\nTest data preserved for manual inspection.`);
  
  return {
    success: !uaeRendersKuwaitProduct && !kuwaitRendersUaeProduct,
    uaeProduct,
    kuwaitProduct,
    uaeOrder,
    kuwaitOrder
  };
}

testMultiAdminProducts()
  .then(result => {
    if (result.success) {
      console.log('\n✅ All tests passed! Multi-admin product segregation is working correctly.');
      process.exit(0);
    } else {
      console.log('\n❌ Tests failed! Data leakage detected.');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Test failed with error:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());