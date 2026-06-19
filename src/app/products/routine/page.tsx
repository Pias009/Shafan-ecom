import { prisma } from "@/lib/prisma";
import { getStoreCode } from "@/lib/server/store-utils";
import RoutinePageClient from "./RoutinePageClient";

export const dynamic = "force-dynamic";
export const revalidate = 60;

async function getRoutineProducts() {
  const products = await prisma.product.findMany({
    where: { active: true, routine: true },
    include: {
      brand: true,
      productCategories: { include: { category: true } },
      productSkinTones: { include: { skinTone: true } },
      subCategory: true,
      countryPrices: { where: { active: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 60,
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
      hexColor: pst.skinTone?.hexColor,
    })) || [],
    subCategoryName: p.subCategory?.name,
  }));
}

async function getActiveBanners() {
  try {
    const banners = await (prisma as any).routineBanner.findMany({
      where: { active: true },
      orderBy: { createdAt: 'desc' },
    });
    return banners;
  } catch {
    return [];
  }
}

export default async function RoutinePage() {
  const [products, banners] = await Promise.all([getRoutineProducts(), getActiveBanners()]);
  return <RoutinePageClient products={products} banners={banners} />;
}
