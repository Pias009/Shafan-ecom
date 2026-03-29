#!/usr/bin/env node

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const BASE_URL = 'http://localhost:3000';

async function testProductCreation() {
  console.log('Testing product creation with minimal payload...\n');

  // First, we need to get a session cookie (simulate admin login)
  // For testing, we'll try without auth first to see if it's auth or validation error
  const payload = {
    name: "Test Product Debug",
    description: "Test description",
    priceCents: 1000,
    discountCents: 0,
    stockQuantity: 10,
    brandName: "All",
    categoryName: "All",
    hot: false,
    trending: false,
    storeId: "GLOBAL",
    countryPrices: [
      { country: "AE", priceCents: 7350, currency: "AED", active: true },
      { country: "KW", priceCents: 615, currency: "KWD", active: true }
    ]
  };

  console.log('Payload:', JSON.stringify(payload, null, 2));

  try {
    const response = await fetch(`${BASE_URL}/api/admin/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    
    const text = await response.text();
    console.log('Response:', text);
    
    if (response.status === 500) {
      console.log('\n=== 500 Error Details ===');
      try {
        const json = JSON.parse(text);
        console.log('Error JSON:', JSON.stringify(json, null, 2));
      } catch (e) {
        console.log('Response is not JSON:', text);
      }
    }
    
  } catch (error) {
    console.error('Fetch error:', error);
  }
}

// Also test with the exact payload from the error
async function testExactErrorPayload() {
  console.log('\n\n=== Testing exact error payload ===\n');
  
  const exactPayload = {
    brandName: "AquaGlass",
    categoryName: "Fragrance",
    countryPrices: [
      { active: true, country: "AE", currency: "AED", priceCents: 60 },
      { active: true, country: "KW", currency: "KWD", priceCents: 0 },
      { active: true, country: "BH", currency: "BHD", priceCents: 0 },
      { active: true, country: "SA", currency: "SAR", priceCents: 0 },
      { active: true, country: "OM", currency: "OMR", priceCents: 0 },
      { active: true, country: "QA", currency: "QAR", priceCents: 0 }
    ],
    description: "rrrrrrrrrrrrr",
    discountCents: 0,
    features: [],
    hot: false,
    images: [],
    mainImage: "",
    name: "rrrrrrrrrrrr",
    priceCents: 0,
    stockQuantity: 0,
    storeId: "GLOBAL",
    trending: false
  };

  console.log('Exact payload:', JSON.stringify(exactPayload, null, 2));

  try {
    const response = await fetch(`${BASE_URL}/api/admin/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(exactPayload),
    });

    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    
    const text = await response.text();
    console.log('Response:', text);
    
  } catch (error) {
    console.error('Fetch error:', error);
  }
}

// Run tests
testProductCreation()
  .then(() => testExactErrorPayload())
  .catch(console.error);