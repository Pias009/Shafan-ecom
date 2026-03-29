const { PrismaClient } = require('@prisma/client');

async function runDiagnostics() {
  console.log('=== E-COMMERCE SYSTEM DIAGNOSTIC CHECK ===\n');
  
  const prisma = new PrismaClient({
    log: ['error', 'warn'],
  });
  
  try {
    // 1. Database Connection Test
    console.log('1. DATABASE CONNECTION:');
    const pingResult = await prisma.$runCommandRaw({ ping: 1 });
    console.log(`   ✓ Database ping: ${JSON.stringify(pingResult)}`);
    
    // 2. Check Connection Pool/IDs
    console.log('\n2. CONNECTION POOL STATUS:');
    console.log('   ℹ️ MongoDB connection parameters configured in prisma.ts');
    console.log('   - serverSelectionTimeoutMS: 10000');
    console.log('   - socketTimeoutMS: 30000');
    console.log('   - maxPoolSize: 20');
    console.log('   - minPoolSize: 5');
    
    // 3. Authentication System Check
    console.log('\n3. AUTHENTICATION SYSTEM:');
    const userCount = await prisma.user.count();
    console.log(`   ✓ Total users in database: ${userCount}`);
    
    const adminUsers = await prisma.user.findMany({
      where: { role: { in: ['ADMIN', 'SUPERADMIN'] } },
      select: { email: true, role: true, mfaEnabled: true }
    });
    console.log(`   ✓ Admin users: ${adminUsers.length}`);
    adminUsers.forEach(user => {
      console.log(`     - ${user.email} (${user.role}) MFA: ${user.mfaEnabled}`);
    });
    
    // 4. Store and Inventory Check
    console.log('\n4. STORE & INVENTORY SYSTEM:');
    const stores = await prisma.store.findMany({
      select: { code: true, name: true, country: true, active: true }
    });
    console.log(`   ✓ Stores configured: ${stores.length}`);
    stores.forEach(store => {
      console.log(`     - ${store.code}: ${store.name} (${store.country}) ${store.active ? 'ACTIVE' : 'INACTIVE'}`);
    });
    
    // Check Kuwait store specifically
    const kuwaitStore = await prisma.store.findFirst({
      where: { code: 'KUW' },
      include: { storeInventories: true }
    });
    if (kuwaitStore) {
      console.log(`   ✓ Kuwait store found with ${kuwaitStore.storeInventories.length} inventory items`);
    } else {
      console.log(`   ⚠️ Kuwait store (KUW) not found - may affect spare store rendering`);
    }
    
    // 5. Product CRUD Operations Check
    console.log('\n5. PRODUCT SYSTEM:');
    const productCount = await prisma.product.count();
    console.log(`   ✓ Total products: ${productCount}`);
    
    const productsWithStore = await prisma.product.findMany({
      where: { storeId: { not: null } },
      select: { id: true, name: true, storeId: true }
    });
    console.log(`   ✓ Products with store assignment: ${productsWithStore.length}`);
    
    // 6. Order Collections Check
    console.log('\n6. ORDER COLLECTIONS:');
    const orderCount = await prisma.order.count();
    console.log(`   ✓ Total orders: ${orderCount}`);
    
    const ordersByStatus = await prisma.order.groupBy({
      by: ['status'],
      _count: true
    });
    ordersByStatus.forEach(group => {
      console.log(`     - ${group.status}: ${group._count} orders`);
    });
    
    // 7. Payment System Check
    console.log('\n7. PAYMENT SYSTEM CONFIGURATION:');
    const stripeKey = process.env.STRIPE_SECRET_KEY ? 'Configured' : 'NOT CONFIGURED';
    const stripePubKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? 'Configured' : 'NOT CONFIGURED';
    console.log(`   ✓ Stripe Secret Key: ${stripeKey}`);
    console.log(`   ✓ Stripe Publishable Key: ${stripePubKey}`);
    
    // 8. Logging System Check
    console.log('\n8. LOGGING SYSTEMS:');
    const auditLogCount = await prisma.auditLog.count();
    console.log(`   ✓ Audit logs in database: ${auditLogCount}`);
    
    // Check recent audit logs
    const recentLogs = await prisma.auditLog.findMany({
      take: 3,
      orderBy: { createdAt: 'desc' },
      select: { action: true, createdAt: true }
    });
    console.log(`   ✓ Recent audit actions:`);
    recentLogs.forEach(log => {
      console.log(`     - ${log.action} at ${log.createdAt.toISOString()}`);
    });
    
    // 9. Environment Configuration Check
    console.log('\n9. ENVIRONMENT CONFIGURATION:');
    const requiredEnvVars = [
      'DATABASE_URL',
      'NEXTAUTH_SECRET',
      'NEXTAUTH_URL',
      'STRIPE_SECRET_KEY',
      'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'
    ];
    
    requiredEnvVars.forEach(varName => {
      const value = process.env[varName];
      const status = value ? '✓' : '✗';
      const displayValue = value ? (varName.includes('SECRET') || varName.includes('KEY') ? '***' : value.substring(0, 20) + '...') : 'MISSING';
      console.log(`   ${status} ${varName}: ${displayValue}`);
    });
    
    // 10. Identify Potential Issues
    console.log('\n10. POTENTIAL ISSUES ANALYSIS:');
    
    const issues = [];
    
    // Check for missing Kuwait store
    if (!kuwaitStore) {
      issues.push('Kuwait store (KUW) not found - may affect "spare store" rendering');
    }
    
    // Check for products without store assignment
    const globalProducts = productCount - productsWithStore.length;
    if (globalProducts > 0) {
      issues.push(`${globalProducts} products without store assignment (global products)`);
    }
    
    // Check for inactive stores
    const inactiveStores = stores.filter(s => !s.active);
    if (inactiveStores.length > 0) {
      issues.push(`${inactiveStores.length} stores are inactive: ${inactiveStores.map(s => s.code).join(', ')}`);
    }
    
    // Check for missing Stripe configuration
    if (!process.env.STRIPE_SECRET_KEY || !process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
      issues.push('Stripe payment configuration may be incomplete');
    }
    
    if (issues.length === 0) {
      console.log('   ✓ No critical issues detected');
    } else {
      console.log('   ⚠️ Potential issues found:');
      issues.forEach(issue => console.log(`     - ${issue}`));
    }
    
    console.log('\n=== DIAGNOSTIC COMPLETE ===');
    
  } catch (error) {
    console.error('Diagnostic failed:', error.message);
    console.error('Full error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run diagnostics
runDiagnostics().catch(console.error);