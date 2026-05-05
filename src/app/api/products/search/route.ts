import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q") || "";
  const limit = parseInt(searchParams.get("limit") || "10");

  if (!query || query.length < 2) {
    return NextResponse.json({ products: [] });
  }

  try {
    const products = await prisma.product.findMany({
      where: {
        active: true,
        OR: [
          {
            name: {
              contains: query,
              mode: "insensitive",
            },
          },
          {
            brand: {
              name: {
                contains: query,
                mode: "insensitive",
              },
            },
          },
          {
            subCategory: {
              name: {
                contains: query,
                mode: "insensitive",
              },
            },
          },
        ],
      },
      include: {
        brand: {
          select: {
            name: true,
          },
        },
        subCategory: {
          select: {
            name: true,
            category: {
              select: {
                name: true,
              },
            },
          },
        },
        countryPrices: true,
      },
      take: limit,
    });

    const cookieStore = req.headers.get('cookie') || '';
    const storeCodeMatch = cookieStore.match(/store_code=([^;]+)/);
    const storeCode = storeCodeMatch ? storeCodeMatch[1] : 'UAE';
    
    const countryMap: Record<string, string> = {
      'UAE': 'AE', 'SAUDI': 'SA', 'KUWAIT': 'KW', 'BAHRAIN': 'BH', 'OMAN': 'OM', 'QATAR': 'QA',
    };
    const userCountry = countryMap[storeCode.toUpperCase()] || 'AE';

    const formattedProducts = products.map(p => {
      // Get price from country-specific prices if available
      let price = Number(p.price) || 0;
      let currency = (p as any).currency || 'USD';

      if ((p as any).countryPrices && (p as any).countryPrices.length > 0) {
        const countryPrice = (p as any).countryPrices.find((cp: any) => cp.country === userCountry && cp.active);
        if (countryPrice && Number(countryPrice.price) > 0) {
          price = Number(countryPrice.price);
          currency = countryPrice.currency || 'AED';
        }
      }

      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        price: price,
        currency: currency,
        discountPrice: p.discountPrice,
        mainImage: p.mainImage,
        imageUrl: p.mainImage,
        brand: p.brand?.name || "SHANFA",
        brandName: p.brand?.name || "SHANFA",
        category: p.subCategory?.category?.name,
        subCategory: p.subCategory?.name,
        countryPrices: (p as any).countryPrices || [],
      };
    });

    return NextResponse.json({ products: formattedProducts });
  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json({ products: [] }, { status: 500 });
  }
}
