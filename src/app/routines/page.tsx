import ProductsClient from "../products/ProductsClient";
import { getStoreCode } from "@/lib/server/store-utils";
import { prisma } from "@/lib/prisma";

export const revalidate = 3600;
export const dynamic = 'force-dynamic';

function getCountryCodeFromStore(storeCode: string | null): string {
  const map: Record<string, string> = {
    'UAE': 'AE', 'KUWAIT': 'KW', 'SAUDI': 'SA', 'SA': 'SA',
    'BAHRAIN': 'BH', 'OMAN': 'OM', 'QATAR': 'QA'
  };
  return storeCode ? (map[storeCode.toUpperCase()] || 'AE') : 'AE';
}

function getPriceFromCountryPrices(countryPrices: any[], countryCode: string) {
  if (!countryPrices || countryPrices.length === 0) return null;
  const cp = countryPrices.find(c => c.country === countryCode);
  return cp?.priceCents || null;
}

async function getRoutineProducts(storeCode: string | null) {
  const countryCode = getCountryCodeFromStore(storeCode);
  
  const products = await prisma.product.findMany({
    where: {
      subCategory: {
        name: 'Routine',
        category: {
          name: 'Skin Care'
        }
      }
    },
    include: {
      brand: true,
      productCategories: {
        include: { category: true }
      },
      subCategory: {
        include: { category: true }
      },
      productSkinTones: {
        include: { skinTone: true }
      },
      productSkinConcerns: {
        include: { skinConcern: true }
      },
      countryPrices: true
    },
    orderBy: { createdAt: 'desc' }
  });
  
  return products;
}

export default async function RoutinesPage() {
  const storeCode = await getStoreCode();
  const products = await getRoutineProducts(storeCode);
  const countryCode = getCountryCodeFromStore(storeCode);
  
  const transformed = products.map((p: any) => {
    const countryPrice = getPriceFromCountryPrices(p.countryPrices, countryCode);
    const originalPrice = countryPrice || p.regularPrice || p.price || 0;
    const currentPrice = countryPrice || p.salePrice || originalPrice;
    const categoryNames = p.productCategories?.map((c: any) => c.category.name) || [];
    const primaryCategory = categoryNames[0] || "Skin Care";
    
    return {
      ...p,
      price: currentPrice,
      priceCents: currentPrice,
      unitPrice: currentPrice,
      regularPrice: originalPrice,
      regularPriceCents: originalPrice,
      discountPrice: currentPrice < originalPrice ? originalPrice : undefined,
      brandName: p.brandName || p.brand?.name || "Generic",
      categoryName: primaryCategory,
      subCategoryName: p.subCategory?.name || "Routine",
      imageUrl: p.mainImage,
      images: p.images || [],
      skinTones: p.productSkinTones?.map((t: any) => t.skinTone) || [],
      skinConcerns: p.productSkinConcerns?.map((c: any) => c.skinConcern) || []
    };
  });
  
  return (
    <ProductsClient 
      initialProducts={transformed} 
      category="Skin Care"
      subcategory="Routine"
      banners={[]}
      totalCount={products.length}
      currentPage={1}
      limit={20}
      isRoutinesPage={true}
    />
  );
}