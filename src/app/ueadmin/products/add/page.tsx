import { prisma } from '@/lib/prisma';
import React from 'react';
import { AddProductForm } from './AddProductForm';

export const dynamic = 'force-dynamic';

export default async function AddProductPage() {
  const [brands, categories] = await Promise.all([
    (prisma as any).brand.findMany({ select: { name: true }, orderBy: { name: 'asc' } }),
    (prisma as any).category.findMany({ select: { name: true }, orderBy: { name: 'asc' } })
  ]);

  return <AddProductForm brands={brands} categories={categories} />;
}
