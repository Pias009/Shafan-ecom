import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function isValidImageUrl(url: any): boolean {
  if (!url || typeof url !== 'string') return false;
  return url.startsWith('/') || url.startsWith('http');
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const isHero = searchParams.get('isHero');
  const activeOnly = searchParams.get('active');

  const where: any = {};
  
  if (isHero === 'true') {
    where.priority = 2;
  }
  
  if (activeOnly === 'true') {
    where.active = true;
  }

  const banners = await prisma.enhancedOfferBanner.findMany({
    where,
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });

  const validBanners = (banners || []).map((b: any) => ({
    ...b,
    imageUrl: isValidImageUrl(b.imageUrl) ? b.imageUrl : "/placeholder-product.png"
  }));

  return NextResponse.json(validBanners);
}
