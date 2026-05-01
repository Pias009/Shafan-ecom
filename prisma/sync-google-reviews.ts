import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const PLACE_ID = process.env.GOOGLE_PLACE_ID || "ChIJK5UNamc5XzYR7eZ特殊性8jD-k";
const API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const SORT_ORDERS = ["most_relevant", "newest", "highest_rating", "lowest_rating"];

async function fetchAllGoogleReviews() {
  if (!API_KEY) {
    console.error("GOOGLE_PLACES_API_KEY not set");
    return [];
  }

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
    relative_time_description: string;
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

  console.log(`Fetched ${unique.length} unique reviews from Google API`);
  return unique;
}

async function main() {
  console.log("Starting Google Reviews sync...");

  const existingCount = await prisma.review.count();
  console.log(`Existing reviews in DB: ${existingCount}`);

  const googleReviews = await fetchAllGoogleReviews();

  if (googleReviews.length === 0) {
    console.error("No reviews fetched from Google. Check your API key.");
    process.exit(1);
  }

  let created = 0;
  let skipped = 0;

  for (const review of googleReviews) {
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

  console.log(`Sync complete: ${created} new, ${skipped} skipped`);
  console.log(`Total reviews in DB: ${await prisma.review.count()}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
