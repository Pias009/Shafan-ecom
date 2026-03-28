// Script to fix Vercel admin login issues
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function diagnoseAndFix() {
  console.log('🔍 Diagnosing Vercel admin login issues...\n');
  
  // Check environment variables
  console.log('📋 Environment Check:');
  console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL || 'Not set');
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set (hidden)' : 'Not set');
  
  const MASTER_ADMIN_EMAIL = 'pvs178380@gmail.com';
  const MASTER_ADMIN_PASSWORD = 'pias900';
  
  try {
    // Test database connection
    console.log('\n🔌 Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Check if master admin exists
    console.log('\n👤 Checking master admin account...');
    let user = await prisma.user.findUnique({
      where: { email: MASTER_ADMIN_EMAIL }
    });
    
    if (!user) {
      console.log('❌ Master admin not found in database');
      console.log('Creating master admin account...');
      
      const passwordHash = await bcrypt.hash(MASTER_ADMIN_PASSWORD, 10);
      user = await prisma.user.create({
        data: {
          email: MASTER_ADMIN_EMAIL,
          name: 'Master Admin',
          role: 'SUPERADMIN',
          passwordHash,
          loginAttempts: 0,
          lockUntil: null,
          mfaEnabled: true,
          isVerified: true
        }
      });
      console.log('✅ Master admin created');
    } else {
      console.log('✅ Master admin found:', user.email);
      console.log('Role:', user.role);
      console.log('Login Attempts:', user.loginAttempts);
      console.log('Lock Until:', user.lockUntil);
      
      // Reset any lockout
      if (user.lockUntil && new Date(user.lockUntil) > new Date()) {
        console.log('⚠️ Account is locked, resetting...');
        await prisma.user.update({
          where: { email: MASTER_ADMIN_EMAIL },
          data: {
            loginAttempts: 0,
            lockUntil: null
          }
        });
        console.log('✅ Lock reset');
      }
      
      // Ensure correct role and password
      const passwordHash = await bcrypt.hash(MASTER_ADMIN_PASSWORD, 10);
      await prisma.user.update({
        where: { email: MASTER_ADMIN_EMAIL },
        data: {
          role: 'SUPERADMIN',
          passwordHash,
          mfaEnabled: true
        }
      });
      console.log('✅ Account updated with correct credentials');
    }
    
    // Test password verification
    console.log('\n🔐 Testing password verification...');
    const testUser = await prisma.user.findUnique({
      where: { email: MASTER_ADMIN_EMAIL }
    });
    
    if (testUser && testUser.passwordHash) {
      const passwordMatch = await bcrypt.compare(MASTER_ADMIN_PASSWORD, testUser.passwordHash);
      if (passwordMatch) {
        console.log('✅ Password verification successful');
      } else {
        console.log('❌ Password verification failed - passwords do not match');
      }
    }
    
    console.log('\n✅ Diagnosis complete!');
    console.log('\n📋 Summary:');
    console.log('Master Admin Email:', MASTER_ADMIN_EMAIL);
    console.log('Password:', MASTER_ADMIN_PASSWORD);
    console.log('Role: SUPERADMIN');
    console.log('MFA Bypass: Enabled');
    
  } catch (error) {
    console.error('\n❌ Error during diagnosis:', error.message);
    
    if (error.code === 'P1001') {
      console.log('\n💡 Database Connection Issue Detected:');
      console.log('1. Check DATABASE_URL environment variable on Vercel');
      console.log('2. Ensure MongoDB Atlas IP whitelist includes Vercel IPs');
      console.log('3. Check network connectivity');
    }
    
  } finally {
    await prisma.$disconnect();
  }
}

// Also check NEXTAUTH_URL configuration
function checkNextAuthConfig() {
  console.log('\n🔧 NEXTAUTH Configuration Check:');
  const currentUrl = process.env.NEXTAUTH_URL;
  const vercelUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null;
  const vercelBranchUrl = process.env.VERCEL_BRANCH_URL ? `https://${process.env.VERCEL_BRANCH_URL}` : null;
  
  console.log('NEXTAUTH_URL:', currentUrl);
  console.log('VERCEL_URL:', vercelUrl);
  console.log('VERCEL_BRANCH_URL:', vercelBranchUrl);
  
  if (vercelUrl && currentUrl !== vercelUrl) {
    console.log('⚠️ Warning: NEXTAUTH_URL may not match actual Vercel URL');
    console.log('💡 Fix: Set NEXTAUTH_URL dynamically in production:');
    console.log('   NEXTAUTH_URL=https://${process.env.VERCEL_URL}');
  }
}

diagnoseAndFix();
checkNextAuthConfig();