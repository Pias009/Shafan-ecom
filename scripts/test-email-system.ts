/**
 * Test script for the email system
 * Run with: npx tsx scripts/test-email-system.ts
 */

import { emailService } from '@/lib/email/service';
import { getEmailServiceStatus, getEmailLogs } from '@/lib/email';

async function testEmailSystem() {
  console.log('🧪 Testing Email System...\n');

  // Test 1: Check service status
  console.log('📊 Test 1: Checking email service status');
  const status = emailService.getStatus();
  console.log('Service Status:', JSON.stringify(status, null, 2));

  // Test 2: Send test email (mock mode since no API key)
  console.log('\n📧 Test 2: Sending test email (mock mode)');
  
  const testResult = await emailService.sendEmail({
    to: { email: 'test@example.com', name: 'Test User' },
    subject: 'Test Email from Shafan Store',
    template: 'welcome',
    data: {
      email: 'test@example.com',
      name: 'Test User',
      loginUrl: 'https://shafan-store.com/dashboard',
    },
  });

  console.log('Email send result:', JSON.stringify(testResult, null, 2));

  // Test 3: Check logs
  console.log('\n📋 Test 3: Checking email logs');
  const logs = emailService.getLogs(10);
  console.log('Recent logs:', JSON.stringify(logs, null, 2));

  // Test 4: Test convenience functions
  console.log('\n⚡ Test 4: Testing convenience functions');
  
  // Import convenience functions
  const { 
    sendMagicLinkEmail,
    sendWelcomeEmail,
    sendPasswordResetEmail 
  } = await import('@/lib/email/service');

  const magicLinkResult = await sendMagicLinkEmail(
    'test@example.com',
    'Test User',
    'https://shafan-store.com/auth/magic-link?token=test123',
    '15 minutes'
  );

  console.log('Magic link email result:', magicLinkResult.success ? '✅ Success' : '❌ Failed');

  // Test 5: Check legacy interface
  console.log('\n🔄 Test 5: Testing legacy email interface');
  
  const { sendEmail: legacySendEmail } = await import('@/lib/email');
  
  const legacyResult = await legacySendEmail({
    to: 'test@example.com',
    subject: 'Legacy Test Email',
    html: '<h1>Test Email</h1><p>This is a test from the legacy interface.</p>',
    text: 'Test Email\nThis is a test from the legacy interface.',
  });

  console.log('Legacy email result:', legacyResult ? '✅ Success' : '❌ Failed');

  // Summary
  console.log('\n📈 Test Summary:');
  console.log('================');
  console.log(`Service Enabled: ${status.enabled ? '✅' : '❌'}`);
  console.log(`Provider: ${status.provider}`);
  console.log(`Test Mode: ${status.testMode ? '✅' : '❌'}`);
  console.log(`Total Sent: ${status.totalSent}`);
  console.log(`Total Failed: ${status.totalFailed}`);
  
  if (status.enabled && status.totalSent > 0) {
    console.log('\n🎉 Email system is working correctly!');
  } else if (status.testMode) {
    console.log('\n⚠️  Email system is in test/mock mode (no API key configured)');
    console.log('   To send real emails, add a RESEND_API_KEY to your .env file');
  } else {
    console.log('\n❌ Email system may not be configured correctly');
  }
}

// Run tests
testEmailSystem().catch(error => {
  console.error('❌ Test failed with error:', error);
  process.exit(1);
});