"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, ShoppingCart, Heart, Star } from "lucide-react";
import { Price } from "./Price";
import { useLanguageStore } from "@/lib/language-store";
import { translations } from "@/lib/translations";

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
  onOrderNow: (product: any) => void;
}

const BADGES = ["BEST SELLER", "TRENDING", "POPULAR", "NEW"];

export function TrendingNowSlider({
  products,
  onQuickView,
  onAddToCart,
  onOrderNow,
}: TrendingNowSliderProps) {
  const router = useRouter();
  const { currentLanguage } = useLanguageStore();
  const isAr = currentLanguage?.code === "ar";
  const [activeIndex, setActiveIndex] = useState(2);
  const [wishlist, setWishlist] = useState<Record<string, boolean>>({});
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [windowWidth, setWindowWidth] = useState(1200);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Initialize active index near center of items
  useEffect(() => {
    if (products.length > 0 && activeIndex >= products.length) {
      setActiveIndex(Math.min(2, products.length - 1));
    }
  }, [products.length, activeIndex]);

  if (!products || products.length === 0) return null;

  const total = products.length;

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + total) % total);
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % total);
  };

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

  // Compact spacing matching Routine section product card footprint
  const isMobile = windowWidth < 640;
  const isTablet = windowWidth >= 640 && windowWidth < 1024;
  const step = isMobile ? 112 : isTablet ? 142 : 172;

  return (
    <section
      id="trending"
      className="w-full py-6 sm:py-8 md:py-10 px-2 sm:px-4 bg-[#faf7f2] select-none overflow-hidden my-2 sm:my-4"
    >
      <div className="max-w-[1536px] mx-auto">
        {/* 1. Header: Elegant Editorial Serif Centered Title */}
        <div className="text-center mb-4 sm:mb-6 md:mb-8">
          <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.25em] text-[#9e7a57] block mb-1">
            {isAr ? "مجموعتنا الحصرية" : "OUR COLLECTION"}
          </span>
          <h2 className="font-serif text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
            {isAr ? "المنتجات المميزة" : "Featured Products"}
          </h2>
          <p className="text-[11px] sm:text-xs text-gray-500 font-medium mt-1 max-w-md mx-auto">
            {isAr
              ? "استكشف أكثر منتجاتنا المفضلة والأكثر طلباً لدى عملائنا"
              : "Explore our most popular items loved by customers"}
          </p>
        </div>

        {/* 2. 3D Coverflow Product Carousel Track - Routine Card Scale */}
        <div
          className="relative w-full h-[265px] sm:h-[295px] md:h-[315px] flex items-center justify-center"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {/* Left Navigation Chevron */}
          <button
            onClick={handlePrev}
            aria-label="Previous product"
            className="no-min-size absolute left-0.5 sm:left-3 md:left-6 top-1/2 -translate-y-1/2 z-40 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white shadow-[0_3px_12px_rgba(0,0,0,0.12)] border border-gray-100 flex items-center justify-center text-neutral-700 hover:text-neutral-900 hover:scale-110 active:scale-95 transition-all"
            style={{ minWidth: 0, minHeight: 0 }}
          >
            <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.2]" />
          </button>

          {/* Right Navigation Chevron */}
          <button
            onClick={handleNext}
            aria-label="Next product"
            className="no-min-size absolute right-0.5 sm:right-3 md:right-6 top-1/2 -translate-y-1/2 z-40 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white shadow-[0_3px_12px_rgba(0,0,0,0.12)] border border-gray-100 flex items-center justify-center text-neutral-700 hover:text-neutral-900 hover:scale-110 active:scale-95 transition-all"
            style={{ minWidth: 0, minHeight: 0 }}
          >
            <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.2]" />
          </button>

          {/* Cards Stage */}
          <div className="relative w-full h-full flex items-center justify-center overflow-visible">
            {products.map((product, i) => {
              // Calculate circular offset relative to activeIndex
              let diff = (i - activeIndex) % total;
              if (diff > total / 2) diff -= total;
              if (diff < -total / 2) diff -= total;

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
                  className={`absolute top-1/2 left-1/2 w-[130px] sm:w-[155px] md:w-[178px] rounded-xl sm:rounded-2xl bg-white p-2 sm:p-2.5 md:p-3 flex flex-col justify-between cursor-pointer border select-none transition-shadow ${
                    isActive
                      ? "border-[#ebdccb] shadow-[0_14px_30px_-8px_rgba(70,45,25,0.13),0_4px_12px_-3px_rgba(0,0,0,0.04)]"
                      : "border-[#ede4d8] shadow-[0_6px_16px_-4px_rgba(70,45,25,0.06)] hover:shadow-md"
                  }`}
                >
                  {/* Top Bar: Pill Tag + Heart Wishlist */}
                  <div className="flex items-center justify-between w-full mb-0.5">
                    <span className="px-1.5 py-0.5 rounded-full text-[7.5px] sm:text-[8px] font-black uppercase tracking-wider bg-[#f5ede2] text-[#8a653e] border border-[#ebdccb]">
                      {badge}
                    </span>
                    <button
                      onClick={(e) => toggleWishlist(e, product.id)}
                      aria-label="Save to wishlist"
                      className="no-min-size w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white hover:bg-neutral-50 border border-gray-100 shadow-2xs flex items-center justify-center transition-colors"
                      style={{ minWidth: 0, minHeight: 0 }}
                    >
                      <Heart
                        size={11}
                        className={isLiked ? "text-rose-500 fill-rose-500" : "text-gray-400 hover:text-rose-500"}
                      />
                    </button>
                  </div>

                  {/* Clean Floating Product Image - Routine Card Proportion */}
                  <div className="relative w-full h-[88px] sm:h-[105px] md:h-[118px] flex items-center justify-center my-0.5 pointer-events-none">
                    <Image
                      src={imgSrc}
                      alt={product.name}
                      fill
                      sizes="(max-width: 640px) 140px, 190px"
                      className="object-contain p-1 transition-transform duration-500 hover:scale-105"
                      priority={isActive}
                    />
                  </div>

                  {/* Micro Pagination Dots below image (from reference UI) */}
                  <div className="flex items-center justify-center gap-1 my-0.5 pointer-events-none">
                    <span className="w-1 h-1 rounded-full bg-[#a67c52]" />
                    <span className="w-1 h-1 rounded-full bg-[#e3d7cb]" />
                    <span className="w-1 h-1 rounded-full bg-[#e3d7cb]" />
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
                  <div className="flex items-center justify-between mt-1 pt-1.5 border-t border-gray-100/80">
                    <div className="flex flex-col">
                      <Price
                        amount={displayPrice}
                        countryPrices={product.countryPrices}
                        className="font-serif font-bold text-[11.5px] sm:text-[13px] md:text-sm text-gray-900"
                      />
                    </div>

                    {/* Reference UI Action Button */}
                    {isActive ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddToCart(product);
                        }}
                        className="no-min-size inline-flex items-center justify-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg bg-[#b0875c] hover:bg-[#99734b] active:scale-95 text-white text-[9px] sm:text-[10px] font-bold shadow-2xs transition-all"
                        style={{ minWidth: 0, minHeight: 0 }}
                      >
                        <ShoppingCart size={10} className="stroke-[2.2]" />
                        <span>Add</span>
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddToCart(product);
                        }}
                        aria-label="Add to cart"
                        className="no-min-size w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-[#f5ede2] hover:bg-[#b0875c] text-[#8a653e] hover:text-white active:scale-95 flex items-center justify-center transition-all shadow-2xs"
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
        <div className="flex items-center justify-center gap-1.5 mt-3 select-none">
          {Array.from({ length: Math.min(5, total) }).map((_, dotIdx) => {
            const isCurrent = dotIdx === activeIndex % Math.min(5, total);
            return (
              <button
                key={dotIdx}
                onClick={() => setActiveIndex(dotIdx)}
                aria-label={`Go to slide ${dotIdx + 1}`}
                className={`no-min-size transition-all duration-300 rounded-full ${
                  isCurrent
                    ? "bg-[#a67c52]"
                    : "border border-[#d4c5b5] bg-transparent hover:border-[#a67c52]"
                }`}
                style={{
                  width: "7px",
                  height: "7px",
                  minWidth: "0px",
                  minHeight: "0px",
                  padding: "0px",
                  borderWidth: isCurrent ? "0px" : "1px",
                }}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}