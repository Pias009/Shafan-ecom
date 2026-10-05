import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getAdminApiSession } from "@/lib/admin-session";
import { prisma } from "@/lib/prisma";
import { parseOfferSectionBody } from "@/lib/offer-sections";
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
  return NextResponse.json(section);
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

  try {
    const section = await prisma.offerSection.update({ where: { id }, data: parsed.data });
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
    await prisma.offerSection.delete({ where: { id } });
    bustHomepageCache();
    revalidatePath("/offers");
    revalidatePath("/");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting offer section:", error);
    return NextResponse.json({ error: "Failed to delete offer section" }, { status: 500 });
  }
}
