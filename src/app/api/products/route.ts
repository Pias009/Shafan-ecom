import { NextResponse } from "next/server";
import { getProducts } from "@/lib/products";

export const revalidate = 60; // Revalidate every 60 seconds (Incremental Static Regeneration)

export async function GET() {
  try {
    const products = await getProducts();
    
    return NextResponse.json(products, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      }
    });
  } catch (error) {
    console.error("MongoDB Products Fetch Error:", error);
    // Return empty array to prevent complete crash on error
    return NextResponse.json([], { status: 500 });
  }
}
