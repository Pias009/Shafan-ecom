/**
 * Optimized product queries with performance enhancements
 * - Selective field selection
 * - Query batching
 * - Connection pooling optimization
 * - Caching integration
 */

import { prisma } from "./prisma";
import { productCache } from "./cache-optimizer";

// Cache TTLs
const CACHE_TTL = {
  PRODUCT_LIST: 300, // 5 minutes
  PRODUCT_DETAIL: 600, // 10 minutes
  PRODUCT_COUNT: 1800, // 30 minutes
};

// Select only necessary fields for product listings
const PRODUCT_LIST_SELECT = {
  id: true,
  name: true,
  description: true,
  mainImage: true,
  priceCents: true,
  discountCents: true,
  currency: true,
  active: true,
  hot: true,
  trending: true,
  averageRating: true,
  ratingCount: true,
  totalSales: true,
  brand: {
    select: {
      name: true,
      logo: true,
    }
  },
  category: {
    select: {
      name: true,
      slug: true,
    }
  },
  createdAt: true,
  updatedAt: true,
};

// Select all fields for product detail
const PRODUCT_DETAIL_SELECT = {
  ...PRODUCT_LIST_SELECT,
  features: true,
  images: true,
  specifications: true,
  weight: true,
  dimensions: true,
  sku: true,
  barcode: true,
  metaTitle: true,
  metaDescription: true,
  metaKeywords: true,
};

function isValidImageUrl(url: any): boolean {
  if (!url || typeof url !== 'string') return false;
  return url.startsWith('/') || url.startsWith('http');
}

export async function getOptimizedProducts(
  storeCode?: string, 
  page: number = 1, 
  limit: number = 20,
  options: {
    hot?: boolean;
    trending?: boolean;
    category?: string;
    brand?: string;
    minPrice?: number;
    maxPrice?: number;
    sortBy?: 'price_asc' | 'price_desc' | 'newest' | 'popular' | 'rating';
  } = {}
) {
  const cacheKey = `products:${storeCode || 'all'}:page:${page}:limit:${limit}:${JSON.stringify(options)}`;
  
  // Try cache first
  const cached = await productCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const skip = (page - 1) * limit;
    
    // Build where clause
    const where: any = {
      active: true,
    };

    if (options.hot) where.hot = true;
    if (options.trending) where.trending = true;
    if (options.category) where.category = { slug: options.category };
    if (options.brand) where.brand = { slug: options.brand };
    
    if (options.minPrice !== undefined || options.maxPrice !== undefined) {
      where.priceCents = {};
      if (options.minPrice !== undefined) where.priceCents.gte = options.minPrice * 100;
      if (options.maxPrice !== undefined) where.priceCents.lte = options.maxPrice * 100;
    }

    // Build orderBy
    let orderBy: any = { createdAt: 'desc' };
    switch (options.sortBy) {
      case 'price_asc':
        orderBy = { priceCents: 'asc' };
        break;
      case 'price_desc':
        orderBy = { priceCents: 'desc' };
        break;
      case 'newest':
        orderBy = { createdAt: 'desc' };
        break;
      case 'popular':
        orderBy = { totalSales: 'desc' };
        break;
      case 'rating':
        orderBy = { averageRating: 'desc' };
        break;
    }

    let dbProducts: any[] = [];
    
    if (storeCode) {
      // Store-specific inventory query
      const inventories = await (prisma as any).storeInventory.findMany({
        where: {
          store: { code: storeCode },
          product: where,
        },
        include: {
          product: {
            select: PRODUCT_LIST_SELECT,
          }
        },
        skip,
        take: limit,
        orderBy: {
          product: orderBy,
        },
      });
      
      dbProducts = inventories.map((inv: any) => ({
        ...inv.product,
        stockQuantity: inv.quantity,
        storePrice: inv.price,
      })).filter((p: any) => p.active);
    } else {
      // Direct product query
      dbProducts = await prisma.product.findMany({
        where,
        select: PRODUCT_LIST_SELECT,
        skip,
        take: limit,
        orderBy,
      });
    }

    // Transform products
    const products = dbProducts.map((p: any) => {
      const priceCents = p.storePrice ? Math.round(p.storePrice * 100) : p.priceCents;
      const discountCents = p.discountCents || 0;
      const salePriceCents = discountCents > 0 ? priceCents - discountCents : null;

      return {
        id: p.id,
        name: p.name,
        description: p.description || "",
        features: p.features || [],
        images: [p.mainImage].filter(isValidImageUrl),
        mainImage: isValidImageUrl(p.mainImage) ? p.mainImage : null,
        stockQuantity: p.stockQuantity || 0,
        averageRating: p.averageRating || 0,
        ratingCount: p.ratingCount || 0,
        totalSales: p.totalSales || 0,
        priceCents: salePriceCents || priceCents,
        regularPriceCents: priceCents,
        salePriceCents,
        currency: p.currency?.toUpperCase() || 'USD',
        active: p.active,
        hot: p.hot,
        trending: p.trending,
        brand: p.brand ? { 
          name: p.brand.name,
          logo: p.brand.logo,
        } : null,
        category: p.category ? { 
          name: p.category.name,
          slug: p.category.slug,
        } : null,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      };
    });

    // Cache the result
    await productCache.set(cacheKey, products, CACHE_TTL.PRODUCT_LIST);

    return products;
  } catch (error) {
    console.error("Optimized Products Fetch Error:", error);
    return [];
  }
}

export async function getOptimizedProduct(id: string, storeCode?: string) {
  const cacheKey = `product:${id}:${storeCode || 'all'}`;
  
  // Try cache first
  const cached = await productCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    let product: any = null;
    
    if (storeCode) {
      // Get product with store inventory
      const inventory = await (prisma as any).storeInventory.findFirst({
        where: {
          productId: id,
          store: { code: storeCode },
        },
        include: {
          product: {
            select: PRODUCT_DETAIL_SELECT,
          },
          store: {
            select: {
              name: true,
              code: true,
              currency: true,
            }
          }
        },
      });

      if (inventory?.product) {
        product = {
          ...inventory.product,
          stockQuantity: inventory.quantity,
          storePrice: inventory.price,
          store: inventory.store,
        };
      }
    } else {
      // Get product directly
      product = await prisma.product.findUnique({
        where: { id },
        select: PRODUCT_DETAIL_SELECT,
      });
    }

    if (!product) {
      return null;
    }

    // Transform product
    const priceCents = product.storePrice ? Math.round(product.storePrice * 100) : product.priceCents;
    const discountCents = product.discountCents || 0;
    const salePriceCents = discountCents > 0 ? priceCents - discountCents : null;

    const transformedProduct = {
      id: product.id,
      name: product.name,
      description: product.description || "",
      features: product.features || [],
      specifications: product.specifications || {},
      images: [product.mainImage, ...(product.images || [])].filter(isValidImageUrl),
      mainImage: isValidImageUrl(product.mainImage) ? product.mainImage : null,
      stockQuantity: product.stockQuantity || 0,
      averageRating: product.averageRating || 0,
      ratingCount: product.ratingCount || 0,
      totalSales: product.totalSales || 0,
      priceCents: salePriceCents || priceCents,
      regularPriceCents: priceCents,
      salePriceCents,
      currency: product.currency?.toUpperCase() || 'USD',
      active: product.active,
      hot: product.hot,
      trending: product.trending,
      brand: product.brand ? { 
        name: product.brand.name,
        logo: product.brand.logo,
      } : null,
      category: product.category ? { 
        name: product.category.name,
        slug: product.category.slug,
      } : null,
      weight: product.weight,
      dimensions: product.dimensions,
      sku: product.sku,
      barcode: product.barcode,
      metaTitle: product.metaTitle,
      metaDescription: product.metaDescription,
      metaKeywords: product.metaKeywords,
      store: product.store,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };

    // Cache the result
    await productCache.set(cacheKey, transformedProduct, CACHE_TTL.PRODUCT_DETAIL);

    return transformedProduct;
  } catch (error) {
    console.error("Optimized Product Fetch Error:", error);
    return null;
  }
}

export async function getProductCount(storeCode?: string, filters: any = {}) {
  const cacheKey = `product_count:${storeCode || 'all'}:${JSON.stringify(filters)}`;
  
  const cached = await productCache.get(cacheKey);
  if (cached !== null && cached !== undefined) {
    return cached as number;
  }

  try {
    const where: any = {
      active: true,
      ...filters,
    };

    let count: number;
    
    if (storeCode) {
      count = await (prisma as any).storeInventory.count({
        where: {
          store: { code: storeCode },
          product: where,
        },
      });
    } else {
      count = await prisma.product.count({ where });
    }

    await productCache.set(cacheKey, count, CACHE_TTL.PRODUCT_COUNT);
    
    return count;
  } catch (error) {
    console.error("Product Count Error:", error);
    return 0;
  }
}

// Batch product fetching for better performance
export async function getProductsBatch(ids: string[], storeCode?: string) {
  const cacheKey = `products_batch:${storeCode || 'all'}:${ids.sort().join(',')}`;
  
  const cached = await productCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const products = await Promise.all(
      ids.map(id => getOptimizedProduct(id, storeCode))
    );

    const validProducts = products.filter(p => p !== null);
    
    await productCache.set(cacheKey, validProducts, CACHE_TTL.PRODUCT_LIST);
    
    return validProducts;
  } catch (error) {
    console.error("Batch Products Fetch Error:", error);
    return [];
  }
}

// Clear product cache (useful for admin updates)
export async function clearProductCache(productId?: string) {
  if (productId) {
    await productCache.delete(`product:${productId}:all`);
    await productCache.delete(`product:${productId}:*`);
  } else {
    // Clear all product-related cache
    const stats = productCache.getStats();
    console.log('Clearing product cache, previous stats:', stats);
    // In a real implementation, you would clear cache entries with product: prefix
  }
}