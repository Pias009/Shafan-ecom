import { NextRequest, NextResponse } from "next/server";
import { getAdminApiSession } from "@/lib/admin-session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const banners = await prisma.enhancedOfferBanner.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      select: {
        id: true,
        imageUrl: true,
        title: true,
        subtitle: true,
        link: true,
        active: true,
        sortOrder: true,
        createdAt: true,
        offerText: true,
        ctaText: true,
        backgroundColor: true,
        textColor: true,
        backgroundImage: true,
        startDate: true,
        endDate: true,
        priority: true,
        clicks: true,
        conversions: true,
        discountId: true,
      },
    });
    return NextResponse.json(banners);
  } catch (error) {
    console.error("Error fetching banners:", error);
    return NextResponse.json({ error: "Failed to fetch banners" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getAdminApiSession();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  
  try {
    const body = await req.json();
    const { 
      imageUrl, 
      title, 
      subtitle, 
      link, 
      active, 
      sortOrder,
      offerText,
      ctaText,
      backgroundColor,
      textColor,
      backgroundImage,
      startDate,
      endDate,
      priority,
      discountId
    } = body;
    
    if (!imageUrl) {
      return NextResponse.json({ error: "imageUrl required" }, { status: 400 });
    }

    const banner = await prisma.enhancedOfferBanner.create({
      data: { 
        imageUrl, 
        title: title || null, 
        subtitle: subtitle || null, 
        link: link || null, 
        active: active !== false, 
        sortOrder: sortOrder || 0,
        offerText: offerText || null,
        ctaText: ctaText || null,
        backgroundColor: backgroundColor || null,
        textColor: textColor || null,
        backgroundImage: backgroundImage || null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        priority: priority || 1,
        discountId: discountId || null,
      },
    });
    
    return NextResponse.json(banner, { status: 201 });
  } catch (error) {
    console.error("Error creating banner:", error);
    return NextResponse.json({ error: "Failed to create banner" }, { status: 500 });
  }
}
