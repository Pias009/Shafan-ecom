import { prisma } from "@/lib/prisma";
import { OffersClient } from "./OffersClient";

export const revalidate = 600;

interface ProductWithDiscount {
  id: string;
  name: string;
  brand?: any;
  price: number;
  imageUrl: string;
  hot?: boolean;
  averageRating?: number;
  ratingCount?: number;
  stockQuantity?: number;
  countryPrices?: any[];
  discountPrice?: number;
  discountPercentage?: number;
  discountCode?: string;
  freeDelivery?: boolean;
}

// Shared by all three discount→product resolution paths below (specific
// products, whole categories, and "apply to all") so the price math only
// lives in one place.
function applyDiscountToProduct(product: any, discount: any): ProductWithDiscount {
  const basePrice = product.price || product.priceCents || 0;
  let discountedPrice = basePrice;

  if (discount.discountType === "PERCENTAGE") {
    discountedPrice = Math.round(basePrice * (1 - discount.value / 100));
  } else if (discount.discountType === "FIXED_AMOUNT") {
    discountedPrice = Math.max(0, basePrice - discount.value);
  }

  return {
    id: product.id,
    name: product.name,
    brand: product.brand,
    price: basePrice,
    imageUrl: product.images?.[0] || product.mainImage || "/placeholder-product.png",
    hot: product.hot,
    averageRating: product.averageRating,
    ratingCount: product.ratingCount,
    stockQuantity: product.stockQuantity,
    countryPrices: product.countryPrices,
    discountPrice: discountedPrice,
    discountPercentage:
      discount.discountType === "PERCENTAGE"
        ? discount.value
        : basePrice > 0
        ? Math.round(((basePrice - discountedPrice) / basePrice) * 100)
        : 0,
    discountCode: discount.code,
    freeDelivery: discount.discountType === "FREE_SHIPPING",
  };
}

export default async function OffersPage() {
  let products: ProductWithDiscount[] = [];
  let coupons: any[] = [];
  let flashProducts: any[] = [];
  let offerBanners: any[] = [];
  let offerSections: any[] = [];

  try {
    // Fetch products that have a manually set discountPrice
    const manualOfferProducts = await prisma.product.findMany({
      where: {
        active: true,
        discountPrice: { gt: 0 }
      },
      include: {
        brand: true,
        countryPrices: true,
      }
    });

    // Fetch all active discounts, then filter the validity window in JS.
    // Mongo stores startDate/endDate as absent (not BSON null) when left
    // blank in the admin form, and Prisma's `{ startDate: null }` filter
    // does not match an absent field on Mongo — so a date-range query here
    // silently excluded every open-ended discount (the common case).
    const now = new Date();
    const activeDiscountsRaw = await (prisma as any).discount.findMany({
      where: {
        active: true,
        status: "ACTIVE",
      },
      include: {
        productDiscounts: {
          include: {
            product: true,
          },
        },
        categoryDiscounts: {
          include: {
            category: true,
          },
        },
      },
    });
    const activeDiscounts = activeDiscountsRaw.filter(
      (d: any) =>
        (!d.startDate || new Date(d.startDate) <= now) &&
        (!d.endDate || new Date(d.endDate) >= now)
    );

    // Build product map with discounts
    const productsMap = new Map<string, ProductWithDiscount>();

    // Process manual offer products first
    manualOfferProducts.forEach((product: any) => {
      const basePrice = product.price || 0;
      const discountedPrice = product.discountPrice;
      const discountPercentage = Math.round(((basePrice - discountedPrice) / basePrice) * 100);

      productsMap.set(product.id, {
        id: product.id,
        name: product.name,
        brand: product.brand,
        price: basePrice,
        imageUrl: product.images?.[0] || product.mainImage || "/placeholder-product.png",
        hot: product.hot,
        averageRating: product.averageRating,
        ratingCount: product.ratingCount,
        stockQuantity: product.stockQuantity,
        countryPrices: product.countryPrices,
        discountPrice: discountedPrice,
        discountPercentage: discountPercentage,
        discountCode: "SALE",
        freeDelivery: false,
      });
    });

    // A discount can scope itself three ways: specific products, whole
    // categories, or "apply to all products" — resolve the latter two to an
    // actual product set before merging, since neither is a direct relation.
    const needsAllActiveProducts = activeDiscounts.some((d: any) => d.applyToAll);
    const neededCategoryIds = Array.from(
      new Set(
        activeDiscounts.flatMap((d: any) => d.categoryDiscounts.map((cd: any) => cd.categoryId))
      )
    );

    const [allActiveProducts, categoryProductLinks] = await Promise.all([
      needsAllActiveProducts
        ? prisma.product.findMany({
            where: { active: true },
            include: { brand: true, countryPrices: true },
          })
        : Promise.resolve([]),
      neededCategoryIds.length > 0
        ? (prisma as any).productCategory.findMany({
            where: { categoryId: { in: neededCategoryIds }, product: { active: true } },
            include: { product: { include: { brand: true, countryPrices: true } } },
          })
        : Promise.resolve([]),
    ]);

    const categoryIdToProducts = new Map<string, any[]>();
    categoryProductLinks.forEach((link: any) => {
      const list = categoryIdToProducts.get(link.categoryId) || [];
      list.push(link.product);
      categoryIdToProducts.set(link.categoryId, list);
    });

    // Process every discount's scope: specific products, then categories,
    // then "apply to all" — in that order, so a more targeted discount isn't
    // silently overwritten by a broader one processed later for the same discount.
    activeDiscounts.forEach((discount: any) => {
      discount.productDiscounts.forEach((pd: any) => {
        productsMap.set(pd.product.id, applyDiscountToProduct(pd.product, discount));
      });

      discount.categoryDiscounts.forEach((cd: any) => {
        const productsInCategory = categoryIdToProducts.get(cd.categoryId) || [];
        productsInCategory.forEach((product: any) => {
          productsMap.set(product.id, applyDiscountToProduct(product, discount));
        });
      });

      if (discount.applyToAll) {
        allActiveProducts.forEach((product: any) => {
          productsMap.set(product.id, applyDiscountToProduct(product, discount));
        });
      }
    });

    products = Array.from(productsMap.values());

    // Extract coupons (discounts with codes)
    coupons = activeDiscounts
      .filter((d: any) => d.code && d.code !== "SALE")
      .map((d: any) => ({
        id: d.id,
        code: d.code,
        description: d.description || `${d.value}${d.discountType === "PERCENTAGE" ? "%" : " USD"} OFF`,
        discountType: d.discountType,
        value: d.value,
        endDate: d.endDate,
      }));

    // Fetch flash sale products (hot = true)
    const flashSaleProducts = await prisma.product.findMany({
      where: { active: true, hot: true },
      include: { brand: true, countryPrices: { where: { active: true } } },
      orderBy: { createdAt: "desc" },
      take: 8,
    });

    flashProducts = flashSaleProducts.map((p: any) => ({
      id: p.id,
      name: p.name,
      price: p.price || 0,
      imageUrl: p.mainImage || p.images?.[0] || "/placeholder-product.png",
      brand: p.brand,
      brandName: p.brand?.name,
      averageRating: p.averageRating,
      ratingCount: p.ratingCount,
      stockQuantity: p.stockQuantity,
      countryPrices: p.countryPrices,
    }));

    // Fetch active offer banners configured in admin — same absent-vs-null
    // Mongo quirk as discounts above, so filter the date window in JS.
    const allActiveBanners = await (prisma as any).enhancedOfferBanner.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: "asc" }, { priority: "desc" }],
    });
    offerBanners = allActiveBanners
      .filter(
        (b: any) =>
          (!b.startDate || new Date(b.startDate) <= now) &&
          (!b.endDate || new Date(b.endDate) >= now)
      )
      .slice(0, 5);
  } catch (error) {
    console.error("Error loading offers:", error);
  }

  // Admin-curated offer sections (title + hand-picked products, in admin order).
  // Loaded separately so a failure here can't blank the rest of the page.
  try {
    const sections = await prisma.offerSection.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });
    const sectionProductIds = Array.from(new Set(sections.flatMap((s) => s.productIds)));
    const sectionProducts = sectionProductIds.length
      ? await prisma.product.findMany({
          where: { id: { in: sectionProductIds }, active: true },
          include: { brand: true, countryPrices: { where: { active: true } } },
        })
      : [];
    const productById = new Map(
      sectionProducts.map((p: any) => [
        p.id,
        {
          id: p.id,
          slug: p.slug,
          name: p.name,
          price: p.price || 0,
          discountPrice: p.discountPrice || undefined,
          imageUrl: p.mainImage || p.images?.[0] || "/placeholder-product.png",
          brand: p.brand,
          brandName: p.brand?.name,
          hot: p.hot,
          averageRating: p.averageRating,
          ratingCount: p.ratingCount,
          stockQuantity: p.stockQuantity,
          countryPrices: p.countryPrices,
        },
      ])
    );
    offerSections = sections
      .map((s) => ({
        id: s.id,
        title: s.title,
        subtitle: s.subtitle,
        products: s.productIds.map((id) => productById.get(id)).filter(Boolean),
      }))
      .filter((s) => s.products.length > 0);
  } catch (error) {
    console.error("Error loading offer sections:", error);
  }

  return (
    <OffersClient
      products={products}
      coupons={coupons}
      flashProducts={flashProducts}
      banners={offerBanners}
      offerSections={offerSections}
    />
  );
}
