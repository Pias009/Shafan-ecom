import { NextRequest, NextResponse } from "next/server";
import { getAdminApiSession } from "@/lib/admin-session";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getAdminApiSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const source = searchParams.get("source");
    const active = searchParams.get("active");

    const reviews = await prisma.review.findMany({
      where: {
        ...(source ? { source } : {}),
        ...(active !== null ? { active: active === "true" } : {}),
      },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json(reviews);
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAdminApiSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { authorName, rating, text, source, avatarUrl, authorUrl, date, sortOrder } = body;

    if (!authorName || !rating || !text) {
      return NextResponse.json(
        { error: "authorName, rating, and text are required" },
        { status: 400 }
      );
    }

    const review = await prisma.review.create({
      data: {
        authorName,
        rating: parseInt(rating),
        text,
        source: source || "manual",
        avatarUrl,
        authorUrl,
        date: date ? new Date(date) : undefined,
        sortOrder: sortOrder || 0,
      },
    });

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    console.error("Error creating review:", error);
    return NextResponse.json(
      { error: "Failed to create review" },
      { status: 500 }
    );
  }
}
