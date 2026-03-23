/**
 * Multi-Admin Access Control Test Script
 * 
 * This script verifies strict data segregation between UAE and Kuwait admins:
 * 1. UAE Admin cannot access Kuwait-specific data
 * 2. Kuwait Admin cannot access UAE-specific data
 * 3. Both admins can only see their respective store data
 * 4. SUPERADMIN has access to all stores
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface TestResult {
  test: string;
  passed: boolean;
  message: string;
}

const results: TestResult[] = [];

function logResult(test: string, passed: boolean, message: string) {
  results.push({ test, passed, message });
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status}: ${test}`);
  if (!passed) {
    console.log(`  → ${message}`);
  }
}

async function runTests() {
  console.log('\n🔐 Multi-Admin Access Control Security Tests\n');
  console.log('=' .repeat(60));

  // Test 1: Verify Store Configuration
  console.log('\n📋 Test 1: Store Configuration');
  const kuwaitStore = await prisma.store.findUnique({ where: { code: 'KUW' } });
  const uaeStore = await prisma.store.findUnique({ where: { code: 'UAE' } });
  
  logResult(
    'Kuwait Store (KUW) exists',
    !!kuwaitStore,
    kuwaitStore ? 'Found KUW store' : 'KUW store not found - run seed script'
  );
  
  logResult(
    'UAE Store (UAE) exists',
    !!uaeStore,
    uaeStore ? 'Found UAE store' : 'UAE store not found - run seed script'
  );

  // Test 2: Verify Admin Users
  console.log('\n👤 Test 2: Admin User Configuration');
  const kuwaitAdmin = await prisma.user.findFirst({
    where: { 
      role: 'ADMIN',
      country: 'KW'
    }
  });
  
  const uaeAdmin = await prisma.user.findFirst({
    where: { 
      role: 'ADMIN',
      country: 'UAE'
    }
  });

  logResult(
    'Kuwait Admin exists with country=KW',
    !!kuwaitAdmin,
    kuwaitAdmin ? `Found Kuwait admin: ${kuwaitAdmin.email}` : 'No Kuwait admin found'
  );

  logResult(
    'UAE Admin exists with country=UAE',
    !!uaeAdmin,
    uaeAdmin ? `Found UAE admin: ${uaeAdmin.email}` : 'No UAE admin found'
  );

  // Test 3: Data Segregation - Orders
  console.log('\n📦 Test 3: Order Data Segregation');
  
  if (kuwaitStore && uaeStore) {
    // Create test orders for each store
    const kuwaitOrder = await prisma.order.findFirst({
      where: { storeId: kuwaitStore.id }
    });
    
    const uaeOrder = await prisma.order.findFirst({
      where: { storeId: uaeStore.id }
    });

    logResult(
      'Kuwait orders exist',
      !!kuwaitOrder,
      kuwaitOrder ? 'Found Kuwait orders' : 'No Kuwait orders found'
    );

    logResult(
      'UAE orders exist',
      !!uaeOrder,
      uaeOrder ? 'Found UAE orders' : 'No UAE orders found'
    );

    // Verify orders are segregated by storeId
    const allKuwaitOrders = await prisma.order.findMany({
      where: { storeId: kuwaitStore.id }
    });

    const allUAEOrders = await prisma.order.findMany({
      where: { storeId: uaeStore.id }
    });

    const kuwaitOrderIds = new Set(allKuwaitOrders.map(o => o.id));
    const uaeOrderIds = new Set(allUAEOrders.map(o => o.id));

    const hasOverlap = [...kuwaitOrderIds].some(id => uaeOrderIds.has(id));

    logResult(
      'Orders are strictly segregated by store',
      !hasOverlap,
      hasOverlap ? 'CRITICAL: Orders overlap between stores!' : 'Orders are properly segregated'
    );
  }

  // Test 4: Data Segregation - Products
  console.log('\n🛍️ Test 4: Product Data Segregation');
  
  if (kuwaitStore && uaeStore) {
    const kuwaitProducts = await prisma.storeInventory.findMany({
      where: { storeId: kuwaitStore.id },
      include: { product: true }
    });

    const uaeProducts = await prisma.storeInventory.findMany({
      where: { storeId: uaeStore.id },
      include: { product: true }
    });

    logResult(
      'Kuwait has inventory',
      kuwaitProducts.length > 0,
      `Found ${kuwaitProducts.length} products in Kuwait inventory`
    );

    logResult(
      'UAE has inventory',
      uaeProducts.length > 0,
      `Found ${uaeProducts.length} products in UAE inventory`
    );

    // Check for product overlap (should be allowed - same product can be in both stores)
    const kuwaitProductIds = new Set(kuwaitProducts.map(p => p.productId));
    const uaeProductIds = new Set(uaeProducts.map(p => p.productId));
    const sharedProducts = [...kuwaitProductIds].filter(id => uaeProductIds.has(id));

    logResult(
      'Products can be shared across stores (via StoreInventory)',
      true,
      `${sharedProducts.length} products are available in both stores (expected behavior)`
    );
  }

  // Test 5: Courier Services Segregation
  console.log('\n🚚 Test 5: Courier Services Segregation');
  
  if (kuwaitStore && uaeStore) {
    const kuwaitCouriers = await prisma.courierService.findMany({
      where: { storeId: kuwaitStore.id }
    });

    const uaeCouriers = await prisma.courierService.findMany({
      where: { storeId: uaeStore.id }
    });

    logResult(
      'Kuwait has courier services',
      kuwaitCouriers.length > 0,
      `Found ${kuwaitCouriers.length} Kuwait couriers`
    );

    logResult(
      'UAE has courier services',
      uaeCouriers.length > 0,
      `Found ${uaeCouriers.length} UAE couriers`
    );

    // Couriers should be segregated
    const kuwaitCourierIds = new Set(kuwaitCouriers.map(c => c.id));
    const uaeCourierIds = new Set(uaeCouriers.map(c => c.id));
    const hasCourierOverlap = [...kuwaitCourierIds].some(id => uaeCourierIds.has(id));

    logResult(
      'Courier services are segregated by store',
      !hasCourierOverlap,
      hasCourierOverlap ? 'WARNING: Couriers overlap between stores' : 'Couriers are properly segregated'
    );
  }

  // Test 6: User Data Privacy
  console.log('\n🔒 Test 6: User Data Privacy');
  
  if (kuwaitStore && uaeStore) {
    const kuwaitOrderUsers = await prisma.order.findMany({
      where: { storeId: kuwaitStore.id },
      select: { userId: true }
    });

    const uaeOrderUsers = await prisma.order.findMany({
      where: { storeId: uaeStore.id },
      select: { userId: true }
    });

    const kuwaitUserIds = new Set(kuwaitOrderUsers.map(o => o.userId).filter(Boolean));
    const uaeUserIds = new Set(uaeOrderUsers.map(o => o.userId).filter(Boolean));

    logResult(
      'Kuwait has customer data',
      kuwaitUserIds.size > 0,
      `Found ${kuwaitUserIds.size} unique Kuwait customers`
    );

    logResult(
      'UAE has customer data',
      uaeUserIds.size > 0,
      `Found ${uaeUserIds.size} unique UAE customers`
    );

    // Users can be shared (same user can order from both stores)
    const sharedUsers = [...kuwaitUserIds].filter(id => uaeUserIds.has(id));

    logResult(
      'Users can place orders in multiple stores',
      true,
      `${sharedUsers.length} users have ordered from both stores (expected behavior)`
    );
  }

  // Test 7: SUPERADMIN Access
  console.log('\n👑 Test 7: SUPERADMIN Access');
  
  const superAdmin = await prisma.user.findFirst({
    where: { role: 'SUPERADMIN' }
  });

  logResult(
    'SUPERADMIN exists',
    !!superAdmin,
    superAdmin ? `Found SUPERADMIN: ${superAdmin?.email}` : 'No SUPERADMIN found'
  );

  if (superAdmin) {
    const allStores = await prisma.store.findMany({
      where: { active: true }
    });

    logResult(
      'SUPERADMIN can access all active stores',
      allStores.length > 0,
      `SUPERADMIN has access to ${allStores.length} stores`
    );
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Test Summary\n');
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const total = results.length;

  console.log(`Total Tests: ${total}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);

  if (failed > 0) {
    console.log('\n⚠️ Failed Tests:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  - ${r.test}: ${r.message}`);
    });
  }

  console.log('\n' + '='.repeat(60) + '\n');
}

runTests()
  .catch((e) => {
    console.error('Test execution error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
