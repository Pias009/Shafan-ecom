import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getAdminApiSession } from "@/lib/admin-session";
import { prisma } from "@/lib/prisma";
import { getSectionCouponForForm, parseOfferSectionBody, parseSectionCoupon, syncSectionCoupon } from "@/lib/offer-sections";
import { parsePopupInput, popupChanged } from "@/lib/popup-banner";
import { bustHomepageCache } from "@/lib/products";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

function isValidId(id: string) {
  return /^[a-f0-9]{24}$/i.test(id);
}

// GET /api/admin/offer-sections/[id]
export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getAdminApiSession();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  if (!isValidId(id)) {
    return NextResponse.json({ error: "Invalid section ID" }, { status: 400 });
  }

  const section = await prisma.offerSection.findUnique({ where: { id } });
  if (!section) {
    return NextResponse.json({ error: "Offer section not found" }, { status: 404 });
  }
  return NextResponse.json({ ...section, coupon: await getSectionCouponForForm(section.discountId) });
}

// PUT /api/admin/offer-sections/[id]
export async function PUT(req: NextRequest, { params }: Params) {
  const session = await getAdminApiSession();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  if (!isValidId(id)) {
    return NextResponse.json({ error: "Invalid section ID" }, { status: 400 });
  }

  const body = await req.json().catch(() => null);

  // Allow a status-only toggle from the list page without resending the whole form.
  if (body && Object.keys(body).length === 1 && typeof body.active === "boolean") {
    try {
      const section = await prisma.offerSection.update({ where: { id }, data: { active: body.active } });
      bustHomepageCache();
      revalidatePath("/offers");
      revalidatePath("/");
      return NextResponse.json(section);
    } catch (error) {
      console.error("Error toggling offer section:", error);
      return NextResponse.json({ error: "Failed to update offer section" }, { status: 500 });
    }
  }

  const parsed = parseOfferSectionBody(body);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const existing = await prisma.offerSection.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Offer section not found" }, { status: 404 });
  }

  const extra: Record<string, unknown> = {};
  let coupon: ReturnType<typeof parseSectionCoupon> | null = null;
  if (body.coupon !== undefined) {
    coupon = parseSectionCoupon(body.coupon);
    if ("error" in coupon) {
      return NextResponse.json({ error: coupon.error }, { status: 400 });
    }
  }
  if (body.popupEnabled !== undefined) {
    const popup = parsePopupInput(body);
    if ("error" in popup) {
      return NextResponse.json({ error: popup.error }, { status: 400 });
    }
    const couponOn = coupon && "data" in coupon ? coupon.data.enabled : !!existing.discountId;
    if (popup.data.popupEnabled && popup.data.popupAction === "COPY_CODE" && !couponOn) {
      return NextResponse.json({ error: "Turn on the coupon code, or pick another click action for the popup" }, { status: 400 });
    }
    Object.assign(extra, popup.data);
    // A visible change gets a new version so every visitor sees it once more.
    if (popup.data.popupEnabled && (popupChanged(existing, popup.data) || !existing.popupUpdatedAt)) {
      extra.popupUpdatedAt = new Date();
    }
  }

  try {
    if (coupon && "data" in coupon) {
      const synced = await syncSectionCoupon({
        title: parsed.data.title,
        productIds: parsed.data.productIds,
        coupon: coupon.data,
        discountId: existing.discountId,
        adminEmail: (session.user as any)?.email,
      });
      if ("error" in synced) {
        return NextResponse.json({ error: synced.error }, { status: 400 });
      }
      extra.discountId = synced.discountId;
    }

    const section = await prisma.offerSection.update({ where: { id }, data: { ...parsed.data, ...extra } });
    bustHomepageCache();
    revalidatePath("/offers");
    revalidatePath("/");
    return NextResponse.json(section);
  } catch (error) {
    console.error("Error updating offer section:", error);
    return NextResponse.json({ error: "Failed to update offer section" }, { status: 500 });
  }
}

// DELETE /api/admin/offer-sections/[id]
export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getAdminApiSession();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  if (!isValidId(id)) {
    return NextResponse.json({ error: "Invalid section ID" }, { status: 400 });
  }

  try {
    const deleted = await prisma.offerSection.delete({ where: { id } });
    // Its coupon would otherwise keep working with no section behind it.
    if (deleted.discountId) {
      await prisma.discount
        .update({ where: { id: deleted.discountId }, data: { active: false, status: "DRAFT" } })
        .catch(() => {});
    }
    bustHomepageCache();
    revalidatePath("/offers");
    revalidatePath("/");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting offer section:", error);
    return NextResponse.json({ error: "Failed to delete offer section" }, { status: 500 });
  }
}
