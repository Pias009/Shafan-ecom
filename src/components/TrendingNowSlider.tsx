"use client";

import { memo } from "react";
import { Flame, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, useMemo } from "react";
import { ProductCard } from "./ProductCard";
import { useLanguageStore } from "@/lib/language-store";
import { translations } from "@/lib/translations";
import Link from "next/link";

interface TrendingNowSliderProps {
  products: { id: string; name: string; price?: number; priceCents?: number; discountPrice?: number; salePrice?: number; salePriceCents?: number; imageUrl?: string; mainImage?: string; brandName?: string; brand?: { name: string }; averageRating?: number; ratingCount?: number; stockQuantity?: number; totalSales?: number; countryPrices?: unknown[]; hot?: boolean; trending?: boolean }[];
  onQuickView: (product: unknown) => void;
  onAddToCart: (product: unknown) => void;
  onOrderNow: (product: unknown) => void;
}

function transformProduct(product: { id: string; name: string; price?: number; priceCents?: number; discountPrice?: number; salePrice?: number; salePriceCents?: number; imageUrl?: string; mainImage?: string; brandName?: string; brand?: { name: string }; averageRating?: number; ratingCount?: number; stockQuantity?: number; totalSales?: number; countryPrices?: unknown[]; hot?: boolean; trending?: boolean }) {
  return {
    id: product.id,
    name: product.name,
    price: product.price || product.priceCents || 0,
    discountPrice: product.discountPrice || product.salePrice || product.salePriceCents,
    imageUrl: product.imageUrl || product.mainImage || "/placeholder-product.png",
    brand: product.brandName || product.brand?.name || "Generic",
    averageRating: product.averageRating,
    ratingCount: product.ratingCount,
    stockQuantity: product.stockQuantity,
    totalSales: product.totalSales,
    countryPrices: product.countryPrices,
    hot: product.hot,
    trending: product.trending,
  };
}

const ProductCardItem = memo(function ProductCardItem({
  product,
  onQuickView,
  onAddToCart,
  onOrderNow,
  priority,
}: {
  product: { id: string; name: string; price?: number; priceCents?: number; discountPrice?: number; salePrice?: number; salePriceCents?: number; imageUrl?: string; mainImage?: string; brandName?: string; brand?: { name: string }; averageRating?: number; ratingCount?: number; stockQuantity?: number; totalSales?: number; countryPrices?: unknown[]; hot?: boolean; trending?: boolean };
  onQuickView: (product: unknown) => void;
  onAddToCart: (product: unknown) => void;
  onOrderNow: (product: unknown) => void;
  priority: boolean;
}) {
  const transformed = useMemo(() => transformProduct(product), [product.id, product.name, product.price, product.priceCents, product.discountPrice, product.salePrice, product.salePriceCents, product.imageUrl, product.mainImage, product.brandName, product.brand, product.averageRating, product.ratingCount, product.stockQuantity, product.totalSales, product.countryPrices, product.hot, product.trending]);
  return (
    <ProductCard
      product={transformed}
      onQuickView={onQuickView}
      onAddToCart={onAddToCart}
      onOrderNow={onOrderNow}
      priority={priority}
    />
  );
});

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
  const [scrollProgress, setScrollProgress] = useState(0);

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      const maxScroll = scrollWidth - clientWidth;
      if (maxScroll > 0) {
        setScrollProgress((scrollLeft / maxScroll) * 100);
      }
    }
  };
  
  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const amount = scrollRef.current.clientWidth;
      scrollRef.current.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
    }
  };

  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (scrollRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickRatio = (e.clientX - rect.left) / rect.width;
      const maxScroll = scrollRef.current.scrollWidth - scrollRef.current.clientWidth;
      scrollRef.current.scrollTo({ left: clickRatio * maxScroll, behavior: 'smooth' });
    }
  };

  const thumbWidthPct = Math.max(20, Math.min(60, products.length > 0 ? (4 / products.length) * 100 : 30));
  
  if (products.length === 0) return null;

  return (
    <section id="trending" className="pt-8 md:pt-12 pb-8 md:pb-12 px-1 sm:px-4 text-gray-900">
      <div className="mb-4 md:mb-8 flex items-center justify-between border-b border-pink-100 pb-4">
        <div className="inline-flex items-center gap-3">
          <span className="h-px w-6 bg-[#890754]/30" />
          <h2 className="font-serif text-2xl sm:text-4xl md:text-5xl font-medium tracking-tight text-gray-900 uppercase">{t.home.trendingNow}</h2>
          <span className="h-px w-6 bg-[#890754]/30 hidden sm:inline-block" />
        </div>
        <Link
          href="/products/trending"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-pink-200 bg-white text-[#890754] hover:bg-pink-50 hover:text-[#540434] transition-all text-xs font-black uppercase tracking-wider shadow-xs"
        >
          <span>VIEW ALL</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="py-2 sm:py-4 relative">
        <button
          onClick={() => scroll('left')}
          className="hidden md:flex absolute -left-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 items-center justify-center bg-white shadow-xl rounded-full border border-pink-100 text-[#890754] hover:bg-[#890754] hover:text-white transition-all active:scale-95"
          aria-label="Previous trending products"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <button
          onClick={() => scroll('right')}
          className="hidden md:flex absolute -right-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 items-center justify-center bg-white shadow-xl rounded-full border border-pink-100 text-[#890754] hover:bg-[#890754] hover:text-white transition-all active:scale-95"
          aria-label="Next trending products"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        <div 
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex overflow-x-auto pb-4 md:pb-6 scrollbar-hide snap-x snap-mandatory px-1.5 sm:px-2 gap-2 sm:gap-3 lg:gap-4"
        >
          {products.map((product, idx) => (
            <div key={product.id} className="flex-shrink-0 snap-start w-[calc(38%-6px)] sm:w-[calc(28%-8px)] md:w-[calc(22%-10px)] lg:w-[calc(19%-12px)]">
              <ProductCardItem
                product={product}
                onQuickView={onQuickView}
                onAddToCart={onAddToCart}
                onOrderNow={onOrderNow}
                priority={idx < 4}
              />
            </div>
          ))}
        </div>

        {/* Bottom Slide Indicator / Track Line */}
        <div className="mt-3 sm:mt-5 flex flex-col items-center justify-center gap-1.5 select-none">
          <div 
            onClick={handleTrackClick}
            className="w-36 sm:w-56 h-1 sm:h-1.5 bg-pink-100/90 hover:bg-pink-200/90 rounded-full relative overflow-hidden cursor-pointer shadow-inner transition-colors"
            title="Click to navigate trending products"
          >
            <div
              className="h-full bg-gradient-to-r from-[#540434] via-[#890754] to-pink-500 rounded-full transition-all duration-150 ease-out"
              style={{
                width: `${thumbWidthPct}%`,
                marginLeft: `${(scrollProgress / 100) * (100 - thumbWidthPct)}%`,
              }}
            />
          </div>
          <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-gray-400 tracking-wider uppercase">
            <span className="inline-block animate-pulse text-[#890754]">‹</span>
            <span>Slide or Drag to explore</span>
            <span className="inline-block animate-pulse text-[#890754]">›</span>
          </div>
        </div>
      </div>
    </section>
  );
}