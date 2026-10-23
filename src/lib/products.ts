import { unstable_cache, revalidateTag } from "next/cache";
import { prisma, prismaWithRetry } from "./prisma";
import { filterByPlacement } from "@/lib/banner-placement";

export const revalidate = 300;

function isValidImageUrl(url: any): boolean {
  if (!url || typeof url !== 'string') return false;
  return url.startsWith('/') || url.startsWith('http');
}

// Homepage data lives in the Next data cache (shared by every server instance),
// so busting it after an admin edit takes effect everywhere at once. An in-memory
// cache only cleared the one instance that handled the admin request.
const HOMEPAGE_CACHE_TAG = "homepage";

export function bustHomepageCache() {
  revalidateTag(HOMEPAGE_CACHE_TAG, { expire: 0 });
}

const getCachedHomePageData = unstable_cache(
  () => prismaWithRetry(fetchHomePageData, 2, 500),
  ["homepage-data"],
  { revalidate: 60, tags: [HOMEPAGE_CACHE_TAG] }
);

export async function getHomePageData(storeCode?: string) {
  try {
    return await getCachedHomePageData();
  } catch (error) {
    // Not cached: the next request retries instead of serving an empty homepage for a minute
    console.error("HomePage data fetch error:", error);
    return { products: [], newArrivals: [], flashSales: [], trending: [], routine: [], bestSellers: [], makeupProducts: [], fragranceProducts: [], banners: [], rejuvenateSection: null, haircareSection: null, offerSections: [], homeSections: [] };
  }
}

async function fetchHomePageData() {
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

  const [allProducts, newArrivals, flashSales, trending, routineProducts, bestSellers, makeupProducts, fragranceProducts, banners, rejuvenateSetting, haircareSetting, activeOfferSections, activeHomeSections] = await Promise.all([
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
    prisma.product.findMany({
      where: { active: true },
      select: selectFields,
      orderBy: { totalSales: 'desc' },
      take: 12,
    }),
    prisma.product.findMany({
      where: {
        active: true,
        productCategories: {
          some: {
            category: {
              name: { equals: 'Makeup', mode: 'insensitive' }
            }
          }
        }
      },
      select: selectFields,
      orderBy: { createdAt: 'desc' },
      take: 12,
    }),
    prisma.product.findMany({
      where: {
        active: true,
        productCategories: {
          some: {
            category: {
              name: { contains: 'Fragran', mode: 'insensitive' }
            }
          }
        }
      },
      select: selectFields,
      orderBy: { createdAt: 'desc' },
      take: 12,
    }),
    prisma.enhancedOfferBanner.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        imageUrl: true,
        title: true,
        subtitle: true,
        offerText: true,
        ctaText: true,
        link: true,
        backgroundColor: true,
        textColor: true,
        placement: true,
      },
    }),
    (prisma as any).appSettings.findUnique({
      where: { type: 'rejuvenate_section' },
    }).catch(() => null),
    (prisma as any).appSettings.findUnique({
      where: { type: 'haircare_section' },
    }).catch(() => null),
    (prisma as any).offerSection.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    }).catch(() => []),
    prisma.homeSection.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    }).catch(() => []),
  ]);

  // Resolve each section's productIds to real, active products, in the
  // admin's chosen order — same two-phase pattern as /offers/page.tsx.
  const sectionProductIds: string[] = Array.from(
    new Set([...activeOfferSections, ...activeHomeSections].flatMap((s: any) => s.productIds as string[]))
  );
  const sectionProducts = sectionProductIds.length
    ? await prisma.product.findMany({
        where: { id: { in: sectionProductIds }, active: true },
        select: selectFields,
      })
    : [];
  const sectionProductById = new Map(sectionProducts.map((p: any) => [p.id, mapProduct(p)]));
  const offerSections = activeOfferSections
    .map((s: any) => ({
      id: s.id,
      title: s.title,
      subtitle: s.subtitle,
      products: s.productIds.map((id: string) => sectionProductById.get(id)).filter(Boolean),
    }))
    .filter((s: any) => s.products.length > 0);

  // Admin-built homepage rows; the category name only feeds the "See All" link.
  const homeSectionCategoryIds = Array.from(
    new Set(activeHomeSections.map((s) => s.categoryId).filter((id): id is string => Boolean(id)))
  );
  const homeSectionCategories = homeSectionCategoryIds.length
    ? await prisma.category.findMany({ where: { id: { in: homeSectionCategoryIds } }, select: { id: true, name: true } })
    : [];
  const categoryNameById = new Map(homeSectionCategories.map((c) => [c.id, c.name]));
  const homeSections = activeHomeSections
    .map((s) => ({
      id: s.id,
      title: s.title,
      badge: s.badge,
      categoryName: (s.categoryId && categoryNameById.get(s.categoryId)) || null,
      products: s.productIds.map((id: string) => sectionProductById.get(id)).filter(Boolean),
    }))
    .filter((s) => s.products.length > 0);

  const data = {
    products: allProducts.map(mapProduct),
    newArrivals: newArrivals.map(mapProduct),
    flashSales: flashSales.map(mapProduct),
    trending: trending.map(mapProduct),
    routine: routineProducts.map(mapProduct),
    bestSellers: bestSellers.map(mapProduct),
    makeupProducts: makeupProducts.map(mapProduct),
    fragranceProducts: fragranceProducts.map(mapProduct),
    // Hero slider only — home-middle and offers-page banners have their own placements
    banners: filterByPlacement(banners || [], "HERO").filter((b: any) => b.imageUrl && b.imageUrl.trim() !== ""),
    rejuvenateSection: (rejuvenateSetting?.data as any) || null,
    haircareSection: (haircareSetting?.data as any) || null,
    offerSections,
    homeSections,
  };

  return data;
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
