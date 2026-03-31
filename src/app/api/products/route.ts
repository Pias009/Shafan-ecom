import { NextResponse } from "next/server";
import { getProducts } from "@/lib/products";

export const revalidate = 60;
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    console.log("API: Starting products fetch...");
    console.log("API: DATABASE_URL exists:", !!process.env.DATABASE_URL);
    
    const { searchParams } = new URL(req.url);
    const store = searchParams.get('store');
    
    const products = await getProducts(store || undefined);
    
    console.log("API: Products fetched:", products.length);
    
    return NextResponse.json(products, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      }
    });
  } catch (error: any) {
    console.error("API Error:", error.message);
    console.error("API Error Code:", error.code);
    console.error("API Error Stack:", error.stack);
    return NextResponse.json({ 
      error: error.message,
      code: error.code,
      products: [] 
    }, { status: 200 });
  }
}
