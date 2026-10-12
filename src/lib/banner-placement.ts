/**
 * Banner placements. All admin banners live in one table (EnhancedOfferBanner);
 * `placement` decides which storefront surface shows each one. Safe to import
 * from client components.
 */
export const BANNER_PLACEMENTS = ["HERO", "HOME_MID", "OFFERS"] as const;
export type BannerPlacement = (typeof BANNER_PLACEMENTS)[number];

export const DEFAULT_BANNER_PLACEMENT: BannerPlacement = "HERO";

export const BANNER_PLACEMENT_LABELS: Record<BannerPlacement, string> = {
  HERO: "Home — top slider",
  HOME_MID: "Home — above Routine",
  OFFERS: "Offers page",
};

export function parseBannerPlacement(value: unknown): BannerPlacement | null {
  const v = typeof value === "string" ? value.trim().toUpperCase() : "";
  return (BANNER_PLACEMENTS as readonly string[]).includes(v) ? (v as BannerPlacement) : null;
}

/** Banners saved before placements existed have none and keep showing in the hero slider. */
export function getBannerPlacement(banner: { placement?: string | null }): BannerPlacement {
  return parseBannerPlacement(banner.placement) ?? DEFAULT_BANNER_PLACEMENT;
}

// Filtered in JS rather than in the query: Prisma's `{ placement: null }` does not
// match a field that is absent in MongoDB, which is the case for every older banner.
export function filterByPlacement<T extends { placement?: string | null }>(
  banners: T[],
  placement: BannerPlacement
): T[] {
  return banners.filter((b) => getBannerPlacement(b) === placement);
}
