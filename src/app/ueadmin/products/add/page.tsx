import { prisma } from '@/lib/prisma';
import { AddProductForm } from './AddProductForm';
import { Suspense } from 'react';
import { getAdminStoreAccess } from '@/lib/admin-store-guard';

export const dynamic = 'force-dynamic';

export default async function AddProductPage() {
  const [brands, categories, storeAccess] = await Promise.all([
    (prisma as any).brand.findMany({ select: { name: true }, orderBy: { name: 'asc' } }),
    (prisma as any).category.findMany({ select: { name: true }, orderBy: { name: 'asc' } }),
    getAdminStoreAccess()
  ]);

  // Determine admin's primary store
  let adminStoreCode = null;
  let isSuperAdmin = false;
  
  if (storeAccess) {
    isSuperAdmin = storeAccess.isSuperAdmin;
    if (storeAccess.allowedStores.length > 0) {
      adminStoreCode = storeAccess.allowedStores[0]; // First store is primary
    }
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AddProductForm
        brands={brands}
        categories={categories}
        adminStoreCode={adminStoreCode}
        isSuperAdmin={isSuperAdmin}
      />
    </Suspense>
  );
}
