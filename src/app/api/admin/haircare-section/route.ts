import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminApiSession } from "@/lib/admin-session";
import { bustHomepageCache } from "@/lib/products";
import {
  DEFAULT_HAIRCARE_SECTION,
  HairCareSectionConfig,
} from "@/lib/haircare-section";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getAdminApiSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [setting, products] = await Promise.all([
      (prisma as any).appSettings.findUnique({
        where: { type: "haircare_section" },
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
        take: 200,
      }),
    ]);

    const sectionData: HairCareSectionConfig = setting?.data
      ? { ...DEFAULT_HAIRCARE_SECTION, ...(setting.data as any) }
      : DEFAULT_HAIRCARE_SECTION;

    return NextResponse.json({
      success: true,
      section: sectionData,
      products,
    });
  } catch (error: any) {
    console.error("Error fetching haircare section:", error);
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

    const sectionData: HairCareSectionConfig = {
      enabled: !!body.enabled,
      heading: body.heading || DEFAULT_HAIRCARE_SECTION.heading,
      headingAr: body.headingAr || DEFAULT_HAIRCARE_SECTION.headingAr,
      badge: body.badge || DEFAULT_HAIRCARE_SECTION.badge,
      badgeAr: body.badgeAr || DEFAULT_HAIRCARE_SECTION.badgeAr,
      productIds: Array.isArray(body.productIds) ? body.productIds : [],
    };

    await (prisma as any).appSettings.upsert({
      where: { type: "haircare_section" },
      update: { data: sectionData },
      create: { type: "haircare_section", data: sectionData },
    });

    bustHomepageCache();

    return NextResponse.json({
      success: true,
      message: "Haircare section updated successfully",
      section: sectionData,
    });
  } catch (error: any) {
    console.error("Error updating haircare section:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update section data" },
      { status: 500 }
    );
  }
}