import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getAccessibleStoreIds } from '@/lib/admin-session';
import { ProductsTable } from './_components/ProductsTable';

export const dynamic = 'force-dynamic';

interface Product {
  id: string;
  name: string;
  mainImage: string | null;
  stockQuantity: number;
  active: boolean;
  brand: { name: string } | null;
  productCategories: { category: { id: string; name: string } }[];
  countryPrices: { country: string; priceCents: number; currency: string }[];
}

export default async function ProductsPage() {
  const accessibleStoreIds = await getAccessibleStoreIds();
  
  let products: Product[] = [];
  if (accessibleStoreIds.length > 0) {
    products = await (prisma as any).product.findMany({
      where: {
        OR: [
          { storeId: { in: accessibleStoreIds } },
          { storeInventories: { some: { storeId: { in: accessibleStoreIds } } } }
        ]
      },
      include: {
        brand: true,
        store: true,
        productCategories: {
          include: { category: { select: { id: true, name: true } } }
        },
        countryPrices: true,
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-black">Inventory</h1>
          <p className="text-sm font-medium text-black/60 mt-1 uppercase tracking-[0.2em]">Manage your products</p>
        </div>
        <Link 
          href="/ueadmin/products/add" 
          className="inline-flex items-center gap-2 bg-black text-white text-xs font-black uppercase tracking-widest px-8 py-4 rounded-full hover:scale-105 transition active:scale-95 shadow-2xl shadow-black/20"
        >
          + Add New Product
        </Link>
      </div>

      <ProductsTable initialProducts={products} />
    </div>
  );
}
