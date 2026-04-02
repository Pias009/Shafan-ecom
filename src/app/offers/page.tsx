import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";

export const dynamic = "force-dynamic";

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

    // Process product-specific discounts
    activeDiscounts.forEach((discount: any) => {
      discount.productDiscounts.forEach((pd: any) => {
        const product = pd.product;
        if (!productsMap.has(product.id)) {
          const basePriceCents = product.priceCents || Math.round(product.price * 100);
          let discountedPrice = basePriceCents;

          if (discount.discountType === "PERCENTAGE") {
            discountedPrice = Math.round(basePriceCents * (1 - discount.value / 100));
          } else if (discount.discountType === "FIXED_AMOUNT") {
            discountedPrice = Math.max(0, basePriceCents - discount.value);
          }

          productsMap.set(product.id, {
            id: product.id,
            name: product.name,
            brand: product.brand,
            price: basePriceCents / 100,
            imageUrl: product.images?.[0] || "/placeholder-product.png",
            hot: product.hot,
            averageRating: product.averageRating,
            ratingCount: product.ratingCount,
            stockQuantity: product.stockQuantity,
            countryPrices: product.countryPrices,
            discountPrice: discountedPrice / 100,
            discountPercentage:
              discount.discountType === "PERCENTAGE"
                ? discount.value
                : Math.round(((basePriceCents - discountedPrice) / basePriceCents) * 100),
            discountCode: discount.code,
            freeDelivery: discount.discountType === "FREE_SHIPPING",
          });
        }
      });
    });

    const products = Array.from(productsMap.values());

    return (
      <main className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-gray-100">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 mb-4 transition"
            >
              <ArrowLeft size={16} />
              Back to Home
            </Link>
            <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-2">
              🎉 Special Offers & Discounts
            </h1>
            <p className="text-gray-600 text-sm md:text-base">
              {products.length} products on sale - Limited time offers!
            </p>
          </div>
        </div>

        {/* Products Grid */}
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-16">
          {products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
              {products.map((product) => (
                <div key={product.id} className="flex justify-center">
                  <ProductCard
                    product={{
                      ...product,
                      price: product.price * 100, // Convert back to cents for component
                      discountPrice: product.discountPrice
                        ? product.discountPrice * 100
                        : undefined,
                    }}
                    onQuickView={() => {}}
                    onAddToCart={() => {}}
                    onOrderNow={() => {}}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🎁</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                No Active Offers Right Now
              </h2>
              <p className="text-gray-600 mb-6">
                Check back soon for amazing discounts!
              </p>
              <Link
                href="/"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition"
              >
                Continue Shopping
              </Link>
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="bg-white border-t border-gray-200 py-12 md:py-16">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="text-4xl mb-3">💰</div>
                <h3 className="font-bold text-lg text-gray-900 mb-2">Save More</h3>
                <p className="text-gray-600 text-sm">
                  Use promo codes at checkout for additional savings
                </p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-3">🚚</div>
                <h3 className="font-bold text-lg text-gray-900 mb-2">
                  Free Shipping
                </h3>
                <p className="text-gray-600 text-sm">
                  On selected items - Check product details
                </p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-3">⏰</div>
                <h3 className="font-bold text-lg text-gray-900 mb-2">
                  Limited Time
                </h3>
                <p className="text-gray-600 text-sm">
                  These offers are valid for a limited period
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  } catch (error) {
    console.error("Error loading offers:", error);
    return (
      <main className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Error Loading Offers
          </h1>
          <p className="text-gray-600 mb-6">
            Something went wrong. Please try again later.
          </p>
          <Link href="/" className="text-blue-600 hover:underline font-semibold">
            Go Home
          </Link>
        </div>
      </main>
    );
  }
}
