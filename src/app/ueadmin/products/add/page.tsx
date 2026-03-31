import { AddProductForm } from './AddProductForm';
import { Suspense } from 'react';

export const dynamic = 'force-dynamic';

// Simple data fetching with fallbacks
async function getBrands() {
  try {
    const { prisma } = await import('@/lib/prisma');
    return await prisma.brand.findMany({ select: { name: true }, orderBy: { name: 'asc' } });
  } catch {
    return [];
  }
}

async function getCategories() {
  try {
    const { prisma } = await import('@/lib/prisma');
    return await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        subCategories: {
          select: {
            id: true,
            name: true,
          }
        }
      },
      orderBy: { name: 'asc' }
    });
  } catch {
    return [];
  }
}

async function getSubCategories() {
  try {
    const { prisma } = await import('@/lib/prisma');
    return await prisma.subCategory.findMany({
      select: {
        id: true,
        name: true,
        categoryId: true,
        category: {
          select: {
            name: true,
          }
        }
      },
      orderBy: { name: 'asc' }
    });
  } catch {
    return [];
  }
}

async function getSkinTones() {
  try {
    const { prisma } = await import('@/lib/prisma');
    return await prisma.skinTone.findMany({
      select: {
        id: true,
        name: true,
        hexColor: true,
      },
      orderBy: { name: 'asc' }
    });
  } catch {
    return [];
  }
}

async function getSkinConcerns() {
  try {
    const { prisma } = await import('@/lib/prisma');
    return await prisma.skinConcern.findMany({
      select: {
        id: true,
        name: true,
        description: true,
      },
      orderBy: { name: 'asc' }
    });
  } catch {
    return [];
  }
}

async function getStoreAccess() {
  try {
    const { getAdminStoreAccess } = await import('@/lib/admin-store-guard');
    return await getAdminStoreAccess();
  } catch {
    return null;
  }
}

export default async function AddProductPage() {
  // Fetch all data in parallel with individual error handling
  const [brands, categories, subCategories, skinTones, skinConcerns, storeAccess] = await Promise.allSettled([
    getBrands(),
    getCategories(),
    getSubCategories(),
    getSkinTones(),
    getSkinConcerns(),
    getStoreAccess()
  ]);

  // Extract values from Promise results
  const brandsData = brands.status === 'fulfilled' ? brands.value : [];
  const categoriesData = categories.status === 'fulfilled' ? categories.value : [];
  const subCategoriesData = subCategories.status === 'fulfilled' ? subCategories.value : [];
  const skinTonesData = skinTones.status === 'fulfilled' ? skinTones.value : [];
  const skinConcernsData = skinConcerns.status === 'fulfilled' ? skinConcerns.value : [];
  const storeAccessData = storeAccess.status === 'fulfilled' ? storeAccess.value : null;

  // Determine admin's primary store
  let adminStoreCode = null;
  let isSuperAdmin = false;
  
  if (storeAccessData) {
    isSuperAdmin = storeAccessData.isSuperAdmin;
    if (storeAccessData.allowedStores.length > 0) {
      adminStoreCode = storeAccessData.allowedStores[0]; // First store is primary
    }
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AddProductForm
        brands={brandsData}
        categories={categoriesData}
        subCategories={subCategoriesData}
        skinTones={skinTonesData}
        skinConcerns={skinConcernsData}
        adminStoreCode={adminStoreCode}
        isSuperAdmin={isSuperAdmin}
      />
    </Suspense>
  );
}
