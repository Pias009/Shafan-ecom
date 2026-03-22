import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Assigning admin countries for data segregation...');
  
  // Ensure stores exist
  const stores = await prisma.store.findMany();
  console.log('Existing stores:', stores.map(s => ({ code: s.code, country: s.country })));
  
  // Update admin users with country assignments
  // In a real system, you'd have a proper AdminStoreAssignment model
  // For now, we'll use the country field on User
  
  const adminUsers = await prisma.user.findMany({
    where: { role: 'ADMIN' }
  });
  
  console.log('\nAdmin users found:');
  for (const admin of adminUsers) {
    console.log(`- ${admin.email} (ID: ${admin.id}) - Country: ${admin.country || 'Not assigned'}`);
    
    // Assign country based on email pattern (example logic)
    let country = admin.country;
    if (!country) {
      if (admin.email?.includes('kuwait') || admin.email?.includes('kw')) {
        country = 'KUWAIT';
      } else if (admin.email?.includes('uae') || admin.email?.includes('ae')) {
        country = 'UAE';
      } else {
        // Default to UAE for global admins
        country = 'UAE';
      }
      
      await prisma.user.update({
        where: { id: admin.id },
        data: { country }
      });
      
      console.log(`  Assigned country: ${country}`);
    }
  }
  
  // Create test stores if they don't exist
  const storeCodes = ['UAE', 'KUW', 'KSA'];
  for (const code of storeCodes) {
    const exists = await prisma.store.findUnique({ where: { code } });
    if (!exists) {
      const countryName = code === 'KUW' ? 'KUWAIT' : code === 'UAE' ? 'UAE' : 'SAUDI_ARABIA';
      await prisma.store.create({
        data: {
          code,
          name: `${countryName} Store`,
          country: countryName,
          region: 'Middle East',
          currency: code === 'KUW' ? 'kwd' : 'aed'
        }
      });
      console.log(`Created store: ${code} (${countryName})`);
    }
  }
  
  console.log('\nData segregation setup complete!');
  console.log('\nExpected behavior:');
  console.log('1. UAE admins (country: UAE) can access UAE store and global products');
  console.log('2. Kuwait admins (country: KUWAIT) can only access Kuwait store');
  console.log('3. SUPERADMIN can access all stores');
  console.log('4. Admins cannot see data from other countries');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());