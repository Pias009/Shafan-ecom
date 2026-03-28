const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function resetMasterAdmin() {
  try {
    console.log('🔧 Resetting master admin account...');
    
    const MASTER_ADMIN_EMAIL = 'pvs178380@gmail.com';
    const MASTER_ADMIN_PASSWORD = 'pias900';
    
    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { email: MASTER_ADMIN_EMAIL }
    });
    
    if (!user) {
      console.log('⚠️ Master admin not found, creating...');
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
      
      // Reset lockout
      await prisma.user.update({
        where: { email: MASTER_ADMIN_EMAIL },
        data: {
          loginAttempts: 0,
          lockUntil: null,
          role: 'SUPERADMIN',
          mfaEnabled: true
        }
      });
      console.log('✅ Lockout reset');
      
      // Update password if needed
      const passwordHash = await bcrypt.hash(MASTER_ADMIN_PASSWORD, 10);
      await prisma.user.update({
        where: { email: MASTER_ADMIN_EMAIL },
        data: { passwordHash }
      });
      console.log('✅ Password updated');
    }
    
    // Verify the account
    const updatedUser = await prisma.user.findUnique({
      where: { email: MASTER_ADMIN_EMAIL }
    });
    
    console.log('\n📊 Account Status:');
    console.log('Email:', updatedUser.email);
    console.log('Role:', updatedUser.role);
    console.log('Login Attempts:', updatedUser.loginAttempts);
    console.log('Lock Until:', updatedUser.lockUntil);
    console.log('MFA Enabled:', updatedUser.mfaEnabled);
    
    console.log('\n✅ Master admin reset complete!');
    console.log('Credentials:');
    console.log('Email:', MASTER_ADMIN_EMAIL);
    console.log('Password:', MASTER_ADMIN_PASSWORD);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetMasterAdmin();