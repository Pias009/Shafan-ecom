import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 60; // Cache for 60 seconds

// GET /api/banners/active - Get active banners for frontend display
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const country = searchParams.get("country") || "AE";
    const displayOn = searchParams.get("displayOn") || "BOTH";

    const now = new Date();

    const banners = await prisma.banner.findMany({
      where: {
        active: true,
        status: "ACTIVE",
        countries: {
          has: country,
        },
        displayOn: {
          in: [displayOn, "BOTH"],
        },
        OR: [
          { startDate: null, endDate: null },
          {
            AND: [
              { OR: [{ startDate: null }, { startDate: { lte: now } }] },
              { OR: [{ endDate: null }, { endDate: { gte: now } }] },
            ],
          },
        ],
      },
      orderBy: [{ sortOrder: "asc" }, { priority: "desc" }],
    });

    return NextResponse.json(banners);
  } catch (error) {
    console.error("Error fetching active banners:", error);
    return NextResponse.json(
      { error: "Failed to fetch banners" },
      { status: 500 }
    );
  }
}
