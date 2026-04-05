import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- STARTING REPRODUCTION OF USER FLOW ---');

  // 1. ADDING PRODUCT
  const testProductName = `Test Flow ${Date.now()}`;
  console.log(`1. Adding product: ${testProductName}`);
  
  const product = await prisma.product.create({
    data: {
      name: testProductName,
      slug: `test-flow-${Date.now()}`,
      priceCents: 0, // Base price is 0 as per site pattern
      stockQuantity: 100,
      active: true,
      countryPrices: {
        create: [
          { country: 'AE', priceCents: 5500, currency: 'AED' }, // 55.00 AED
          { country: 'SA', priceCents: 6000, currency: 'SAR' }, // 60.00 SAR
        ]
      }
    },
    include: {
      countryPrices: true
    }
  });
  console.log(`Product created with ID: ${product.id}`);

  // 2. CHECKN PRICE GETTING ROW
  console.log('2. Checking price getting row (fetching from DB)...');
  const aePriceRow = await prisma.countryPrice.findFirst({
    where: {
      productId: product.id,
      country: 'AE'
    }
  });
  console.log('AE Price Row:', JSON.stringify(aePriceRow, null, 2));

  // 3. CRATE ORDER (Simulation)
  console.log('3. Simulating Create Order for AE...');
  const countryCode = 'AE';
  
  // Logic from create-order/route.ts
  const dbPrice = aePriceRow ? Number(aePriceRow.priceCents) : 0;
  console.log(`Price fetched for order: ${dbPrice} cents`);

  const orderItemsData = [{
    productId: product.id,
    quantity: 2,
    unitPriceCents: dbPrice,
    nameSnapshot: product.name,
  }];

  const subtotalCents = orderItemsData[0].unitPriceCents * orderItemsData[0].quantity;
  const shippingCents = 1500; // Mock shipping
  const totalCents = subtotalCents + shippingCents;

  const order = await prisma.order.create({
    data: {
      status: 'ORDER_RECEIVED',
      currency: 'aed',
      subtotalCents,
      shippingCents,
      totalCents,
      billingAddress: {},
      shippingAddress: {},
      paymentMethod: 'cod',
      items: {
        create: orderItemsData
      }
    },
    include: {
      items: true
    }
  });
  console.log(`Order created with ID: ${order.id}`);

  // 4. PRICE CHAKING
  console.log('4. Price checking...');
  console.log(`Order Subtotal: ${order.subtotalCents}`);
  console.log(`Item Unit Price in Order: ${order.items[0].unitPriceCents}`);
  
  const expectedSubtotal = 5500 * 2;
  if (order.subtotalCents === expectedSubtotal) {
    console.log('✅ PRICE CHECK PASSED: Subtotal matches expected value.');
  } else {
    console.error(`❌ PRICE CHECK FAILED: Expected ${expectedSubtotal}, got ${order.subtotalCents}`);
  }

  console.log('--- FLOW COMPLETED ---');
}

main().catch(console.error).finally(() => prisma.$disconnect());
