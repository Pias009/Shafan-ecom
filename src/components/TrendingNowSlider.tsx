"use client";

import { Flame } from "lucide-react";
import { ProductCard } from "./ProductCard";
import { useLanguageStore } from "@/lib/language-store";
import { translations } from "@/lib/translations";

interface TrendingNowSliderProps {
  products: any[];
  onQuickView: (product: any) => void;
  onAddToCart: (product: any) => void;
  onOrderNow: (product: any) => void;
}

export function TrendingNowSlider({
  products,
  onQuickView,
  onAddToCart,
  onOrderNow
}: TrendingNowSliderProps) {
  const { currentLanguage } = useLanguageStore();
  const t = translations[currentLanguage.code as keyof typeof translations];
  
  if (products.length === 0) return null;

  return (
    <section id="trending" className="pt-4 md:pt-12 px-1 sm:px-4">
      <div className="mb-4 md:mb-8">
        <div className="inline-flex items-center gap-1.5 glass-panel rounded-full px-2.5 py-1 sm:px-3 sm:py-1.5 mb-1.5 sm:mb-2 w-fit">
          <Flame className="text-orange-500 fill-orange-400 w-3 h-3 sm:w-3.5 sm:h-3.5" />
          <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-black/60">Trending Now</span>
          <Flame className="text-red-500 fill-red-400 w-3 h-3 sm:w-3.5 sm:h-3.5" />
        </div>
        <h2 className="font-display text-2xl sm:text-4xl md:text-5xl text-black font-black tracking-tight">{t.home.trendingNow}</h2>
        <p className="font-body text-black/70 mt-1 text-sm sm:text-lg max-w-xl font-medium">{t.home.mostLoved}</p>
      </div>

      <div className="py-4 sm:py-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6 md:gap-8 px-2 sm:px-4">
          {products.map((product) => (
            <div
              key={product.id}
              className="transform transition-transform duration-300 hover:scale-[1.02]"
            >
              <div className="shadow-lg hover:shadow-xl rounded-xl sm:rounded-2xl bg-white/50 backdrop-blur-sm border border-black/5 transition-all duration-300 h-full">
                <ProductCard
                  product={{
                    ...product,
                    price: product.priceCents / 100,
                    imageUrl: product.mainImage,
                    brand: product.brand?.name,
                    averageRating: product.averageRating,
                    ratingCount: product.ratingCount,
                    stockQuantity: product.stockQuantity,
                    totalSales: product.totalSales,
                  }}
                  onQuickView={onQuickView}
                  onAddToCart={onAddToCart}
                  onOrderNow={onOrderNow}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}