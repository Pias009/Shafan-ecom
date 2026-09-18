export interface RejuvenateCardConfig {
  id: string;
  tabTitle: string;
  tabTitleAr?: string;
  categoryTag: string;
  categoryTagAr?: string;
  imageSrc: string;
  imageAlt?: string;
  bgHex: string;
  accentHex?: string;
  productId?: string;
}

export interface RejuvenateSectionConfig {
  badgeText: string;
  badgeTextAr?: string;
  heading: string;
  headingAr?: string;
  description: string;
  descriptionAr?: string;
  bottomLinkText: string;
  bottomLinkTextAr?: string;
  bottomLinkUrl: string;
  cards: RejuvenateCardConfig[];
}

export const DEFAULT_REJUVENATE_SECTION: RejuvenateSectionConfig = {
  badgeText: "SEAL SIP :",
  badgeTextAr: "طقوس الصفاء والنقاء :",
  heading: "Refresh Your Mind",
  headingAr: "انعشي حواسك وبشرتك",
  description:
    "Nourish your skin and soul with pure botanical essentials crafted for profound radiance, clarity, and tranquility.",
  descriptionAr:
    "اعتني بجمالك وصفاء روحك مع أفضل مستحضرات العناية الطبيعية المنتقاة بعناية فائقة لتمنحك إشراقة استثنائية.",
  bottomLinkText: "Explore All Routine Essentials",
  bottomLinkTextAr: "اكتشفي كافة مستحضرات الروتين",
  bottomLinkUrl: "/products?category=Routine",
  cards: [
    {
      id: "serum",
      tabTitle: "Sentlary\nSinville",
      tabTitleAr: "سينتلاري",
      categoryTag: "Radiance Elixir",
      categoryTagAr: "سيروم النضارة",
      bgHex: "#fbe8df",
      accentHex: "#d87a63",
      imageSrc: "/images/rejuvenate/card-serum.jpg",
      imageAlt: "Luxury face serum with coral flower",
      productId: "",
    },
    {
      id: "cream",
      tabTitle: "Gpelari",
      tabTitleAr: "جيبيلاري",
      categoryTag: "Velvet Cream",
      categoryTagAr: "كريم الترميم",
      bgHex: "#f4c7bf",
      accentHex: "#cf6d68",
      imageSrc: "/images/rejuvenate/card-cream.jpg",
      imageAlt: "Handmade ceramic bowls with botanical whipped cream",
      productId: "",
    },
    {
      id: "candle",
      tabTitle: "Seoty\nSeciac",
      tabTitleAr: "سيوتي",
      categoryTag: "Zen Calming",
      categoryTagAr: "طقس التهدئة",
      bgHex: "#cde2d6",
      accentHex: "#5c9176",
      imageSrc: "/images/rejuvenate/card-candle.jpg",
      imageAlt: "White aromatherapy scented candle with fern leaves",
      productId: "",
    },
  ],
};
