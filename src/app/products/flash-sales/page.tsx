import { prisma } from "@/lib/prisma";
import FlashSalesClient from "./FlashSalesClient";

export const dynamic = "force-dynamic";
export const revalidate = 5;

export default async function FlashSalesPage() {
  const products = await prisma.product.findMany({
    where: { active: true, hot: true },
    include: {
      brand: true,
      productCategories: {
        include: { category: true }
      },
      productSkinTones: {
        include: { skinTone: true }
      },
      subCategory: true,
      countryPrices: {
        where: { active: true }
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const flashProducts = products.map((p: any) => ({
    ...p,
    price: p.price || 0,
    priceCents: p.price || 0,
    regularPrice: p.price || 0,
    regularPriceCents: p.price || 0,
    imageUrl: p.mainImage,
    brandName: p.brand?.name,
    categoryName: p.productCategories?.[0]?.category?.name,
    categories: p.productCategories?.map((pc: any) => pc.category?.name) || [],
    skinTones: p.productSkinTones?.map((pst: any) => ({
      name: pst.skinTone?.name,
      hexColor: pst.skinTone?.hexColor
    })) || [],
    subCategoryName: p.subCategory?.name,
  }));

  return <FlashSalesClient products={flashProducts} />;
}