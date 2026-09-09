"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, ShoppingCart, Heart } from "lucide-react";
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
  const step = isMobile ? 165 : isTablet ? 195 : 230;

  return (
    <div className="w-full py-2 select-none overflow-hidden">
      <div className="max-w-[1536px] mx-auto">
        {/* 3D Coverflow Product Carousel Track */}
        <div
          className="relative w-full h-[415px] sm:h-[435px] md:h-[450px] flex items-center justify-center"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {/* Left Navigation Chevron */}
          <button
            onClick={handlePrev}
            aria-label="Previous flash deal"
            className="no-min-size absolute left-1 sm:left-4 md:left-8 top-1/2 -translate-y-1/2 z-40 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white shadow-[0_4px_16px_rgba(0,0,0,0.1)] border border-gray-100 flex items-center justify-center text-neutral-700 hover:text-neutral-900 hover:scale-110 active:scale-95 transition-all"
            style={{ minWidth: 0, minHeight: 0 }}
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2]" />
          </button>

          {/* Right Navigation Chevron */}
          <button
            onClick={handleNext}
            aria-label="Next flash deal"
            className="no-min-size absolute right-1 sm:right-4 md:right-8 top-1/2 -translate-y-1/2 z-40 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white shadow-[0_4px_16px_rgba(0,0,0,0.1)] border border-gray-100 flex items-center justify-center text-neutral-700 hover:text-neutral-900 hover:scale-110 active:scale-95 transition-all"
            style={{ minWidth: 0, minHeight: 0 }}
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2]" />
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

              // Reference UI scale: Center is elevated, side cards are slightly smaller
              const scale = isActive ? 1.06 : isNeighbor ? 0.90 : 0.78;
              const zIndex = isActive ? 30 : isNeighbor ? 20 : 10;
              const opacity = isActive ? 1 : isNeighbor ? (isMobile ? 0.55 : 0.88) : 0.65;
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
              const shortDesc = product.shortDescription || `${brandName} clinical formula for radiant, healthy glow.`;

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
                  className={`absolute top-1/2 left-1/2 w-[190px] sm:w-[210px] md:w-[225px] rounded-[26px] sm:rounded-[28px] bg-white p-3.5 sm:p-4 flex flex-col justify-between cursor-pointer border select-none transition-shadow ${
                    isActive
                      ? "border-[#ebdccb] shadow-[0_20px_45px_-10px_rgba(70,45,25,0.14),0_6px_16px_-4px_rgba(0,0,0,0.04)]"
                      : "border-[#ede4d8] shadow-[0_8px_20px_-5px_rgba(70,45,25,0.06)] hover:shadow-md"
                  }`}
                >
                  {/* Top Bar: Pill Tag + Heart */}
                  <div className="flex items-center justify-between w-full mb-1">
                    {discountPct ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[9px] sm:text-[9.5px] font-black uppercase tracking-wider bg-[#fbf0e8] text-[#b44b20] border border-[#f2d8c9]">
                        {discountPct}% OFF
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[9px] sm:text-[9.5px] font-black uppercase tracking-wider bg-[#f5ede2] text-[#8a653e] border border-[#ebdccb]">
                        {isAr ? "عرض خاص" : "BEST SELLER"}
                      </span>
                    )}
                    <button
                      onClick={(e) => toggleWishlist(e, product.id)}
                      aria-label="Save to wishlist"
                      className="no-min-size w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white hover:bg-neutral-50 border border-gray-100 shadow-2xs flex items-center justify-center transition-colors"
                      style={{ minWidth: 0, minHeight: 0 }}
                    >
                      <Heart
                        size={14}
                        className={isLiked ? "text-rose-500 fill-rose-500" : "text-gray-400 hover:text-rose-500"}
                      />
                    </button>
                  </div>

                  {/* Clean Floating Product Image */}
                  <div className="relative w-full h-[135px] sm:h-[150px] md:h-[160px] flex items-center justify-center my-1 pointer-events-none">
                    <Image
                      src={imgSrc}
                      alt={product.name}
                      fill
                      sizes="(max-width: 640px) 200px, 240px"
                      className="object-contain p-1 transition-transform duration-500 hover:scale-105"
                      priority={isActive}
                    />
                  </div>

                  {/* Micro 3-Dots below image (matching reference UI) */}
                  <div className="flex items-center justify-center gap-1.5 my-1 pointer-events-none">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#a67c52]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#e3d7cb]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#e3d7cb]" />
                  </div>

                  {/* Title & Description */}
                  <div className="flex flex-col mt-0.5">
                    <h3 className="font-serif font-bold text-xs sm:text-[13px] md:text-sm text-gray-900 line-clamp-1 group-hover:text-[#890754] transition-colors">
                      {product.name}
                    </h3>
                    <p className="text-[10px] sm:text-[11px] text-gray-500 font-normal line-clamp-2 leading-snug mt-0.5 min-h-[26px]">
                      {shortDesc}
                    </p>

                    {/* Star Rating */}
                    <div className="flex items-center gap-1 mt-1 text-[10px] sm:text-[11px] font-semibold text-gray-800">
                      <span className="text-amber-500 text-xs leading-none">★</span>
                      <span>{rating}</span>
                      <span className="text-gray-400 font-normal">({reviews})</span>
                    </div>
                  </div>

                  {/* Bottom Action Bar: Price + Add to Cart Button */}
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100/80">
                    <div className="flex flex-col">
                      <Price
                        amount={displayPrice}
                        countryPrices={product.countryPrices}
                        className="font-serif font-bold text-sm sm:text-base text-gray-900"
                      />
                      {hasDiscount && (
                        <Price
                          amount={rawPrice}
                          countryPrices={product.countryPrices}
                          className="text-[10px] text-gray-400 line-through font-medium -mt-0.5"
                        />
                      )}
                    </div>

                    {/* Reference UI: Active card has "Add to Cart" camel pill, Side cards have camel cart square */}
                    {isActive ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart(product);
                        }}
                        className="no-min-size inline-flex items-center justify-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl bg-[#b0875c] hover:bg-[#99734b] active:scale-95 text-white text-[11px] sm:text-xs font-bold shadow-xs transition-all"
                        style={{ minWidth: 0, minHeight: 0 }}
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
                        className="no-min-size w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#f5ede2] hover:bg-[#b0875c] text-[#8a653e] hover:text-white active:scale-95 flex items-center justify-center transition-all shadow-2xs"
                        style={{ minWidth: 0, minHeight: 0 }}
                      >
                        <ShoppingCart size={14} className="stroke-[2.2]" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Pagination Dots: 5 Small Circles matching Reference UI */}
        <div className="flex items-center justify-center gap-2 mt-4 select-none">
          {Array.from({ length: Math.min(5, total) }).map((_, dotIdx) => {
            const isCurrent = dotIdx === activeIndex % Math.min(5, total);
            return (
              <button
                key={dotIdx}
                onClick={() => setActiveIndex(dotIdx)}
                aria-label={`Go to slide ${dotIdx + 1}`}
                className={`no-min-size transition-all duration-300 rounded-full ${
                  isCurrent
                    ? "w-2.5 h-2.5 bg-[#a67c52]"
                    : "w-2.5 h-2.5 border-[1.5px] border-[#d4c5b5] bg-transparent hover:border-[#a67c52]"
                }`}
                style={{
                  width: "10px",
                  height: "10px",
                  minWidth: "0px",
                  minHeight: "0px",
                  padding: "0px",
                  borderWidth: isCurrent ? "0px" : "1.5px",
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
