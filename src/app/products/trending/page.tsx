import { prisma } from "@/lib/prisma";
import { getStoreCode } from "@/lib/server/store-utils";
import TrendingClient from "./TrendingClient";

export const dynamic = "force-dynamic";
export const revalidate = 60;

async function getTrendingProducts(storeCode?: string) {
  const storeCodeMap: Record<string, string> = {
    'UAE': 'AE', 'KUWAIT': 'KW', 'SAUDI': 'SA', 'SA': 'SA',
    'BAHRAIN': 'BH', 'OMAN': 'OM', 'QATAR': 'QA'
  };

  const products = await prisma.product.findMany({
    where: { active: true, trending: true },
    include: {
      brand: true,
      productCategories: { include: { category: true } },
      productSkinTones: { include: { skinTone: true } },
      subCategory: true,
      countryPrices: { where: { active: true } },
    },
    orderBy: { totalSales: 'desc' },
    take: 40,
  });

  return products.map((p: any) => ({
    ...p,
    price: p.price || 0,
    priceCents: p.price || 0,
    regularPrice: p.price || 0,
    regularPriceCents: p.price || 0,
    imageUrl: p.mainImage,
    brandName: p.brand?.name,
    categoryName: p.productCategories?.[0]?.category?.name,
    skinTones: p.productSkinTones?.map((pst: any) => ({
      name: pst.skinTone?.name,
      hexColor: pst.skinTone?.hexColor
    })) || [],
    subCategoryName: p.subCategory?.name,
  }));
}

export default async function TrendingPage() {
  const storeCode = await getStoreCode();
  const products = await getTrendingProducts(storeCode);

  return <TrendingClient products={products} />;
}