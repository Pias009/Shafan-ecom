require('dotenv').config({ path: '.env' });
const { PrismaClient } = require('@prisma/client');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const prisma = new PrismaClient();

async function uploadToCloudinary(url: string): Promise<string | null> {
  try {
    const result = await cloudinary.uploader.upload(url, {
      folder: 'ecommerce/products',
      transformation: { width: 1200, height: 1200, crop: 'limit', quality: 'auto' },
      use_filename: true,
      unique_filename: true,
    });
    return result.secure_url;
  } catch (error: any) {
    console.error('Upload failed:', error.message);
    return null;
  }
}

async function migrateImages() {
  console.log('Starting image migration to Cloudinary...\n');

  const products = await prisma.product.findMany({
    where: {
      OR: [
        { mainImage: { not: null } },
        { images: { isEmpty: false } }
      ]
    },
    select: {
      id: true,
      name: true,
      mainImage: true,
      images: true
    }
  });

  let migrated = 0;
  let failed = 0;

  for (const product of products) {
    console.log(`\nProcessing: ${product.name}`);
    console.log(`  ID: ${product.id}`);

    let newMainImage: string | null = null;
    const newImages: string[] = [];

    // Upload main image
    if (product.mainImage && product.mainImage.includes('unsplash')) {
      console.log('  Uploading main image...');
      newMainImage = await uploadToCloudinary(product.mainImage);
      if (newMainImage) {
        console.log(`  ✓ Main image uploaded`);
      } else {
        console.log(`  ✗ Main image failed, keeping original`);
        failed++;
      }
    }

    // Upload gallery images
    const galleryImages = product.images.filter((img: string) => img.includes('unsplash'));
    for (const img of galleryImages) {
      console.log(`  Uploading gallery image...`);
      const newUrl = await uploadToCloudinary(img);
      if (newUrl) {
        newImages.push(newUrl);
        console.log(`  ✓ Gallery image uploaded`);
      } else {
        console.log(`  ✗ Gallery image failed`);
        failed++;
      }
    }

    // Update database if we have new images
    if (newMainImage || newImages.length > 0) {
      try {
        await prisma.product.update({
          where: { id: product.id },
          data: {
            mainImage: newMainImage || product.mainImage,
            images: newImages.length > 0 ? newImages : product.images
          }
        });
        migrated++;
        console.log(`  ✓ Database updated`);
      } catch (error: any) {
        console.error(`  ✗ Database update failed:`, error.message);
      }
    } else {
      console.log(`  - No images to migrate`);
    }
  }

  console.log('\n=== Migration Complete ===');
  console.log(`Products migrated: ${migrated}`);
  console.log(`Failed images: ${failed}`);
}

prisma.$connect()
  .then(migrateImages)
  .catch(console.error)
  .finally(() => prisma.$disconnect());
