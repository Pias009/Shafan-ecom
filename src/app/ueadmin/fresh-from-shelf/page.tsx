import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getAccessibleStoreIds } from '@/lib/admin-session';
import { FreshFromShelfTable } from './_components/FreshFromShelfTable';

export const dynamic = 'force-dynamic';

const DUMMY_PRODUCT_NAMES = [
  "test", "dummy", "sample", "placeholder", "temp", "demo", "mock", "fake", "xxx", "yyy"
];

const DUMMY_BRANDS = [
  "test brand", "dummy", "sample", "placeholder", "temp", "demo", "mock", "fake", "xxx", "yyy", "skypearl"
];

interface Product {
  id: string;
  name: string;
  mainImage: string | null;
  stockQuantity: number;
  active: boolean;
  freshFromShelf: boolean;
  createdAt: Date;
  brand: { name: string } | null;
  productCategories: { category: { id: string; name: string } }[];
  countryPrices: { country: string; price: number; currency: string }[];
}

function isDummyProduct(p: Product): boolean {
  const name = (p.name || "").trim().toLowerCase();
  const brand = (p.brand?.name || "").trim().toLowerCase();
  
  return DUMMY_PRODUCT_NAMES.some(dn => name.includes(dn.toLowerCase())) || 
         DUMMY_BRANDS.some(db => brand.includes(db.toLowerCase()));
}

function hasValidPrice(p: Product, country: string = 'AE'): boolean {
  const countryPrice = p.countryPrices?.find((cp: any) => cp.country === country);
  if (!countryPrice) return false;
  return countryPrice.price != null && countryPrice.price > 0;
}

export default async function FreshFromShelfPage() {
  const accessibleStoreIds = await getAccessibleStoreIds();
  
  let products: Product[] = [];
  
  const whereClause = accessibleStoreIds.length > 0 ? {
    OR: [
      { storeId: { in: accessibleStoreIds } },
      { storeInventories: { some: { storeId: { in: accessibleStoreIds } } } }
    ]
  } : {};

  const dbProducts = await (prisma as any).product.findMany({
    where: whereClause,
    select: {
      id: true,
      name: true,
      mainImage: true,
      stockQuantity: true,
      active: true,
      freshFromShelf: true,
      createdAt: true,
      brand: { select: { name: true } },
      productCategories: {
        include: { category: { select: { id: true, name: true } } }
      },
      countryPrices: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  const filteredProducts = dbProducts
    .filter((p: Product) => !isDummyProduct(p))
    .filter((p: Product) => hasValidPrice(p, 'AE'));

  products = filteredProducts.slice(0, 20);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-black">Fresh From Shelf</h1>
          <p className="text-sm font-medium text-black/60 mt-1 uppercase tracking-[0.2em]">Manage fresh products (sorted by newest)</p>
        </div>
        <Link 
          href="/ueadmin/products/add" 
          className="inline-flex items-center gap-2 bg-black text-white text-xs font-black uppercase tracking-widest px-8 py-4 rounded-full hover:scale-105 transition active:scale-95 shadow-2xl shadow-black/20"
        >
          + Add New Product
        </Link>
      </div>

      <FreshFromShelfTable initialProducts={products} />
    </div>
  );
}