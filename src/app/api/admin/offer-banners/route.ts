import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const banners = await (prisma as any).offerBanner.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });
  return NextResponse.json(banners);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !["ADMIN", "SUPERADMIN"].includes((session.user as any)?.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json();
  const { imageUrl, title, subtitle, link, active, sortOrder } = body;
  if (!imageUrl) return NextResponse.json({ error: "imageUrl required" }, { status: 400 });

  const banner = await (prisma as any).offerBanner.create({
    data: { imageUrl, title, subtitle, link, active: active !== false, sortOrder: sortOrder || 0 },
  });
  return NextResponse.json(banner, { status: 201 });
}
