import { PrismaClient } from '@prisma/client';
import { uploadFromUrl } from '@/lib/cloudinary';

const prisma = new PrismaClient();

async function migrateImages() {
  console.log('Starting image migration to Cloudinary...\n');
  
  const products = await prisma.product.findMany({ 
    where: { mainImage: { not: null } },
    select: { id: true, name: true, mainImage: true, images: true }
  });
  
  console.log(`Found ${products.length} products with images\n`);
  
  let uploaded = 0;
  let failed = 0;
  
  for (const p of products) {
    console.log(`Processing: ${p.name}`);
    
    // Upload main image
    if (p.mainImage && !p.mainImage.includes('cloudinary')) {
      try {
        const cloudUrl = await uploadFromUrl(p.mainImage);
        await prisma.product.update({
          where: { id: p.id },
          data: { mainImage: cloudUrl }
        });
        console.log(`  ✓ Main image uploaded to Cloudinary`);
        uploaded++;
      } catch (e: any) {
        console.log(`  ✗ Failed: ${e.message}`);
        failed++;
      }
    }
    
    // Upload additional images
    if (p.images && p.images.length > 0) {
      const cloudImages: string[] = [];
      for (const img of p.images) {
        if (img && !img.includes('cloudinary')) {
          try {
            const cloudUrl = await uploadFromUrl(img);
            cloudImages.push(cloudUrl);
          } catch {
            cloudImages.push(img);
          }
        } else {
          cloudImages.push(img);
        }
      }
      if (cloudImages.length > 0) {
        await prisma.product.update({
          where: { id: p.id },
          data: { images: cloudImages }
        });
        console.log(`  ✓ Additional images processed`);
      }
    }
    console.log('');
  }
  
  console.log('=================================');
  console.log(`Migration complete!`);
  console.log(`Uploaded: ${uploaded}`);
  console.log(`Failed: ${failed}`);
  
  await prisma.$disconnect();
}

migrateImages().catch(console.error);