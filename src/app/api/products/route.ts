import { NextResponse } from "next/server";
import { getProducts } from "@/lib/products";

export const revalidate = 3600;
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const store = searchParams.get('store');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    
    const products = await getProducts(store || undefined, page, limit);
    
    return NextResponse.json(products, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      }
    });
  } catch (error: any) {
    console.error("API Error:", error.message);
    return NextResponse.json({ 
      error: error.message,
      products: [] 
    }, { status: 200 });
  }
}
