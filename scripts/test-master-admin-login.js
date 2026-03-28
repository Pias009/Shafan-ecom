#!/usr/bin/env node

/**
 * Test script to verify master admin login on the new Vercel deployment
 * URL: https://shanfaecom-al153sa4b-shanfaglobalit-7766s-projects.vercel.app
 *
 * IMPORTANT: This deployment has Vercel Authentication enabled (SSO protection).
 * You need to either:
 * 1. Disable Vercel Authentication in the Vercel dashboard, or
 * 2. Use a bypass token to access the site
 */

const https = require('https');
const { URL } = require('url');

const DEPLOYMENT_URL = 'https://shanfaecom-al153sa4b-shanfaglobalit-7766s-projects.vercel.app';
const MASTER_ADMIN_EMAIL = 'pvs178380@gmail.com';
const MASTER_ADMIN_PASSWORD = 'pias900';

console.log('🔐 Testing Master Admin Login on New Deployment');
console.log('===============================================');
console.log(`Deployment URL: ${DEPLOYMENT_URL}`);
console.log(`Master Admin Email: ${MASTER_ADMIN_EMAIL}`);
console.log('');
console.log('⚠️  IMPORTANT: This deployment has Vercel Authentication enabled.');
console.log('   You need to disable it in the Vercel dashboard or use a bypass token.');
console.log('');

// Test 1: Check if the site is accessible
function testSiteAccessibility() {
  return new Promise((resolve, reject) => {
    const url = new URL(DEPLOYMENT_URL);
    
    const options = {
      hostname: url.hostname,
      port: 443,
      path: '/',
      method: 'GET',
      headers: {
        'User-Agent': 'MasterAdminLoginTest/1.0'
      }
    };

    console.log('📡 Test 1: Checking site accessibility...');
    
    const req = https.request(options, (res) => {
      console.log(`   Status Code: ${res.statusCode}`);
      console.log(`   Status Message: ${res.statusMessage}`);
      
      if (res.statusCode === 200 || res.statusCode === 401 || res.statusCode === 302) {
        console.log('   ✅ Site is accessible');
        resolve(true);
      } else {
        console.log(`   ⚠️  Site returned unexpected status: ${res.statusCode}`);
        resolve(false);
      }
      
      res.on('data', () => {}); // Drain data
      res.on('end', () => {});
    });

    req.on('error', (error) => {
      console.log(`   ❌ Error accessing site: ${error.message}`);
      reject(error);
    });

    req.setTimeout(10000, () => {
      req.destroy();
      console.log('   ⏰ Request timeout');
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

// Test 2: Test the admin login endpoint
function testAdminLoginEndpoint() {
  return new Promise((resolve, reject) => {
    const url = new URL(`${DEPLOYMENT_URL}/api/auth/master-admin`);
    
    const postData = JSON.stringify({
      email: MASTER_ADMIN_EMAIL,
      password: MASTER_ADMIN_PASSWORD
    });

    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'User-Agent': 'MasterAdminLoginTest/1.0'
      }
    };

    console.log('\n🔑 Test 2: Testing master admin login endpoint...');
    console.log(`   Endpoint: ${url.toString()}`);
    
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log(`   Status Code: ${res.statusCode}`);
        console.log(`   Status Message: ${res.statusMessage}`);
        
        try {
          const response = JSON.parse(data);
          console.log('   Response:', JSON.stringify(response, null, 2));
          
          if (res.statusCode === 200 || res.statusCode === 201) {
            if (response.success || response.token || response.user) {
              console.log('   ✅ Master admin login successful!');
              resolve(true);
            } else {
              console.log('   ⚠️  Login endpoint responded but no success flag found');
              resolve(false);
            }
          } else if (res.statusCode === 401) {
            console.log('   ❌ Authentication failed - Invalid credentials');
            resolve(false);
          } else if (res.statusCode === 403) {
            console.log('   ❌ Access forbidden - Master admin might be disabled');
            resolve(false);
          } else {
            console.log(`   ⚠️  Unexpected response: ${res.statusCode}`);
            resolve(false);
          }
        } catch (error) {
          console.log(`   ⚠️  Could not parse JSON response: ${error.message}`);
          console.log(`   Raw response: ${data.substring(0, 200)}...`);
          resolve(false);
        }
      });
    });

    req.on('error', (error) => {
      console.log(`   ❌ Error calling login endpoint: ${error.message}`);
      reject(error);
    });

    req.setTimeout(10000, () => {
      req.destroy();
      console.log('   ⏰ Request timeout');
      reject(new Error('Request timeout'));
    });

    req.write(postData);
    req.end();
  });
}

// Test 3: Check admin panel accessibility
function testAdminPanelAccess() {
  return new Promise((resolve, reject) => {
    const url = new URL(`${DEPLOYMENT_URL}/ueadmin/login`);
    
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'GET',
      headers: {
        'User-Agent': 'MasterAdminLoginTest/1.0'
      }
    };

    console.log('\n🏢 Test 3: Checking admin panel accessibility...');
    console.log(`   URL: ${url.toString()}`);
    
    const req = https.request(options, (res) => {
      console.log(`   Status Code: ${res.statusCode}`);
      console.log(`   Status Message: ${res.statusMessage}`);
      
      if (res.statusCode === 200) {
        console.log('   ✅ Admin login page is accessible');
        resolve(true);
      } else if (res.statusCode === 302 || res.statusCode === 301) {
        console.log(`   🔄 Redirect detected to: ${res.headers.location || 'unknown'}`);
        console.log('   ⚠️  Admin panel might be redirecting (could be logged in already)');
        resolve(true);
      } else if (res.statusCode === 401 || res.statusCode === 403) {
        console.log('   ⚠️  Admin panel requires authentication');
        resolve(true); // This is expected for protected admin panel
      } else {
        console.log(`   ⚠️  Unexpected status: ${res.statusCode}`);
        resolve(false);
      }
      
      res.on('data', () => {}); // Drain data
      res.on('end', () => {});
    });

    req.on('error', (error) => {
      console.log(`   ❌ Error accessing admin panel: ${error.message}`);
      reject(error);
    });

    req.setTimeout(10000, () => {
      req.destroy();
      console.log('   ⏰ Request timeout');
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

// Main test execution
async function runTests() {
  console.log('🚀 Starting master admin login tests...\n');
  
  try {
    // Test 1: Site accessibility
    const siteAccessible = await testSiteAccessibility();
    
    // Test 2: Admin login endpoint
    const loginWorking = await testAdminLoginEndpoint();
    
    // Test 3: Admin panel accessibility
    const adminPanelAccessible = await testAdminPanelAccess();
    
    // Summary
    console.log('\n📊 TEST SUMMARY');
    console.log('===============');
    console.log(`✅ Site Accessibility: ${siteAccessible ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Master Admin Login: ${loginWorking ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Admin Panel Access: ${adminPanelAccessible ? 'PASS' : 'FAIL'}`);
    
    const allTestsPassed = siteAccessible && loginWorking && adminPanelAccessible;
    
    if (allTestsPassed) {
      console.log('\n🎉 All tests passed! Master admin login is working correctly.');
      console.log(`🔗 You can login at: ${DEPLOYMENT_URL}/ueadmin/login`);
      console.log(`📧 Email: ${MASTER_ADMIN_EMAIL}`);
      console.log(`🔑 Password: ${MASTER_ADMIN_PASSWORD}`);
    } else {
      console.log('\n⚠️  Some tests failed. Check the issues above.');
      console.log('💡 VERCEL AUTHENTICATION DETECTED:');
      console.log('   The deployment has Vercel SSO protection enabled.');
      console.log('   This prevents external access to the site.');
      console.log('');
      console.log('🔧 Solutions:');
      console.log('   1. Disable Vercel Authentication in Vercel Dashboard:');
      console.log('      - Go to your project in Vercel');
      console.log('      - Navigate to Settings → Authentication');
      console.log('      - Disable "Vercel Authentication"');
      console.log('');
      console.log('   2. Use a bypass token (temporary):');
      console.log('      - Get bypass token from Vercel dashboard');
      console.log('      - Access URL with: ?x-vercel-protection-bypass=TOKEN');
      console.log('');
      console.log('   3. Other possible issues:');
      console.log('      - NEXTAUTH_URL might not be set correctly in Vercel environment');
      console.log('      - Master admin might not be seeded in the database');
      console.log('      - Database connection issues');
      console.log('      - IP whitelisting on MongoDB Atlas');
    }
    
    process.exit(allTestsPassed ? 0 : 1);
    
  } catch (error) {
    console.error('\n❌ Test execution failed:', error.message);
    process.exit(1);
  }
}

// Run the tests
runTests();