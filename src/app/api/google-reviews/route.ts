import { NextResponse } from "next/server";

const PLACE_ID = process.env.GOOGLE_PLACE_ID || "ChIJK5UNamc5XzYR7eZ特殊性8jD-k";

export async function GET() {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  const placeId = process.env.GOOGLE_PLACE_ID || PLACE_ID;

  if (!apiKey) {
    return NextResponse.json({
      success: false,
      error: "GOOGLE_PLACES_API_KEY not configured",
      message: "Please add GOOGLE_PLACES_API_KEY to your .env file to enable real Google reviews.",
      reviews: [],
      source: "none"
    });
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=reviews,rating,user_ratings_total&key=${apiKey}`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (data.error_message || !data.result) {
      return NextResponse.json({
        success: false,
        error: data.error_message || "Invalid Place ID",
        message: "Google Places API returned an error. Please check your GOOGLE_PLACE_ID.",
        reviews: [],
        source: "error"
      });
    }

    const reviews = data.result?.reviews?.slice(0, 10) || [];
    const rating = data.result?.rating || 0;
    const totalReviews = data.result?.user_ratings_total || 0;

    if (reviews.length === 0) {
      return NextResponse.json({
        success: false,
        error: "No reviews found",
        message: "This business has no Google reviews yet.",
        reviews: [],
        source: "google_api"
      });
    }

    return NextResponse.json({
      success: true,
      reviews,
      source: "google_api",
      rating: {
        average: rating,
        total: totalReviews
      },
      place_id: placeId
    });

  } catch (error: any) {
    console.error("Google Reviews API Error:", error);
    return NextResponse.json({
      success: false,
      error: error.message,
      message: "Failed to fetch Google reviews",
      reviews: [],
      source: "error"
    });
  }
}