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
      },
      take: limit,
    });

    const formattedProducts = products.map(p => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: p.price || 0,
      discountPrice: p.discountPrice,
      mainImage: p.mainImage,
      imageUrl: p.mainImage,
      brand: p.brand?.name || "SHANFA",
      brandName: p.brand?.name || "SHANFA",
      category: p.subCategory?.category?.name,
      subCategory: p.subCategory?.name,
    }));

    return NextResponse.json({ products: formattedProducts });
  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json({ products: [] }, { status: 500 });
  }
}
