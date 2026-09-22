"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, ShoppingCart, Star, Flame } from "lucide-react";
import { Price } from "@/components/Price";
import { getOptimizedUrl } from "@/lib/cloudinary-url";
import { resolveProductPrice } from "@/lib/product-utils";
import { useCountryStore } from "@/lib/country-store";

interface FlashSaleProduct {
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
  freeDelivery?: boolean;
}

interface FlashSalesSliderProps {
  products: FlashSaleProduct[];
  onQuickView: (product: any) => void;
  addToCart: (product: any) => void;
  orderNow: (product: any) => void;
}

function transformProduct(product: any) {
  const price = product.price || product.priceCents || 0;
  const salePrice = product.discountPrice || product.salePrice || product.salePriceCents || 0;
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    price: price,
    discountPrice: salePrice > 0 ? salePrice : undefined,
    salePrice: salePrice > 0 ? salePrice : undefined,
    imageUrl: product.imageUrl || product.mainImage || "/placeholder-product.png",
    mainImage: product.mainImage || product.imageUrl,
    brand: product.brandName || (typeof product.brand === "string" ? product.brand : product.brand?.name) || "Shafan",
    averageRating: product.averageRating,
    ratingCount: product.ratingCount,
    stockQuantity: product.stockQuantity,
    totalSales: product.totalSales,
    countryPrices: product.countryPrices,
    hot: product.hot,
    trending: product.trending,
    freeDelivery: product.freeDelivery,
  };
}

export function FlashSalesSlider({
  products,
  onQuickView,
  addToCart,
  orderNow,
}: FlashSalesSliderProps) {
  const { selectedCountry } = useCountryStore();
  const [activeIndex, setActiveIndex] = useState(2);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);

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
    }, 3500);
    return () => clearInterval(timer);
  }, [total, isPaused, handleNext]);

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
    <div className="w-full py-2 select-none overflow-hidden">
      <div className="w-full max-w-[1536px] mx-auto">
        {/* 3D Cylindrical Arc Coverflow Stage */}
        <div
          className="relative w-full h-[280px] sm:h-[360px] md:h-[430px] lg:h-[490px] xl:h-[530px] flex items-center justify-center overflow-hidden"
          style={{ perspective: "1400px" }}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Left Navigation Chevron */}
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Previous flash deal"
            className="no-min-size absolute left-2 sm:left-6 lg:left-10 top-1/2 -translate-y-1/2 z-40 w-8 h-8 sm:w-11 sm:h-11 rounded-full bg-white shadow-[0_4px_16px_rgba(0,0,0,0.08)] border border-slate-200 flex items-center justify-center text-slate-700 hover:text-slate-900 hover:bg-slate-50 hover:scale-105 active:scale-95 transition-all"
            style={{ minWidth: 0, minHeight: 0 }}
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2]" />
          </button>

          {/* Right Navigation Chevron */}
          <button
            type="button"
            onClick={handleNext}
            aria-label="Next flash deal"
            className="no-min-size absolute right-2 sm:right-6 lg:right-10 top-1/2 -translate-y-1/2 z-40 w-8 h-8 sm:w-11 sm:h-11 rounded-full bg-white shadow-[0_4px_16px_rgba(0,0,0,0.08)] border border-slate-200 flex items-center justify-center text-slate-700 hover:text-slate-900 hover:bg-slate-50 hover:scale-105 active:scale-95 transition-all"
            style={{ minWidth: 0, minHeight: 0 }}
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2]" />
          </button>

          {/* Cards Stage with Symmetrical 3D Convex Arc Horizon */}
          <div className="relative w-full h-full flex items-center justify-center overflow-visible">
            {products.map((rawProduct, i) => {
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
              const product = transformProduct(rawProduct);
              const resolved = resolveProductPrice(product, selectedCountry);
              const regularPrice = resolved.originalPrice;
              const effectivePrice = resolved.displayPrice;
              const discountPct =
                resolved.hasDiscount && regularPrice > effectivePrice
                  ? Math.round(((regularPrice - effectivePrice) / regularPrice) * 100)
                  : 0;
              const priceCurrency = resolved.currency;

              const rawImg = product.imageUrl || product.mainImage || "/placeholder-product.png";
              const imgSrc = getOptimizedUrl(rawImg, 800);

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
                  {/* 3D Card Shell — Clean Modern Luxury Aesthetic */}
                  <div
                    className="relative w-full h-full rounded-2xl sm:rounded-3xl bg-white border border-slate-200/80 overflow-hidden shadow-lg transition-transform duration-300 group flex flex-col justify-between"
                    style={{
                      boxShadow: isCenter
                        ? "0 28px 60px -12px rgba(137,7,84,0.22), 0 12px 32px rgba(0,0,0,0.06), inset 0 1.5px 2px rgba(255,255,255,0.9)"
                        : "0 10px 28px rgba(20,5,15,0.08), inset 0 1px 1.5px rgba(255,255,255,0.6)",
                    }}
                  >
                    {/* Floating Badge (Top-Left) */}
                    <div className="absolute top-2 left-2 sm:top-3 sm:left-3 z-20 pointer-events-none">
                      <span className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-white/95 backdrop-blur-md text-[#890754] text-[7.5px] sm:text-[9.5px] lg:text-[10px] font-semibold uppercase tracking-wider border border-pink-100 shadow-xs">
                        <Flame className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#890754] fill-[#890754]" />
                        {discountPct > 0
                          ? `-${discountPct}%`
                          : product.hot || product.trending
                          ? "BEST SELLER"
                          : "FLASH DEAL"}
                      </span>
                    </div>

                    {/* Top Specular Soft Reflection */}
                    <div className="absolute inset-x-0 top-0 h-[35%] bg-gradient-to-b from-white/35 via-white/5 to-transparent pointer-events-none rounded-t-2xl sm:rounded-t-3xl z-10" />

                    {/* Image Stage: Clean centered product presentation */}
                    <div className="relative flex-1 w-full min-h-0 flex items-center justify-center p-1 sm:p-4">
                      <Image
                        src={imgSrc}
                        alt={product.name || "Flash Sale Product"}
                        fill
                        className="object-contain p-1 sm:p-3 transition-transform duration-700 ease-out group-hover:scale-105"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        priority={isCenter}
                      />
                    </div>

                    {/* Bottom Info Area: Clean Brand, Title, Price, Cart & Rating */}
                    <div className="relative z-20 bg-white border-t border-slate-100 px-2.5 py-2 sm:px-4 sm:py-3 flex flex-col gap-1">
                      {/* Brand & Rating Row */}
                      <div className="flex items-center justify-between gap-1 leading-none">
                        <span className="text-[8px] sm:text-[10px] lg:text-xs font-semibold uppercase tracking-wider text-[#890754] truncate">
                          {product.brand}
                        </span>
                        <div className="flex items-center gap-0.5 shrink-0">
                          <Star size={10} className="text-amber-400 fill-amber-400 sm:w-3 sm:h-3" />
                          <span className="text-[8.5px] sm:text-[10px] lg:text-xs font-semibold text-slate-600">
                            {product.averageRating || 4.9}
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
                            amount={effectivePrice || regularPrice}
                            className="text-xs sm:text-sm lg:text-base font-bold text-[#890754] tracking-tight leading-none"
                            countryPrices={product.countryPrices}
                            currency={priceCurrency}
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

        {/* Bottom Pagination Dots (Hidden on mobile) */}
        <div className="hidden sm:flex items-center justify-center gap-2 mt-4 sm:mt-6 select-none">
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
    </div>
  );
}
