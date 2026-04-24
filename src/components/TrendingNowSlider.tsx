"use client";

import { Flame, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { ProductCard } from "./ProductCard";
import { useLanguageStore } from "@/lib/language-store";
import { translations } from "@/lib/translations";
import Link from "next/link";

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
  const router = useRouter();
  const { currentLanguage } = useLanguageStore();
  const t = translations[currentLanguage.code as keyof typeof translations];
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  
  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      setTimeout(checkScroll, 300);
    }
  };
  
  if (products.length === 0) return null;

  return (
    <section id="trending" className="pt-2 md:pt-6 pb-6 md:pb-10 px-1 sm:px-4">
      <div className="mb-4 md:mb-8">
        <div className="inline-flex items-center gap-1.5 glass-panel rounded-full px-2.5 py-1 sm:px-3 sm:py-1.5 mb-1.5 sm:mb-2 w-fit">
          <Flame className="text-orange-500 fill-orange-400 w-3 h-3 sm:w-3.5 sm:h-3.5" />
          <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-black/60">Trending Now</span>
          <Flame className="text-red-500 fill-red-400 w-3 h-3 sm:w-3.5 sm:h-3.5" />
        </div>
        <div className="flex items-end justify-between">
          <div>
            <h2 className="font-display text-2xl sm:text-4xl md:text-5xl text-black font-black tracking-tight">{t.home.trendingNow}</h2>
            <p className="font-body text-black/70 mt-1 text-sm sm:text-lg max-w-xl font-medium">{t.home.mostLoved}</p>
          </div>
          <Link
            href="/products/trending"
            className="hidden sm:flex items-center gap-2 px-6 py-2.5 rounded-full bg-black text-white text-xs font-black uppercase tracking-widest hover:bg-gray-800 transition-colors shadow-md hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm"
          >
            See All Trending
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <div className="py-4 sm:py-8 relative">
        <div className="relative">
          {/* Left Scroll Button - Desktop Only */}
          <button
            onClick={() => scroll('left')}
            className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 sm:w-12 sm:h-12 items-center justify-center bg-white/90 backdrop-blur-sm rounded-full shadow-lg border border-black/10 hover:bg-white transition-all active:scale-95"
            disabled={!canScrollLeft}
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 text-black" />
          </button>

          {/* Right Scroll Button - Desktop Only */}
          <button
            onClick={() => scroll('right')}
            className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 sm:w-12 sm:h-12 items-center justify-center bg-white/90 backdrop-blur-sm rounded-full shadow-lg border border-black/10 hover:bg-white transition-all active:scale-95"
            disabled={!canScrollRight}
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-black" />
          </button>

          {/* Scrollable container */}
          <div 
            ref={scrollRef}
            onScroll={checkScroll}
            className="flex overflow-x-auto pb-6 md:pb-8 scrollbar-hide snap-x snap-mandatory px-2 sm:px-4 gap-2 sm:gap-3 md:gap-4"
          >
            {products.map((product, idx) => (
              <div key={product.id} className="flex-shrink-0 snap-start w-[150px] sm:w-[180px] md:w-[220px] lg:w-[260px]">
                <ProductCard
                  product={{
                    ...product,
                    price: product.price || product.priceCents || 0,
                    imageUrl: product.imageUrl || product.mainImage,
                    brand: product.brandName || product.brand?.name || "Generic",
                    averageRating: product.averageRating,
                    ratingCount: product.ratingCount,
                    stockQuantity: product.stockQuantity,
                    totalSales: product.totalSales,
                    countryPrices: product.countryPrices,
                  }}
                  onQuickView={onQuickView}
                  onAddToCart={onAddToCart}
                  onOrderNow={onOrderNow}
                  priority={idx < 4}
                />
              </div>
            ))}
          </div>
          
          {/* Mobile scroll hint */}
          <div className="flex flex-col items-center mt-4 md:mt-6 gap-2 sm:gap-3 md:hidden">
            <span className="text-[10px] sm:text-xs font-medium text-black/60 text-center px-2">
              Scroll horizontally to explore trending products
            </span>
            <div className="flex items-center gap-1.5 sm:gap-2 text-black/40">
              <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-[9px] sm:text-[10px] font-semibold">SWIPE</span>
              <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}