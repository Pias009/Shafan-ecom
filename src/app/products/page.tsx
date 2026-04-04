import ProductsClient from "./ProductsClient";
import { getProducts } from "@/lib/products";
import { getStoreCode } from "@/lib/server/store-utils";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";

export const revalidate = 60;

async function getBanners() {
  try {
    const banners = await prisma.banner.findMany({
      where: {
        active: true,
        status: 'ACTIVE',
        displayOn: { in: ['PRODUCTS', 'BOTH'] }
      },
      select: {
        id: true,
        imageUrl: true,
        title: true,
        description: true,
        ctaLink: true,
        ctaText: true,
        position: true,
        backgroundColor: true,
        textColor: true,
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });
    return banners;
  } catch {
    return [];
  }
}

function getCountryCodeFromStore(storeCode: string | null): string {
  const map: Record<string, string> = {
    'UAE': 'AE', 'KUWAIT': 'KW', 'SAUDI': 'SA', 'SA': 'SA',
    'BAHRAIN': 'BH', 'OMAN': 'OM', 'QATAR': 'QA'
  };
  return storeCode ? (map[storeCode.toUpperCase()] || 'AE') : 'AE';
}

function getPriceFromCountryPrices(countryPrices: any[], countryCode: string) {
  if (!countryPrices || countryPrices.length === 0) return null;
  const cp = countryPrices.find(c => c.country === countryCode && c.active);
  return cp?.priceCents || null;
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; brand?: string }>;
}) {
  const storeCode = await getStoreCode();
  const products = await getProducts(storeCode);
  const params = await searchParams;
  const category = params.category;
  const brand = params.brand;
  const banners = await getBanners();
  
  const countryCode = getCountryCodeFromStore(storeCode);
  
  const transformed = products.map((p: any) => {
    // Try to get country-specific price first
    const countryPrice = getPriceFromCountryPrices(p.countryPrices, countryCode);
    
    // Determine prices: sale price takes priority, then country price, then regular price
    const salePrice = p.salePriceCents ? p.salePriceCents / 100 : null;
    const regularPrice = p.regularPriceCents / 100;
    
    // Calculate final prices in display format
    const displayPrice = countryPrice 
      ? countryPrice / 100 
      : (salePrice || regularPrice);
    const originalPrice = countryPrice 
      ? (salePrice || regularPrice) 
      : regularPrice;
    
    return {
      ...p,
      price: displayPrice,
      discountPrice: displayPrice < originalPrice ? originalPrice : undefined,
      priceCents: countryPrice || p.salePriceCents || p.regularPriceCents,
      regularPriceCents: originalPrice * 100,
      salePriceCents: salePrice ? salePrice * 100 : null,
      brandName: p.brand?.name || "Generic",
      categoryName: p.category?.name || "General",
      imageUrl: p.mainImage || "/placeholder-product.png",
      images: p.images || []
    };
  });

  return <ProductsClient initialProducts={transformed} category={category} brand={brand} banners={banners} />;
}
