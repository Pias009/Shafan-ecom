import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const dbReviews = await prisma.review.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
    });

    if (dbReviews.length === 0) {
      return NextResponse.json({
        success: false,
        error: "No reviews found",
        message: "No reviews in database. Run: npx tsx prisma/sync-google-reviews.ts",
        reviews: [],
        source: "none",
        rating: { average: 0, total: 0 }
      });
    }

    const activeReviews = dbReviews;
    const avgRating = activeReviews.reduce((sum, r) => sum + r.rating, 0) / activeReviews.length;

    const reviews = activeReviews.map((r) => ({
      id: r.id,
      author_name: r.authorName,
      rating: r.rating,
      text: r.text,
      relative_time_description: r.date ? timeAgo(r.date) : "",
    }));

    return NextResponse.json({
      success: true,
      reviews,
      source: "database",
      mapsLink: "https://maps.google.com/?cid=14264924938566658650",
      rating: {
        average: Math.round(avgRating * 10) / 10,
        total: activeReviews.length
      }
    });

  } catch (error: any) {
    console.error("Reviews API Error:", error);
    return NextResponse.json({
      success: false,
      error: error.message,
      message: "Failed to fetch reviews",
      reviews: [],
      source: "error",
      rating: { average: 0, total: 0 }
    });
  }
}

function timeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days < 1) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
}
