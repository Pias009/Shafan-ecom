export const revalidate = 60; // Revalidate every 60 seconds

export async function getProducts() {
  try {
    const woocommerceUrl = (process.env.NEXT_PUBLIC_WOOCOMMERCE_URL || "").replace(/\/$/, "");
    const consumerKey = process.env.WOOCOMMERCE_CONSUMER_KEY || "";
    const consumerSecret = process.env.WOOCOMMERCE_CONSUMER_SECRET || "";

    // Generate Basic Auth token for WooCommerce REST API
    const authHeader = `Basic ${Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64')}`;

    // Use Next.js native fetch to leverage its aggressive Data Cache
    const url = new URL(`${woocommerceUrl}/wp-json/wc/v3/products`);
    url.searchParams.append("status", "publish");
    url.searchParams.append("per_page", "100");
    url.searchParams.append("_fields", "id,name,description,attributes,images,stock_quantity,price,regular_price,sale_price,status,featured,on_sale,categories,average_rating,rating_count,total_sales");

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Authorization": authHeader,
        "Content-Type": "application/json",
      },
      next: {
        revalidate: 60, // Cache on Vercel Edge/Server for 60 seconds
        tags: ['products'], 
      }
    });

    if (!response.ok) {
      throw new Error(`WooCommerce API responded with status: ${response.status}`);
    }

    const wooProducts = await response.json();

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
        averageRating: parseFloat(p.average_rating || "0"),
        ratingCount: p.rating_count || 0,
        totalSales: p.total_sales || 0,
        priceCents: Math.round((salePrice || regularPrice) * 100),
        regularPriceCents: Math.round(regularPrice * 100),
        salePriceCents: salePrice ? Math.round(salePrice * 100) : null,
        currency: "AED",
        active: p.status === "publish",
        hot: p.featured || false,
        trending: p.on_sale || false,
        brand: p.categories?.[0] ? { name: p.categories[0].name } : null,
        category: p.categories?.[1] ? { name: p.categories[1].name } : (p.categories?.[0] ? { name: p.categories[0].name } : null),
      };
    });

    return products;
  } catch (error) {
    console.error("WooCommerce Products Fetch Error:", error);
    return [];
  }
}

export async function getProduct(id: string) {
  try {
    const woocommerceUrl = (process.env.NEXT_PUBLIC_WOOCOMMERCE_URL || "").replace(/\/$/, "");
    const consumerKey = process.env.WOOCOMMERCE_CONSUMER_KEY || "";
    const consumerSecret = process.env.WOOCOMMERCE_CONSUMER_SECRET || "";

    const response = await fetch(`${woocommerceUrl}/wp-json/wc/v3/products/${id}`, {
      method: "GET",
      headers: {
        "Authorization": `Basic ${Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64')}`,
        "Content-Type": "application/json",
      },
      next: {
        revalidate: 60,
        tags: [`product-${id}`],
      }
    });

    if (!response.ok) throw new Error(`Failed to fetch product ${id}`);
    const p = await response.json();

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
      averageRating: parseFloat(p.average_rating || "0"),
      ratingCount: p.rating_count || 0,
      totalSales: p.total_sales || 0,
      priceCents: Math.round((salePrice || regularPrice) * 100),
      regularPriceCents: Math.round(regularPrice * 100),
      salePriceCents: salePrice ? Math.round(salePrice * 100) : null,
      currency: "AED",
      active: p.status === "publish",
      hot: p.featured || false,
      trending: p.on_sale || false,
      brand: p.categories?.[0] ? { name: p.categories[0].name } : null,
      category: p.categories?.[1] ? { name: p.categories[1].name } : (p.categories?.[0] ? { name: p.categories[0].name } : null),
      related_ids: p.related_ids || [],
    };
  } catch (error) {
    console.error("WooCommerce Product Fetch Error:", error);
    return null;
  }
}

