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
    <section id="trending" className="pt-4 md:pt-12 pb-12 md:pb-20 px-1 sm:px-4">
      <div className="mb-4 md:mb-8">
        <div className="inline-flex items-center gap-1.5 glass-panel rounded-full px-2.5 py-1 sm:px-3 sm:py-1.5 mb-1.5 sm:mb-2 w-fit">
          <Flame className="text-orange-500 fill-orange-400 w-3 h-3 sm:w-3.5 sm:h-3.5" />
          <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-black/60">Trending Now</span>
          <Flame className="text-red-500 fill-red-400 w-3 h-3 sm:w-3.5 sm:h-3.5" />
        </div>
        <h2 className="font-display text-2xl sm:text-4xl md:text-5xl text-black font-black tracking-tight">{t.home.trendingNow}</h2>
        <p className="font-body text-black/70 mt-1 text-sm sm:text-lg max-w-xl font-medium">{t.home.mostLoved}</p>
      </div>

      <div className="py-4 sm:py-8 relative">
        {/* Horizontal scroll container */}
        <div className="relative">
          {/* Scrollable container */}
          <div className="flex overflow-x-auto pb-6 md:pb-8 scrollbar-hide snap-x snap-mandatory px-2 sm:px-4 gap-2 sm:gap-3 md:gap-4">
            {products.map((product) => (
              <div key={product.id} className="flex-shrink-0 snap-start w-[150px] sm:w-[180px] md:w-[220px] lg:w-[260px]">
                <ProductCard
                  product={{
                    ...product,
                    price: product.price || product.priceCents || 0,
                    imageUrl: product.mainImage,
                    brand: product.brand?.name,
                    averageRating: product.averageRating,
                    ratingCount: product.ratingCount,
                    stockQuantity: product.stockQuantity,
                    totalSales: product.totalSales,
                    countryPrices: product.countryPrices,
                  }}
                  onQuickView={onQuickView}
                  onAddToCart={onAddToCart}
                  onOrderNow={onOrderNow}
                />
              </div>
            ))}
          </div>
          
          {/* Enhanced sliding indicator with 2-second animation */}
          <div className="flex flex-col items-center mt-4 md:mt-6 gap-2 sm:gap-3">
            {/* Text hint - responsive text size */}
            <span className="text-[10px] sm:text-xs font-medium text-black/60 text-center px-2">
              Scroll horizontally to explore trending products
            </span>
            
            {/* Modern sliding indicator container - responsive width */}
            <div className="relative w-32 sm:w-40 md:w-48 h-1.5 bg-black/10 rounded-full overflow-hidden">
              {/* Sliding bar with gradient and 2-second animation */}
              <div className="absolute top-0 left-0 h-full w-1/3 bg-gradient-to-r from-orange-400 via-red-500 to-orange-400 animate-slideIndicator rounded-full" />
              
              {/* Pulsing dots for additional visual interest - responsive size */}
              <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full animate-pulse"
                   style={{ animationDelay: '0.3s' }} />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full animate-pulse"
                   style={{ animationDelay: '0.6s' }} />
              <div className="absolute top-1/2 left-3/4 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full animate-pulse"
                   style={{ animationDelay: '0.9s' }} />
            </div>
            
            {/* Arrow indicators - responsive size */}
            <div className="flex items-center gap-1.5 sm:gap-2 text-black/40">
              <svg className="w-3 h-3 sm:w-4 sm:h-4 animate-bounceLeft" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-[9px] sm:text-[10px] font-semibold">SWIPE</span>
              <svg className="w-3 h-3 sm:w-4 sm:h-4 animate-bounceRight" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>
        
        {/* Add CSS animations for the sliding indicator */}
        <style jsx>{`
          @keyframes slideIndicator {
            0% {
              transform: translateX(-100%);
            }
            100% {
              transform: translateX(300%);
            }
          }
          
          @keyframes bounceLeft {
            0%, 100% {
              transform: translateX(0);
            }
            50% {
              transform: translateX(-4px);
            }
          }
          
          @keyframes bounceRight {
            0%, 100% {
              transform: translateX(0);
            }
            50% {
              transform: translateX(4px);
            }
          }
          
          .animate-slideIndicator {
            animation: slideIndicator 2s ease-in-out infinite;
          }
          
          .animate-bounceLeft {
            animation: bounceLeft 1.5s ease-in-out infinite;
          }
          
          .animate-bounceRight {
            animation: bounceRight 1.5s ease-in-out infinite;
            animation-delay: 0.5s;
          }
        `}</style>
      </div>
    </section>
  );
}