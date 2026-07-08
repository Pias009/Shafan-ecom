import { prisma, prismaWithRetry } from "./prisma";

export const revalidate = 300;

function isValidImageUrl(url: any): boolean {
  if (!url || typeof url !== 'string') return false;
  return url.startsWith('/') || url.startsWith('http');
}

// In-memory cache for homepage data
let homepageCache: { data: any; timestamp: number } | null = null;
const HOMEPAGE_CACHE_TTL = 60_000; // 1 minute

export function bustHomepageCache() {
  homepageCache = null;
}

export async function getHomePageData(storeCode?: string) {
  if (homepageCache && Date.now() - homepageCache.timestamp < HOMEPAGE_CACHE_TTL) {
    return homepageCache.data;
  }

  try {
    const selectFields = {
      id: true,
      name: true,
      slug: true,
      mainImage: true,
      stockQuantity: true,
      averageRating: true,
      ratingCount: true,
      totalSales: true,
      price: true,
      discountPrice: true,
      currency: true,
      hot: true,
      trending: true,
      freshFromShelf: true,
      routine: true,
      brand: { select: { name: true } },
      productCategories: { include: { category: { select: { name: true } } } },
      countryPrices: { where: { active: true }, select: { country: true, price: true, currency: true } },
    };

    const mapProduct = (p: any) => {
      const mainImage = isValidImageUrl(p.mainImage) ? p.mainImage : null;
      const categoryNames = p.productCategories?.map((pc: any) => pc.category?.name).filter(Boolean) || [];
      const primaryCategory = categoryNames[0] || "General";
      const regPrice = Number(p.price) || 0;
      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        mainImage,
        imageUrl: mainImage,
        images: [],
        shortDescription: "",
        stockQuantity: p.stockQuantity || 0,
        averageRating: p.averageRating || 0,
        ratingCount: p.ratingCount || 0,
        totalSales: p.totalSales || 0,
        price: regPrice,
        priceCents: regPrice,
        regularPrice: regPrice,
        regularPriceCents: regPrice,
        salePrice: p.discountPrice ? Number(p.discountPrice) : null,
        salePriceCents: p.discountPrice ? Number(p.discountPrice) : null,
        discountPrice: p.discountPrice ? Number(p.discountPrice) : null,
        currency: p.currency?.toUpperCase() || 'USD',
        hot: p.hot,
        trending: p.trending,
        routine: p.routine,
        brand: p.brand ? { name: p.brand.name } : null,
        brandName: p.brand?.name || "Generic",
        category: { name: primaryCategory },
        categoryName: primaryCategory,
        categories: categoryNames,
        countryPrices: p.countryPrices || [],
      };
    };

    const [allProducts, newArrivals, flashSales, trending, routineProducts] = await Promise.all([
      prisma.product.findMany({
        where: { active: true },
        select: selectFields,
        orderBy: { createdAt: 'desc' },
        take: 30,
      }),
      prisma.product.findMany({
        where: { active: true, freshFromShelf: true },
        select: selectFields,
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      prisma.product.findMany({
        where: { active: true, hot: true },
        select: selectFields,
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      prisma.product.findMany({
        where: { active: true, trending: true },
        select: selectFields,
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      prisma.product.findMany({
        where: { active: true, routine: true },
        select: selectFields,
        orderBy: { createdAt: 'desc' },
        take: 12,
      }),
    ]);

    const data = {
      products: allProducts.map(mapProduct),
      newArrivals: newArrivals.map(mapProduct),
      flashSales: flashSales.map(mapProduct),
      trending: trending.map(mapProduct),
      routine: routineProducts.map(mapProduct),
    };

    homepageCache = { data, timestamp: Date.now() };
    return data;
  } catch (error) {
    console.error("HomePage data fetch error:", error);
    return { products: [], newArrivals: [], flashSales: [], trending: [], routine: [] };
  }
}

export async function getProducts(storeCode?: string, page: number = 1, limit: number = 50, category?: string, brand?: string, trendingOnly?: boolean) {
  const skip = (page - 1) * limit;
  
  try {
    const dbProducts = await prismaWithRetry(async () => {
      return await prisma.product.findMany({
        where: { 
          active: true,
          ...(trendingOnly === true && { trending: true }),
          ...(brand && { 
            brand: {
              name: brand
            }
          }),
          ...(category?.toLowerCase() === 'routine'
            ? { routine: true }
            : category && {
                productCategories: {
                  some: {
                    category: {
                      name: { equals: category, mode: 'insensitive' }
                    }
                  }
                }
              })
        },
        select: {
          id: true,
          name: true,
          slug: true,
          shortDescription: true,
          mainImage: true,
          images: true,
          stockQuantity: true,
          averageRating: true,
          ratingCount: true,
          totalSales: true,
          price: true,
          discountPrice: true,
          currency: true,
          active: true,
          hot: true,
          trending: true,
          routine: true,
          brand: { select: { name: true } },
          productCategories: {
            include: {
              category: { select: { id: true, name: true } }
            }
          },
          productSkinTones: {
            include: {
              skinTone: { select: { name: true, hexColor: true } }
            }
          },
          productSkinConcerns: {
            include: {
              skinConcern: { select: { name: true } }
            }
          },
          subCategory: { select: { name: true } },
          countryPrices: {
            where: { active: true },
            select: { country: true, price: true, currency: true, active: true }
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: skip,
      });
    }, 2, 500);

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
      const skinConcerns = p.productSkinConcerns?.map((psc: any) => psc.skinConcern?.name).filter(Boolean) || [];

      const subCategoryName = p.subCategory?.name;

      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        shortDescription: p.shortDescription || "",
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
        salePrice: p.discountPrice ? Number(p.discountPrice) : null,
        salePriceCents: p.discountPrice ? Number(p.discountPrice) : null,
        discountPrice: p.discountPrice ? Number(p.discountPrice) : null,
        discountCents: p.discountPrice ? Number(p.discountPrice) : null,
        currency: currency,
        active: p.active,
        hot: p.hot,
        trending: p.trending,
        routine: p.routine,
        imageUrl: mainImage,
        brand: p.brand ? { name: p.brand.name } : null,
        brandName: p.brand?.name || "Generic",
        category: { name: primaryCategory },
        categoryName: primaryCategory,
        categories: categoryNames,
        skinTones,
        skinConcerns,
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

export async function getProductsForSelect(storeCode?: string, includeSku: boolean = false) {
  try {
    const selectFields = includeSku 
      ? { id: true, name: true, sku: true }
      : { id: true, name: true };

    const dbProducts = await prisma.product.findMany({
      where: { active: true },
      select: selectFields,
      orderBy: { name: 'asc' },
      take: 1000,
    });

    return dbProducts.map((p: any) => ({
      id: p.id,
      name: p.name,
      sku: p.sku || null,
    }));
  } catch (error: any) {
    console.error("Prisma Product Select Fetch Error:", error);
    return [];
  }
}

export async function getProductCount(storeCode?: string): Promise<number> {
  try {
    return await prisma.product.count({
      where: { active: true },
    });
  } catch (error) {
    console.error("Prisma Product Count Error:", error);
    return 0;
  }
}

export async function getNewArrivals(storeCode?: string, limit: number = 20) {
  try {
    const dbProducts = await prismaWithRetry(async () => {
      return await prisma.product.findMany({
        where: { 
          active: true,
          freshFromShelf: true
        },
        select: {
          id: true,
          name: true,
          slug: true,
          shortDescription: true,
          mainImage: true,
          images: true,
          stockQuantity: true,
          averageRating: true,
          ratingCount: true,
          totalSales: true,
          price: true,
          discountPrice: true,
          currency: true,
          active: true,
          hot: true,
          trending: true,
          createdAt: true,
          brand: { select: { name: true } },
          productCategories: { include: { category: true } },
          productSkinTones: { include: { skinTone: true } },
          productSkinConcerns: { include: { skinConcern: true } },
          subCategory: { select: { name: true } },
          countryPrices: { where: { active: true }, select: { country: true, price: true, currency: true, active: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });
    });

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
        slug: p.slug,
        shortDescription: p.shortDescription || "",
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
        salePrice: p.discountPrice ? Number(p.discountPrice) : null,
        salePriceCents: p.discountPrice ? Number(p.discountPrice) : null,
        discountPrice: p.discountPrice ? Number(p.discountPrice) : null,
        discountCents: p.discountPrice ? Number(p.discountPrice) : null,
        currency: p.currency?.toUpperCase() || 'USD',
        active: p.active,
        hot: p.hot,
        trending: p.trending,
        createdAt: p.createdAt,
        brand: p.brand ? { name: p.brand.name } : null,
        brandName: p.brand?.name,
        category: { name: primaryCategory },
        categoryName: primaryCategory,
        categories: categoryNames,
        categoriesArray: categoryNames,
        skinTones,
        skinConcerns,
        subCategory: subCategoryName ? { name: subCategoryName } : null,
        countryPrices: p.countryPrices || [],
      };
    });

    return products;
  } catch (error) {
    console.error("Prisma New Arrivals Fetch Error:", error);
    return [];
  }
}

export async function getFlashSales(storeCode?: string, limit: number = 20) {
  try {
    const dbProducts = await prismaWithRetry(async () => {
      return await prisma.product.findMany({
        where: { 
          active: true,
          hot: true
        },
        select: {
          id: true,
          name: true,
          slug: true,
          shortDescription: true,
          mainImage: true,
          images: true,
          stockQuantity: true,
          averageRating: true,
          ratingCount: true,
          totalSales: true,
          price: true,
          discountPrice: true,
          currency: true,
          active: true,
          hot: true,
          trending: true,
          createdAt: true,
          brand: { select: { name: true } },
          productCategories: { include: { category: true } },
          productSkinTones: { include: { skinTone: true } },
          productSkinConcerns: { include: { skinConcern: true } },
          subCategory: { select: { name: true } },
          countryPrices: { where: { active: true }, select: { country: true, price: true, currency: true, active: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });
    });

    console.log("getFlashSales found:", dbProducts.length, "products");

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

      const regularPrice = Number(p.price) || 0;
      const salePrice = Number(p.discountPrice) || 0;

      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        shortDescription: p.shortDescription || "",
        images: galleryImages,
        mainImage: mainImage,
        stockQuantity: p.stockQuantity || 0,
        averageRating: p.averageRating || 0,
        ratingCount: p.ratingCount || 0,
        totalSales: p.totalSales || 0,
        price: regularPrice,
        priceCents: regularPrice,
        regularPrice: regularPrice,
        regularPriceCents: regularPrice,
        discountPrice: salePrice || 0,
        discountCents: salePrice || 0,
        currency: p.currency?.toUpperCase() || 'USD',
        active: p.active,
        hot: p.hot,
        trending: p.trending,
        createdAt: p.createdAt,
        brand: p.brand ? { name: p.brand.name } : null,
        brandName: p.brand?.name,
        category: { name: primaryCategory },
        categoryName: primaryCategory,
        categories: categoryNames,
        categoriesArray: categoryNames,
        skinTones,
        skinConcerns,
        subCategory: subCategoryName ? { name: subCategoryName } : null,
        countryPrices: p.countryPrices || [],
      };
    });

    return products;
  } catch (error) {
    console.error("Prisma Flash Sales Fetch Error:", error);
    return [];
  }
}

export async function getTrendingProducts(storeCode?: string, limit: number = 20) {
  try {
    const dbProducts = await prismaWithRetry(async () => {
      return await prisma.product.findMany({
        where: { 
          active: true,
          trending: true
        },
        select: {
          id: true,
          name: true,
          slug: true,
          shortDescription: true,
          mainImage: true,
          images: true,
          stockQuantity: true,
          averageRating: true,
          ratingCount: true,
          totalSales: true,
          price: true,
          discountPrice: true,
          currency: true,
          active: true,
          hot: true,
          trending: true,
          createdAt: true,
          brand: { select: { name: true } },
          productCategories: { include: { category: true } },
          productSkinTones: { include: { skinTone: true } },
          productSkinConcerns: { include: { skinConcern: true } },
          subCategory: { select: { name: true } },
          countryPrices: { where: { active: true }, select: { country: true, price: true, currency: true, active: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });
    });

    console.log("getTrendingProducts found:", dbProducts.length, "products");

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

      const regularPrice = Number(p.price) || 0;
      const salePrice = Number(p.discountPrice) || 0;

      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        shortDescription: p.shortDescription || "",
        images: galleryImages,
        mainImage: mainImage,
        stockQuantity: p.stockQuantity || 0,
        averageRating: p.averageRating || 0,
        ratingCount: p.ratingCount || 0,
        totalSales: p.totalSales || 0,
        price: regularPrice,
        priceCents: regularPrice,
        regularPrice: regularPrice,
        regularPriceCents: regularPrice,
        discountPrice: salePrice || 0,
        discountCents: salePrice || 0,
        currency: p.currency?.toUpperCase() || 'USD',
        active: p.active,
        hot: p.hot,
        trending: p.trending,
        createdAt: p.createdAt,
        brand: p.brand ? { name: p.brand.name } : null,
        brandName: p.brand?.name,
        category: { name: primaryCategory },
        categoryName: primaryCategory,
        categories: categoryNames,
        categoriesArray: categoryNames,
        skinTones,
        skinConcerns,
        subCategory: subCategoryName ? { name: subCategoryName } : null,
        countryPrices: p.countryPrices || [],
      };
    });

    return products;
  } catch (error) {
    console.error("Prisma Trending Products Fetch Error:", error);
    return [];
  }
}
