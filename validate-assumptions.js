const { PrismaClient } = require('@prisma/client');

async function validateAssumptions() {
  console.log('=== VALIDATING CRITICAL ASSUMPTIONS ===\n');
  
  const prisma = new PrismaClient();
  
  try {
    // ASSUMPTION 1: Product store assignment affects spare store rendering
    console.log('1. PRODUCT STORE ASSIGNMENT ANALYSIS:');
    
    const allProducts = await prisma.product.findMany({
      include: {
        store: true,
        storeInventories: {
          include: { store: true }
        }
      }
    });
    
    console.log(`   Total products: ${allProducts.length}`);
    
    const productsByStoreType = {
      withStore: allProducts.filter(p => p.storeId !== null),
      global: allProducts.filter(p => p.storeId === null),
      withInventory: allProducts.filter(p => p.storeInventories.length > 0)
    };
    
    console.log(`   - Products with direct store assignment: ${productsByStoreType.withStore.length}`);
    console.log(`   - Global products (no store): ${productsByStoreType.global.length}`);
    console.log(`   - Products with store inventory records: ${productsByStoreType.withInventory.length}`);
    
    // Check Kuwait store inventory specifically
    const kuwaitStore = await prisma.store.findFirst({
      where: { code: 'KUW' },
      include: { storeInventories: { include: { product: true } } }
    });
    
    if (kuwaitStore) {
      console.log(`\n   Kuwait Store (${kuwaitStore.code}) Inventory:`);
      console.log(`   - Total inventory items: ${kuwaitStore.storeInventories.length}`);
      
      if (kuwaitStore.storeInventories.length === 0) {
        console.log('   ⚠️ CRITICAL: Kuwait store has NO inventory items - spare store rendering will be empty');
      } else {
        console.log('   Inventory items:');
        kuwaitStore.storeInventories.forEach((inv, i) => {
          console.log(`     ${i+1}. ${inv.product.name} - Qty: ${inv.quantity}, Price: $${inv.price}`);
        });
      }
    }
    
    // ASSUMPTION 2: Authentication/Login flow complexity
    console.log('\n2. AUTHENTICATION FLOW ANALYSIS:');
    
    const usersWithMfa = await prisma.user.findMany({
      where: { mfaEnabled: true },
      select: { email: true, role: true, loginAttempts: true }
    });
    
    console.log(`   Users with MFA enabled: ${usersWithMfa.length}`);
    
    const lockedUsers = await prisma.user.findMany({
      where: { 
        lockUntil: { not: null },
        lockUntil: { gt: new Date() }
      },
      select: { email: true, lockUntil: true }
    });
    
    console.log(`   Currently locked users: ${lockedUsers.length}`);
    if (lockedUsers.length > 0) {
      console.log('   ⚠️ Locked users may experience login failures:');
      lockedUsers.forEach(user => {
        console.log(`     - ${user.email} locked until ${user.lockUntil}`);
      });
    }
    
    // Check MFA tokens
    const mfaTokens = await prisma.mfaToken.findMany({
      include: { user: true }
    });
    
    console.log(`   Active MFA tokens: ${mfaTokens.length}`);
    
    const expiredMfaTokens = mfaTokens.filter(token => token.expires < new Date());
    console.log(`   Expired MFA tokens: ${expiredMfaTokens.length}`);
    
    // ASSUMPTION 3: Order collection filtering by store
    console.log('\n3. ORDER COLLECTION ANALYSIS:');
    
    const allOrders = await prisma.order.findMany({
      include: { store: true, user: true }
    });
    
    console.log(`   Total orders: ${allOrders.length}`);
    
    const ordersByStore = {};
    allOrders.forEach(order => {
      const storeCode = order.store?.code || 'GLOBAL';
      ordersByStore[storeCode] = (ordersByStore[storeCode] || 0) + 1;
    });
    
    console.log('   Orders by store:');
    Object.entries(ordersByStore).forEach(([store, count]) => {
      console.log(`     - ${store}: ${count} orders`);
    });
    
    // Check Kuwait store orders
    const kuwaitOrders = allOrders.filter(order => order.store?.code === 'KUW');
    console.log(`   Kuwait store orders: ${kuwaitOrders.length}`);
    
    if (kuwaitOrders.length === 0 && kuwaitStore) {
      console.log('   ⚠️ Kuwait store exists but has no orders - may affect order collection display');
    }
    
    // ASSUMPTION 4: Payment system readiness
    console.log('\n4. PAYMENT SYSTEM READINESS:');
    
    const ordersWithPayment = await prisma.order.findMany({
      where: {
        OR: [
          { stripePaymentIntentId: { not: null } },
          { tabbyPaymentId: { not: null } },
          { tamaraCheckoutId: { not: null } }
        ]
      },
      select: { id: true, status: true, stripePaymentIntentId: true }
    });
    
    console.log(`   Orders with payment references: ${ordersWithPayment.length}`);
    
    // Check environment variables
    const stripeConfig = {
      secret: process.env.STRIPE_SECRET_KEY ? 'Configured' : 'MISSING',
      publishable: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? 'Configured' : 'MISSING',
      webhook: process.env.STRIPE_WEBHOOK_SECRET ? 'Configured' : 'MISSING'
    };
    
    console.log('   Stripe configuration:');
    console.log(`     - Secret Key: ${stripeConfig.secret}`);
    console.log(`     - Publishable Key: ${stripeConfig.publishable}`);
    console.log(`     - Webhook Secret: ${stripeConfig.webhook}`);
    
    // SUMMARY OF FINDINGS
    console.log('\n=== CRITICAL FINDINGS ===');
    
    const criticalIssues = [];
    
    if (kuwaitStore && kuwaitStore.storeInventories.length === 0) {
      criticalIssues.push('Kuwait store has NO inventory items - spare products rendering will show empty store');
    }
    
    if (productsByStoreType.global.length > productsByStoreType.withStore.length) {
      criticalIssues.push(`Majority of products (${productsByStoreType.global.length}/${allProducts.length}) are global without store assignment`);
    }
    
    if (lockedUsers.length > 0) {
      criticalIssues.push(`${lockedUsers.length} users are currently locked out of the system`);
    }
    
    if (stripeConfig.secret === 'MISSING' || stripeConfig.publishable === 'MISSING') {
      criticalIssues.push('Stripe payment configuration appears incomplete');
    }
    
    if (criticalIssues.length === 0) {
      console.log('No critical issues detected. System appears functional.');
    } else {
      console.log(`Found ${criticalIssues.length} critical issue(s):`);
      criticalIssues.forEach((issue, i) => {
        console.log(`  ${i+1}. ${issue}`);
      });
    }
    
    console.log('\n=== VALIDATION COMPLETE ===');
    
  } catch (error) {
    console.error('Validation failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

validateAssumptions().catch(console.error);