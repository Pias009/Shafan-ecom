#!/usr/bin/env node

/**
 * Admin Login Test Script
 * Tests the admin login functionality with the deployed Vercel application
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');

const DEPLOYED_URL = process.env.DEPLOYED_URL || 'https://shafan-ecom-beta.vercel.app';
const TEST_EMAIL = process.env.TEST_EMAIL || 'pvs178380@gmail.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'pias900';

const testCases = [
  {
    name: 'Admin Login Page Accessibility',
    url: `${DEPLOYED_URL}/ueadmin/login`,
    method: 'GET',
    expectedStatus: 200,
  },
  {
    name: 'Master Admin Login API',
    url: `${DEPLOYED_URL}/api/auth/master-admin`,
    method: 'POST',
    body: JSON.stringify({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    }),
    expectedStatus: 200,
  },
  {
    name: 'Developer Login API',
    url: `${DEPLOYED_URL}/api/auth/developer-login`,
    method: 'POST',
    expectedStatus: 200,
  },
  {
    name: 'Admin Dashboard Access (Unauthorized)',
    url: `${DEPLOYED_URL}/ueadmin/dashboard`,
    method: 'GET',
    expectedStatus: 302, // Should redirect to login
  },
  {
    name: 'NextAuth Health Check',
    url: `${DEPLOYED_URL}/api/auth/session`,
    method: 'GET',
    expectedStatus: 200,
  },
];

class AdminLoginTester {
  constructor() {
    this.results = [];
    this.cookies = [];
  }

  async runTests() {
    console.log('🚀 Starting Admin Login Tests');
    console.log(`📡 Testing deployed URL: ${DEPLOYED_URL}`);
    console.log('='.repeat(60));

    for (const testCase of testCases) {
      await this.runTest(testCase);
    }

    this.printSummary();
  }

  async runTest(testCase) {
    const startTime = Date.now();
    const url = new URL(testCase.url);
    
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method: testCase.method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'AdminLoginTester/1.0',
      },
    };

    // Add cookies if we have any
    if (this.cookies.length > 0) {
      options.headers.Cookie = this.cookies.join('; ');
    }

    return new Promise((resolve) => {
      const protocol = url.protocol === 'https:' ? https : http;
      const req = protocol.request(options, (res) => {
        let data = '';
        
        // Collect response cookies
        if (res.headers['set-cookie']) {
          this.cookies = res.headers['set-cookie'].map(cookie => cookie.split(';')[0]);
        }

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          const duration = Date.now() - startTime;
          const success = res.statusCode === testCase.expectedStatus;
          
          const result = {
            name: testCase.name,
            url: testCase.url,
            statusCode: res.statusCode,
            expectedStatus: testCase.expectedStatus,
            success,
            duration: `${duration}ms`,
            response: data.length > 500 ? data.substring(0, 500) + '...' : data,
          };

          this.results.push(result);
          
          console.log(`${success ? '✅' : '❌'} ${testCase.name}`);
          console.log(`   Status: ${res.statusCode} (expected: ${testCase.expectedStatus})`);
          console.log(`   Time: ${duration}ms`);
          
          if (!success && data) {
            try {
              const jsonData = JSON.parse(data);
              console.log(`   Error: ${jsonData.error || jsonData.message || 'Unknown error'}`);
            } catch (e) {
              // Not JSON
            }
          }
          
          resolve();
        });
      });

      req.on('error', (error) => {
        const duration = Date.now() - startTime;
        const result = {
          name: testCase.name,
          url: testCase.url,
          statusCode: 0,
          expectedStatus: testCase.expectedStatus,
          success: false,
          duration: `${duration}ms`,
          error: error.message,
        };

        this.results.push(result);
        
        console.log(`❌ ${testCase.name}`);
        console.log(`   Error: ${error.message}`);
        console.log(`   Time: ${duration}ms`);
        
        resolve();
      });

      req.setTimeout(10000, () => {
        req.destroy();
        console.log(`❌ ${testCase.name} - Timeout`);
      });

      if (testCase.body) {
        req.write(testCase.body);
      }
      
      req.end();
    });
  }

  printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));
    
    const passed = this.results.filter(r => r.success).length;
    const failed = this.results.filter(r => !r.success).length;
    const total = this.results.length;
    
    console.log(`Total Tests: ${total}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Success Rate: ${Math.round((passed / total) * 100)}%`);
    
    if (failed > 0) {
      console.log('\n🔍 Failed Tests:');
      this.results
        .filter(r => !r.success)
        .forEach(r => {
          console.log(`   - ${r.name}`);
          console.log(`     URL: ${r.url}`);
          console.log(`     Status: ${r.statusCode} (expected: ${r.expectedStatus})`);
          if (r.error) console.log(`     Error: ${r.error}`);
        });
    }
    
    console.log('\n💡 Recommendations:');
    if (failed === 0) {
      console.log('   All tests passed! Admin login should be working correctly.');
    } else {
      console.log('   1. Check if the deployed URL is accessible');
      console.log('   2. Verify environment variables in Vercel dashboard');
      console.log('   3. Check database connection');
      console.log('   4. Review server logs for errors');
    }
  }
}

// Run tests
const tester = new AdminLoginTester();
tester.runTests().catch(error => {
  console.error('Test runner error:', error);
  process.exit(1);
});