#!/usr/bin/env node

/**
 * Admin Login Flow Test
 * Simulates the actual admin login flow and verifies redirection
 */

const https = require('https');
const { URL } = require('url');

const DEPLOYED_URL = process.env.DEPLOYED_URL || 'https://shafan-ecom-beta.vercel.app';
const MASTER_EMAIL = process.env.MASTER_EMAIL || 'pvs178380@gmail.com';
const MASTER_PASSWORD = process.env.MASTER_PASSWORD || 'pias900';

class AdminLoginFlowTester {
  constructor() {
    this.cookies = [];
    this.sessionToken = null;
    this.results = [];
  }

  async runFullTest() {
    console.log('🔐 Testing Admin Login Flow');
    console.log(`🌐 Target: ${DEPLOYED_URL}`);
    console.log('='.repeat(60));

    try {
      // Step 1: Check if admin login page is accessible
      await this.testStep('Access Login Page', `${DEPLOYED_URL}/ueadmin/login`, 'GET', 200);
      
      // Step 2: Try to access dashboard without login (should redirect)
      await this.testStep('Unauthorized Dashboard Access', `${DEPLOYED_URL}/ueadmin/dashboard`, 'GET', 302, true);
      
      // Step 3: Test MFA initiation API
      const mfaResponse = await this.makeRequest({
        url: `${DEPLOYED_URL}/api/auth/mfa/initiate`,
        method: 'POST',
        body: { email: MASTER_EMAIL, password: MASTER_PASSWORD },
      });
      
      this.recordResult('MFA Initiation', mfaResponse.statusCode === 200, 
        `Status: ${mfaResponse.statusCode}, Response: ${JSON.stringify(mfaResponse.data)}`);
      
      // Step 4: Test master admin login API
      const masterAdminResponse = await this.makeRequest({
        url: `${DEPLOYED_URL}/api/auth/master-admin`,
        method: 'POST',
        body: { email: MASTER_EMAIL, password: MASTER_PASSWORD },
      });
      
      this.recordResult('Master Admin API', masterAdminResponse.statusCode === 200,
        `Status: ${masterAdminResponse.statusCode}, Response: ${JSON.stringify(masterAdminResponse.data)}`);
      
      // Step 5: If master admin login succeeded, try to access dashboard again
      if (masterAdminResponse.statusCode === 200) {
        // Store any cookies from the response
        if (masterAdminResponse.headers['set-cookie']) {
          this.cookies = masterAdminResponse.headers['set-cookie'].map(c => c.split(';')[0]);
          console.log('🍪 Cookies received:', this.cookies.length);
        }
        
        // Try dashboard access with cookies
        await this.testStep('Dashboard After Login', `${DEPLOYED_URL}/ueadmin/dashboard`, 'GET', 200);
      }
      
      // Step 6: Check session endpoint
      const sessionResponse = await this.makeRequest({
        url: `${DEPLOYED_URL}/api/auth/session`,
        method: 'GET',
      });
      
      this.recordResult('Session Check', sessionResponse.statusCode === 200,
        `Status: ${sessionResponse.statusCode}, Has Session: ${sessionResponse.data && sessionResponse.data.user ? 'Yes' : 'No'}`);
      
      // Step 7: Test logout flow
      await this.testStep('Logout Page', `${DEPLOYED_URL}/api/auth/signout`, 'GET', 302, true);
      
    } catch (error) {
      console.error('Test error:', error);
    }
    
    this.printSummary();
  }

  async testStep(name, url, method, expectedStatus, checkRedirect = false) {
    const response = await this.makeRequest({ url, method });
    const success = checkRedirect 
      ? (response.statusCode === expectedStatus || response.statusCode === 200)
      : response.statusCode === expectedStatus;
    
    this.recordResult(name, success, 
      `Status: ${response.statusCode} (expected: ${expectedStatus}), Redirect: ${response.headers.location || 'None'}`);
    
    return response;
  }

  makeRequest(options) {
    return new Promise((resolve, reject) => {
      const url = new URL(options.url);
      const reqOptions = {
        hostname: url.hostname,
        port: url.port || 443,
        path: url.pathname + url.search,
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'AdminLoginFlowTester/1.0',
          ...(this.cookies.length > 0 ? { 'Cookie': this.cookies.join('; ') } : {}),
        },
      };

      const req = https.request(reqOptions, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const jsonData = data ? JSON.parse(data) : null;
            resolve({
              statusCode: res.statusCode,
              headers: res.headers,
              data: jsonData,
              rawData: data,
            });
          } catch (e) {
            resolve({
              statusCode: res.statusCode,
              headers: res.headers,
              data: null,
              rawData: data,
            });
          }
        });
      });

      req.on('error', reject);
      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error('Timeout'));
      });

      if (options.body) {
        req.write(JSON.stringify(options.body));
      }
      req.end();
    });
  }

  recordResult(name, success, details) {
    const result = { name, success, details };
    this.results.push(result);
    console.log(`${success ? '✅' : '❌'} ${name}`);
    console.log(`   ${details}`);
  }

  printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 LOGIN FLOW TEST SUMMARY');
    console.log('='.repeat(60));
    
    const passed = this.results.filter(r => r.success).length;
    const total = this.results.length;
    
    console.log(`Tests: ${passed}/${total} passed (${Math.round((passed/total)*100)}%)`);
    
    console.log('\n🔍 Detailed Results:');
    this.results.forEach((r, i) => {
      console.log(`${i+1}. ${r.name}: ${r.success ? 'PASS' : 'FAIL'}`);
      console.log(`   ${r.details}`);
    });
    
    console.log('\n💡 Analysis:');
    
    // Check specific issues
    const mfaTest = this.results.find(r => r.name === 'MFA Initiation');
    const masterAdminTest = this.results.find(r => r.name === 'Master Admin API');
    const dashboardTest = this.results.find(r => r.name === 'Dashboard After Login');
    
    if (masterAdminTest && masterAdminTest.success) {
      console.log('   ✅ Master admin login API is working');
      if (dashboardTest && dashboardTest.success) {
        console.log('   ✅ Dashboard access after login is working');
        console.log('   🎉 Admin login flow appears to be functional!');
      } else {
        console.log('   ⚠️  Dashboard access may have issues despite successful login');
        console.log('   💡 Check middleware configuration and session cookies');
      }
    } else {
      console.log('   ❌ Master admin login API is not working');
      console.log('   💡 Check:');
      console.log('      - MASTER_ADMIN_EMAIL and MASTER_ADMIN_PASSWORD environment variables');
      console.log('      - Database connection and user records');
      console.log('      - API endpoint implementation');
    }
    
    console.log('\n🚀 Next Steps:');
    console.log('   1. Manually test login at: ' + DEPLOYED_URL + '/ueadmin/login');
    console.log('   2. Use credentials: ' + MASTER_EMAIL + ' / ' + MASTER_PASSWORD);
    console.log('   3. Check browser console for errors');
    console.log('   4. Verify redirect to /ueadmin/dashboard after login');
  }
}

// Run the test
const tester = new AdminLoginFlowTester();
tester.runFullTest().catch(console.error);