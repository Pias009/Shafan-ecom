import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getAdminApiSession } from "@/lib/admin-session";
import { prisma } from "@/lib/prisma";
import { parseOfferSectionBody, parseSectionCoupon, syncSectionCoupon } from "@/lib/offer-sections";
import { parsePopupInput } from "@/lib/popup-banner";
import { bustHomepageCache } from "@/lib/products";

export const dynamic = "force-dynamic";

// GET /api/admin/offer-sections - List sections with optional search/status filter
export async function GET(req: NextRequest) {
  const session = await getAdminApiSession();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search")?.trim();
  const status = searchParams.get("status") || "all";

  const where: any = {};
  if (search) where.title = { contains: search, mode: "insensitive" };
  if (status === "active") where.active = true;
  if (status === "inactive") where.active = false;

  try {
    const sections = await prisma.offerSection.findMany({
      where,
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });
    return NextResponse.json({ sections });
  } catch (error) {
    console.error("Error fetching offer sections:", error);
    return NextResponse.json({ error: "Failed to fetch offer sections" }, { status: 500 });
  }
}

// POST /api/admin/offer-sections - Create a section
export async function POST(req: NextRequest) {
  const session = await getAdminApiSession();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = parseOfferSectionBody(body);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const coupon = parseSectionCoupon(body?.coupon);
  if ("error" in coupon) {
    return NextResponse.json({ error: coupon.error }, { status: 400 });
  }
  const popup = parsePopupInput(body || {});
  if ("error" in popup) {
    return NextResponse.json({ error: popup.error }, { status: 400 });
  }
  if (popup.data.popupEnabled && popup.data.popupAction === "COPY_CODE" && !coupon.data.enabled) {
    return NextResponse.json({ error: "Turn on the coupon code, or pick another click action for the popup" }, { status: 400 });
  }

  try {
    const synced = await syncSectionCoupon({
      title: parsed.data.title,
      productIds: parsed.data.productIds,
      coupon: coupon.data,
      discountId: null,
      adminEmail: (session.user as any)?.email,
    });
    if ("error" in synced) {
      return NextResponse.json({ error: synced.error }, { status: 400 });
    }

    const section = await prisma.offerSection.create({
      data: {
        ...parsed.data,
        discountId: synced.discountId,
        ...popup.data,
        popupUpdatedAt: popup.data.popupEnabled ? new Date() : null,
      },
    });
    bustHomepageCache();
    revalidatePath("/offers");
    revalidatePath("/");
    return NextResponse.json(section, { status: 201 });
  } catch (error) {
    console.error("Error creating offer section:", error);
    return NextResponse.json({ error: "Failed to create offer section" }, { status: 500 });
  }
}
