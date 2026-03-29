#!/usr/bin/env node

/**
 * Test script to verify master admin bypass functionality
 * Tests that pvs178380@gmail.com with password pias900 can bypass MFA
 */

const fetch = require('node-fetch');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const MASTER_EMAIL = 'pvs178380@gmail.com';
const MASTER_PASSWORD = 'pias900';
const REGULAR_ADMIN_EMAIL = 'admin@shafan.com';
const REGULAR_ADMIN_PASSWORD = 'Admin@Shafan2024';

async function testMasterAdminBypass() {
  console.log('🧪 Testing Master Admin Bypass Functionality\n');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Master Admin: ${MASTER_EMAIL}`);
  console.log(`Regular Admin: ${REGULAR_ADMIN_EMAIL}\n`);

  // Test 1: Master admin should get mfaRequired: false
  console.log('1. Testing master admin login (should bypass MFA)...');
  try {
    const response = await fetch(`${BASE_URL}/api/auth/mfa/initiate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: MASTER_EMAIL,
        password: MASTER_PASSWORD
      })
    });

    const data = await response.json();
    console.log(`   Status: ${response.status}`);
    console.log(`   Response:`, data);

    if (response.ok && data.mfaRequired === false && data.masterAdminBypass === true) {
      console.log('   ✅ PASS: Master admin correctly bypasses MFA\n');
    } else {
      console.log('   ❌ FAIL: Master admin should bypass MFA\n');
      return false;
    }
  } catch (error) {
    console.log('   ❌ ERROR:', error.message, '\n');
    return false;
  }

  // Test 2: Regular admin should get mfaRequired: true
  console.log('2. Testing regular admin login (should require MFA)...');
  try {
    const response = await fetch(`${BASE_URL}/api/auth/mfa/initiate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: REGULAR_ADMIN_EMAIL,
        password: REGULAR_ADMIN_PASSWORD
      })
    });

    const data = await response.json();
    console.log(`   Status: ${response.status}`);
    console.log(`   Response:`, data);

    if (response.ok && data.mfaRequired === true) {
      console.log('   ✅ PASS: Regular admin correctly requires MFA\n');
    } else {
      console.log('   ❌ FAIL: Regular admin should require MFA\n');
      return false;
    }
  } catch (error) {
    console.log('   ❌ ERROR:', error.message, '\n');
    return false;
  }

  // Test 3: Invalid credentials should fail
  console.log('3. Testing invalid credentials...');
  try {
    const response = await fetch(`${BASE_URL}/api/auth/mfa/initiate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: MASTER_EMAIL,
        password: 'wrongpassword'
      })
    });

    const data = await response.json();
    console.log(`   Status: ${response.status}`);
    console.log(`   Response:`, data);

    if (!response.ok && response.status === 401) {
      console.log('   ✅ PASS: Invalid credentials correctly rejected\n');
    } else {
      console.log('   ❌ FAIL: Invalid credentials should be rejected\n');
      return false;
    }
  } catch (error) {
    console.log('   ❌ ERROR:', error.message, '\n');
    return false;
  }

  console.log('🎉 All tests passed! Master admin bypass is working correctly.');
  console.log('\nNext steps:');
  console.log('1. Visit /ueadmin/login in your browser');
  console.log('2. Login with pvs178380@gmail.com / pias900');
  console.log('3. You should be redirected directly to /ueadmin without MFA verification');
  console.log('4. Regular admins will still need to complete MFA via email');

  return true;
}

// Run the test
testMasterAdminBypass().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});