import { prisma } from '@/lib/prisma';
import { getAccessibleStoreIds } from '@/lib/admin-session';
import { RoutineClient } from './_components/RoutineClient';

export const dynamic = 'force-dynamic';

const DUMMY_NAMES = ['test', 'dummy', 'sample', 'placeholder', 'temp', 'demo', 'mock', 'fake', 'xxx', 'yyy'];
const DUMMY_BRANDS = ['test brand', 'dummy', 'sample', 'placeholder', 'temp', 'demo', 'mock', 'fake', 'xxx', 'yyy', 'skypearl'];

function isDummy(p: any) {
  const name = (p.name || '').toLowerCase();
  const brand = (p.brand?.name || '').toLowerCase();
  return DUMMY_NAMES.some(d => name.includes(d)) || DUMMY_BRANDS.some(d => brand.includes(d));
}

export default async function RoutinePage() {
  const accessibleStoreIds = await getAccessibleStoreIds();

  const whereClause = accessibleStoreIds.length > 0 ? {
    OR: [
      { storeId: { in: accessibleStoreIds } },
      { storeInventories: { some: { storeId: { in: accessibleStoreIds } } } },
    ],
  } : {};

  const [dbProducts, banners] = await Promise.all([
    (prisma as any).product.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        mainImage: true,
        stockQuantity: true,
        active: true,
        routine: true,
        createdAt: true,
        brand: { select: { name: true } },
        productCategories: { include: { category: { select: { id: true, name: true } } } },
        countryPrices: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    (prisma as any).routineBanner.findMany({ orderBy: { createdAt: 'desc' } }),
  ]);

  const products = dbProducts.filter((p: any) => !isDummy(p));

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-black">Routine</h1>
          <p className="text-sm font-medium text-black/60 mt-1 uppercase tracking-[0.2em]">
            Manage routine products &amp; banner
          </p>
        </div>
      </div>
      <RoutineClient initialProducts={products} initialBanners={banners} />
    </div>
  );
}
