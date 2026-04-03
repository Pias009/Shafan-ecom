import { NextRequest, NextResponse } from "next/server";
import { getAdminApiSession } from "@/lib/admin-session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Helper function to check admin authorization
async function checkAdminAuth() {
  const session = await getAdminApiSession();
  if (!session) {
    return null;
  }
  return session;
}

// GET /api/admin/promotional/banners - Get all banners with filtering and pagination
export async function GET(req: NextRequest) {
  console.log("[DEBUG] GET /api/admin/promotional/banners: Request received");
  const session = await checkAdminAuth();
  if (!session) {
    console.log("[DEBUG] GET: Authentication failed - returning 403");
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || "all";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const sort = searchParams.get("sort") || "createdAt";
  const order = searchParams.get("order") || "desc";
  const skip = (page - 1) * limit;

  console.log("[DEBUG] GET: Query params:", { status, page, limit, sort, order, skip });

  // Build where clause based on status filter
  const where: any = {};
  
  if (status === "active") {
    console.log("[DEBUG] GET: Building where clause for 'active' status");
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
    console.log("[DEBUG] GET: Building where clause for 'scheduled' status");
    where.active = true;
    where.startDate = { gt: new Date() };
  } else if (status === "expired") {
    console.log("[DEBUG] GET: Building where clause for 'expired' status");
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

  console.log("[DEBUG] GET: Final where clause:", JSON.stringify(where, null, 2));

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

  console.log("[DEBUG] GET: Order by clause:", orderBy);

  try {
    console.log("[DEBUG] GET: Attempting database count query...");
    // Get total count for pagination
    const total = await prisma.enhancedOfferBanner.count({ where });
    console.log("[DEBUG] GET: Database count successful, total:", total);

    console.log("[DEBUG] GET: Attempting database findMany query...");
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
    console.log("[DEBUG] GET: Database query successful, found", banners.length, "banners");

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
    console.error("[ERROR] GET: Error fetching banners:", error);
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

// POST /api/admin/promotional/banners - Create a new banner
export async function POST(req: NextRequest) {
  console.log("[DEBUG] POST /api/admin/promotional/banners: Request received");
  const session = await checkAdminAuth();
  if (!session) {
    console.log("[DEBUG] POST: Authentication failed - returning 403");
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    console.log("[DEBUG] POST: Parsing request body...");
    const body = await req.json();
    console.log("[DEBUG] POST: Request body:", JSON.stringify(body, null, 2));
    
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
      console.log("[DEBUG] POST: Validation failed - imageUrl is required");
      return NextResponse.json(
        { error: "imageUrl is required" },
        { status: 400 }
      );
    }

    // Validate priority range
    if (priority < 1 || priority > 3) {
      console.log("[DEBUG] POST: Validation failed - priority out of range:", priority);
      return NextResponse.json(
        { error: "Priority must be between 1 and 3" },
        { status: 400 }
      );
    }

    // Parse dates if provided
    const startDateObj = startDate ? new Date(startDate) : null;
    const endDateObj = endDate ? new Date(endDate) : null;
    console.log("[DEBUG] POST: Parsed dates - start:", startDateObj, "end:", endDateObj);

    // Validate date logic
    if (startDateObj && endDateObj && startDateObj >= endDateObj) {
      console.log("[DEBUG] POST: Validation failed - start date not before end date");
      return NextResponse.json(
        { error: "Start date must be before end date" },
        { status: 400 }
      );
    }

    console.log("[DEBUG] POST: Attempting to create banner in database...");
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
    console.log("[DEBUG] POST: Banner created successfully:", banner.id);

    return NextResponse.json(banner, { status: 201 });
  } catch (error) {
    console.error("[ERROR] POST: Error creating banner:", error);
    console.error("[ERROR] POST: Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { error: "Failed to create banner" },
      { status: 500 }
    );
  }
}