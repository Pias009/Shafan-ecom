import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const SYNC_SECRET = process.env.CRON_SECRET;

const PLACE_ID = process.env.GOOGLE_PLACE_ID || "";
const API_KEY = process.env.GOOGLE_PLACES_API_KEY || "";
const SORT_ORDERS = ["most_relevant", "newest", "highest_rating", "lowest_rating"];

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${SYNC_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!API_KEY || !PLACE_ID) {
    return NextResponse.json({ error: "Google API not configured" }, { status: 500 });
  }

  try {
    const fetchPromises = SORT_ORDERS.map(async (sort) => {
      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${PLACE_ID}&fields=reviews,rating,user_ratings_total&reviews_sort=${sort}&key=${API_KEY}`;
      const response = await fetch(url);
      return response.json();
    });

    const results = await Promise.all(fetchPromises);

    const allReviews: Array<{
      author_name: string;
      rating: number;
      text: string;
      time: number;
      author_url: string;
      profile_photo_url: string;
    }> = [];

    for (const data of results) {
      if (!data.error_message && data.result?.reviews) {
        allReviews.push(...data.result.reviews);
      }
    }

    const unique = Array.from(
      new Map(
        allReviews.map((r) => [`${r.author_name}-${r.time}`, r])
      ).values()
    );

    let created = 0;
    let skipped = 0;

    for (const review of unique) {
      const exists = await prisma.review.findFirst({
        where: {
          source: "google",
          authorName: review.author_name,
          date: new Date(review.time * 1000),
        },
      });

      if (exists) {
        skipped++;
        continue;
      }

      await prisma.review.create({
        data: {
          source: "google",
          authorName: review.author_name,
          rating: review.rating,
          text: review.text,
          avatarUrl: review.profile_photo_url,
          authorUrl: review.author_url,
          date: new Date(review.time * 1000),
          sortOrder: -review.time,
        },
      });
      created++;
    }

    const total = await prisma.review.count();

    return NextResponse.json({
      success: true,
      synced: created,
      skipped,
      total,
    });

  } catch (error: any) {
    console.error("Sync error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
