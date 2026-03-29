#!/usr/bin/env node

/**
 * Script to fix Vercel deployment authentication issues
 * 1. Checks current NEXTAUTH_URL configuration
 * 2. Suggests fixes for admin panel redirect issues
 * 3. Provides environment variable setup guidance
 */

const fs = require('fs');
const path = require('path');

console.log('=== VERCEL AUTHENTICATION FIX SCRIPT ===\n');

// Check current .env file
const envPath = path.join(__dirname, '.env');
let envContent = '';
try {
  envContent = fs.readFileSync(envPath, 'utf8');
  console.log('✓ Found .env file');
} catch (err) {
  console.log('✗ No .env file found');
}

// Extract NEXTAUTH_URL
const nextauthUrlMatch = envContent.match(/NEXTAUTH_URL=["']([^"']+)["']/);
const currentNextauthUrl = nextauthUrlMatch ? nextauthUrlMatch[1] : null;

console.log('\n1. CURRENT CONFIGURATION:');
console.log(`   NEXTAUTH_URL: ${currentNextauthUrl || 'Not set'}`);
console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'Not set'}`);

// Check Vercel environment variables
console.log('\n2. VERCEL ENVIRONMENT DETECTION:');
console.log(`   VERCEL_ENV: ${process.env.VERCEL_ENV || 'Not detected (running locally)'}`);
console.log(`   VERCEL_URL: ${process.env.VERCEL_URL || 'Not detected'}`);
console.log(`   VERCEL_GIT_COMMIT_REF: ${process.env.VERCEL_GIT_COMMIT_REF || 'Not detected'}`);

// Determine correct NEXTAUTH_URL
let recommendedUrl = currentNextauthUrl;
if (process.env.VERCEL_URL) {
  recommendedUrl = `https://${process.env.VERCEL_URL}`;
  console.log(`   ✓ Detected Vercel URL: ${recommendedUrl}`);
} else if (process.env.NODE_ENV === 'production') {
  recommendedUrl = 'https://shafan-ecom-beta.vercel.app';
  console.log(`   ✓ Using production URL: ${recommendedUrl}`);
} else {
  recommendedUrl = 'http://localhost:3000';
  console.log(`   ✓ Using local development URL: ${recommendedUrl}`);
}

console.log('\n3. ISSUES DETECTED:');
const issues = [];

if (!currentNextauthUrl) {
  issues.push('NEXTAUTH_URL is not set in .env file');
} else if (currentNextauthUrl.includes('localhost') && process.env.NODE_ENV === 'production') {
  issues.push('NEXTAUTH_URL points to localhost in production environment');
} else if (currentNextauthUrl !== recommendedUrl && process.env.VERCEL_URL) {
  issues.push(`NEXTAUTH_URL (${currentNextauthUrl}) doesn't match Vercel deployment URL (${recommendedUrl})`);
}

if (issues.length === 0) {
  console.log('   ✓ No obvious configuration issues detected');
} else {
  issues.forEach((issue, i) => {
    console.log(`   ${i+1}. ${issue}`);
  });
}

console.log('\n4. RECOMMENDED FIXES:');
console.log('   For Vercel deployment:');
console.log('   1. Set NEXTAUTH_URL in Vercel project settings (Environment Variables)');
console.log('   2. Use the exact deployment URL (e.g., https://shafan-ecom-beta.vercel.app)');
console.log('   3. For preview deployments, you can use:');
console.log('      NEXTAUTH_URL=https://${VERCEL_URL}');
console.log('   4. Ensure NEXTAUTH_SECRET is set and consistent across deployments');
console.log('\n   For local development:');
console.log('   1. Keep NEXTAUTH_URL=http://localhost:3000 in .env file');
console.log('   2. Run with NODE_ENV=development');

console.log('\n5. ADMIN PANEL SPECIFIC ISSUES:');
console.log('   - Check ACTIVE_ADMIN_PANELS environment variable is set to "true"');
console.log('   - Ensure admin users have mfaVerified: true in their token');
console.log('   - In production, SUPERADMIN cannot bypass MFA (unlike development)');

console.log('\n6. CORS ISSUE WITH IPAPI.CO:');
console.log('   - The GlobalInitializer component tries to fetch from ipapi.co');
console.log('   - This fails with CORS error on Vercel deployments');
console.log('   - Fixed in updated GlobalInitializer.tsx with better error handling');

// Generate updated .env.example if needed
console.log('\n7. ACTION REQUIRED:');
console.log('   For immediate fix, update your Vercel environment variables:');
console.log(`   NEXTAUTH_URL=${recommendedUrl}`);
console.log('   NEXTAUTH_SECRET=<your-secret-key>');
console.log('   ACTIVE_ADMIN_PANELS=true');
console.log('   NODE_ENV=production');

console.log('\n=== SCRIPT COMPLETE ===');
console.log('\nNext steps:');
console.log('1. Deploy with corrected environment variables');
console.log('2. Test admin login at /ueadmin/login');
console.log('3. Check Vercel logs for middleware debug output');