import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/promotional/banners - Get active banners for public display
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "10");
    const priority = searchParams.get("priority"); // Optional: filter by priority


    // Build where clause for active banners
    const where: any = {
      active: true,
    };

    // Filter by priority if specified
    if (priority) {
      const priorityNum = parseInt(priority);
      if (!isNaN(priorityNum) && priorityNum >= 1 && priorityNum <= 3) {
        where.priority = priorityNum;
      }
    }


    // Get active banners
    const banners = await prisma.enhancedOfferBanner.findMany({
      where,
      orderBy: [
        { priority: "desc" }, // Higher priority first
        { sortOrder: "asc" }, // Then by sort order
        { createdAt: "desc" }, // Then by creation date
      ],
      take: limit,
      select: {
        id: true,
        imageUrl: true,
        title: true,
        subtitle: true,
        offerText: true,
        ctaText: true,
        backgroundColor: true,
        textColor: true,
        backgroundImage: true,
        link: true,
        discountId: true,
        priority: true,
        clicks: true,
        // Don't include sensitive or admin-only fields
      },
    });


    // Increment click count for analytics (simulated - would be done on actual click)
    // This is just for tracking impressions/views
    if (banners.length > 0) {
      // In a real implementation, you might want to track impressions separately
      // For now, we'll just return the banners
    }

    return NextResponse.json(banners);
  } catch (error) {
    console.error("[ERROR] GET: Error fetching public banners:", error);
    console.error("[ERROR] GET: Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { error: "Failed to fetch banners" },
      { status: 500 }
    );
  }
}

// POST /api/promotional/banners/:id/click - Track banner click (optional endpoint)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { bannerId } = body;

    if (!bannerId) {
      return NextResponse.json(
        { error: "bannerId is required" },
        { status: 400 }
      );
    }

    // Validate banner ID format
    if (bannerId.length !== 24) {
      return NextResponse.json(
        { error: "Invalid banner ID" },
        { status: 400 }
      );
    }

    // Increment click count
    const updatedBanner = await prisma.enhancedOfferBanner.update({
      where: { id: bannerId },
      data: {
        clicks: {
          increment: 1,
        },
      },
      select: {
        id: true,
        clicks: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Click tracked",
      banner: updatedBanner,
    });
  } catch (error) {
    console.error("Error tracking banner click:", error);
    // Don't fail the request if tracking fails
    return NextResponse.json({
      success: false,
      message: "Click tracking failed",
    });
  }
}