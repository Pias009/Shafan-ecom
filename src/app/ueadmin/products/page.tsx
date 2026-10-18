import Link from 'next/link';
import { Plus, Upload } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { getAccessibleStoreIds } from '@/lib/admin-session';
import { ProductsTable, type ProductRow } from './_components/ProductsTable';
import { PageHeader, btn } from '../_components/ui';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Products' };

export default async function ProductsPage() {
  const accessibleStoreIds = await getAccessibleStoreIds();

  // Only the columns ProductsTable renders — full product documents (descriptions,
  // galleries, SEO fields) made this page's payload several MB.
  const products: ProductRow[] = await prisma.product.findMany({
    where: accessibleStoreIds.length > 0
      ? {
          OR: [
            { storeId: { in: accessibleStoreIds } },
            { storeInventories: { some: { storeId: { in: accessibleStoreIds } } } },
          ],
        }
      : undefined,
    select: {
      id: true,
      name: true,
      sku: true,
      mainImage: true,
      stockQuantity: true,
      active: true,
      freshFromShelf: true,
      brand: { select: { name: true } },
      productCategories: { select: { category: { select: { id: true, name: true } } } },
      countryPrices: { select: { country: true, price: true, currency: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div>
      <PageHeader
        title="Products"
        description={`${products.length.toLocaleString()} products in your catalog`}
        actions={
          <>
            <Link href="/ueadmin/products/bulk" className={btn.secondary}>
              <Upload size={15} /> Bulk edit
            </Link>
            <Link href="/ueadmin/products/add" className={btn.primary}>
              <Plus size={15} /> Add product
            </Link>
          </>
        }
      />
      <ProductsTable initialProducts={products} />
    </div>
  );
}
