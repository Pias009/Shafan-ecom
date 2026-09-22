"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ShoppingCart, Star, Heart, Sparkles, ArrowRight } from "lucide-react";
import { Price } from "./Price";
import { useLanguageStore } from "@/lib/language-store";
import { useCountryStore } from "@/lib/country-store";
import { resolveProductPrice } from "@/lib/product-utils";
import { getOptimizedUrl } from "@/lib/cloudinary-url";

interface FragranceSpotlightSectionProps {
  products?: any[];
  onQuickView: (product: any) => void;
  addToCart: (product: any) => void;
  orderNow?: (product: any) => void;
}

const BADGES = ["PARFUM", "EXCLUSIVE", "OUD LUXE", "SIGNATURE", "ROYAL"];

export default function FragranceSpotlightSection({
  products = [],
  onQuickView,
  addToCart,
}: FragranceSpotlightSectionProps) {
  const { currentLanguage } = useLanguageStore();
  const isAr = currentLanguage?.code === "ar";
  const { selectedCountry } = useCountryStore();
  const [activeIndex, setActiveIndex] = useState(2);
  const [wishlist, setWishlist] = useState<Record<string, boolean>>({});
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  const fragranceProducts = products.length > 0 ? products : [];

  if (!fragranceProducts || fragranceProducts.length === 0) return null;

  const total = fragranceProducts.length;
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
    }, 3500);
    return () => clearInterval(timer);
  }, [total, isPaused, handleNext]);

  const toggleWishlist = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setWishlist((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const onTouchStart = (e: React.TouchEvent) => {
    setIsPaused(true);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    setIsPaused(false);
    if (touchStart === null) return;
    const touchEnd = e.changedTouches[0].clientX;
    const distance = touchStart - touchEnd;
    if (distance > 40) {
      handleNext();
    } else if (distance < -40) {
      handlePrev();
    }
    setTouchStart(null);
  };

  return (
    <section
      id="fragrances"
      className="relative w-full py-8 sm:py-12 md:py-16 px-2 sm:px-6 lg:px-8 select-none overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Soft Ambient Illumination */}
      <div className="absolute inset-0 pointer-events-none -z-10 flex items-center justify-center">
        <div className="w-[1100px] h-[500px] bg-gradient-to-r from-amber-500/5 via-[#890754]/5 to-pink-500/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-[1536px] mx-auto flex flex-col items-center">
        {/* 1. Ultra-Slim Section Header Bar (Matching Flash Sales style) */}
        <div className="w-full mb-4 sm:mb-6 md:mb-8 relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-[#3e0325] via-[#540434] to-[#3e0325] backdrop-blur-xl border border-pink-500/20 px-4 py-3 sm:px-6 sm:py-3.5 shadow-[0_8px_32px_rgba(84,4,52,0.2)]">
          {/* Glow accent */}
          <div className="absolute -top-12 -left-12 w-40 h-40 bg-pink-500/15 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-8 right-12 w-36 h-36 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative flex items-center justify-between gap-3 sm:gap-6">
            {/* Left: Title + Mini Badge */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <h2 className="font-sans text-base sm:text-lg md:text-xl font-bold tracking-tight text-white uppercase whitespace-nowrap">
                {isAr ? "العطور الفاخرة" : "Fragrances"}
              </h2>
              <span className="inline-flex items-center gap-1 bg-[#890754] border border-pink-400/40 text-white text-[8.5px] sm:text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                {isAr ? "حصري" : "EXCLUSIVE"}
              </span>
            </div>

            {/* Right: Slim See All CTA */}
            <Link
              href="/products?category=Fragrances"
              className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 rounded-full border border-pink-300/30 bg-white/10 hover:bg-white text-white hover:text-[#540434] hover:scale-105 transition-all text-xs font-semibold uppercase tracking-wider shadow-xs active:scale-95 shrink-0 whitespace-nowrap"
            >
              <span>{isAr ? "عرض الكل" : "See All"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* 2. 3D Cylindrical Arc Card Carousel (Spacious Full-Width Fan) */}
        <div
          className="relative w-full h-[280px] sm:h-[360px] md:h-[430px] lg:h-[490px] xl:h-[530px] flex items-center justify-center overflow-hidden"
          style={{ perspective: "1400px" }}
        >
          {/* Left Navigation Chevron */}
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Previous fragrance"
            className="no-min-size absolute left-2 sm:left-6 lg:left-10 top-1/2 -translate-y-1/2 z-40 w-8 h-8 sm:w-11 sm:h-11 rounded-full bg-white shadow-[0_4px_16px_rgba(0,0,0,0.08)] border border-slate-200 flex items-center justify-center text-slate-700 hover:text-slate-900 hover:bg-slate-50 hover:scale-105 active:scale-95 transition-all"
            style={{ minWidth: 0, minHeight: 0 }}
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2]" />
          </button>

          {/* Right Navigation Chevron */}
          <button
            type="button"
            onClick={handleNext}
            aria-label="Next fragrance"
            className="no-min-size absolute right-2 sm:right-6 lg:right-10 top-1/2 -translate-y-1/2 z-40 w-8 h-8 sm:w-11 sm:h-11 rounded-full bg-white shadow-[0_4px_16px_rgba(0,0,0,0.08)] border border-slate-200 flex items-center justify-center text-slate-700 hover:text-slate-900 hover:bg-slate-50 hover:scale-105 active:scale-95 transition-all"
            style={{ minWidth: 0, minHeight: 0 }}
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2]" />
          </button>

          {/* Cards Stage with Symmetrical 3D Convex Arc Horizon */}
          <div className="relative w-full h-full flex items-center justify-center overflow-visible">
            {fragranceProducts.map((product, i) => {
              let diff = (i - safeActiveIndex) % total;
              if (diff > total / 2) diff -= total;
              if (diff < -total / 2) diff += total;

              const isVisible = Math.abs(diff) <= 2;
              if (!isVisible) return null;

              let translateX = "0%";
              let translateY = "0px";
              let translateZ = "80px";
              let rotateY = 0;
              let rotateZ = 0;
              let scale = 1.06;
              let zIndex = 30;
              let opacity = 1;

              if (diff === 1) {
                translateX = "82%";
                translateY = "20px";
                translateZ = "-35px";
                rotateY = -22;
                rotateZ = 3;
                scale = 0.88;
                zIndex = 20;
                opacity = 0.95;
              } else if (diff === 2) {
                translateX = "162%";
                translateY = "40px";
                translateZ = "-120px";
                rotateY = -36;
                rotateZ = 6.5;
                scale = 0.74;
                zIndex = 10;
                opacity = 0.65;
              } else if (diff === -1) {
                translateX = "-82%";
                translateY = "20px";
                translateZ = "-35px";
                rotateY = 22;
                rotateZ = -3;
                scale = 0.88;
                zIndex = 20;
                opacity = 0.95;
              } else if (diff === -2) {
                translateX = "-162%";
                translateY = "40px";
                translateZ = "-120px";
                rotateY = 36;
                rotateZ = -6.5;
                scale = 0.74;
                zIndex = 10;
                opacity = 0.65;
              }

              const isCenter = diff === 0;
              const badge = BADGES[i % BADGES.length];
              const isLiked = !!wishlist[product.id];
              const rawImg = product.imageUrl || product.mainImage || (product.images && product.images[0]) || "/placeholder-product.png";
              const imgSrc = getOptimizedUrl(rawImg, 800);
              const brandName =
                typeof product.brand === "string"
                  ? product.brand
                  : product.brand?.name || product.brandName || "Shafan Fragrance";
              const resolved = resolveProductPrice(product, selectedCountry);
              const regularPrice = resolved.originalPrice;
              const effectivePrice = resolved.displayPrice;
              const displayPrice = effectivePrice > 0 ? effectivePrice : regularPrice;
              const originalPrice = resolved.hasDiscount && regularPrice > effectivePrice ? regularPrice : null;

              return (
                <div
                  key={product.id || i}
                  onClick={() => {
                    if (isCenter) {
                      onQuickView(product);
                    } else {
                      setActiveIndex(i);
                    }
                  }}
                  className="absolute w-[155px] h-[240px] sm:w-[220px] sm:h-[320px] md:w-[270px] md:h-[380px] lg:w-[320px] lg:h-[440px] xl:w-[350px] xl:h-[470px] rounded-2xl sm:rounded-3xl p-1 flex flex-col items-center justify-center cursor-pointer select-none transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]"
                  style={{
                    transform: `translateX(${translateX}) translateY(${translateY}) translateZ(${translateZ}) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg) scale(${scale})`,
                    zIndex,
                    opacity,
                    transformStyle: "preserve-3d",
                    willChange: "transform, opacity",
                  }}
                >
                  {/* 3D Card Shell */}
                  <div
                    className="relative w-full h-full rounded-2xl sm:rounded-3xl bg-white border border-slate-200/80 overflow-hidden shadow-lg transition-transform duration-300 group flex flex-col justify-between"
                    style={{
                      boxShadow: isCenter
                        ? "0 28px 60px -12px rgba(137,7,84,0.22), 0 12px 32px rgba(0,0,0,0.06), inset 0 1.5px 2px rgba(255,255,255,0.9)"
                        : "0 10px 28px rgba(20,5,15,0.08), inset 0 1px 1.5px rgba(255,255,255,0.6)",
                    }}
                  >
                    {/* Top Floating Bar: Badge & Wishlist Heart */}
                    <div className="absolute top-2 inset-x-2 sm:top-3 sm:inset-x-3 z-20 flex items-center justify-between pointer-events-none">
                      <span className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-white/95 backdrop-blur-md text-[#890754] text-[7.5px] sm:text-[9.5px] lg:text-[10px] font-semibold uppercase tracking-wider border border-pink-100 shadow-xs pointer-events-auto">
                        <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#890754]" />
                        {badge}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => toggleWishlist(e, product.id)}
                        aria-label="Save to wishlist"
                        className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white/90 backdrop-blur-md border border-slate-100 flex items-center justify-center hover:bg-pink-50 transition-colors shadow-2xs pointer-events-auto"
                      >
                        <Heart
                          size={12}
                          className={isLiked ? "text-rose-500 fill-rose-500" : "text-slate-400 hover:text-rose-500"}
                        />
                      </button>
                    </div>

                    {/* Top Specular Soft Reflection */}
                    <div className="absolute inset-x-0 top-0 h-[35%] bg-gradient-to-b from-white/35 via-white/5 to-transparent pointer-events-none rounded-t-2xl sm:rounded-t-3xl z-10" />

                    {/* Image Stage */}
                    <div className="relative flex-1 w-full min-h-0 flex items-center justify-center p-1 sm:p-4">
                      <Image
                        src={imgSrc}
                        alt={product.name || "Fragrance"}
                        fill
                        className="object-contain p-1 sm:p-3 transition-transform duration-700 ease-out group-hover:scale-105"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        priority={isCenter}
                      />
                    </div>

                    {/* Bottom Info Area */}
                    <div className="relative z-20 bg-white border-t border-slate-100 px-2.5 py-2 sm:px-4 sm:py-3 flex flex-col gap-1">
                      {/* Brand & Rating Row */}
                      <div className="flex items-center justify-between gap-1 leading-none">
                        <span className="text-[8px] sm:text-[10px] lg:text-xs font-semibold uppercase tracking-wider text-[#890754] truncate">
                          {brandName}
                        </span>
                        <div className="flex items-center gap-0.5 shrink-0">
                          <Star size={10} className="text-amber-400 fill-amber-400 sm:w-3 sm:h-3" />
                          <span className="text-[8.5px] sm:text-[10px] lg:text-xs font-semibold text-slate-600">
                            {product.averageRating || 5.0}
                          </span>
                          {product.ratingCount && (
                            <span className="text-[8px] sm:text-[9.5px] text-slate-400 font-normal">
                              ({product.ratingCount})
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Title Row */}
                      <h4 className="font-sans font-medium text-[11px] sm:text-xs lg:text-sm text-slate-900 leading-snug truncate group-hover:text-[#890754] transition-colors">
                        {product.name}
                      </h4>

                      {/* Price & Cart Icon Row */}
                      <div className="flex items-center justify-between gap-2 pt-0.5 mt-0.5">
                        <div className="flex items-baseline min-w-0">
                          <Price
                            amount={displayPrice}
                            className="text-xs sm:text-sm lg:text-base font-bold text-[#890754] tracking-tight leading-none"
                            countryPrices={product.countryPrices}
                            currency={resolved.currency}
                          />
                        </div>

                        {/* Cart Icon Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            addToCart(product);
                          }}
                          className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 rounded-full bg-[#890754] hover:bg-[#540434] text-white flex items-center justify-center shadow-xs transition-all active:scale-90 shrink-0"
                          title="Add to Cart"
                          aria-label="Add to Cart"
                        >
                          <ShoppingCart className="w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. Bottom Pagination Dots (Hidden on mobile) */}
        <div className="hidden sm:flex items-center justify-center gap-2 mt-6 sm:mt-8 select-none">
          {Array.from({ length: Math.min(6, total) }).map((_, dotIdx) => {
            const isCurrent = dotIdx === safeActiveIndex % Math.min(6, total);
            return (
              <button
                key={dotIdx}
                onClick={() => setActiveIndex(dotIdx)}
                aria-label={`Go to slide ${dotIdx + 1}`}
                className={`transition-all duration-300 rounded-full ${
                  isCurrent
                    ? "bg-[#890754] w-6 h-1.5"
                    : "bg-slate-200 hover:bg-slate-300 w-1.5 h-1.5"
                }`}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
