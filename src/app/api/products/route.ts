import { NextResponse } from "next/server";
import { getProducts } from "@/lib/products";

export const revalidate = 60; // Revalidate every 60 seconds (Incremental Static Regeneration)
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const store = searchParams.get('store');
    
    // Get all products - filtering happens on client side to avoid hydration mismatches
    const products = await getProducts(store || undefined);
    
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
