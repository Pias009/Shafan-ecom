import { NextResponse } from "next/server";
import { getProducts } from "@/lib/products";

export const revalidate = 60;
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const store = searchParams.get('store');
    
    const products = await getProducts(store || undefined);
    
    return NextResponse.json(products, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
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
