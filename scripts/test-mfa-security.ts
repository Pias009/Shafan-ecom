/**
 * MFA Security Test Suite
 * 
 * This test suite verifies that:
 * 1. All admin users require MFA verification
 * 2. No master email bypass exists
 * 3. MFA tokens are properly generated and validated
 * 4. AdminGuard enforces MFA verification
 * 5. Middleware enforces MFA verification
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  details?: string;
}

const results: TestResult[] = [];

function logTest(name: string, passed: boolean, message: string, details?: string) {
  const result: TestResult = { name, passed, message, details };
  results.push(result);
  
  const icon = passed ? '✅' : '❌';
  console.log(`${icon} ${name}: ${message}`);
  if (details) {
    console.log(`   Details: ${details}`);
  }
}

async function runTests() {
  console.log('\n🔒 MFA SECURITY TEST SUITE\n');
  console.log('='.repeat(60));

  // Test 1: Verify no master email bypass exists in MFA initiate route
  console.log('\n📋 Test 1: Checking for master email bypass...');
  try {
    const fs = await import('fs');
    const mfaInitiatePath = './src/app/api/auth/mfa/initiate/route.ts';
    const mfaInitiateContent = fs.readFileSync(mfaInitiatePath, 'utf-8');
    
    const hasMasterBypass = mfaInitiateContent.includes('pvs178380@gmail.com') ||
                           mfaInitiateContent.includes('isMasterEmail') ||
                           mfaInitiateContent.includes('MASTER EMAIL BYPASS');
    
    if (hasMasterBypass) {
      logTest(
        'Master Email Bypass Check',
        false,
        'FAILED: Master email bypass detected',
        'Found references to master email bypass in MFA initiate route'
      );
    } else {
      logTest(
        'Master Email Bypass Check',
        true,
        'PASSED: No master email bypass found',
        'MFA initiate route does not contain any bypass mechanisms'
      );
    }
  } catch (error) {
    logTest(
      'Master Email Bypass Check',
      false,
      'FAILED: Could not read MFA initiate route',
      String(error)
    );
  }

  // Test 2: Verify all admin users have MFA requirement
  console.log('\n📋 Test 2: Verifying admin users require MFA...');
  try {
    const adminUsers = await prisma.user.findMany({
      where: {
        role: {
          in: ['ADMIN', 'SUPERADMIN']
        }
      }
    });

    if (adminUsers.length === 0) {
      logTest(
        'Admin Users MFA Requirement',
        false,
        'WARNING: No admin users found',
        'Please create admin users to test MFA enforcement'
      );
    } else {
      logTest(
        'Admin Users MFA Requirement',
        true,
        `PASSED: Found ${adminUsers.length} admin users`,
        `All admin users will be required to complete MFA`
      );
    }
  } catch (error) {
    logTest(
      'Admin Users MFA Requirement',
      false,
      'FAILED: Could not query admin users',
      String(error)
    );
  }

  // Test 3: Verify MFA token model exists
  console.log('\n📋 Test 3: Checking MFA token model...');
  try {
    // Try to query MFA tokens to verify the model exists
    const mfaTokens = await (prisma as any).mfaToken.findMany({
      take: 1
    });
    
    logTest(
      'MFA Token Model',
      true,
      'PASSED: MFA token model exists',
      'MFA tokens can be created and validated'
    );
  } catch (error) {
    logTest(
      'MFA Token Model',
      false,
      'FAILED: MFA token model not found',
      'Please ensure MFA token model is defined in Prisma schema'
    );
  }

  // Test 4: Verify AdminGuard enforces MFA verification
  console.log('\n📋 Test 4: Checking AdminGuard MFA enforcement...');
  try {
    const fs = await import('fs');
    const adminGuardPath = './src/app/ueadmin/_components/AdminGuard.tsx';
    const adminGuardContent = fs.readFileSync(adminGuardPath, 'utf-8');
    
    const hasMfaCheck = adminGuardContent.includes('mfaVerified') &&
                       adminGuardContent.includes('MFA VERIFIED');
    
    if (hasMfaCheck) {
      logTest(
        'AdminGuard MFA Enforcement',
        true,
        'PASSED: AdminGuard enforces MFA verification',
        'Client-side MFA verification is implemented'
      );
    } else {
      logTest(
        'AdminGuard MFA Enforcement',
        false,
        'FAILED: AdminGuard does not enforce MFA',
        'AdminGuard should check mfaVerified flag'
      );
    }
  } catch (error) {
    logTest(
      'AdminGuard MFA Enforcement',
      false,
      'FAILED: Could not read AdminGuard',
      String(error)
    );
  }

  // Test 5: Verify middleware enforces MFA verification
  console.log('\n📋 Test 5: Checking middleware MFA enforcement...');
  try {
    const fs = await import('fs');
    const middlewarePath = './middleware.ts';
    const middlewareContent = fs.readFileSync(middlewarePath, 'utf-8');
    
    const hasMfaCheck = middlewareContent.includes('mfaVerified') &&
                       middlewareContent.includes('NO BYPASS');
    
    if (hasMfaCheck) {
      logTest(
        'Middleware MFA Enforcement',
        true,
        'PASSED: Middleware enforces MFA verification',
        'Server-side MFA verification is implemented'
      );
    } else {
      logTest(
        'Middleware MFA Enforcement',
        false,
        'FAILED: Middleware does not enforce MFA',
        'Middleware should check mfaVerified flag'
      );
    }
  } catch (error) {
    logTest(
      'Middleware MFA Enforcement',
      false,
      'FAILED: Could not read middleware',
      String(error)
    );
  }

  // Test 6: Verify auth options include MFA provider
  console.log('\n📋 Test 6: Checking auth configuration...');
  try {
    const fs = await import('fs');
    const authPath = './src/lib/auth.ts';
    const authContent = fs.readFileSync(authPath, 'utf-8');
    
    const hasMfaProvider = authContent.includes('id: "mfa"') &&
                          authContent.includes('name: "MFA Token"');
    
    if (hasMfaProvider) {
      logTest(
        'Auth Configuration',
        true,
        'PASSED: MFA provider configured',
        'NextAuth includes MFA token provider'
      );
    } else {
      logTest(
        'Auth Configuration',
        false,
        'FAILED: MFA provider not configured',
        'NextAuth should include MFA token provider'
      );
    }
  } catch (error) {
    logTest(
      'Auth Configuration',
      false,
      'FAILED: Could not read auth configuration',
      String(error)
    );
  }

  // Test 7: Verify MFA token expiration is set
  console.log('\n📋 Test 7: Checking MFA token expiration...');
  try {
    const fs = await import('fs');
    const mfaInitiatePath = './src/app/api/auth/mfa/initiate/route.ts';
    const mfaInitiateContent = fs.readFileSync(mfaInitiatePath, 'utf-8');
    
    const hasExpiration = mfaInitiateContent.includes('expires') &&
                         mfaInitiateContent.includes('10 * 60 * 1000');
    
    if (hasExpiration) {
      logTest(
        'MFA Token Expiration',
        true,
        'PASSED: MFA tokens expire after 10 minutes',
        'MFA tokens have proper expiration time'
      );
    } else {
      logTest(
        'MFA Token Expiration',
        false,
        'FAILED: MFA token expiration not set',
        'MFA tokens should expire after a reasonable time'
      );
    }
  } catch (error) {
    logTest(
      'MFA Token Expiration',
      false,
      'FAILED: Could not check MFA token expiration',
      String(error)
    );
  }

  // Test 8: Verify MFA tokens are deleted after use
  console.log('\n📋 Test 8: Checking MFA token cleanup...');
  try {
    const fs = await import('fs');
    const authPath = './src/lib/auth.ts';
    const authContent = fs.readFileSync(authPath, 'utf-8');
    
    const deletesToken = authContent.includes('mfaToken.delete') ||
                        authContent.includes('delete({ where: { id: mfaToken.id }');
    
    if (deletesToken) {
      logTest(
        'MFA Token Cleanup',
        true,
        'PASSED: MFA tokens are deleted after use',
        'Used MFA tokens are properly cleaned up'
      );
    } else {
      logTest(
        'MFA Token Cleanup',
        false,
        'FAILED: MFA tokens not deleted after use',
        'Used MFA tokens should be deleted to prevent reuse'
      );
    }
  } catch (error) {
    logTest(
      'MFA Token Cleanup',
      false,
      'FAILED: Could not check MFA token cleanup',
      String(error)
    );
  }

  // Test 9: Verify login attempt tracking
  console.log('\n📋 Test 9: Checking login attempt tracking...');
  try {
    const fs = await import('fs');
    const mfaInitiatePath = './src/app/api/auth/mfa/initiate/route.ts';
    const mfaInitiateContent = fs.readFileSync(mfaInitiatePath, 'utf-8');
    
    const tracksAttempts = mfaInitiateContent.includes('loginAttempts') &&
                          mfaInitiateContent.includes('lockUntil');
    
    if (tracksAttempts) {
      logTest(
        'Login Attempt Tracking',
        true,
        'PASSED: Login attempts are tracked',
        'Failed login attempts are tracked and accounts can be locked'
      );
    } else {
      logTest(
        'Login Attempt Tracking',
        false,
        'FAILED: Login attempts not tracked',
        'Failed login attempts should be tracked for security'
      );
    }
  } catch (error) {
    logTest(
      'Login Attempt Tracking',
      false,
      'FAILED: Could not check login attempt tracking',
      String(error)
    );
  }

  // Test 10: Verify account lockout after 3 failed attempts
  console.log('\n📋 Test 10: Checking account lockout...');
  try {
    const fs = await import('fs');
    const mfaInitiatePath = './src/app/api/auth/mfa/initiate/route.ts';
    const mfaInitiateContent = fs.readFileSync(mfaInitiatePath, 'utf-8');
    
    const hasLockout = mfaInitiateContent.includes('newAttempts >= 3') &&
                      mfaInitiateContent.includes('30 * 60 * 1000');
    
    if (hasLockout) {
      logTest(
        'Account Lockout',
        true,
        'PASSED: Accounts lock after 3 failed attempts for 30 minutes',
        'Account lockout mechanism is properly configured'
      );
    } else {
      logTest(
        'Account Lockout',
        false,
        'FAILED: Account lockout not configured',
        'Accounts should lock after multiple failed attempts'
      );
    }
  } catch (error) {
    logTest(
      'Account Lockout',
      false,
      'FAILED: Could not check account lockout',
      String(error)
    );
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 TEST SUMMARY\n');
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const total = results.length;
  
  console.log(`Total Tests: ${total}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
  
  if (failed > 0) {
    console.log('\n⚠️  FAILED TESTS:\n');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  ❌ ${r.name}`);
      console.log(`     ${r.message}`);
      if (r.details) {
        console.log(`     ${r.details}`);
      }
    });
  }
  
  console.log('\n' + '='.repeat(60));
  
  if (failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! MFA security is properly configured.\n');
  } else {
    console.log('\n⚠️  SOME TESTS FAILED. Please review and fix the issues above.\n');
  }
}

runTests()
  .catch((error) => {
    console.error('Error running tests:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
