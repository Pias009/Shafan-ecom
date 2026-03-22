import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !["ADMIN", "SUPERADMIN"].includes((session.user as any)?.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  
  try {
    const { id } = await params;
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

    const banner = await prisma.enhancedOfferBanner.update({
      where: { id },
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
    
    return NextResponse.json(banner);
  } catch (error) {
    console.error("Error updating banner:", error);
    return NextResponse.json({ error: "Failed to update banner" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !["ADMIN", "SUPERADMIN"].includes((session.user as any)?.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  
  try {
    const { id } = await params;
    await prisma.enhancedOfferBanner.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error deleting banner:", error);
    return NextResponse.json({ error: "Failed to delete banner" }, { status: 500 });
  }
}
