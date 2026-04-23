import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { FlashSalesTable } from './_components/FlashSalesTable';

export const dynamic = 'force-dynamic';

export default async function FlashSalesPage() {
  const products = await prisma.product.findMany({
    include: {
      brand: true,
      productCategories: {
        include: { category: { select: { id: true, name: true } } }
      },
      countryPrices: true,
    },
    orderBy: { createdAt: 'desc' }
  });

  // Add displayPrice to each product
  const productsWithPrice = products.map((p: any) => {
    const aePrice = p.countryPrices?.find((cp: any) => cp.country === 'AE');
    return {
      ...p,
      displayPrice: (aePrice?.price) || p.price || 0
    };
  });

  const flashSaleProducts = productsWithPrice.filter((p: any) => p.hot === true);
  const regularProducts = productsWithPrice.filter((p: any) => p.hot !== true);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-black">Flash Sales</h1>
          <p className="text-sm font-medium text-black/60 mt-1 uppercase tracking-[0.2em]">Manage flash sale products</p>
        </div>
        <div className="flex gap-3">
          <Link 
            href="/ueadmin/products/add"
            className="px-6 py-3 bg-black text-white font-black text-xs uppercase tracking-widest rounded-full hover:bg-gray-800 transition-all"
          >
            + Add Product
          </Link>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-yellow-400 rounded-xl flex items-center justify-center">
            <span className="text-2xl">⚡</span>
          </div>
          <div>
            <h2 className="font-black text-lg text-yellow-900">Flash Sales</h2>
            <p className="text-sm text-yellow-700">
              Mark products as hot to feature them here
            </p>
          </div>
        </div>
      </div>

      <FlashSalesTable 
        flashSaleProducts={flashSaleProducts}
        regularProducts={regularProducts}
      />
    </div>
  );
}