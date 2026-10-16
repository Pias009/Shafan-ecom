import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getAdminApiSession } from "@/lib/admin-session";
import { prisma } from "@/lib/prisma";
import { parseHomeSectionBody } from "@/lib/home-sections";
import { bustHomepageCache } from "@/lib/products";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

function isValidId(id: string) {
  return /^[a-f0-9]{24}$/i.test(id);
}

// GET /api/admin/home-sections/[id]
export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getAdminApiSession();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  if (!isValidId(id)) {
    return NextResponse.json({ error: "Invalid section ID" }, { status: 400 });
  }

  const section = await prisma.homeSection.findUnique({ where: { id } });
  if (!section) {
    return NextResponse.json({ error: "Home section not found" }, { status: 404 });
  }
  return NextResponse.json(section);
}

// PUT /api/admin/home-sections/[id]
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
      const section = await prisma.homeSection.update({ where: { id }, data: { active: body.active } });
      bustHomepageCache();
        revalidatePath("/");
      return NextResponse.json(section);
    } catch (error) {
      console.error("Error toggling home section:", error);
      return NextResponse.json({ error: "Failed to update home section" }, { status: 500 });
    }
  }

  const parsed = parseHomeSectionBody(body);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const section = await prisma.homeSection.update({ where: { id }, data: parsed.data });
    bustHomepageCache();
    revalidatePath("/");
    return NextResponse.json(section);
  } catch (error) {
    console.error("Error updating home section:", error);
    return NextResponse.json({ error: "Failed to update home section" }, { status: 500 });
  }
}

// DELETE /api/admin/home-sections/[id]
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
    await prisma.homeSection.delete({ where: { id } });
    bustHomepageCache();
    revalidatePath("/");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting home section:", error);
    return NextResponse.json({ error: "Failed to delete home section" }, { status: 500 });
  }
}
