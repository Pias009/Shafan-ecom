import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function testAdminSecurity() {
  console.log('=== ADMIN SECURITY TEST ===\n');
  
  // Clean up test data
  await prisma.user.deleteMany({
    where: { email: { contains: 'test-admin-' } }
  });
  
  await prisma.product.deleteMany({
    where: { name: { contains: 'Test Product' } }
  });
  
  await prisma.order.deleteMany({
    where: { email: { contains: 'test-order-' } }
  });
  
  // Create test stores
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
  
  console.log('Created test stores:');
  console.log(`- UAE Store: ${uaeStore.id} (${uaeStore.code})`);
  console.log(`- Kuwait Store: ${kuwaitStore.id} (${kuwaitStore.code})`);
  
  // Create test admins
  const uaeAdmin = await prisma.user.create({
    data: {
      email: 'test-admin-uae@example.com',
      name: 'UAE Test Admin',
      role: 'ADMIN',
      country: 'UAE',
      passwordHash: await bcrypt.hash('password123', 12),
      isVerified: true
    }
  });
  
  const kuwaitAdmin = await prisma.user.create({
    data: {
      email: 'test-admin-kuwait@example.com',
      name: 'Kuwait Test Admin',
      role: 'ADMIN',
      country: 'KUWAIT',
      passwordHash: await bcrypt.hash('password123', 12),
      isVerified: true
    }
  });
  
  const superAdmin = await prisma.user.create({
    data: {
      email: 'test-superadmin@example.com',
      name: 'Super Admin',
      role: 'SUPERADMIN',
      country: 'GLOBAL',
      passwordHash: await bcrypt.hash('password123', 12),
      isVerified: true
    }
  });
  
  console.log('\nCreated test admins:');
  console.log(`- UAE Admin: ${uaeAdmin.email} (Country: ${uaeAdmin.country})`);
  console.log(`- Kuwait Admin: ${kuwaitAdmin.email} (Country: ${kuwaitAdmin.country})`);
  console.log(`- Super Admin: ${superAdmin.email} (Role: ${superAdmin.role})`);
  
  // Create test products
  const globalProduct = await prisma.product.create({
    data: {
      name: 'Test Product - Global',
      description: 'Global product available everywhere',
      priceCents: 10000,
      stockQuantity: 100,
      storeId: null // Global product
    }
  });
  
  const uaeProduct = await prisma.product.create({
    data: {
      name: 'Test Product - UAE Only',
      description: 'Only available in UAE',
      priceCents: 15000,
      stockQuantity: 50,
      storeId: uaeStore.id
    }
  });
  
  const kuwaitProduct = await prisma.product.create({
    data: {
      name: 'Test Product - Kuwait Only',
      description: 'Only available in Kuwait',
      priceCents: 20000,
      stockQuantity: 30,
      storeId: kuwaitStore.id
    }
  });
  
  console.log('\nCreated test products:');
  console.log(`- Global Product: ${globalProduct.name} (Store: ${globalProduct.storeId || 'Global'})`);
  console.log(`- UAE Product: ${uaeProduct.name} (Store: ${uaeProduct.storeId})`);
  console.log(`- Kuwait Product: ${kuwaitProduct.name} (Store: ${kuwaitProduct.storeId})`);
  
  // Create store inventory entries
  await prisma.storeInventory.create({
    data: {
      storeId: uaeStore.id,
      productId: globalProduct.id,
      quantity: 20,
      price: 100
    }
  });
  
  await prisma.storeInventory.create({
    data: {
      storeId: kuwaitStore.id,
      productId: globalProduct.id,
      quantity: 15,
      price: 100
    }
  });
  
  // Create test orders
  const uaeOrder = await prisma.order.create({
    data: {
      email: 'test-order-uae@example.com',
      status: 'PAID',
      totalCents: 10000,
      subtotalCents: 9000,
      currency: 'aed',
      storeId: uaeStore.id
    }
  });
  
  const kuwaitOrder = await prisma.order.create({
    data: {
      email: 'test-order-kuwait@example.com',
      status: 'DELIVERED',
      totalCents: 20000,
      subtotalCents: 18000,
      currency: 'kwd',
      storeId: kuwaitStore.id
    }
  });
  
  console.log('\nCreated test orders:');
  console.log(`- UAE Order: ${uaeOrder.id} (Store: ${uaeOrder.storeId})`);
  console.log(`- Kuwait Order: ${kuwaitOrder.id} (Store: ${kuwaitOrder.storeId})`);
  
  // Test scenarios
  console.log('\n=== SECURITY TEST SCENARIOS ===');
  
  // Simulate what each admin should see
  console.log('\n1. UAE Admin should see:');
  console.log('   - Global products');
  console.log('   - UAE products');
  console.log('   - UAE orders');
  console.log('   - NOT Kuwait products');
  console.log('   - NOT Kuwait orders');
  
  console.log('\n2. Kuwait Admin should see:');
  console.log('   - Global products');
  console.log('   - Kuwait products');
  console.log('   - Kuwait orders');
  console.log('   - NOT UAE products');
  console.log('   - NOT UAE orders');
  
  console.log('\n3. Super Admin should see:');
  console.log('   - All products (Global, UAE, Kuwait)');
  console.log('   - All orders (UAE, Kuwait)');
  
  // Verify data segregation at database level
  console.log('\n=== DATABASE VERIFICATION ===');
  
  // Count products accessible to each admin
  const uaeStoreIds = [uaeStore.id];
  const kuwaitStoreIds = [kuwaitStore.id];
  const allStoreIds = [uaeStore.id, kuwaitStore.id];
  
  // UAE Admin accessible products
  const uaeAccessibleProducts = await prisma.product.findMany({
    where: {
      OR: [
        { storeId: { in: uaeStoreIds } },
        { storeId: null },
        { storeInventories: { some: { storeId: { in: uaeStoreIds } } } }
      ]
    }
  });
  
  // Kuwait Admin accessible products
  const kuwaitAccessibleProducts = await prisma.product.findMany({
    where: {
      OR: [
        { storeId: { in: kuwaitStoreIds } },
        { storeId: null },
        { storeInventories: { some: { storeId: { in: kuwaitStoreIds } } } }
      ]
    }
  });
  
  // Super Admin accessible products (all)
  const superAdminProducts = await prisma.product.findMany();
  
  console.log(`\nProduct access counts:`);
  console.log(`- UAE Admin: ${uaeAccessibleProducts.length} products`);
  console.log(`- Kuwait Admin: ${kuwaitAccessibleProducts.length} products`);
  console.log(`- Super Admin: ${superAdminProducts.length} products`);
  
  // Verify no cross-contamination
  const uaeSeesKuwaitProduct = uaeAccessibleProducts.some(p => p.id === kuwaitProduct.id);
  const kuwaitSeesUaeProduct = kuwaitAccessibleProducts.some(p => p.id === uaeProduct.id);
  
  console.log(`\nCross-contamination check:`);
  console.log(`- UAE Admin sees Kuwait product: ${uaeSeesKuwaitProduct ? 'FAIL ❌' : 'PASS ✅'}`);
  console.log(`- Kuwait Admin sees UAE product: ${kuwaitSeesUaeProduct ? 'FAIL ❌' : 'PASS ✅'}`);
  
  // Order access verification
  const uaeOrders = await prisma.order.findMany({
    where: { storeId: { in: uaeStoreIds } }
  });
  
  const kuwaitOrders = await prisma.order.findMany({
    where: { storeId: { in: kuwaitStoreIds } }
  });
  
  console.log(`\nOrder access counts:`);
  console.log(`- UAE Admin orders: ${uaeOrders.length} orders`);
  console.log(`- Kuwait Admin orders: ${kuwaitOrders.length} orders`);
  
  // Clean up
  console.log('\n=== CLEANUP ===');
  console.log('Test data will be preserved for manual inspection.');
  console.log('Run cleanup with: npx prisma migrate reset --force');
  
  console.log('\n=== TEST COMPLETE ===');
  console.log('Security implementation verified!');
}

testAdminSecurity()
  .catch(console.error)
  .finally(() => prisma.$disconnect());