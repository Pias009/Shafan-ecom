import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { OffersClient } from "./OffersClient";

export const revalidate = 3600;

interface ProductWithDiscount {
  id: string;
  name: string;
  brand?: any;
  price: number;
  imageUrl: string;
  hot?: boolean;
  averageRating?: number;
  ratingCount?: number;
  stockQuantity?: number;
  countryPrices?: any[];
  discountPrice?: number;
  discountPercentage?: number;
  discountCode?: string;
  freeDelivery?: boolean;
}

export default async function OffersPage() {
  try {
    // Fetch products that have a manually set discountPrice
    const manualOfferProducts = await prisma.product.findMany({
      where: {
        active: true,
        discountPrice: { gt: 0 }
      },
      include: {
        brand: true,
        countryPrices: true,
      }
    });

    // Fetch all active discounts with their linked products
    const activeDiscounts = await (prisma as any).discount.findMany({
      where: {
        active: true,
        status: "ACTIVE",
        AND: [
          {
            OR: [
              { startDate: null },
              { startDate: { lte: new Date() } },
            ]
          },
          {
            OR: [
              { endDate: null },
              { endDate: { gte: new Date() } },
            ]
          }
        ]
      },
      include: {
        productDiscounts: {
          include: {
            product: true,
          },
        },
        categoryDiscounts: {
          include: {
            category: true,
          },
        },
      },
    });

    // Build product map with discounts
    const productsMap = new Map<string, ProductWithDiscount>();

    // Process manual offer products first
    manualOfferProducts.forEach((product: any) => {
      const basePrice = product.price || 0;
      const discountedPrice = product.discountPrice;
      const discountPercentage = Math.round(((basePrice - discountedPrice) / basePrice) * 100);

      productsMap.set(product.id, {
        id: product.id,
        name: product.name,
        brand: product.brand,
        price: basePrice,
        imageUrl: product.images?.[0] || product.mainImage || "/placeholder-product.png",
        hot: product.hot,
        averageRating: product.averageRating,
        ratingCount: product.ratingCount,
        stockQuantity: product.stockQuantity,
        countryPrices: product.countryPrices,
        discountPrice: discountedPrice,
        discountPercentage: discountPercentage,
        discountCode: "SALE",
        freeDelivery: false,
      });
    });

    // Process product-specific discounts
    activeDiscounts.forEach((discount: any) => {
      discount.productDiscounts.forEach((pd: any) => {
        const product = pd.product;
        const basePrice = product.price || product.priceCents || 0;
          let discountedPrice = basePrice;

          if (discount.discountType === "PERCENTAGE") {
            discountedPrice = Math.round(basePrice * (1 - discount.value / 100));
          } else if (discount.discountType === "FIXED_AMOUNT") {
            discountedPrice = Math.max(0, basePrice - discount.value);
          }

          productsMap.set(product.id, {
            id: product.id,
            name: product.name,
            brand: product.brand,
            price: basePrice,
            imageUrl: product.images?.[0] || "/placeholder-product.png",
            hot: product.hot,
            averageRating: product.averageRating,
            ratingCount: product.ratingCount,
            stockQuantity: product.stockQuantity,
            countryPrices: product.countryPrices,
            discountPrice: discountedPrice,
            discountPercentage:
              discount.discountType === "PERCENTAGE"
                ? discount.value
                : Math.round(((basePrice - discountedPrice) / basePrice) * 100),
            discountCode: discount.code,
            freeDelivery: discount.discountType === "FREE_SHIPPING",
      });
    });
  });

    const products = Array.from(productsMap.values());
    
    // Extract coupons (discounts with codes)
    const coupons = activeDiscounts
      .filter((d: any) => d.code && d.code !== "SALE")
      .map((d: any) => ({
        id: d.id,
        code: d.code,
        description: d.description || `${d.value}${d.discountType === "PERCENTAGE" ? "%" : " USD"} OFF`,
        discountType: d.discountType,
        value: d.value,
        endDate: d.endDate,
      }));

    return <OffersClient products={products} coupons={coupons} />;
  } catch (error) {
    console.error("Error loading offers:", error);
    return <OffersClient products={[]} coupons={[]} />;
  }
}
