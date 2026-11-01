import { NextRequest, NextResponse } from "next/server";
import { getActivePopupBanner } from "@/lib/popup-banner";

// GET /api/popup-banner?country=AE — the site-wide popup banner for this
// country, or { banner: null }. Shared-cached briefly; admin edits show within a minute.
export async function GET(request: NextRequest) {
  const country = (request.nextUrl.searchParams.get("country") || "AE").slice(0, 2);
  try {
    const banner = await getActivePopupBanner(country);
    return NextResponse.json(
      { banner },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } }
    );
  } catch (error) {
    console.error("Popup banner lookup failed:", error);
    return NextResponse.json({ banner: null });
  }
}
