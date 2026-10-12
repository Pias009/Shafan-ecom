import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { filterByPlacement, parseBannerPlacement, DEFAULT_BANNER_PLACEMENT } from "@/lib/banner-placement";

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

  const allBanners = await prisma.enhancedOfferBanner.findMany({
    where,
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });

  // The products slider asks for isHero=true; keep home-middle / offers-page banners out of it.
  const placement = parseBannerPlacement(searchParams.get('placement')) ?? (isHero === 'true' ? DEFAULT_BANNER_PLACEMENT : null);
  const banners = placement ? filterByPlacement(allBanners, placement) : allBanners;

  const validBanners = (banners || []).map((b: any) => ({
    ...b,
    imageUrl: isValidImageUrl(b.imageUrl) ? b.imageUrl : "/placeholder-product.png"
  }));

  return NextResponse.json(validBanners);
}
