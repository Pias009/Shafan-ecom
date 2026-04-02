"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";

export function OffersClient({ products }: { products: any[] }) {
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
                    price: product.price * 100,
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
                Free delivery on orders above certain amount
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-3">⚡</div>
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
}