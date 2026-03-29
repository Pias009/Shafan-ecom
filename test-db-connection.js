const { PrismaClient } = require('@prisma/client');

async function testConnection() {
  console.log('Testing database connection...');
  
  const prisma = new PrismaClient({
    log: ['error', 'warn'],
  });
  
  try {
    // For MongoDB, we can use a simple query
    const result = await prisma.$runCommandRaw({ ping: 1 });
    console.log('Database connection successful:', result);
    
    // Check connection pool info
    console.log('Connection pool stats:');
    console.log('- Active connections:', await prisma.$metrics());
    
    // Test a simple query
    const userCount = await prisma.user.count();
    console.log(`Total users in database: ${userCount}`);
    
    // Check store data
    const storeCount = await prisma.store.count();
    console.log(`Total stores: ${storeCount}`);
    
    return true;
  } catch (error) {
    console.error('Database connection failed:', error.message);
    console.error('Full error:', error);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

testConnection().then(success => {
  process.exit(success ? 0 : 1);
}).catch(err => {
  console.error('Unexpected error:', err);
  process.exit(1);
});