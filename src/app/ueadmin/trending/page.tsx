import { prisma } from '@/lib/prisma';
import { getAccessibleStoreIds } from '@/lib/admin-session';
import TrendingClient from './TrendingClient';

export const dynamic = 'force-dynamic';

interface Product {
  id: string;
  name: string;
  mainImage: string | null;
  stockQuantity: number;
  active: boolean;
  trending: boolean;
  brand: { name: string } | null;
  productCategories: { category: { id: string; name: string } }[];
  countryPrices: { country: string; price: number; currency: string }[];
}

export default async function TrendingPage() {
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
      select: {
        id: true,
        name: true,
        mainImage: true,
        stockQuantity: true,
        active: true,
        trending: true,
        brand: { select: { name: true } },
        productCategories: {
          include: { category: { select: { id: true, name: true } } }
        },
        countryPrices: true,
      },
      orderBy: { createdAt: 'desc' }
    }) as Product[];
  } else {
    products = await (prisma as any).product.findMany({
      select: {
        id: true,
        name: true,
        mainImage: true,
        stockQuantity: true,
        active: true,
        trending: true,
        brand: { select: { name: true } },
        productCategories: {
          include: { category: { select: { id: true, name: true } } }
        },
        countryPrices: true,
      },
      orderBy: { createdAt: 'desc' }
    }) as Product[];
  }

  return <TrendingClient initialProducts={products} />;
}