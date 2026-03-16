import { wooApi } from "@/lib/woocommerce";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

// Simple in-memory cache
let cachedProducts: any = null;
let lastFetchTime = 0;
const CACHE_DURATION = 1 * 60 * 1000; // 1 minute

export async function GET() {
  const now = Date.now();

  // Return cached data if available and not expired
  if (cachedProducts && (now - lastFetchTime < CACHE_DURATION)) {
    return NextResponse.json(cachedProducts);
  }

  try {
    // Optimization: Only fetch the fields we actually use
    const { data: wooProducts } = await wooApi.get("products", {
      status: "publish",
      per_page: 100,
      _fields: "id,name,description,attributes,images,stock_quantity,price,regular_price,sale_price,status,featured,on_sale,categories"
    });

    const products = wooProducts.map((p: any) => {
      const regularPrice = parseFloat(p.regular_price || p.price || "0");
      const salePrice = p.sale_price ? parseFloat(p.sale_price) : null;
      
      return {
        id: String(p.id),
        name: p.name,
        description: p.description,
        features: p.attributes?.map((attr: any) => `${attr.name}: ${attr.options.join(", ")}`) || [],
        images: p.images?.map((img: any) => img.src) || [],
        mainImage: p.images?.[0]?.src || null,
        stockQuantity: p.stock_quantity || 0,
        // Active price for sorting/filtering
        priceCents: Math.round((salePrice || regularPrice) * 100),
        // Original price for showing strikethrough
        regularPriceCents: Math.round(regularPrice * 100),
        // Sale price for showing sale badge
        salePriceCents: salePrice ? Math.round(salePrice * 100) : null,
        currency: "AED",
        active: p.status === "publish",
        hot: p.featured || false,
        trending: p.on_sale || false,
        brand: p.categories?.[0] ? { name: p.categories[0].name } : null,
        category: p.categories?.[1] ? { name: p.categories[1].name } : (p.categories?.[0] ? { name: p.categories[0].name } : null),
      };
    });

    // Update cache
    cachedProducts = products;
    lastFetchTime = now;

    return NextResponse.json(products, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      }
    });
  } catch (error) {
    console.error("WooCommerce API Error:", error);
    // Return cached data as fallback even if expired
    if (cachedProducts) {
      return NextResponse.json(cachedProducts, {
        headers: {
          'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=60',
        }
      });
    }
    return NextResponse.json([]);
  }
}
