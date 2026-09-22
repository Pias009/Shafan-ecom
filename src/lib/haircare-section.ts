export interface HairCareSectionConfig {
  enabled: boolean;
  heading: string;
  headingAr?: string;
  badge: string;
  badgeAr?: string;
  productIds: string[];
}

export const DEFAULT_HAIRCARE_SECTION: HairCareSectionConfig = {
  enabled: true,
  heading: "Herbal Haircare",
  headingAr: "العناية بالشعر",
  badge: "RITUAL",
  badgeAr: "طقوس",
  productIds: [],
};