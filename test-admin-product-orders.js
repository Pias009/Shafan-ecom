const { PrismaClient } = require('@prisma/client');

async function testAdminProductOrders() {
  console.log('=== TESTING ADMIN PRODUCT CREATION AND ORDER RETRIEVAL ===\n');
  
  const prisma = new PrismaClient({
    log: ['error', 'warn'],
  });
  
  try {
    // 1. Get all admins and their countries
    console.log('1. ADMIN USERS AND THEIR COUNTRIES:');
    const admins = await prisma.user.findMany({
      where: { role: { in: ['ADMIN', 'SUPERADMIN'] } },
      select: { id: true, email: true, role: true, country: true }
    });
    
    admins.forEach(admin => {
      console.log(`   - ${admin.email} (${admin.role}): country=${admin.country || 'NOT SET'}`);
    });
    
    // 2. Check store assignments
    console.log('\n2. STORE ASSIGNMENTS:');
    const stores = await prisma.store.findMany({
      select: { id: true, code: true, country: true }
    });
    
    stores.forEach(store => {
      console.log(`   - ${store.code}: ${store.country} (ID: ${store.id})`);
    });
    
    // 3. Check products and their store assignments
    console.log('\n3. PRODUCT STORE ASSIGNMENTS:');
    const products = await prisma.product.findMany({
      select: { id: true, name: true, storeId: true, store: { select: { code: true } } }
    });
    
    products.forEach(product => {
      console.log(`   - ${product.name}: store=${product.store?.code || 'NULL'} (storeId: ${product.storeId || 'NULL'})`);
    });
    
    // 4. Check store inventory
    console.log('\n4. STORE INVENTORY:');
    const inventories = await prisma.storeInventory.findMany({
      include: {
        store: { select: { code: true } },
        product: { select: { name: true } }
      }
    });
    
    inventories.forEach(inv => {
      console.log(`   - ${inv.product.name} in ${inv.store.code}: ${inv.quantity} units`);
    });
    
    // 5. Check orders and their store assignments
    console.log('\n5. ORDER STORE ASSIGNMENTS:');
    const orders = await prisma.order.findMany({
      select: { id: true, status: true, storeId: true, store: { select: { code: true } } }
    });
    
    orders.forEach(order => {
      console.log(`   - Order ${order.id.substring(0, 8)}: store=${order.store?.code || 'NULL'} (status: ${order.status})`);
    });
    
    // 6. Simulate what UAE admin would see vs Kuwait admin
    console.log('\n6. SIMULATING ADMIN VIEWS:');
    
    // UAE admin (country=UAE) should see UAE store (code=UAE)
    const uaeStore = await prisma.store.findFirst({ where: { code: 'UAE' } });
    const kuwaitStore = await prisma.store.findFirst({ where: { code: 'KUW' } });
    
    console.log('\n   UAE ADMIN VIEW:');
    if (uaeStore) {
      const uaeProducts = await prisma.product.findMany({
        where: { storeId: uaeStore.id },
        select: { name: true }
      });
      console.log(`   - Products in UAE store: ${uaeProducts.length}`);
      
      const uaeOrders = await prisma.order.findMany({
        where: { storeId: uaeStore.id },
        select: { id: true }
      });
      console.log(`   - Orders in UAE store: ${uaeOrders.length}`);
    }
    
    console.log('\n   KUWAIT ADMIN VIEW:');
    if (kuwaitStore) {
      const kuwaitProducts = await prisma.product.findMany({
        where: { storeId: kuwaitStore.id },
        select: { name: true }
      });
      console.log(`   - Products in Kuwait store: ${kuwaitProducts.length}`);
      
      const kuwaitOrders = await prisma.order.findMany({
        where: { storeId: kuwaitStore.id },
        select: { id: true }
      });
      console.log(`   - Orders in Kuwait store: ${kuwaitOrders.length}`);
    }
    
    // 7. Check for potential issues
    console.log('\n7. POTENTIAL ISSUES:');
    
    // Check for products without store assignment
    const productsWithoutStore = await prisma.product.findMany({
      where: { storeId: null },
      select: { name: true }
    });
    
    if (productsWithoutStore.length > 0) {
      console.log(`   ⚠️  Products without store assignment: ${productsWithoutStore.length}`);
      productsWithoutStore.forEach(p => console.log(`     - ${p.name}`));
    } else {
      console.log(`   ✓ All products have store assignment`);
    }
    
    // Check for orders without store assignment
    const ordersWithoutStore = await prisma.order.findMany({
      where: { storeId: null },
      select: { id: true }
    });
    
    if (ordersWithoutStore.length > 0) {
      console.log(`   ⚠️  Orders without store assignment: ${ordersWithoutStore.length}`);
    } else {
      console.log(`   ✓ All orders have store assignment`);
    }
    
    // Check if UAE admin orders page would show Kuwait orders
    console.log('\n8. UAE ADMIN ORDERS PAGE BUG:');
    const allOrders = await prisma.order.findMany({
      select: { id: true, storeId: true, store: { select: { code: true } } }
    });
    
    const uaeOrdersCount = allOrders.filter(o => o.store?.code === 'UAE').length;
    const kuwaitOrdersCount = allOrders.filter(o => o.store?.code === 'KUW').length;
    
    console.log(`   - Current UAE orders page shows ALL ${allOrders.length} orders`);
    console.log(`   - UAE store orders: ${uaeOrdersCount}`);
    console.log(`   - Kuwait store orders: ${kuwaitOrdersCount}`);
    console.log(`   ⚠️  BUG: UAE admin would see ${kuwaitOrdersCount} Kuwait orders they shouldn't see`);
    
  } catch (error) {
    console.error('Error during test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAdminProductOrders();