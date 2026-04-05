import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const ids = searchParams.get("ids") || "";
  const country = searchParams.get("country") || "KW";

  if (!ids) {
    return NextResponse.json({ prices: {} });
  }

  const productIds = ids.split(",").filter((id) => /^[0-9a-fA-F]{24}$/.test(id));

  if (productIds.length === 0) {
    return NextResponse.json({ prices: {} });
  }

  try {
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
      },
      select: {
        id: true,
        countryPrices: {
          where: {
            country: country.toUpperCase(),
            active: true,
          },
        },
      },
    });

    const prices: Record<string, number> = {};
    products.forEach((product) => {
      if (product.countryPrices && product.countryPrices.length > 0) {
        prices[product.id] = Number(product.countryPrices[0].price) || 0;
      } else {
        prices[product.id] = 0;
      }
    });

    return NextResponse.json({ prices });
  } catch (error) {
    console.error("Failed to fetch product prices:", error);
    return NextResponse.json({ prices: {} }, { status: 500 });
  }
}