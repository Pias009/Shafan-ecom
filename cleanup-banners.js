const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Cleaning up banners with broken image URLs...');
  
  // Delete banners with unsplash URLs that return 404
  const deleted = await prisma.enhancedOfferBanner.deleteMany({
    where: {
      OR: [
        { imageUrl: { contains: 'unsplash.com/photo-1551288049' } },
        { imageUrl: { contains: 'unsplash.com/photo-1487412720507' } }
      ]
    }
  });
  
  console.log(`Deleted ${deleted.count} banners with broken URLs`);
  
  // List remaining banners
  const remaining = await prisma.enhancedOfferBanner.findMany({
    select: { id: true, title: true, imageUrl: true }
  });
  
  console.log(`Remaining ${remaining.length} banners:`);
  remaining.forEach(b => console.log(`- ${b.id}: ${b.title} (${b.imageUrl.substring(0, 50)}...)`));
  
  await prisma.$disconnect();
}

main().catch(console.error);