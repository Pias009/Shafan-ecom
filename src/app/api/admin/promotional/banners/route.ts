import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Helper function to check admin authorization
async function checkAdminAuth() {
  const session = await getServerSession(authOptions);
  if (!session || !["ADMIN", "SUPERADMIN"].includes((session.user as any)?.role)) {
    return null;
  }
  return session;
}

// GET /api/admin/promotional/banners - Get all banners with filtering and pagination
export async function GET(req: NextRequest) {
  const session = await checkAdminAuth();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || "all";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const sort = searchParams.get("sort") || "createdAt";
  const order = searchParams.get("order") || "desc";
  const skip = (page - 1) * limit;

  // Build where clause based on status filter
  const where: any = {};
  
  if (status === "active") {
    where.active = true;
    where.OR = [
      { startDate: null, endDate: null },
      {
        AND: [
          { OR: [{ startDate: null }, { startDate: { lte: new Date() } }] },
          { OR: [{ endDate: null }, { endDate: { gte: new Date() } }] },
        ],
      },
    ];
  } else if (status === "scheduled") {
    where.active = true;
    where.startDate = { gt: new Date() };
  } else if (status === "expired") {
    where.OR = [
      { active: false },
      {
        AND: [
          { endDate: { not: null } },
          { endDate: { lt: new Date() } },
        ],
      },
    ];
  }

  // Build orderBy clause
  const orderBy: any = {};
  if (sort === "priority") {
    orderBy.priority = order;
    orderBy.sortOrder = "asc";
  } else if (sort === "startDate") {
    orderBy.startDate = order;
  } else {
    orderBy[sort] = order;
  }

  try {
    // Get total count for pagination
    const total = await prisma.enhancedOfferBanner.count({ where });

    // Get banners with pagination
    const banners = await prisma.enhancedOfferBanner.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: {
        discount: {
          select: {
            id: true,
            name: true,
            code: true,
            discountType: true,
            value: true,
          },
        },
      },
    });

    return NextResponse.json({
      banners,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching banners:", error);
    return NextResponse.json(
      { error: "Failed to fetch banners" },
      { status: 500 }
    );
  }
}

// POST /api/admin/promotional/banners - Create a new banner
export async function POST(req: NextRequest) {
  const session = await checkAdminAuth();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const {
      imageUrl,
      title,
      subtitle,
      offerText,
      ctaText,
      backgroundColor,
      textColor,
      backgroundImage,
      startDate,
      endDate,
      active = true,
      link,
      discountId,
      sortOrder = 0,
      priority = 1,
    } = body;

    // Validate required fields
    if (!imageUrl) {
      return NextResponse.json(
        { error: "imageUrl is required" },
        { status: 400 }
      );
    }

    // Validate priority range
    if (priority < 1 || priority > 3) {
      return NextResponse.json(
        { error: "Priority must be between 1 and 3" },
        { status: 400 }
      );
    }

    // Parse dates if provided
    const startDateObj = startDate ? new Date(startDate) : null;
    const endDateObj = endDate ? new Date(endDate) : null;

    // Validate date logic
    if (startDateObj && endDateObj && startDateObj >= endDateObj) {
      return NextResponse.json(
        { error: "Start date must be before end date" },
        { status: 400 }
      );
    }

    // Create the banner
    const banner = await prisma.enhancedOfferBanner.create({
      data: {
        imageUrl,
        title,
        subtitle,
        offerText,
        ctaText,
        backgroundColor,
        textColor,
        backgroundImage,
        startDate: startDateObj,
        endDate: endDateObj,
        active,
        link,
        discountId,
        sortOrder,
        priority,
        clicks: 0,
        conversions: 0,
      },
      include: {
        discount: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    return NextResponse.json(banner, { status: 201 });
  } catch (error) {
    console.error("Error creating banner:", error);
    return NextResponse.json(
      { error: "Failed to create banner" },
      { status: 500 }
    );
  }
}