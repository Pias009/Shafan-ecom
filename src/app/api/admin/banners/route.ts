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

// GET /api/admin/banners - Get all banners
export async function GET(req: NextRequest) {
  const session = await checkAdminAuth();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || "all";
  const displayOn = searchParams.get("displayOn");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const skip = (page - 1) * limit;

  const where: any = {};

  if (status === "active") {
    where.active = true;
    where.status = "ACTIVE";
    where.OR = [
      { startDate: null, endDate: null },
      {
        AND: [
          { OR: [{ startDate: null }, { startDate: { lte: new Date() } }] },
          { OR: [{ endDate: null }, { endDate: { gte: new Date() } }] },
        ],
      },
    ];
  } else if (status === "draft") {
    where.status = "DRAFT";
  } else if (status === "archived") {
    where.status = "ARCHIVED";
  }

  if (displayOn) {
    where.displayOn = displayOn;
  }

  try {
    const total = await prisma.banner.count({ where });

    const banners = await prisma.banner.findMany({
      where,
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      skip,
      take: limit,
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

// POST /api/admin/banners - Create a new banner
export async function POST(req: NextRequest) {
  const session = await checkAdminAuth();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const {
      title,
      description,
      imageUrl,
      ctaText,
      ctaLink,
      backgroundColor,
      textColor,
      position = "MIDDLE",
      displayOn = "BOTH",
      countries = [],
      startDate,
      endDate,
      active = true,
      sortOrder = 0,
      priority = 1,
      desktopHeight,
      mobileHeight,
    } = body;

    // Validate required fields
    if (!title) {
      return NextResponse.json(
        { error: "title is required" },
        { status: 400 }
      );
    }

    if (!imageUrl) {
      return NextResponse.json(
        { error: "imageUrl is required" },
        { status: 400 }
      );
    }

    // Validate countries
    const validCountries = ["AE", "KW", "BH", "SA", "OM", "QA"];
    if (countries.length > 0) {
      const invalidCountries = countries.filter((c: string) => !validCountries.includes(c));
      if (invalidCountries.length > 0) {
        return NextResponse.json(
          { error: `Invalid countries: ${invalidCountries.join(", ")}` },
          { status: 400 }
        );
      }
    }

    // Parse dates
    const startDateObj = startDate ? new Date(startDate) : null;
    const endDateObj = endDate ? new Date(endDate) : null;

    // Validate date logic
    if (startDateObj && endDateObj && startDateObj >= endDateObj) {
      return NextResponse.json(
        { error: "Start date must be before end date" },
        { status: 400 }
      );
    }

    // Create banner
    const banner = await prisma.banner.create({
      data: {
        title,
        description,
        imageUrl,
        ctaText,
        ctaLink,
        backgroundColor,
        textColor,
        position,
        displayOn,
        countries: countries.length > 0 ? countries : validCountries,
        startDate: startDateObj,
        endDate: endDateObj,
        active,
        status: active ? "ACTIVE" : "DRAFT",
        publishedAt: active ? new Date() : null,
        sortOrder,
        priority,
        desktopHeight,
        mobileHeight,
        createdBy: (session.user as any)?.email,
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
