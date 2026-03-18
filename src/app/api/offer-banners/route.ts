import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function isValidImageUrl(url: any): boolean {
  if (!url || typeof url !== 'string') return false;
  return url.startsWith('/') || url.startsWith('http');
}

export async function GET() {
  const banners = await (prisma as any).offerBanner.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });

  const validBanners = (banners || []).map((b: any) => ({
    ...b,
    imageUrl: isValidImageUrl(b.imageUrl) ? b.imageUrl : "/placeholder-product.png"
  }));

  return NextResponse.json(validBanners);
}
