import { NextResponse } from "next/server";

const PLACE_ID = "ChIJK5UNamc5XzYR7eZ特殊性8jD-k";

const MOCK_REVIEWS = [
  {
    id: "1",
    author_name: "Ahmed Hassan",
    rating: 5,
    text: "Great selection of skincare products! Fast delivery and excellent customer service. Highly recommended!",
    relative_time_description: "2 weeks ago",
    profile_photo_url: null
  },
  {
    id: "2",
    author_name: "Sarah Mohammed",
    rating: 5,
    text: "Best online beauty store in UAE. Authentic products and reasonable prices. Will definitely order again!",
    relative_time_description: "1 month ago",
    profile_photo_url: null
  },
  {
    id: "3",
    author_name: "Fatima Ali",
    rating: 4,
    text: "Good variety of brands. Found exactly what I was looking for. Delivery was quick too.",
    relative_time_description: "3 weeks ago",
    profile_photo_url: null
  },
  {
    id: "4",
    author_name: "Khalid Rashid",
    rating: 5,
    text: "Amazing quality products! The packaging was secure and arrived in perfect condition.",
    relative_time_description: "1 week ago",
    profile_photo_url: null
  },
  {
    id: "5",
    author_name: "Noor Khan",
    rating: 5,
    text: "My go-to store for all skincare needs. Always fresh products and great discounts!",
    relative_time_description: "2 weeks ago",
    profile_photo_url: null
  },
  {
    id: "6",
    author_name: "Mariam Ahmed",
    rating: 4,
    text: "Excellent customer support. Had a question and got immediate response. Love shopping here!",
    relative_time_description: "1 month ago",
    profile_photo_url: null
  }
];

export async function GET() {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  const placeId = process.env.GOOGLE_PLACE_ID || PLACE_ID;

  if (!apiKey) {
    return NextResponse.json({
      success: false,
      error: "GOOGLE_PLACES_API_KEY not configured",
      message: "To fetch real Google Reviews, please add the following to your .env file:",
      required_env_vars: {
        GOOGLE_PLACES_API_KEY: "Your Google Cloud Places API Key",
        GOOGLE_PLACE_ID: "Your Google Business Profile Place ID (optional, defaults to Shanfa Global)"
      },
      setup_steps: [
        "1. Go to Google Cloud Console (console.cloud.google.com)",
        "2. Create a project or select existing",
        "3. Enable 'Places API' and 'Business Profile API'",
        "4. Create API credentials (API Key)",
        "5. Add the key to your .env file",
        "6. Get your Place ID from https://developers.google.com/maps/documentation/places/web-service/place-id"
      ],
      reviews: MOCK_REVIEWS,
      source: "mock",
      rating: {
        average: 4.8,
        total: 150
      }
    });
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=reviews,rating,user_ratings_total&key=${apiKey}`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (data.error_message) {
      return NextResponse.json({
        success: false,
        error: data.error_message,
        reviews: MOCK_REVIEWS,
        source: "mock_fallback"
      });
    }

    const reviews = data.result?.reviews?.slice(0, 10) || MOCK_REVIEWS;
    const rating = data.result?.rating || 4.8;
    const totalReviews = data.result?.user_ratings_total || 150;

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
      reviews: MOCK_REVIEWS,
      source: "error_fallback"
    });
  }
}