/**
 * Multi-Admin Database Seed Script
 * 
 * This script sets up the complete multi-admin infrastructure:
 * 1. Creates UAE and Kuwait stores
 * 2. Creates admin users for each region
 * 3. Sets up region-specific courier services
 * 4. Creates sample inventory for each store
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Multi-Admin Database...\n');

  // ============================================
  // 1. Create Stores
  // ============================================
  console.log('📦 Creating Stores...');

  const uaeStore = await prisma.store.upsert({
    where: { code: 'UAE' },
    update: {},
    create: {
      code: 'UAE',
      name: 'UAE Store',
      country: 'UAE',
      region: 'MENA',
      active: true,
      currency: 'AED',
    },
  });
  console.log(`  ✅ Created UAE Store (ID: ${uaeStore.id})`);

  const kuwaitStore = await prisma.store.upsert({
    where: { code: 'KUW' },
    update: {},
    create: {
      code: 'KUW',
      name: 'Kuwait Store',
      country: 'KW',
      region: 'MENA',
      active: true,
      currency: 'KWD',
    },
  });
  console.log(`  ✅ Created Kuwait Store (ID: ${kuwaitStore.id})`);

  // ============================================
  // 2. Create Admin Users
  // ============================================
  console.log('\n👤 Creating Admin Users...');

  const passwordHash = await bcrypt.hash('Admin123!', 10);

  // UAE Admin
  const uaeAdmin = await prisma.user.upsert({
    where: { email: 'uae-admin@shafanglobal.com' },
    update: {},
    create: {
      email: 'uae-admin@shafanglobal.com',
      name: 'UAE Admin',
      role: 'ADMIN',
      country: 'UAE',
      passwordHash,
      isVerified: true,
    },
  });
  console.log(`  ✅ Created UAE Admin: ${uaeAdmin.email}`);

  // Kuwait Admin
  const kuwaitAdmin = await prisma.user.upsert({
    where: { email: 'kuwait-admin@shafanglobal.com' },
    update: {},
    create: {
      email: 'kuwait-admin@shafanglobal.com',
      name: 'Kuwait Admin',
      role: 'ADMIN',
      country: 'KW',
      passwordHash,
      isVerified: true,
    },
  });
  console.log(`  ✅ Created Kuwait Admin: ${kuwaitAdmin.email}`);

  // SUPERADMIN
  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@shafanglobal.com' },
    update: {},
    create: {
      email: 'superadmin@shafanglobal.com',
      name: 'Super Admin',
      role: 'SUPERADMIN',
      passwordHash,
      isVerified: true,
    },
  });
  console.log(`  ✅ Created SUPERADMIN: ${superAdmin.email}`);

  // ============================================
  // 3. Create Courier Services
  // ============================================
  console.log('\n🚚 Creating Courier Services...');

  // UAE Couriers
  const uaeCouriers = [
    { name: 'Aramex', enabled: true, config: { trackingUrl: 'https://www.aramex.com/track/results/?page=1&ShipmentNumber=' } },
    { name: 'DHL UAE', enabled: true, config: { trackingUrl: 'https://www.dhl.com/en-us/tracking.html?tracking-id=' } },
    { name: 'FedEx UAE', enabled: true, config: { trackingUrl: 'https://www.fedex.com/apps/fedextrack/?action=track&trackingnumber=' } },
  ];

  for (const courier of uaeCouriers) {
    const existing = await prisma.courierService.findFirst({
      where: {
        name: courier.name,
        storeId: uaeStore.id
      }
    });
    
    if (!existing) {
      await prisma.courierService.create({
        data: {
          name: courier.name,
          storeId: uaeStore.id,
          enabled: courier.enabled,
          config: courier.config,
        },
      });
      console.log(`  ✅ Created UAE Courier: ${courier.name}`);
    } else {
      console.log(`  ℹ️  UAE Courier already exists: ${courier.name}`);
    }
  }

  // Kuwait Couriers
  const kuwaitCouriers = [
    { name: 'Aramex Kuwait', enabled: true, config: { trackingUrl: 'https://www.aramex.com/track/results/?page=1&ShipmentNumber=' } },
    { name: 'SMSA Express', enabled: true, config: { trackingUrl: 'https://www.smsaexpress.com/track.aspx' } },
    { name: 'DHL Kuwait', enabled: true, config: { trackingUrl: 'https://www.dhl.com/en-us/tracking.html?tracking-id=' } },
  ];

  for (const courier of kuwaitCouriers) {
    const existing = await prisma.courierService.findFirst({
      where: {
        name: courier.name,
        storeId: kuwaitStore.id
      }
    });
    
    if (!existing) {
      await prisma.courierService.create({
        data: {
          name: courier.name,
          storeId: kuwaitStore.id,
          enabled: courier.enabled,
          config: courier.config,
        },
      });
      console.log(`  ✅ Created Kuwait Courier: ${courier.name}`);
    } else {
      console.log(`  ℹ️  Kuwait Courier already exists: ${courier.name}`);
    }
  }

  // ============================================
  // 4. Create Sample Products
  // ============================================
  console.log('\n🛍️ Creating Sample Products...');

  // Global products (available in both stores)
  const globalProducts = [
    {
      name: 'Premium Giloy Ayurvedic Supplement',
      slug: 'premium-giloy-ayurvedic-supplement',
      description: 'High-quality Giloy supplement for immune support',
      features: ['Natural', 'Ayurvedic', 'Immune Support'],
      priceCents: 2999,
      currency: 'USD',
      active: true,
      hot: true,
    },
    {
      name: 'Organic Ashwagandha Root',
      slug: 'organic-ashwagandha-root',
      description: 'Premium organic Ashwagandha for stress relief',
      features: ['Organic', 'Stress Relief', 'Energy Boost'],
      priceCents: 2499,
      currency: 'USD',
      active: true,
      trending: true,
    },
  ];

  const createdProducts = [];
  for (const productData of globalProducts) {
    const product = await prisma.product.upsert({
      where: { name: productData.name },
      update: {},
      create: productData,
    });
    createdProducts.push(product);
    console.log(`  ✅ Created Product: ${product.name}`);
  }

  // Kuwait-exclusive products
  const kuwaitProducts = [
    {
      name: 'Kuwait Exclusive Herbal Tea',
      slug: 'kuwait-exclusive-herbal-tea',
      description: 'Special blend of herbs popular in Kuwait',
      features: ['Local Favorite', 'Herbal', 'Refreshing'],
      priceCents: 1500,
      currency: 'KWD',
      active: true,
      hot: true,
    },
  ];

  for (const productData of kuwaitProducts) {
    const product = await prisma.product.upsert({
      where: { name: productData.name },
      update: {},
      create: productData,
    });
    createdProducts.push(product);
    console.log(`  ✅ Created Kuwait Product: ${product.name}`);
  }

  // UAE-exclusive products
  const uaeProducts = [
    {
      name: 'UAE Premium Dates Collection',
      slug: 'uae-premium-dates-collection',
      description: 'Premium dates sourced from UAE farms',
      features: ['Premium Quality', 'Local Sourcing', 'Natural'],
      priceCents: 3999,
      currency: 'AED',
      active: true,
      trending: true,
    },
  ];

  for (const productData of uaeProducts) {
    const product = await prisma.product.upsert({
      where: { name: productData.name },
      update: {},
      create: productData,
    });
    createdProducts.push(product);
    console.log(`  ✅ Created UAE Product: ${product.name}`);
  }

  // ============================================
  // 5. Create Store Inventory
  // ============================================
  console.log('\n📋 Creating Store Inventory...');

  // Add first product to UAE store only (UAE-exclusive)
  const uaeExclusiveProduct1 = createdProducts[0];
  await prisma.storeInventory.upsert({
    where: {
      storeId_productId: {
        storeId: uaeStore.id,
        productId: uaeExclusiveProduct1.id,
      },
    },
    update: {},
    create: {
      storeId: uaeStore.id,
      productId: uaeExclusiveProduct1.id,
      quantity: 100,
      price: uaeExclusiveProduct1.priceCents / 100,
    },
  });
  console.log(`  ✅ Added ${uaeExclusiveProduct1.name} to UAE store only`);

  // Add second product to Kuwait store only (Kuwait-exclusive)
  const kuwaitExclusiveProduct1 = createdProducts[1];
  await prisma.storeInventory.upsert({
    where: {
      storeId_productId: {
        storeId: kuwaitStore.id,
        productId: kuwaitExclusiveProduct1.id,
      },
    },
    update: {},
    create: {
      storeId: kuwaitStore.id,
      productId: kuwaitExclusiveProduct1.id,
      quantity: 50,
      price: kuwaitExclusiveProduct1.priceCents / 100,
    },
  });
  console.log(`  ✅ Added ${kuwaitExclusiveProduct1.name} to Kuwait store only`);

  // Add Kuwait-exclusive products to Kuwait store only
  for (const product of createdProducts.slice(2, 3)) {
    await prisma.storeInventory.upsert({
      where: {
        storeId_productId: {
          storeId: kuwaitStore.id,
          productId: product.id,
        },
      },
      update: {},
      create: {
        storeId: kuwaitStore.id,
        productId: product.id,
        quantity: 75,
        price: product.priceCents / 100,
      },
    });
    console.log(`  ✅ Added ${product.name} to Kuwait store only`);
  }

  // Add UAE-exclusive products to UAE store only
  for (const product of createdProducts.slice(3)) {
    await prisma.storeInventory.upsert({
      where: {
        storeId_productId: {
          storeId: uaeStore.id,
          productId: product.id,
        },
      },
      update: {},
      create: {
        storeId: uaeStore.id,
        productId: product.id,
        quantity: 80,
        price: product.priceCents / 100,
      },
    });
    console.log(`  ✅ Added ${product.name} to UAE store only`);
  }

  // ============================================
  // 6. Create Sample Orders
  // ============================================
  console.log('\n📦 Creating Sample Orders...');

  // Create sample users
  const kuwaitUser = await prisma.user.upsert({
    where: { email: 'kuwait-customer@example.com' },
    update: {},
    create: {
      email: 'kuwait-customer@example.com',
      name: 'Kuwait Customer',
      role: 'USER',
      country: 'KW',
      isVerified: true,
    },
  });

  const uaeUser = await prisma.user.upsert({
    where: { email: 'uae-customer@example.com' },
    update: {},
    create: {
      email: 'uae-customer@example.com',
      name: 'UAE Customer',
      role: 'USER',
      country: 'UAE',
      isVerified: true,
    },
  });

  // Create Kuwait order
  const kuwaitOrder = await prisma.order.create({
    data: {
      storeId: kuwaitStore.id,
      userId: kuwaitUser.id,
      email: kuwaitUser.email,
      status: 'ORDER_CONFIRMED',
      currency: 'KWD',
      subtotalCents: 1500,
      totalCents: 1650,
      paymentMethod: 'KNET',
      paymentMethodTitle: 'KNET Payment',
      billingAddress: {
        first_name: 'Kuwait',
        last_name: 'Customer',
        email: kuwaitUser.email,
        phone: '+96512345678',
        country: 'Kuwait',
        city: 'Kuwait City',
        address1: '123 Example Street',
        postalCode: '12345',
      },
      shippingAddress: {
        first_name: 'Kuwait',
        last_name: 'Customer',
        email: kuwaitUser.email,
        phone: '+96512345678',
        country: 'Kuwait',
        city: 'Kuwait City',
        address1: '123 Example Street',
        postalCode: '12345',
      },
    },
  });
  console.log(`  ✅ Created Kuwait Order: ${kuwaitOrder.id}`);

  // Create UAE order
  const uaeOrder = await prisma.order.create({
    data: {
      storeId: uaeStore.id,
      userId: uaeUser.id,
      email: uaeUser.email,
      status: 'PROCESSING',
      currency: 'AED',
      subtotalCents: 3999,
      totalCents: 4199,
      paymentMethod: 'card',
      paymentMethodTitle: 'Credit Card',
      billingAddress: {
        first_name: 'UAE',
        last_name: 'Customer',
        email: uaeUser.email,
        phone: '+97112345678',
        country: 'United Arab Emirates',
        city: 'Dubai',
        address1: '456 Example Road',
        postalCode: '12345',
      },
      shippingAddress: {
        first_name: 'UAE',
        last_name: 'Customer',
        email: uaeUser.email,
        phone: '+97112345678',
        country: 'United Arab Emirates',
        city: 'Dubai',
        address1: '456 Example Road',
        postalCode: '12345',
      },
    },
  });
  console.log(`  ✅ Created UAE Order: ${uaeOrder.id}`);

  // ============================================
  // Summary
  // ============================================
  console.log('\n' + '='.repeat(60));
  console.log('✅ Multi-Admin Database Seeding Complete!\n');
  console.log('📋 Admin Credentials:');
  console.log('  UAE Admin:      uae-admin@shafanglobal.com / Admin123!');
  console.log('  Kuwait Admin:   kuwait-admin@shafanglobal.com / Admin123!');
  console.log('  SUPERADMIN:     superadmin@shafanglobal.com / Admin123!');
  console.log('\n' + '='.repeat(60) + '\n');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
