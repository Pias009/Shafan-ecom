const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Checking EnhancedOfferBanner records...');
    const banners = await prisma.enhancedOfferBanner.findMany({
      select: {
        id: true,
        title: true,
        active: true,
        imageUrl: true,
        link: true,
        createdAt: true
      }
    });
    
    console.log(`Found ${banners.length} banners:`);
    banners.forEach(b => {
      console.log(`- ${b.id}: ${b.title} (active: ${b.active})`);
    });
    
    // Also check the API endpoint
    console.log('\nTesting API endpoint...');
    const response = await fetch('http://localhost:3000/api/promotional/banners?limit=5');
    const data = await response.json();
    console.log(`API returned ${Array.isArray(data) ? data.length : 'non-array'}:`, data);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();