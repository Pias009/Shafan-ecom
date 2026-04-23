import { prisma } from "@/lib/prisma";
import { getStoreCode } from "@/lib/server/store-utils";
import NewArrivalsClient from "./NewArrivalsClient";

export const dynamic = "force-dynamic";
export const revalidate = 60;

async function getNewArrivalsProducts(storeCode?: string) {
  const storeCodeMap: Record<string, string> = {
    'UAE': 'AE', 'KUWAIT': 'KW', 'SAUDI': 'SA', 'SA': 'SA',
    'BAHRAIN': 'BH', 'OMAN': 'OM', 'QATAR': 'QA'
  };
  const countryCode = storeCode ? storeCodeMap[storeCode.toUpperCase()] || 'AE' : 'AE';

  const products = await prisma.product.findMany({
    where: { active: true },
    include: {
      brand: true,
      productCategories: { include: { category: true } },
      productSkinTones: { include: { skinTone: true } },
      subCategory: true,
      countryPrices: { where: { active: true } },
    },
    orderBy: { createdAt: 'desc' },
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

export default async function NewArrivalsPage() {
  const storeCode = await getStoreCode();
  const products = await getNewArrivalsProducts(storeCode);

  return <NewArrivalsClient products={products} />;
}