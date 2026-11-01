import { prisma } from '../src/lib/prisma';
import { syncSectionCoupon } from '../src/lib/offer-sections';

const offersToCreate = [
  {
    title: "Viral Korean Glass Skin Routine",
    subtitle: "Achieve the iconic porcelain glass glow with viral K-Beauty bestsellers",
    sortOrder: 1,
    active: true,
    bannerImage: "/images/offers/banner-1-glass-skin.jpg",
    offerText: "25% OFF K-BEAUTY",
    ctaText: "SHOP GLASS SKIN",
    coupon: {
      enabled: true,
      code: "GLASSSKIN25",
      discountType: "PERCENTAGE" as const,
      value: 25,
      maxLimitAmount: null,
      minimumOrderValue: null,
      endDate: null,
    },
    popup: {
      popupEnabled: true,
      popupImage: "/images/offers/banner-1-glass-skin.jpg",
      popupAction: "COPY_CODE" as const,
      popupLink: "/offers",
    },
    productIds: [
      "69d37e9c1099c26ee869c9a6", // Anua 10% Niacinamide+TXA 4% Dark Spot Correcting Serum
      "69d681ec1b47d0d4703689f5", // COSRX Advanced Snail 92 All In One Cream
      "69d6742a6552754db3540b9c", // Beauty of Joseon Relief Sun : Rice + Probiotics Sun screen
      "69d65cc6e16dc2a96d76a278", // AXIS-Y Dark Spot Correcting Glow Serum
      "69d6645acc2ae501172896d8", // Beauty of Joseon Dynasty Cream
      "69d52c3701949c280184433d", // ANUA Heartleaf 77 Soothing Toner
      "69d6689d47cafc4e52bfa63f", // Beauty of Joseon Ginseng Cleansing Oil
    ],
  },
  {
    title: "The Ordinary Clinical Active Powerhouse",
    subtitle: "Top-selling clinical serums for targeted blemishes, clarity and dense hair",
    sortOrder: 2,
    active: true,
    bannerImage: "/images/offers/banner-2-clinical-serums.jpg",
    offerText: "20% OFF CLINICAL",
    ctaText: "SHOP THE ORDINARY",
    coupon: {
      enabled: true,
      code: "ORDINARY20",
      discountType: "PERCENTAGE" as const,
      value: 20,
      maxLimitAmount: null,
      minimumOrderValue: null,
      endDate: null,
    },
    popup: {
      popupEnabled: true,
      popupImage: "/images/offers/banner-2-clinical-serums.jpg",
      popupAction: "COPY_CODE" as const,
      popupLink: "/offers",
    },
    productIds: [
      "69df5c3ebbd72ae1502c266a", // The Ordinary Multi-Peptide Hair Serum 60ml
      "69df9a56cb6e051f427c9ca5", // The Ordinary Niacinamide 10% + Zinc 1% serum 30ml
      "69df4c8ac916b48e48efcae2", // The Ordinary Azelaic Acid Suspension 10%, 30 ml
      "69df53c12a8880a247c256d0", // The Ordinary Glycolic Acid 7% Toning Solution 240ml
      "69de53fd5bcba13ec1a75e11", // The Ordinary Alpha Arbutin 2%+HA Serum 30ml
      "6a3d46af41b37727d1f7f12e", // The Ordinary Alpha Arbutin 2% + HA 60ml
    ],
  },
  {
    title: "Dermatologist Barrier Repair & Deep Hydration",
    subtitle: "Ceramide & hyaluronic acid rich formulas to lock in deep moisture all day",
    sortOrder: 3,
    active: true,
    bannerImage: "/images/offers/banner-3-cerave-barrier.jpg",
    offerText: "30% OFF CERAVE",
    ctaText: "RESTORE BARRIER",
    coupon: {
      enabled: true,
      code: "BARRIER30",
      discountType: "PERCENTAGE" as const,
      value: 30,
      maxLimitAmount: null,
      minimumOrderValue: null,
      endDate: null,
    },
    popup: {
      popupEnabled: true,
      popupImage: "/images/offers/banner-3-cerave-barrier.jpg",
      popupAction: "COPY_CODE" as const,
      popupLink: "/offers",
    },
    productIds: [
      "69dcf8e6ac26764b2cf43a64", // CeraVe Foaming Cleanser 236 ml
      "69dd1a399d5f6ac018644b4d", // CeraVe Moisturizing Cream Dry to Dry 340 gram
      "69de32c5d5ffad56752185a3", // CeraVe SA Smoothing Cleanser with Salicylic Acid
      "69dd0d39a0c8505d90adb7cc", // CeraVe Hydrating Cleanser 236ml
      "69dd243c4d3f8fbc2e453ec9", // CeraVe PM Facial Moisturizing Lotion 89ml
      "69de53f95bcba13ec1a75e07", // CeraVe Skin Renewing Night Cream 48g
      "69de2e58296a2e55e354f047", // CeraVe Resurfacing Retinol Serum 30ml
      "69de4b9ffd3e4f0981a544c6", // Cerave Eye Repair Cream for Dark Circles 14ml
    ],
  },
  {
    title: "Acne Control & Dark Spot Erasing Heroes",
    subtitle: "Combat stubborn breakouts, fade hyperpigmentation, and calm redness fast",
    sortOrder: 4,
    active: true,
    bannerImage: "/images/offers/banner-4-acne-clearance.jpg",
    offerText: "20% OFF CLEAR SKIN",
    ctaText: "CLEAR ACNE NOW",
    coupon: {
      enabled: true,
      code: "CLEARSKIN20",
      discountType: "PERCENTAGE" as const,
      value: 20,
      maxLimitAmount: null,
      minimumOrderValue: null,
      endDate: null,
    },
    popup: {
      popupEnabled: true,
      popupImage: "/images/offers/banner-4-acne-clearance.jpg",
      popupAction: "COPY_CODE" as const,
      popupLink: "/offers",
    },
    productIds: [
      "69f0a26df208c1209fbc96f9", // Acne + Dark Spot Control Kit
      "69ef9d45a2780d43102bec52", // Melasma Fighting Combo
      "69e24d83e6e0ec4c2b6390c2", // La Roche-Posay Mela B3 Anti-Dark Spot Serum 30ml
      "69d7ce981261b37552c30d12", // CeraVe Acne Foaming Cream Cleanser 150ml
      "69d7ac0334e39572815c0060", // CeraVe Acne Control Cleanser 237ml
      "69e0f2aa72a8883026002c8b", // Dr. Althea 345 Relief Cream 50ml
      "69d52882d04fd6f9f530e4e7", // Anua Heartleaf 77 Clear Pad 70 Pads 160ml
    ],
  },
  {
    title: "Youth Radiance & Anti-Aging Luxury Ritual",
    subtitle: "Advanced retinal, ginseng and peptide elixirs for firm, youthful luminosity",
    sortOrder: 5,
    active: true,
    bannerImage: "/images/offers/banner-5-luxury-antiaging.jpg",
    offerText: "35% OFF ANTI-AGING",
    ctaText: "CLAIM YOUTH GLOW",
    coupon: {
      enabled: true,
      code: "YOUTHGLOW35",
      discountType: "PERCENTAGE" as const,
      value: 35,
      maxLimitAmount: null,
      minimumOrderValue: null,
      endDate: null,
    },
    popup: {
      popupEnabled: true,
      popupImage: "/images/offers/banner-5-luxury-antiaging.jpg",
      popupAction: "COPY_CODE" as const,
      popupLink: "/offers",
    },
    productIds: [
      "69de41d4cede929bb3217922", // CeraVe Skin Renewing Eye Cream 14ml
      "69d67b672b312002c1a51216", // Celimax Vita‑A Retinal Shot Tightening Booster 15ml
      "69d6705512ce9916265fcf40", // Beauty of Joseon Ginseng Essence Water 150 ml
      "69d51e36fe95c3cb1483f839", // Anua Heartleaf 70% Intense Calming Cream 50 ml
      "69dcff09b4fb53b641bc57d2", // CeraVe Hyaluronic Acid Serum 30ml
      "69d5184d2caa5171e8a9f6f3", // Anua Heartleaf 70% Daily Lotion 200ml
    ],
  },
];

async function seedOffers() {
  console.log("Starting creation of 5 Offer Sections & Banners...");

  for (const offer of offersToCreate) {
    // Check if section with this title already exists
    let section = await prisma.offerSection.findFirst({
      where: { title: offer.title },
    });

    // Sync discount coupon
    const syncResult = await syncSectionCoupon({
      title: offer.title,
      productIds: offer.productIds,
      coupon: offer.coupon,
      discountId: section?.discountId || null,
      adminEmail: "superadmin@example.com",
    });

    if ("error" in syncResult) {
      console.error(`Error syncing coupon for ${offer.title}:`, syncResult.error);
      continue;
    }

    if (section) {
      section = await prisma.offerSection.update({
        where: { id: section.id },
        data: {
          title: offer.title,
          subtitle: offer.subtitle,
          productIds: offer.productIds,
          sortOrder: offer.sortOrder,
          active: offer.active,
          discountId: syncResult.discountId,
          popupEnabled: offer.popup.popupEnabled,
          popupImage: offer.popup.popupImage,
          popupAction: offer.popup.popupAction,
          popupLink: offer.popup.popupLink,
          popupUpdatedAt: new Date(),
        },
      });
      console.log(`Updated existing OfferSection: ${section.title} (${section.id})`);
    } else {
      section = await prisma.offerSection.create({
        data: {
          title: offer.title,
          subtitle: offer.subtitle,
          productIds: offer.productIds,
          sortOrder: offer.sortOrder,
          active: offer.active,
          discountId: syncResult.discountId,
          popupEnabled: offer.popup.popupEnabled,
          popupImage: offer.popup.popupImage,
          popupAction: offer.popup.popupAction,
          popupLink: offer.popup.popupLink,
          popupUpdatedAt: new Date(),
        },
      });
      console.log(`Created new OfferSection: ${section.title} (${section.id})`);
    }

    // Upsert EnhancedOfferBanner for the Offers page slider
    const existingBanner = await (prisma as any).enhancedOfferBanner.findUnique({
      where: { imageUrl: offer.bannerImage },
    });

    if (existingBanner) {
      await (prisma as any).enhancedOfferBanner.update({
        where: { id: existingBanner.id },
        data: {
          title: offer.title,
          subtitle: offer.subtitle,
          offerText: offer.offerText,
          ctaText: offer.ctaText,
          active: true,
          link: "/offers",
          discountId: syncResult.discountId,
          sortOrder: offer.sortOrder,
          priority: 3,
          placement: "OFFERS",
          textColor: "#ffffff",
        },
      });
      console.log(`Updated EnhancedOfferBanner for ${offer.title}`);
    } else {
      await (prisma as any).enhancedOfferBanner.create({
        data: {
          imageUrl: offer.bannerImage,
          title: offer.title,
          subtitle: offer.subtitle,
          offerText: offer.offerText,
          ctaText: offer.ctaText,
          active: true,
          link: "/offers",
          discountId: syncResult.discountId,
          sortOrder: offer.sortOrder,
          priority: 3,
          placement: "OFFERS",
          textColor: "#ffffff",
        },
      });
      console.log(`Created EnhancedOfferBanner for ${offer.title}`);
    }
  }

  console.log("All 5 offer sections and banners created successfully!");
}

seedOffers()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
