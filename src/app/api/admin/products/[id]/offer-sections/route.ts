import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getAdminApiSession } from "@/lib/admin-session";
import { prisma } from "@/lib/prisma";
import { bustHomepageCache } from "@/lib/products";

export const dynamic = "force-dynamic";

const OBJECT_ID = /^[a-f0-9]{24}$/i;

type Params = { params: Promise<{ id: string }> };

// OfferSection.productIds is the inverse side of this relation — the array
// lives on OfferSection, not on Product — so membership can't be written as
// a normal field update on the product. Instead, diff the submitted set of
// section ids against every section's current productIds and push/pull this
// product's id from whichever ones changed.
export async function POST(req: NextRequest, { params }: Params) {
  const session = await getAdminApiSession();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  if (!OBJECT_ID.test(id)) {
    return NextResponse.json({ error: "Invalid product ID" }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const offerSectionIds: string[] = Array.isArray(body?.offerSectionIds)
    ? Array.from(new Set(body.offerSectionIds.filter((sid: unknown) => typeof sid === "string" && OBJECT_ID.test(sid))))
    : [];

  try {
    const allSections = await prisma.offerSection.findMany({
      select: { id: true, productIds: true },
    });

    await Promise.all(
      allSections.map((section) => {
        const shouldBeIn = offerSectionIds.includes(section.id);
        const isIn = section.productIds.includes(id);

        if (shouldBeIn && !isIn) {
          return prisma.offerSection.update({
            where: { id: section.id },
            data: { productIds: { push: id } },
          });
        }
        if (!shouldBeIn && isIn) {
          return prisma.offerSection.update({
            where: { id: section.id },
            data: { productIds: section.productIds.filter((pid) => pid !== id) },
          });
        }
        return null;
      })
    );

    bustHomepageCache();
    revalidatePath("/offers");
    revalidatePath("/");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating product offer-section membership:", error);
    return NextResponse.json({ error: "Failed to update offer sections" }, { status: 500 });
  }
}
