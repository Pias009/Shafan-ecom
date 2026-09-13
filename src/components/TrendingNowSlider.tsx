"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, ShoppingCart, Heart } from "lucide-react";
import { Price } from "./Price";
import { useLanguageStore } from "@/lib/language-store";

interface TrendingProduct {
  id: string;
  name: string;
  slug?: string;
  price?: number;
  priceCents?: number;
  discountPrice?: number;
  salePrice?: number;
  salePriceCents?: number;
  imageUrl?: string;
  mainImage?: string;
  brandName?: string;
  brand?: { name: string } | string;
  averageRating?: number;
  ratingCount?: number;
  stockQuantity?: number;
  totalSales?: number;
  countryPrices?: any[];
  hot?: boolean;
  trending?: boolean;
  shortDescription?: string;
  description?: string;
}

interface TrendingNowSliderProps {
  products: TrendingProduct[];
  onQuickView: (product: any) => void;
  onAddToCart: (product: any) => void;
  onOrderNow?: (product: any) => void;
}

const BADGES = ["BEST SELLER", "TRENDING", "POPULAR", "NEW"];

export function TrendingNowSlider({
  products,
  onQuickView,
  onAddToCart,
}: TrendingNowSliderProps) {
  const router = useRouter();
  const { currentLanguage } = useLanguageStore();
  const isAr = currentLanguage?.code === "ar";
  const [activeIndex, setActiveIndex] = useState(2);
  const [wishlist, setWishlist] = useState<Record<string, boolean>>({});
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [windowWidth, setWindowWidth] = useState(1200);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (!products || products.length === 0) return null;

  const total = products.length;
  const safeActiveIndex = total > 0 ? (activeIndex >= total ? Math.min(2, total - 1) : activeIndex) : 0;

  const handlePrev = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + total) % total);
  }, [total]);

  const handleNext = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % total);
  }, [total]);

  useEffect(() => {
    if (total <= 1 || isPaused) return;
    const timer = setInterval(() => {
      handleNext();
    }, 2000);
    return () => clearInterval(timer);
  }, [total, isPaused, handleNext]);

  const toggleWishlist = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setWishlist((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCardClick = (product: TrendingProduct, diff: number) => {
    if (diff !== 0) {
      // If clicking a side card, animate it to center
      setActiveIndex(products.findIndex((p) => p.id === product.id));
    } else {
      // If clicking active center card, open quick view or navigate
      if (onQuickView) {
        onQuickView(product);
      } else if (product.slug || product.id) {
        router.push(`/products/${product.slug || product.id}`);
      }
    }
  };

  // Touch handlers for mobile swipe
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const touchEnd = e.changedTouches[0].clientX;
    const distance = touchStart - touchEnd;
    if (distance > 45) {
      handleNext();
    } else if (distance < -45) {
      handlePrev();
    }
    setTouchStart(null);
  };

  // Spacing calibrated for wider luxury card footprint
  const isMobile = windowWidth < 640;
  const isTablet = windowWidth >= 640 && windowWidth < 1024;
  const step = isMobile ? 140 : isTablet ? 172 : 200;

  return (
    <section
      id="trending"
      className="relative w-full py-8 sm:py-12 px-2 sm:px-4 bg-transparent select-none overflow-hidden my-4 sm:my-6"
    >
      {/* Soft Ambient Illumination */}
      <div className="absolute inset-0 pointer-events-none -z-10 flex items-center justify-center">
        <div className="w-[700px] h-[350px] bg-gradient-to-r from-pink-500/5 via-[#890754]/5 to-amber-500/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-[1536px] mx-auto">
        {/* 1. Header: Pure Luxury Animated Brand Heading (No Extra Text) */}
        <div className="flex flex-col items-center justify-center mb-6 sm:mb-8 text-center">
          <h2 className="fancy-brand-heading font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-[#890754] tracking-tight sm:tracking-normal select-none">
            {isAr ? "المنتجات الأكثر رواجاً" : "Trending Now"}
          </h2>
          <div className="luxury-heading-line h-0.5 mt-2 sm:mt-2.5 bg-gradient-to-r from-transparent via-[#890754] to-transparent rounded-full" />
        </div>

        {/* 2. 3D Coverflow Product Carousel Track - Wider Card Scale */}
        <div
          className="relative w-full h-[280px] sm:h-[310px] md:h-[330px] flex items-center justify-center"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Left Navigation Chevron */}
          <button
            onClick={handlePrev}
            aria-label="Previous product"
            className="no-min-size absolute left-0.5 sm:left-3 md:left-6 top-1/2 -translate-y-1/2 z-40 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white shadow-[0_3px_12px_rgba(137,7,84,0.12)] border border-pink-100 flex items-center justify-center text-[#890754] hover:bg-[#890754] hover:text-white hover:scale-110 active:scale-95 transition-all"
            style={{ minWidth: 0, minHeight: 0 }}
          >
            <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.2]" />
          </button>

          {/* Right Navigation Chevron */}
          <button
            onClick={handleNext}
            aria-label="Next product"
            className="no-min-size absolute right-0.5 sm:right-3 md:right-6 top-1/2 -translate-y-1/2 z-40 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white shadow-[0_3px_12px_rgba(137,7,84,0.12)] border border-pink-100 flex items-center justify-center text-[#890754] hover:bg-[#890754] hover:text-white hover:scale-110 active:scale-95 transition-all"
            style={{ minWidth: 0, minHeight: 0 }}
          >
            <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.2]" />
          </button>

          {/* Cards Stage */}
          <div className="relative w-full h-full flex items-center justify-center overflow-visible">
            {products.map((product, i) => {
              // Calculate circular offset relative to safeActiveIndex
              let diff = (i - safeActiveIndex) % total;
              if (diff > total / 2) diff -= total;
              if (diff < -total / 2) diff += total;

              // Only render cards within visibility range
              const isVisible = Math.abs(diff) <= (isMobile ? 1 : 2);
              if (!isVisible) return null;

              const isActive = diff === 0;
              const isNeighbor = Math.abs(diff) === 1;

              const scale = isActive ? 1.06 : isNeighbor ? 0.88 : 0.75;
              const zIndex = isActive ? 30 : isNeighbor ? 20 : 10;
              const opacity = isActive ? 1 : isNeighbor ? (isMobile ? 0.58 : 0.88) : 0.65;
              const offsetX = diff * step;

              const badge = BADGES[i % BADGES.length];
              const isLiked = !!wishlist[product.id];
              const imgSrc = product.imageUrl || product.mainImage || "/placeholder-product.png";
              const price = product.price || product.priceCents || 0;
              const displayPrice = product.discountPrice || product.salePrice || price;
              const rating = product.averageRating ? product.averageRating.toFixed(1) : "4.8";
              const reviews = product.ratingCount || 75 + ((i * 17) % 65);
              const brandName = typeof product.brand === "string" ? product.brand : product.brand?.name || product.brandName || "Shafan";
              const shortDesc = product.shortDescription || `${brandName} clinical formula for radiant glow.`;

              return (
                <div
                  key={product.id}
                  onClick={() => handleCardClick(product, diff)}
                  style={{
                    transform: `translate(calc(-50% + ${offsetX}px), -50%) scale(${scale})`,
                    zIndex,
                    opacity,
                    transition: "transform 0.45s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.35s ease-out, box-shadow 0.35s ease-out",
                  }}
                  className={`absolute top-1/2 left-1/2 w-[162px] sm:w-[195px] md:w-[220px] rounded-2xl bg-white p-2.5 sm:p-3 flex flex-col justify-between cursor-pointer border select-none transition-all ${
                    isActive
                      ? "border-[#890754]/30 shadow-[0_16px_36px_-8px_rgba(137,7,84,0.18),0_4px_12px_-3px_rgba(0,0,0,0.04)] ring-1 ring-[#890754]/20"
                      : "border-pink-100/90 shadow-[0_6px_16px_-4px_rgba(137,7,84,0.06)] hover:shadow-md hover:border-pink-200"
                  }`}
                >
                  {/* Top Bar: Pill Tag + Heart Wishlist */}
                  <div className="flex items-center justify-between w-full mb-0.5">
                    <span className="px-1.5 py-0.5 rounded-full text-[7.5px] sm:text-[8px] font-black uppercase tracking-wider bg-pink-50 text-[#890754] border border-pink-200/80">
                      {badge}
                    </span>
                    <button
                      onClick={(e) => toggleWishlist(e, product.id)}
                      aria-label="Save to wishlist"
                      className="no-min-size w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white hover:bg-pink-50/50 border border-gray-100 shadow-2xs flex items-center justify-center transition-colors"
                      style={{ minWidth: 0, minHeight: 0 }}
                    >
                      <Heart
                        size={11}
                        className={isLiked ? "text-rose-500 fill-rose-500" : "text-gray-400 hover:text-rose-500"}
                      />
                    </button>
                  </div>

                  {/* Clean Floating Product Image - Wider Proportion */}
                  <div className="relative w-full h-[98px] sm:h-[115px] md:h-[128px] flex items-center justify-center my-0.5 pointer-events-none">
                    <Image
                      src={imgSrc}
                      alt={product.name}
                      fill
                      sizes="(max-width: 640px) 170px, 220px"
                      className="object-contain p-1 transition-transform duration-500 hover:scale-105"
                      priority={isActive}
                    />
                  </div>

                  {/* Micro Pagination Dots below image (harmonized with brand palette) */}
                  <div className="flex items-center justify-center gap-1 my-0.5 pointer-events-none">
                    <span className="w-1 h-1 rounded-full bg-[#890754]" />
                    <span className="w-1 h-1 rounded-full bg-pink-200" />
                    <span className="w-1 h-1 rounded-full bg-pink-200" />
                  </div>

                  {/* Title & Description */}
                  <div className="flex flex-col mt-0.5">
                    <h3 className="font-serif font-bold text-[10.5px] sm:text-[11.5px] md:text-xs text-gray-900 line-clamp-1 group-hover:text-[#890754] transition-colors leading-snug">
                      {product.name}
                    </h3>
                    <p className="text-[8px] sm:text-[9px] text-gray-500 font-normal line-clamp-1 sm:line-clamp-2 leading-tight mt-0.5 min-h-[11px] sm:min-h-[22px]">
                      {shortDesc}
                    </p>

                    {/* Star Rating */}
                    <div className="flex items-center gap-0.5 mt-0.5 text-[8.5px] sm:text-[9.5px] font-semibold text-gray-800">
                      <span className="text-amber-500 text-[10px] leading-none">★</span>
                      <span>{rating}</span>
                      <span className="text-gray-400 font-normal">({reviews})</span>
                    </div>
                  </div>

                  {/* Bottom Action Bar */}
                  <div className="flex items-center justify-between mt-1 pt-1.5 border-t border-pink-100/70">
                    <div className="flex flex-col">
                      <Price
                        amount={displayPrice}
                        countryPrices={product.countryPrices}
                        className="font-serif font-bold text-[11.5px] sm:text-[13px] md:text-sm text-[#890754]"
                      />
                    </div>

                    {/* Reference UI Action Button with Brand Velvet Plum */}
                    {isActive ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddToCart(product);
                        }}
                        className="no-min-size inline-flex items-center justify-center gap-1 px-2.5 sm:px-3 py-1 rounded-full bg-gradient-to-r from-[#540434] via-[#890754] to-[#a80b67] hover:shadow-md hover:shadow-pink-900/25 active:scale-95 text-white text-[9px] sm:text-[10px] font-black uppercase tracking-wider transition-all"
                        style={{ minWidth: 0, minHeight: 0 }}
                      >
                        <ShoppingCart size={10} className="stroke-[2.4]" />
                        <span>Add</span>
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddToCart(product);
                        }}
                        aria-label="Add to cart"
                        className="no-min-size w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-pink-50 hover:bg-[#890754] text-[#890754] hover:text-white border border-pink-200/80 active:scale-95 flex items-center justify-center transition-all shadow-2xs"
                        style={{ minWidth: 0, minHeight: 0 }}
                      >
                        <ShoppingCart size={11} className="stroke-[2.2]" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. Bottom Small Circular Pagination Indicator Dots */}
        <div className="flex items-center justify-center gap-1.5 mt-4 select-none">
          {Array.from({ length: Math.min(5, total) }).map((_, dotIdx) => {
            const isCurrent = dotIdx === safeActiveIndex % Math.min(5, total);
            return (
              <button
                key={dotIdx}
                onClick={() => setActiveIndex(dotIdx)}
                aria-label={`Go to slide ${dotIdx + 1}`}
                className={`no-min-size transition-all duration-300 rounded-full ${
                  isCurrent
                    ? "bg-[#890754]"
                    : "border border-pink-200 bg-transparent hover:border-[#890754]"
                }`}
                style={{
                  height: "6px",
                  width: isCurrent ? "18px" : "6px",
                  minWidth: 0,
                  minHeight: 0,
                }}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}