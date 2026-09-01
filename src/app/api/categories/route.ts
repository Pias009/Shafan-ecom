import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET all active public categories
export async function GET(request: NextRequest) {
  try {
    const categories = await prisma.category.findMany({
      where: {
        active: true,
      },
      include: {
        subCategories: true,
      },
      orderBy: [
        { sortOrder: "asc" },
        { name: "asc" },
      ],
    });

    return NextResponse.json(categories, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    console.error("Error fetching public categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}
