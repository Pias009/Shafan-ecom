import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const SKIN_TYPE_MAP: Record<string, string[]> = {
  oily: ["Oily Skin"],
  dry: ["Dry Skin"],
  combination: ["Combination"],
  sensitive: ["Sensitive Skin"],
  normal: ["Normal Skin"],
  "acne-prone": ["Acne-prone Skin"],
  "all type": ["All type Skin"],
};

const CONCERN_MAP: Record<string, string[]> = {
  acne: ["Acne"],
  "dark spot": ["Dark Spot", "Pigmentation"],
  pigmentation: ["Pigmentation", "Dark Spot"],
  melasma: ["Melasma", "Pigmentation"],
  wrinkles: ["Anti Wrinkles", "Anti Aging"],
  aging: ["Anti Aging", "Anti Wrinkles"],
  pores: ["Anti Pores"],
  blackheads: ["Blackheads"],
  redness: ["Redness"],
  brightening: ["Brightening", "Dull Skin"],
  dull: ["Dull Skin", "Brightening"],
  hydration: [],
  "dark circles": ["Dark Circles"],
  scar: ["Acne Scar"],
  "sun damage": ["Sun Damage"],
  sensitive: [],
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { skinType, concerns, limit = 5 } = body;

    if (!skinType) {
      return NextResponse.json(
        { error: "Skin type is required" },
        { status: 400 }
      );
    }

    const skinTypeNames = SKIN_TYPE_MAP[skinType.toLowerCase()] || [
      skinType,
    ];
    const concernNames = (concerns || []).flatMap(
      (c: string) => CONCERN_MAP[c.toLowerCase()] || [c]
    );

    const skinTones = await prisma.skinTone.findMany({
      where: { name: { in: skinTypeNames } },
    });
    const skinToneIds = skinTones.map((s) => s.id);

    const skinConcerns = concernNames.length
      ? await prisma.skinConcern.findMany({
          where: { name: { in: concernNames } },
        })
      : [];
    const skinConcernIds = skinConcerns.map((s) => s.id);

    const products = await prisma.product.findMany({
      where: {
        active: true,
        stockQuantity: { gt: 0 },
        ...(skinToneIds.length > 0
          ? {
              productSkinTones: {
                some: { skinToneId: { in: skinToneIds } },
              },
            }
          : {}),
        ...(skinConcernIds.length > 0
          ? {
              productSkinConcerns: {
                some: { skinConcernId: { in: skinConcernIds } },
              },
            }
          : {}),
      },
      include: {
        brand: { select: { name: true } },
        subCategory: { select: { name: true } },
        productSkinTones: { include: { skinTone: true } },
        productSkinConcerns: { include: { skinConcern: true } },
        countryPrices: true,
      },
      orderBy: [{ trending: "desc" }, { totalSales: "desc" }],
      take: limit,
    });

    const recommendations = products.map((p) => {
      const countryPrice = p.countryPrices.find(
        (cp) => cp.active && cp.country === "AE"
      );
      const price = countryPrice
        ? `${countryPrice.price} ${countryPrice.currency}`
        : p.price
        ? `${p.price} ${p.currency}`
        : "Price not available";

      return {
        id: p.id,
        name: p.name,
        description: p.shortDescription || p.description || "",
        price,
        imageUrl: p.mainImage || p.images[0] || "",
        productUrl: `/product/${p.slug || p.id}`,
        skinTypes: p.productSkinTones.map((pst) => pst.skinTone.name),
        concerns: p.productSkinConcerns.map((psc) => psc.skinConcern.name),
        howToUse: p.howToUse || null,
        brand: p.brand?.name || "",
        subCategory: p.subCategory?.name || "",
      };
    });

    return NextResponse.json({ products: recommendations });
  } catch (error) {
    console.error("Product recommendation error:", error);
    return NextResponse.json(
      { error: "Failed to get product recommendations" },
      { status: 500 }
    );
  }
}
