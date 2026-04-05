import { prisma, prismaWithRetry } from "./prisma";

export const revalidate = 60;

function isValidImageUrl(url: any): boolean {
  if (!url || typeof url !== 'string') return false;
  return url.startsWith('/') || url.startsWith('http');
}

export function hasValidPrice(product: any, userCountry?: string): boolean {
  if (product.countryPrices && product.countryPrices.length > 0) {
    const hasValidPrice = product.countryPrices.some((cp: any) => cp.price > 0);
    return hasValidPrice || product.price > 0;
  }
  return product.price > 0;
}

export async function getProducts(storeCode?: string, page: number = 1, limit: number = 50) {
  try {
    const dbProducts = await prismaWithRetry(async () => {
      return await prisma.product.findMany({
        where: { active: true },
        include: {
          brand: true,
          productCategories: { include: { category: { select: { id: true, name: true } } } },
          productSkinTones: { include: { skinTone: true } },
          subCategory: true,
          countryPrices: {
            where: { active: true },
            select: { country: true, price: true, currency: true, active: true }
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });
    });

    const products = dbProducts.map((p: any) => {
      const mainImage = isValidImageUrl(p.mainImage) ? p.mainImage : null;
      const galleryImages = (p.images || []).filter(isValidImageUrl);

      const currency = p.currency ? p.currency.toUpperCase() : 'USD';

      const categoryNames = p.productCategories?.map((pc: any) => pc.category?.name).filter(Boolean) || [];
      const primaryCategory = categoryNames[0] || "General";

      const skinTones = p.productSkinTones?.map((pst: any) => ({
        name: pst.skinTone?.name,
        hexColor: pst.skinTone?.hexColor
      })).filter((t: any) => t.name) || [];

      const subCategoryName = p.subCategory?.name;

      return {
        id: p.id,
        name: p.name,
        description: p.description || "",
        shortDescription: p.shortDescription || "",
        benefits: p.benefits || "",
        ingredients: p.ingredients || "",
        howToUse: p.howToUse || "",
        features: p.features || [],
        images: galleryImages,
        mainImage: mainImage,
        stockQuantity: p.stockQuantity || 0,
        averageRating: p.averageRating || 0,
        ratingCount: p.ratingCount || 0,
        totalSales: p.totalSales || 0,
        price: Number(p.price) || 0,
        priceCents: Number(p.price) || 0,
        regularPrice: Number(p.price) || 0,
        regularPriceCents: Number(p.price) || 0,
        salePrice: p.discountPrice ? Number(p.price) - Number(p.discountPrice) : null,
        salePriceCents: p.discountPrice ? Number(p.price) - Number(p.discountPrice) : null,
        discountPrice: p.discountPrice ? Number(p.discountPrice) : null,
        discountCents: p.discountPrice ? Number(p.discountPrice) : null,
        currency: currency,
        active: p.active,
        hot: p.hot,
        trending: p.trending,
        brand: p.brand ? { name: p.brand.name } : null,
        category: { name: primaryCategory },
        categoryName: primaryCategory,
        categories: categoryNames,
        skinTones,
        subCategory: subCategoryName ? { name: subCategoryName } : null,
        subCategoryName: subCategoryName,
        countryPrices: p.countryPrices || [],
      };
    });

    return products;
  } catch (error: any) {
    console.error("Prisma Product Fetch Error:", error);
    return [];
  }
}

export async function getProduct(id: string) {
  try {
    const p = await (prisma as any).product.findUnique({
      where: { id },
      include: {
        brand: true,
        productCategories: { include: { category: true } },
        productSkinTones: { include: { skinTone: true } },
        productSkinConcerns: { include: { skinConcern: true } },
        subCategory: { include: { category: true } },
        countryPrices: true,
      },
    });

    if (!p) return null;

    const mainImage = isValidImageUrl(p.mainImage) ? (p.mainImage as string) : null;
    const galleryImages = (p.images || []).filter(isValidImageUrl) as string[];

    const product = {
      id: p.id,
      name: p.name,
      description: p.description || "",
      shortDescription: p.shortDescription || "",
      benefits: p.benefits || "",
      ingredients: p.ingredients || "",
      howToUse: p.howToUse || "",
      features: p.features || [],
      images: galleryImages,
      mainImage: mainImage,
      stockQuantity: p.stockQuantity || 0,
      averageRating: p.averageRating || 0,
      ratingCount: p.ratingCount || 0,
      totalSales: p.totalSales || 0,
      price: Number(p.price) || 0,
      priceCents: Number(p.price) || 0,
      regularPrice: Number(p.price) || 0,
      regularPriceCents: Number(p.price) || 0,
      salePrice: p.discountPrice ? Number(p.price) - Number(p.discountPrice) : null,
      salePriceCents: p.discountPrice ? Number(p.price) - Number(p.discountPrice) : null,
      discountPrice: p.discountPrice ? Number(p.discountPrice) : null,
      discountCents: p.discountPrice ? Number(p.discountPrice) : null,
      currency: p.currency.toUpperCase(),
      active: p.active,
      hot: p.hot,
      trending: p.trending,
      brand: p.brand ? { name: p.brand.name } : null,
      category: p.productCategories && p.productCategories.length > 0 ? { name: p.productCategories[0].category.name } : null,
      categories: p.productCategories?.map((pc: any) => pc.category.name) || [],
      subCategory: p.subCategory ? { name: p.subCategory.name, category: p.subCategory.category?.name } : null,
      skinTones: p.productSkinTones?.map((pst: any) => ({ name: pst.skinTone.name, hexColor: pst.skinTone.hexColor })) || [],
      skinConcerns: p.productSkinConcerns?.map((psc: any) => psc.skinConcern.name) || [],
      countryPrices: p.countryPrices || [],
      related_ids: [],
    };

    return product;
  } catch (error: any) {
    console.error("Prisma Product Fetch Error:", error);
    return null;
  }
}

// Function to invalidate product cache (stubbed out)
export async function invalidateProductCache(productId: string): Promise<void> {
  // Redis removed
}

// Function to fetch new arrival products (latest 4 products)
export async function getNewArrivals(storeCode?: string, limit: number = 4) {
  try {
    let dbProducts: any[] = [];
    
    if (storeCode) {
      const inventories = await prismaWithRetry(async () => {
        return await (prisma as any).storeInventory.findMany({
          where: { store: { code: storeCode } },
          include: {
            product: {
              include: {
                brand: true,
                productCategories: { include: { category: true } },
              },
            }
          },
          orderBy: { product: { createdAt: 'desc' } },
          take: limit,
        });
      });
      dbProducts = inventories.map((inv: any) => ({
        ...inv.product,
        price: Number(inv.price) || 0,
        priceCents: Number(inv.price) || 0,
        discountPrice: null,
        discountCents: null,
        stockQuantity: inv.quantity
      })).filter((p: any) => p.active);
    } else {
      dbProducts = await prismaWithRetry(async () => {
        return await prisma.product.findMany({
          where: { active: true },
          include: {
            brand: true,
            productCategories: { include: { category: true } },
            productSkinTones: { include: { skinTone: true } },
            productSkinConcerns: { include: { skinConcern: true } },
            subCategory: { include: { category: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: limit,
        });
      });
    }

    const products = dbProducts.map((p: any) => {
      const mainImage = isValidImageUrl(p.mainImage) ? p.mainImage : null;
      const galleryImages = (p.images || []).filter(isValidImageUrl);

      const categoryNames = p.productCategories?.map((pc: any) => pc.category?.name).filter(Boolean) || [];
      const primaryCategory = categoryNames[0] || "General";
      const skinTones = p.productSkinTones?.map((pst: any) => ({
        name: pst.skinTone?.name,
        hexColor: pst.skinTone?.hexColor
      })).filter((t: any) => t.name) || [];
      const skinConcerns = p.productSkinConcerns?.map((psc: any) => psc.skinConcern?.name).filter(Boolean) || [];
      const subCategoryName = p.subCategory?.name;

      return {
        id: p.id,
        name: p.name,
        description: p.description || "",
        shortDescription: p.shortDescription || "",
        benefits: p.benefits || "",
        ingredients: p.ingredients || "",
        howToUse: p.howToUse || "",
        features: p.features || [],
        images: galleryImages,
        mainImage: mainImage,
        stockQuantity: p.stockQuantity || 0,
        averageRating: p.averageRating || 0,
        ratingCount: p.ratingCount || 0,
        totalSales: p.totalSales || 0,
        price: Number(p.price) || 0,
        priceCents: Number(p.price) || 0,
        regularPrice: Number(p.price) || 0,
        regularPriceCents: Number(p.price) || 0,
        salePrice: p.discountPrice ? Number(p.price) - Number(p.discountPrice) : null,
        salePriceCents: p.discountPrice ? Number(p.price) - Number(p.discountPrice) : null,
        discountPrice: p.discountPrice ? Number(p.discountPrice) : null,
        discountCents: p.discountPrice ? Number(p.discountPrice) : null,
        currency: p.currency?.toUpperCase() || 'USD',
        active: p.active,
        hot: p.hot,
        trending: p.trending,
        brand: p.brand ? { name: p.brand.name } : null,
        brandName: p.brand?.name,
        category: { name: primaryCategory },
        categoryName: primaryCategory,
        categories: categoryNames,
        categoriesArray: categoryNames,
        skinTones,
        skinConcerns,
        subCategory: subCategoryName ? { name: subCategoryName } : null,
      };
    });

    return products;
  } catch (error) {
    console.error("Prisma New Arrivals Fetch Error:", error);
    return [];
  }
}

// Function to invalidate all product caches (stubbed out)
export async function invalidateAllProductCaches(): Promise<void> {
  // Redis removed
}
