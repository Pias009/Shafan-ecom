import { prisma } from '@/lib/prisma';
import { AddProductForm } from './AddProductForm';
import { Suspense } from 'react';

export const dynamic = 'force-dynamic';

export default async function AddProductPage() {
  const [brands, categories] = await Promise.all([
    (prisma as any).brand.findMany({ select: { name: true }, orderBy: { name: 'asc' } }),
    (prisma as any).category.findMany({ select: { name: true }, orderBy: { name: 'asc' } })
  ]);

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AddProductForm brands={brands} categories={categories} />
    </Suspense>
  );
}
