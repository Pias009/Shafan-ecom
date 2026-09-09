"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, ShoppingCart, Heart, Zap } from "lucide-react";
import { Price } from "./Price";
import { useLanguageStore } from "@/lib/language-store";

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
  shortDescription?: string;
}

interface FlashSalesSliderProps {
  products: FlashSaleProduct[];
  onQuickView: (product: any) => void;
  addToCart: (product: any) => void;
  orderNow: (product: any) => void;
}

export function FlashSalesSlider({
  products,
  onQuickView,
  addToCart,
  orderNow,
}: FlashSalesSliderProps) {
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

  const handleCardClick = (product: FlashSaleProduct, diff: number) => {
    if (diff !== 0) {
      setActiveIndex(products.findIndex((p) => p.id === product.id));
    } else {
      if (onQuickView) {
        onQuickView(product);
      } else if (product.slug || product.id) {
        router.push(`/products/${product.slug || product.id}`);
      }
    }
  };

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

  const isMobile = windowWidth < 640;
  const isTablet = windowWidth >= 640 && windowWidth < 1024;
  const step = isMobile ? 140 : isTablet ? 170 : 205;

  return (
    <div className="w-full py-2 select-none overflow-hidden">
      <div className="max-w-[1536px] mx-auto">
        {/* 3D Coverflow Product Track */}
        <div
          className="relative w-full h-[395px] sm:h-[420px] md:h-[435px] flex items-center justify-center"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {/* Left Navigation Chevron */}
          <button
            onClick={handlePrev}
            aria-label="Previous flash deal"
            className="absolute left-2 sm:left-6 md:left-8 top-1/2 -translate-y-1/2 z-40 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white shadow-[0_4px_14px_rgba(0,0,0,0.12)] border border-pink-100 flex items-center justify-center text-gray-700 hover:text-[#890754] hover:scale-110 active:scale-95 transition-all"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Right Navigation Chevron */}
          <button
            onClick={handleNext}
            aria-label="Next flash deal"
            className="absolute right-2 sm:right-6 md:right-8 top-1/2 -translate-y-1/2 z-40 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white shadow-[0_4px_14px_rgba(0,0,0,0.12)] border border-pink-100 flex items-center justify-center text-gray-700 hover:text-[#890754] hover:scale-110 active:scale-95 transition-all"
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Cards Stage */}
          <div className="relative w-full h-full flex items-center justify-center overflow-visible">
            {products.map((product, i) => {
              let diff = (i - activeIndex) % total;
              if (diff > total / 2) diff -= total;
              if (diff < -total / 2) diff -= total;

              const isVisible = Math.abs(diff) <= (isMobile ? 1 : 2);
              if (!isVisible) return null;

              const isActive = diff === 0;
              const isNeighbor = Math.abs(diff) === 1;

              const scale = isActive ? 1.08 : isNeighbor ? 0.92 : 0.80;
              const zIndex = isActive ? 30 : isNeighbor ? 20 : 10;
              const opacity = isActive ? 1 : isNeighbor ? (isMobile ? 0.6 : 0.9) : 0.72;
              const offsetX = diff * step;

              const isLiked = !!wishlist[product.id];
              const imgSrc = product.imageUrl || product.mainImage || "/placeholder-product.png";
              const rawPrice = product.price || product.priceCents || 0;
              const rawSalePrice = product.discountPrice || product.salePrice || product.salePriceCents;
              const hasDiscount = rawSalePrice && rawSalePrice < rawPrice;
              const displayPrice = hasDiscount ? rawSalePrice : rawPrice;
              const discountPct = hasDiscount && rawPrice > 0 ? Math.round(((rawPrice - rawSalePrice) / rawPrice) * 100) : null;

              const rating = product.averageRating ? product.averageRating.toFixed(1) : "4.9";
              const reviews = product.ratingCount || 60 + ((i * 19) % 55);
              const brandName = typeof product.brand === "string" ? product.brand : product.brand?.name || product.brandName || "Shafan";
              const shortDesc = product.shortDescription || `${brandName} premium clinical formula flash sale deal.`;

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
                  className={`absolute top-1/2 left-1/2 w-[175px] sm:w-[190px] md:w-[205px] rounded-[22px] sm:rounded-[26px] bg-white p-3 sm:p-3.5 flex flex-col justify-between cursor-pointer border select-none transition-shadow ${
                    isActive
                      ? "border-pink-200 shadow-[0_20px_45px_-10px_rgba(137,7,84,0.18),0_6px_16px_-4px_rgba(0,0,0,0.06)]"
                      : "border-pink-100/80 shadow-[0_8px_20px_-5px_rgba(80,10,50,0.06)] hover:shadow-md"
                  }`}
                >
                  {/* Top Bar: Flash Discount Badge + Heart */}
                  <div className="flex items-center justify-between w-full mb-0.5">
                    {discountPct ? (
                      <span className="px-2 py-0.5 rounded-full text-[8.5px] sm:text-[9px] font-black tracking-wider bg-rose-50 text-rose-600 border border-rose-200/80 flex items-center gap-0.5">
                        <Zap size={9} className="fill-rose-500 text-rose-500" />
                        <span>{discountPct}% OFF</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[8.5px] sm:text-[9px] font-black uppercase tracking-wider bg-pink-50 text-[#890754] border border-pink-200/80">
                        {isAr ? "عرض خاص" : "FLASH DEAL"}
                      </span>
                    )}
                    <button
                      onClick={(e) => toggleWishlist(e, product.id)}
                      aria-label="Save to wishlist"
                      className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white hover:bg-pink-50 border border-pink-100 shadow-2xs flex items-center justify-center transition-colors"
                    >
                      <Heart
                        size={13}
                        className={isLiked ? "text-rose-500 fill-rose-500" : "text-gray-400 hover:text-rose-500"}
                      />
                    </button>
                  </div>

                  {/* Clean Floating Product Image */}
                  <div className="relative w-full h-[125px] sm:h-[135px] md:h-[145px] flex items-center justify-center my-0.5 pointer-events-none">
                    <Image
                      src={imgSrc}
                      alt={product.name}
                      fill
                      sizes="(max-width: 640px) 180px, 220px"
                      className="object-contain p-1 transition-transform duration-500 hover:scale-105"
                      priority={isActive}
                    />
                  </div>

                  {/* Micro 3-Dots below image */}
                  <div className="flex items-center justify-center gap-1 my-0.5 pointer-events-none">
                    <span className="w-1 h-1 rounded-full bg-[#890754]" />
                    <span className="w-1 h-1 rounded-full bg-pink-200" />
                    <span className="w-1 h-1 rounded-full bg-pink-200" />
                  </div>

                  {/* Title & Description */}
                  <div className="flex flex-col mt-0.5">
                    <h3 className="font-serif font-bold text-xs sm:text-[13px] md:text-sm text-gray-900 line-clamp-1 group-hover:text-[#890754] transition-colors">
                      {product.name}
                    </h3>
                    <p className="text-[10px] sm:text-[10.5px] text-gray-500 font-normal line-clamp-2 leading-snug mt-0.5 min-h-[26px]">
                      {shortDesc}
                    </p>

                    {/* Star Rating */}
                    <div className="flex items-center gap-1 mt-1 text-[10px] sm:text-[11px] font-semibold text-gray-800">
                      <span className="text-amber-500 text-xs leading-none">★</span>
                      <span>{rating}</span>
                      <span className="text-gray-400 font-normal">({reviews})</span>
                    </div>
                  </div>

                  {/* Bottom Action Bar: Price + Add to Cart */}
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100/80">
                    <div className="flex flex-col">
                      <Price
                        amount={displayPrice}
                        countryPrices={product.countryPrices}
                        className="font-serif font-bold text-sm sm:text-base text-[#890754]"
                      />
                      {hasDiscount && (
                        <Price
                          amount={rawPrice}
                          countryPrices={product.countryPrices}
                          className="text-[10px] text-gray-400 line-through font-medium"
                        />
                      )}
                    </div>

                    {isActive ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart(product);
                        }}
                        className="inline-flex items-center justify-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg sm:rounded-xl bg-gradient-to-r from-[#890754] to-[#680540] hover:from-[#a00863] hover:to-[#540434] active:scale-95 text-white text-[10px] sm:text-[11px] font-bold shadow-xs hover:shadow transition-all"
                      >
                        <ShoppingCart size={13} className="stroke-[2.2]" />
                        <span>Add to Cart</span>
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart(product);
                        }}
                        aria-label="Add to cart"
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-pink-50 hover:bg-[#890754] text-[#890754] hover:text-white active:scale-95 flex items-center justify-center transition-all shadow-xs"
                      >
                        <ShoppingCart size={13} className="stroke-[2.2]" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Super Small Pagination Indicator Dots */}
        <div className="flex items-center justify-center gap-1.5 mt-4 sm:mt-5 select-none">
          {Array.from({ length: Math.min(5, total) }).map((_, dotIdx) => {
            const isCurrent = dotIdx === activeIndex % Math.min(5, total);
            return (
              <button
                key={dotIdx}
                onClick={() => setActiveIndex(dotIdx)}
                aria-label={`Go to slide ${dotIdx + 1}`}
                className={`transition-all duration-300 rounded-full ${
                  isCurrent
                    ? "w-2 h-1 bg-[#890754] ring-1 ring-[#890754]/30"
                    : "w-1 h-1 bg-pink-200 hover:bg-[#890754]/50"
                }`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
