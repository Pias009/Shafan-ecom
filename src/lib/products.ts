import { prisma } from "./prisma";
import { RedisCache, CacheKeys, CacheTTL } from "./redis";

export const revalidate = 60; // Revalidate every 60 seconds

function isValidImageUrl(url: any): boolean {
  if (!url || typeof url !== 'string') return false;
  return url.startsWith('/') || url.startsWith('http');
}

export async function getProducts(storeCode?: string, page: number = 1, limit: number = 20) {
  try {
    // Try to get from cache first
    const cacheKey = CacheKeys.productList(storeCode || 'global', page, limit);
    const cached = await RedisCache.get<any[]>(cacheKey);
    
    if (cached !== null) {
      return cached;
    }

    let dbProducts: any[] = [];
    
    if (storeCode) {
      const inventories = await (prisma as any).storeInventory.findMany({
        where: {
          store: { code: storeCode }
        },
        include: {
          product: {
            include: {
              brand: true,
              category: true,
            }
          }
        },
        skip: (page - 1) * limit,
        take: limit,
      });
      dbProducts = inventories.map((inv: any) => ({
        ...inv.product,
        priceCents: Math.round(inv.price * 100),
        discountCents: null,
        stockQuantity: inv.quantity
      })).filter((p: any) => p.active);
    } else {
      dbProducts = await prisma.product.findMany({
        where: {
          active: true,
        },
        include: {
          brand: true,
          category: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      });
    }

    const products = dbProducts.map((p: any) => {
      const regularPrice = p.priceCents / 100;
      const salePrice = p.discountCents ? (p.priceCents - p.discountCents) / 100 : null;
      
      const mainImage = isValidImageUrl(p.mainImage) ? p.mainImage : null;
      const galleryImages = (p.images || []).filter(isValidImageUrl);

      return {
        id: p.id,
        name: p.name,
        description: p.description || "",
        features: p.features || [],
        images: galleryImages,
        mainImage: mainImage,
        stockQuantity: p.stockQuantity || 0,
        averageRating: p.averageRating || 0,
        ratingCount: p.ratingCount || 0,
        totalSales: p.totalSales || 0,
        priceCents: p.discountCents ? (p.priceCents - p.discountCents) : p.priceCents,
        regularPriceCents: p.priceCents,
        salePriceCents: p.discountCents ? (p.priceCents - p.discountCents) : null,
        currency: p.currency.toUpperCase(),
        active: p.active,
        hot: p.hot,
        trending: p.trending,
        brand: p.brand ? { name: p.brand.name } : null,
        category: p.category ? { name: p.category.name } : null,
      };
    });

    // Cache the results
    await RedisCache.set(cacheKey, products, CacheTTL.PRODUCT);
    
    return products;
  } catch (error) {
    console.error("Prisma Products Fetch Error:", error);
    return [];
  }
}

export async function getProduct(id: string) {
  try {
    // Try to get from cache first
    const cacheKey = CacheKeys.product(id);
    const cached = await RedisCache.get<any>(cacheKey);
    
    if (cached !== null) {
      return cached;
    }

    const p = await (prisma as any).product.findUnique({
      where: { id },
      include: {
        brand: true,
        category: true,
      },
    });

    if (!p) return null;

    const mainImage = isValidImageUrl(p.mainImage) ? (p.mainImage as string) : null;
    const galleryImages = (p.images || []).filter(isValidImageUrl) as string[];

    const product = {
      id: p.id,
      name: p.name,
      description: p.description || "",
      features: p.features || [],
      images: galleryImages,
      mainImage: mainImage,
      stockQuantity: p.stockQuantity || 0,
      averageRating: p.averageRating || 0,
      ratingCount: p.ratingCount || 0,
      totalSales: p.totalSales || 0,
      priceCents: p.discountCents ? (p.priceCents - p.discountCents) : p.priceCents,
      regularPriceCents: p.priceCents,
      salePriceCents: p.discountCents ? (p.priceCents - p.discountCents) : null,
      currency: p.currency.toUpperCase(),
      active: p.active,
      hot: p.hot,
      trending: p.trending,
      brand: p.brand ? { name: p.brand.name } : null,
      category: p.category ? { name: p.category.name } : null,
      related_ids: [],
    };

    // Cache the product
    await RedisCache.set(cacheKey, product, CacheTTL.PRODUCT);
    
    return product;
  } catch (error) {
    console.error("Prisma Product Fetch Error:", error);
    return null;
  }
}

// Function to invalidate product cache (call when product is updated)
export async function invalidateProductCache(productId: string): Promise<void> {
  await RedisCache.del(CacheKeys.product(productId));
  await RedisCache.delPattern('products:*');
}

// Function to invalidate all product caches
export async function invalidateAllProductCaches(): Promise<void> {
  await RedisCache.invalidateProducts();
}

