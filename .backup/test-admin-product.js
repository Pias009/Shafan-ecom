#!/usr/bin/env node

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const BASE_URL = 'http://localhost:3000';
const MASTER_EMAIL = 'pvs178380@gmail.com';
const MASTER_PASSWORD = 'pias900';

async function testAdminProductCreation() {
  console.log('Testing admin product creation with country pricing...\n');

  // Step 1: Login as master admin
  console.log('1. Logging in as master admin...');
  const loginRes = await fetch(`${BASE_URL}/api/auth/master-admin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: MASTER_EMAIL,
      password: MASTER_PASSWORD,
    }),
  });

  if (!loginRes.ok) {
    const error = await loginRes.text();
    console.error('Login failed:', error);
    return;
  }

  const cookies = loginRes.headers.get('set-cookie');
  console.log('Login successful, got cookies:', cookies);

  // Step 2: Create a product with country pricing
  const productPayload = {
    name: 'Demo Product with Country Pricing',
    description: 'Test product with separate prices for different countries',
    priceCents: 2000, // base price in cents (USD)
    discountCents: 500,
    stockQuantity: 100,
    brandName: 'All',
    categoryName: 'All',
    hot: false,
    trending: false,
    storeId: 'GLOBAL', // global product
    countryPrices: [
      { country: 'AE', priceCents: 7350, currency: 'AED', active: true }, // ~2000 USD to AED
      { country: 'KW', priceCents: 615, currency: 'KWD', active: true },  // ~2000 USD to KWD
      { country: 'BD', priceCents: 220000, currency: 'BDT', active: true }, // ~2000 USD to BDT
      { country: 'SA', priceCents: 7500, currency: 'SAR', active: true },
      { country: 'OM', priceCents: 770, currency: 'OMR', active: true },
      { country: 'QA', priceCents: 7280, currency: 'QAR', active: true }
    ]
  };

  console.log('\n2. Creating product with country pricing...');
  console.log('Payload:', JSON.stringify(productPayload, null, 2));

  const productRes = await fetch(`${BASE_URL}/api/admin/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookies || '',
    },
    body: JSON.stringify(productPayload),
  });

  const responseText = await productRes.text();
  console.log('Response status:', productRes.status);
  console.log('Response headers:', productRes.headers.get('set-cookie'));
  console.log('Response body:', responseText);

  try {
    const productResult = JSON.parse(responseText);
    console.log('Parsed JSON:', JSON.stringify(productResult, null, 2));
    if (productRes.ok) {
      console.log('\n✅ Product created successfully!');
      console.log('Product ID:', productResult.id);
    } else {
      console.log('\n❌ Product creation failed');
    }
  } catch (e) {
    // Not JSON
  }

  // Step 3: Verify product appears in admin listing
  console.log('\n3. Fetching admin product list...');
  const listRes = await fetch(`${BASE_URL}/api/admin/products`, {
    headers: {
      'Cookie': cookies || '',
    },
  });

  if (listRes.ok) {
    const products = await listRes.json();
    console.log(`Found ${products.length} products`);
    const demoProduct = products.find(p => p.name.includes('Demo Product with Country Pricing'));
    if (demoProduct) {
      console.log('✅ Demo product found in listing');
      console.log('Product details:', JSON.stringify(demoProduct, null, 2));
    } else {
      console.log('❌ Demo product not found in listing');
    }
  } else {
    console.log('Failed to fetch product list');
  }
}

testAdminProductCreation().catch(console.error);