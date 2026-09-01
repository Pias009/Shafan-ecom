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
  
  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -320 : 320;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };
  
  if (products.length === 0) return null;

  return (
    <section id="trending" className="pt-8 md:pt-12 pb-8 md:pb-12 px-1 sm:px-4 text-white">
      <div className="mb-4 md:mb-8 flex items-center justify-between border-b border-white/30 pb-4">
        <div className="inline-flex items-center gap-3">
          <span className="h-px w-6 bg-white/50" />
          <h2 className="font-serif text-2xl sm:text-4xl md:text-5xl font-medium tracking-tight text-white uppercase drop-shadow-sm">{t.home.trendingNow}</h2>
          <span className="h-px w-6 bg-white/50 hidden sm:inline-block" />
        </div>
        <Link
          href="/products/trending"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-white/40 bg-white/15 text-white hover:bg-white hover:text-[#0c433a] transition-all text-xs font-black uppercase tracking-wider shadow-sm"
        >
          <span>VIEW ALL</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="py-2 sm:py-4 relative">
        <button
          onClick={() => scroll('left')}
          className="hidden md:flex absolute -left-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 items-center justify-center bg-white shadow-xl rounded-full border border-[#c5e1d7] text-[#0c433a] hover:bg-[#0c433a] hover:text-white transition-all active:scale-95"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <button
          onClick={() => scroll('right')}
          className="hidden md:flex absolute -right-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 items-center justify-center bg-white shadow-xl rounded-full border border-[#c5e1d7] text-[#0c433a] hover:bg-[#0c433a] hover:text-white transition-all active:scale-95"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        <div 
          ref={scrollRef}
          className="flex overflow-x-auto pb-4 md:pb-6 scrollbar-hide snap-x snap-mandatory px-1 sm:px-2 gap-3 sm:gap-4 md:gap-5"
        >
          {products.map((product, idx) => (
            <div key={product.id} className="flex-shrink-0 snap-start w-[160px] sm:w-[200px] md:w-[240px] lg:w-[270px]">
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
      </div>
    </section>
  );
}