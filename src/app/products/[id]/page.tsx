import { getOptimizedProduct } from "@/lib/optimized-products";
import { getStoreCode } from "@/lib/server/store-utils";
import ProductPageClient from "./ProductPageClient";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const revalidate = 60;

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const storeCode = await getStoreCode();
  
  const product = await getOptimizedProduct(id, storeCode) as any;

  if (!product || !product.id) {
    notFound();
  }

  const productCategoryName = product.category?.name || product.categoryName;
  const productBrandName = typeof product.brand === 'string' ? product.brand : (product.brand?.name || product.brandName);

  let recommendations: any[] = [];
  
  if (productCategoryName) {
    const sameCategory = await prisma.product.findMany({
      where: { 
        id: { not: id },
        active: true,
        productCategories: {
          some: {
            category: { name: productCategoryName }
          }
        }
      },
      select: {
        id: true,
        name: true,
        shortDescription: true,
        mainImage: true,
        images: true,
        price: true,
        discountPrice: true,
        currency: true,
        averageRating: true,
        ratingCount: true,
        totalSales: true,
        hot: true,
        brand: { select: { name: true } },
        productCategories: { include: { category: true } },
        subCategory: { select: { name: true } },
        countryPrices: { where: { active: true }, select: { country: true, price: true, currency: true } },
      },
      take: 8,
      orderBy: { totalSales: 'desc' },
    });

    recommendations = sameCategory.map((p: any) => ({
      id: p.id,
      name: p.name,
      shortDescription: p.shortDescription || "",
      mainImage: p.mainImage,
      images: p.images || [],
      price: Number(p.price) || 0,
      priceCents: Number(p.price) || 0,
      regularPrice: Number(p.price) || 0,
      salePrice: p.discountPrice ? Number(p.price) - Number(p.discountPrice) : null,
      discountPrice: p.discountPrice ? Number(p.discountPrice) : null,
      currency: p.currency?.toUpperCase() || 'USD',
      averageRating: p.averageRating || 0,
      ratingCount: p.ratingCount || 0,
      totalSales: p.totalSales || 0,
      hot: p.hot,
      brand: p.brand ? { name: p.brand.name } : null,
      category: p.productCategories?.[0]?.category ? { name: p.productCategories[0].category.name } : null,
      subCategory: p.subCategory ? { name: p.subCategory.name } : null,
      countryPrices: p.countryPrices || [],
    }));
  }

  if (recommendations.length < 4 && productBrandName) {
    const brandRecs = await prisma.product.findMany({
      where: { 
        id: { not: id },
        active: true,
        brand: { name: productBrandName },
        NOT: { id: { in: recommendations.map((r: any) => r.id) } }
      },
      select: {
        id: true,
        name: true,
        shortDescription: true,
        mainImage: true,
        images: true,
        price: true,
        discountPrice: true,
        currency: true,
        averageRating: true,
        ratingCount: true,
        totalSales: true,
        hot: true,
        brand: { select: { name: true } },
        productCategories: { include: { category: true } },
        subCategory: { select: { name: true } },
        countryPrices: { where: { active: true }, select: { country: true, price: true, currency: true } },
      },
      take: 8 - recommendations.length,
      orderBy: { totalSales: 'desc' },
    });

    const mapped = brandRecs.map((p: any) => ({
      id: p.id,
      name: p.name,
      shortDescription: p.shortDescription || "",
      mainImage: p.mainImage,
      images: p.images || [],
      price: Number(p.price) || 0,
      priceCents: Number(p.price) || 0,
      regularPrice: Number(p.price) || 0,
      salePrice: p.discountPrice ? Number(p.price) - Number(p.discountPrice) : null,
      discountPrice: p.discountPrice ? Number(p.discountPrice) : null,
      currency: p.currency?.toUpperCase() || 'USD',
      averageRating: p.averageRating || 0,
      ratingCount: p.ratingCount || 0,
      totalSales: p.totalSales || 0,
      hot: p.hot,
      brand: p.brand ? { name: p.brand.name } : null,
      category: p.productCategories?.[0]?.category ? { name: p.productCategories[0].category.name } : null,
      subCategory: p.subCategory ? { name: p.subCategory.name } : null,
      countryPrices: p.countryPrices || [],
    }));

    recommendations = [...recommendations, ...mapped];
  }

  return <ProductPageClient product={product} recommendations={recommendations} />;
}
