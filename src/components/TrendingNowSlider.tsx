"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { EditorialProductCard } from "@/components/EditorialProductCard";
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
}

interface TrendingNowSliderProps {
  products: TrendingProduct[];
  onQuickView: (product: any) => void;
  onAddToCart: (product: any) => void;
  onOrderNow: (product: any) => void;
}

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

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchEnd = (e: React.TouchEvent) => {
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

  const isMobile = windowWidth < 640;
  const isTablet = windowWidth >= 640 && windowWidth < 1024;
  const step = isMobile ? 118 : isTablet ? 148 : 180;

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

        {/* 2. Coverflow Carousel Track — Routine Section ProductCard Style & Size */}
        <div
          className="relative w-full h-[255px] sm:h-[285px] md:h-[310px] flex items-center justify-center"
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
              let diff = (i - activeIndex) % total;
              if (diff > total / 2) diff -= total;
              if (diff < -total / 2) diff -= total;

              const isVisible = Math.abs(diff) <= (isMobile ? 1 : 2);
              if (!isVisible) return null;

              const isActive = diff === 0;
              const isNeighbor = Math.abs(diff) === 1;

              const scale = isActive ? 1.05 : isNeighbor ? 0.88 : 0.74;
              const zIndex = isActive ? 30 : isNeighbor ? 20 : 10;
              const opacity = isActive ? 1 : isNeighbor ? (isMobile ? 0.58 : 0.88) : 0.65;
              const offsetX = diff * step;

              return (
                <div
                  key={product.id}
                  onClickCapture={(e) => {
                    if (diff !== 0) {
                      e.stopPropagation();
                      e.preventDefault();
                      setActiveIndex(products.findIndex((p) => p.id === product.id));
                    }
                  }}
                  style={{
                    transform: `translate(calc(-50% + ${offsetX}px), -50%) scale(${scale})`,
                    zIndex,
                    opacity,
                    transition: "transform 0.45s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.35s ease-out",
                  }}
                  className="absolute top-1/2 left-1/2 w-[130px] sm:w-[155px] md:w-[178px] cursor-pointer select-none"
                >
                  <EditorialProductCard
                    product={product}
                    onQuickView={onQuickView}
                    onAddToCart={onAddToCart}
                    onOrderNow={onOrderNow}
                    showAddButton={isActive}
                    priority={isActive}
                  />
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