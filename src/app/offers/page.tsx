import { prisma } from "@/lib/prisma";
import { OffersClient } from "./OffersClient";
import { filterByPlacement } from "@/lib/banner-placement";

export const revalidate = 600;

export default async function OffersPage() {
  let coupons: any[] = [];
  let flashProducts: any[] = [];
  let offerBanners: any[] = [];
  let offerSections: any[] = [];

  try {
    // Fetch all active discounts (for the coupon list), then filter the validity window in JS.
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
    });
    const activeDiscounts = activeDiscountsRaw.filter(
      (d: any) =>
        (!d.startDate || new Date(d.startDate) <= now) &&
        (!d.endDate || new Date(d.endDate) >= now)
    );

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
    offerBanners = filterByPlacement(allActiveBanners, "OFFERS")
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
      coupons={coupons}
      flashProducts={flashProducts}
      banners={offerBanners}
      offerSections={offerSections}
    />
  );
}
