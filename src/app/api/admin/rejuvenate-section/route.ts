import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminApiSession } from "@/lib/admin-session";
import { bustHomepageCache } from "@/lib/products";
import { DEFAULT_REJUVENATE_SECTION, RejuvenateSectionConfig } from "@/lib/rejuvenate-section";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getAdminApiSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [setting, products] = await Promise.all([
      (prisma as any).appSettings.findUnique({
        where: { type: "rejuvenate_section" },
      }),
      (prisma as any).product.findMany({
        where: { active: true },
        select: {
          id: true,
          name: true,
          mainImage: true,
          price: true,
          discountPrice: true,
          brand: { select: { name: true } },
          productCategories: {
            include: { category: { select: { id: true, name: true } } },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 150,
      }),
    ]);

    const sectionData: RejuvenateSectionConfig = setting?.data
      ? { ...DEFAULT_REJUVENATE_SECTION, ...(setting.data as any) }
      : DEFAULT_REJUVENATE_SECTION;

    return NextResponse.json({
      success: true,
      section: sectionData,
      products,
    });
  } catch (error: any) {
    console.error("Error fetching rejuvenate section:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch section data" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const session = await getAdminApiSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();

    const sectionData: RejuvenateSectionConfig = {
      badgeText: body.badgeText || DEFAULT_REJUVENATE_SECTION.badgeText,
      badgeTextAr: body.badgeTextAr || DEFAULT_REJUVENATE_SECTION.badgeTextAr,
      heading: body.heading || DEFAULT_REJUVENATE_SECTION.heading,
      headingAr: body.headingAr || DEFAULT_REJUVENATE_SECTION.headingAr,
      description: body.description || DEFAULT_REJUVENATE_SECTION.description,
      descriptionAr: body.descriptionAr || DEFAULT_REJUVENATE_SECTION.descriptionAr,
      bottomLinkText: body.bottomLinkText || DEFAULT_REJUVENATE_SECTION.bottomLinkText,
      bottomLinkTextAr: body.bottomLinkTextAr || DEFAULT_REJUVENATE_SECTION.bottomLinkTextAr,
      bottomLinkUrl: body.bottomLinkUrl || DEFAULT_REJUVENATE_SECTION.bottomLinkUrl,
      cards: Array.isArray(body.cards) && body.cards.length > 0
        ? body.cards
        : DEFAULT_REJUVENATE_SECTION.cards,
    };

    await (prisma as any).appSettings.upsert({
      where: { type: "rejuvenate_section" },
      update: { data: sectionData },
      create: { type: "rejuvenate_section", data: sectionData },
    });

    bustHomepageCache();

    return NextResponse.json({
      success: true,
      message: "Section updated successfully",
      section: sectionData,
    });
  } catch (error: any) {
    console.error("Error updating rejuvenate section:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update section data" },
      { status: 500 }
    );
  }
}
