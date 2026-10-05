import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getAdminApiSession } from "@/lib/admin-session";
import { prisma } from "@/lib/prisma";
import { parseOfferSectionBody } from "@/lib/offer-sections";
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

  const parsed = parseOfferSectionBody(await req.json().catch(() => null));
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const section = await prisma.offerSection.create({ data: parsed.data });
    bustHomepageCache();
    revalidatePath("/offers");
    revalidatePath("/");
    return NextResponse.json(section, { status: 201 });
  } catch (error) {
    console.error("Error creating offer section:", error);
    return NextResponse.json({ error: "Failed to create offer section" }, { status: 500 });
  }
}
