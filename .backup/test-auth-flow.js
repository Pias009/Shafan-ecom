const bcrypt = require('bcryptjs');

// Test the credentials from seed.ts
const testCredentials = [
  {
    email: 'pvs178380@gmail.com',
    password: 'pias900',
    description: 'Master Admin (from seed.ts)'
  },
  {
    email: 'admin@shafan.com',
    password: 'Admin@Shafan2024',
    description: 'Regular Admin (from seed.ts)'
  },
  {
    email: 'superadmin@example.com',
    password: 'superadmin123',
    description: 'Demo Super Admin (from .env.example)'
  },
  {
    email: 'kuwait-admin@example.com',
    password: 'demoadmin',
    description: 'Kuwait Admin (from Kuwait login page)'
  }
];

console.log('🔐 Testing Authentication Credentials\n');
console.log('='.repeat(60));

// Test bcrypt hash generation to understand the format
async function testHash() {
  const password = 'pias900';
  const hash = await bcrypt.hash(password, 10);
  console.log(`Password: ${password}`);
  console.log(`BCrypt Hash (salt 10): ${hash.substring(0, 30)}...`);
  console.log(`Hash length: ${hash.length} characters\n`);
}

// Check which credentials might be in use
console.log('Possible credentials in the system:');
testCredentials.forEach((cred, i) => {
  console.log(`${i + 1}. ${cred.description}`);
  console.log(`   Email: ${cred.email}`);
  console.log(`   Password: ${cred.password}`);
  console.log('');
});

console.log('='.repeat(60));
console.log('\n🎯 DIAGNOSIS:');
console.log('The 401 error in production suggests:');
console.log('1. Database not seeded with admin users');
console.log('2. Wrong credentials being used');
console.log('3. Database connection issues');
console.log('\n💡 RECOMMENDATION:');
console.log('Run database seed in production:');
console.log('1. Set DATABASE_URL environment variable in Vercel');
console.log('2. Run: npx prisma db push');
console.log('3. Run: npx prisma db seed');
console.log('4. Or use: npm run db:seed');