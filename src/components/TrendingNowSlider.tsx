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

  // Compute spacing step based on viewport
  const isMobile = windowWidth < 640;
  const isTablet = windowWidth >= 640 && windowWidth < 1024;
  const step = isMobile ? 185 : isTablet ? 225 : 275;

  return (
    <section
      id="trending"
      className="w-full py-10 sm:py-16 md:py-20 px-2 sm:px-4 bg-[#faf7f2] select-none overflow-hidden my-4 sm:my-8"
    >
      <div className="max-w-[1536px] mx-auto">
        {/* 1. Header: Elegant Editorial Serif Centered Title */}
        <div className="text-center mb-8 sm:mb-12 md:mb-16">
          <span className="text-[10px] sm:text-xs font-black uppercase tracking-[0.25em] text-[#9e7a57] block mb-1.5">
            {isAr ? "مجموعتنا الحصرية" : "OUR COLLECTION"}
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 tracking-tight">
            {isAr ? "المنتجات المميزة" : "Featured Products"}
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 font-medium mt-2 max-w-md mx-auto">
            {isAr
              ? "استكشف أكثر منتجاتنا المفضلة والأكثر طلباً لدى عملائنا"
              : "Explore our most popular items loved by customers"}
          </p>
        </div>

        {/* 2. 3D Coverflow Product Carousel Track */}
        <div
          className="relative w-full h-[470px] sm:h-[510px] md:h-[530px] flex items-center justify-center"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {/* Left Navigation Chevron */}
          <button
            onClick={handlePrev}
            aria-label="Previous product"
            className="absolute left-2 sm:left-6 md:left-10 top-1/2 -translate-y-1/2 z-40 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white shadow-[0_4px_16px_rgba(0,0,0,0.12)] border border-gray-100 flex items-center justify-center text-gray-700 hover:text-gray-900 hover:scale-110 active:scale-95 transition-all"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          {/* Right Navigation Chevron */}
          <button
            onClick={handleNext}
            aria-label="Next product"
            className="absolute right-2 sm:right-6 md:right-10 top-1/2 -translate-y-1/2 z-40 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white shadow-[0_4px_16px_rgba(0,0,0,0.12)] border border-gray-100 flex items-center justify-center text-gray-700 hover:text-gray-900 hover:scale-110 active:scale-95 transition-all"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          {/* Cards Stage */}
          <div className="relative w-full h-full flex items-center justify-center overflow-visible">
            {products.map((product, i) => {
              // Calculate circular offset relative to activeIndex
              let diff = (i - activeIndex) % total;
              if (diff > total / 2) diff -= total;
              if (diff < -total / 2) diff += total;

              // Only render cards within visibility range
              const isVisible = Math.abs(diff) <= (isMobile ? 1 : 2);
              if (!isVisible) return null;

              const isActive = diff === 0;
              const isNeighbor = Math.abs(diff) === 1;
              const isOuter = Math.abs(diff) === 2;

              // Dynamic scale and styling according to Coverflow position
              const scale = isActive ? 1.06 : isNeighbor ? 0.92 : 0.82;
              const zIndex = isActive ? 30 : isNeighbor ? 20 : 10;
              const opacity = isActive ? 1 : isNeighbor ? (isMobile ? 0.6 : 0.9) : 0.72;
              const offsetX = diff * step;

              const badge = BADGES[i % BADGES.length];
              const isLiked = !!wishlist[product.id];
              const imgSrc = product.imageUrl || product.mainImage || "/placeholder-product.png";
              const price = product.price || product.priceCents || 0;
              const displayPrice = product.discountPrice || product.salePrice || price;
              const rating = product.averageRating ? product.averageRating.toFixed(1) : "4.8";
              const reviews = product.ratingCount || 75 + ((i * 17) % 65);
              const brandName = typeof product.brand === "string" ? product.brand : product.brand?.name || product.brandName || "Shafan";
              const shortDesc = product.shortDescription || `${brandName} premium clinical formula for radiant, healthy glow.`;

              return (
                <div
                  key={product.id}
                  onClick={() => handleCardClick(product, diff)}
                  style={{
                    transform: `translate(calc(-50% + ${offsetX}px), -50%) scale(${scale})`,
                    zIndex,
                    opacity,
                    transition: "transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease-out, box-shadow 0.4s ease-out",
                  }}
                  className={`absolute top-1/2 left-1/2 w-[250px] sm:w-[275px] md:w-[295px] rounded-[26px] sm:rounded-[30px] bg-white p-4 sm:p-5 flex flex-col justify-between cursor-pointer border select-none transition-shadow ${
                    isActive
                      ? "border-[#ded3c5] shadow-[0_24px_50px_-10px_rgba(40,20,10,0.18),0_8px_20px_-4px_rgba(0,0,0,0.06)]"
                      : "border-[#ede4d8] shadow-[0_10px_25px_-5px_rgba(40,25,15,0.08)] hover:shadow-lg"
                  }`}
                >
                  {/* Top Bar: Pill Tag + Heart Wishlist */}
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="px-2.5 py-1 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider bg-[#f5ede4] text-[#8c6541] border border-[#e8dacb]/80">
                      {badge}
                    </span>
                    <button
                      onClick={(e) => toggleWishlist(e, product.id)}
                      aria-label="Save to wishlist"
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white hover:bg-pink-50 border border-gray-100 shadow-2xs flex items-center justify-center transition-colors"
                    >
                      <Heart
                        size={15}
                        className={isLiked ? "text-rose-500 fill-rose-500" : "text-gray-400 hover:text-rose-500"}
                      />
                    </button>
                  </div>

                  {/* Clean Floating Product Image */}
                  <div className="relative w-full h-[170px] sm:h-[195px] flex items-center justify-center my-1 pointer-events-none">
                    <Image
                      src={imgSrc}
                      alt={product.name}
                      fill
                      sizes="(max-width: 640px) 260px, 300px"
                      className="object-contain p-1.5 transition-transform duration-500 hover:scale-105"
                      priority={isActive}
                    />
                  </div>

                  {/* Micro Pagination Dots below image (from reference UI) */}
                  <div className="flex items-center justify-center gap-1.5 my-1 pointer-events-none">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#a67c52]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#e3d7cb]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#e3d7cb]" />
                  </div>

                  {/* Title & Description */}
                  <div className="flex flex-col mt-1">
                    <h3 className="font-serif font-bold text-base sm:text-lg text-gray-900 line-clamp-1 group-hover:text-[#890754] transition-colors">
                      {product.name}
                    </h3>
                    <p className="text-[11px] sm:text-xs text-gray-500 font-normal line-clamp-2 leading-relaxed mt-0.5 min-h-[32px]">
                      {shortDesc}
                    </p>

                    {/* Star Rating */}
                    <div className="flex items-center gap-1 mt-1 text-xs font-semibold text-gray-800">
                      <span className="text-amber-500 text-sm leading-none">★</span>
                      <span>{rating}</span>
                      <span className="text-gray-400 font-normal">({reviews})</span>
                    </div>
                  </div>

                  {/* Bottom Action Bar */}
                  <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-gray-100/80">
                    <div className="flex flex-col">
                      <Price
                        amount={displayPrice}
                        countryPrices={product.countryPrices}
                        className="font-serif font-bold text-base sm:text-lg md:text-xl text-gray-900"
                      />
                    </div>

                    {/* Button depends on active card state */}
                    {isActive ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddToCart(product);
                        }}
                        className="inline-flex items-center justify-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl bg-[#a67c52] hover:bg-[#8c6541] active:scale-95 text-white text-xs sm:text-[13px] font-bold shadow-sm hover:shadow-md transition-all"
                      >
                        <ShoppingCart size={14} className="stroke-[2.2]" />
                        <span>Add to Cart</span>
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddToCart(product);
                        }}
                        aria-label="Add to cart"
                        className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#f4ece3] hover:bg-[#a67c52] text-[#8c6541] hover:text-white active:scale-95 flex items-center justify-center transition-all shadow-xs"
                      >
                        <ShoppingCart size={15} className="stroke-[2.2]" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. Bottom 5 Pagination Indicator Dots with Active Elongated Pill */}
        <div className="flex items-center justify-center gap-2 mt-6 select-none">
          {Array.from({ length: Math.min(5, total) }).map((_, dotIdx) => {
            const isCurrent = dotIdx === activeIndex % Math.min(5, total);
            return (
              <button
                key={dotIdx}
                onClick={() => setActiveIndex(dotIdx)}
                aria-label={`Go to slide ${dotIdx + 1}`}
                className={`transition-all duration-300 ${
                  isCurrent
                    ? "w-6 h-2 rounded-full bg-[#a67c52]"
                    : "w-2 h-2 rounded-full bg-[#e3d7cb] hover:bg-[#c9b8a8]"
                }`}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}