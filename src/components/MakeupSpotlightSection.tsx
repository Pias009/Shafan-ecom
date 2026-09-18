"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, Eye, ShoppingCart, ArrowRight, Check, Star } from "lucide-react";
import { Price } from "./Price";
import { useCountryStore } from "@/lib/country-store";
import { useLanguageStore } from "@/lib/language-store";
import { getOptimizedUrl } from "@/lib/cloudinary-url";

interface MakeupSpotlightSectionProps {
  products?: any[];
  onQuickView: (product: any) => void;
  addToCart: (product: any) => void;
  orderNow?: (product: any) => void;
}

export default function MakeupSpotlightSection({
  products = [],
  onQuickView,
  addToCart,
  orderNow,
}: MakeupSpotlightSectionProps) {
  const { currentLanguage } = useLanguageStore();
  const isAr = currentLanguage?.code === "ar";
  const { selectedCountry } = useCountryStore();
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});

  // Filter makeup products or use fallback to ensure display
  const makeupProducts = products.length > 0 ? products : [];

  const handleAddToCart = (e: React.MouseEvent, product: any) => {
    e.stopPropagation();
    addToCart(product);
    setAddedIds((prev) => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setAddedIds((prev) => ({ ...prev, [product.id]: false }));
    }, 1500);
  };

  const handleOrderNow = (e: React.MouseEvent, product: any) => {
    e.stopPropagation();
    if (orderNow) {
      orderNow(product);
    } else {
      addToCart(product);
    }
  };

  if (!makeupProducts || makeupProducts.length === 0) return null;

  return (
    <section className="relative w-full py-5 sm:py-10 select-none overflow-hidden">
      {/* Editorial Luxury Container */}
      <div className="relative max-w-[1536px] mx-auto px-2 sm:px-4 lg:px-6">
        
        {/* Background Atmosphere */}
        <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden rounded-[40px]">
          <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[600px] h-[600px] bg-rose-600/10 rounded-full blur-[120px]" />
          <div className="absolute -top-24 right-10 w-[500px] h-[500px] bg-[#890754]/15 rounded-full blur-[130px]" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-pink-500/[0.02] to-transparent" />
        </div>

        {/* Ultra-Slim Section Header Bar (Matching Flash Sales style) */}
        <div className="w-full mb-4 sm:mb-6 md:mb-8 relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-[#3e0325] via-[#540434] to-[#3e0325] backdrop-blur-xl border border-pink-500/20 px-4 py-3 sm:px-6 sm:py-3.5 shadow-[0_8px_32px_rgba(84,4,52,0.2)]">
          {/* Glow accent */}
          <div className="absolute -top-12 -left-12 w-40 h-40 bg-pink-500/15 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-8 right-12 w-36 h-36 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative flex items-center justify-between gap-3 sm:gap-6">
            {/* Left: Title + Mini Badge */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <h2 className="font-sans text-base sm:text-lg md:text-xl font-bold tracking-tight text-white uppercase whitespace-nowrap">
                {isAr ? "المكياج" : "Makeup"}
              </h2>
              <span className="inline-flex items-center gap-1 bg-[#890754] border border-pink-400/40 text-white text-[8.5px] sm:text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                {isAr ? "كوتور" : "COUTURE"}
              </span>
            </div>

            {/* Right: Slim See All CTA */}
            <Link
              href="/products?category=Makeup"
              className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 rounded-full border border-pink-300/30 bg-white/10 hover:bg-white text-white hover:text-[#540434] hover:scale-105 transition-all text-xs font-semibold uppercase tracking-wider shadow-xs active:scale-95 shrink-0 whitespace-nowrap"
            >
              <span>{isAr ? "عرض الكل" : "See All"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Makeup Products Interactive Grid: 2 columns on mobile, 2 on sm, 3 on lg */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-6">
          {makeupProducts.map((product: any, idx: number) => {
            const isArmani = (product.name || "").toLowerCase().includes("armani");
            const isLancome = (product.name || "").toLowerCase().includes("lancome");

            const shadeHex = isArmani ? "#8f1d1d" : isLancome ? "#9e132c" : "#890754";
            const shadeName = isArmani
              ? "#415 Redwood"
              : isLancome
              ? "#481 Pigeon Blood Ruby"
              : "Iconic Couture Shade";

            const finishBadge = isArmani ? "Intense Velvet Matte" : "Ruby Cream Satin";
            const brandLabel = isArmani ? "GIORGIO ARMANI" : isLancome ? "LANCÔME PARIS" : product.brandName || "COUTURE BEAUTY";

            const isJustAdded = !!addedIds[product.id];
            const imgSrc = product.mainImage || (product.images && product.images[0]) || "/placeholder-product.png";

            return (
              <motion.div
                key={product.id || idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-20px" }}
                transition={{ duration: 0.45, delay: idx * 0.1 }}
                className="group relative rounded-2xl sm:rounded-3xl bg-white border border-slate-200/80 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
              >
                {/* Top Floating Badge Bar */}
                <div className="absolute top-2 left-2 right-2 sm:top-3 sm:left-3 sm:right-3 z-20 flex items-center justify-between pointer-events-none gap-1">
                  <span className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-white/95 backdrop-blur-md text-[#890754] text-[7.5px] sm:text-[9.5px] lg:text-[10px] font-semibold uppercase tracking-wider border border-pink-100 shadow-xs truncate max-w-[120px] sm:max-w-none">
                    <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#890754] fill-[#890754] shrink-0" />
                    <span className="truncate">{finishBadge}</span>
                  </span>
                  
                  {/* Shade Swatch Dot */}
                  {shadeHex && (
                    <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border-2 border-white shadow-xs shrink-0" style={{ backgroundColor: shadeHex }} title={shadeName} />
                  )}
                </div>

                {/* Top Specular Soft Reflection */}
                <div className="absolute inset-x-0 top-0 h-[35%] bg-gradient-to-b from-white/35 via-white/5 to-transparent pointer-events-none rounded-t-2xl sm:rounded-t-3xl z-10" />

                {/* Product Image Stage */}
                <div
                  className="relative flex-1 w-full aspect-square min-h-[160px] xs:min-h-[190px] sm:min-h-[220px] flex items-center justify-center p-1 sm:p-4 cursor-pointer"
                  onClick={() => onQuickView(product)}
                >
                  <Image
                    src={getOptimizedUrl(imgSrc, 600)}
                    alt={product.name}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-contain p-1 sm:p-3 transition-transform duration-500 ease-out group-hover:scale-105"
                  />

                  {/* Subtle hover overlay for desktop */}
                  <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:flex items-center justify-center pointer-events-none">
                    <span className="px-3 py-1 rounded-full bg-white/95 text-gray-900 text-[10px] font-black uppercase tracking-wider shadow-sm backdrop-blur-xs">
                      {isAr ? "معاينة" : "Quick View"}
                    </span>
                  </div>
                </div>

                {/* Bottom Info Area */}
                <div className="relative z-20 bg-white border-t border-slate-100 px-2.5 py-2 sm:px-4 sm:py-3 flex flex-col gap-1">
                  {/* Brand & Rating Row */}
                  <div className="flex items-center justify-between gap-1 leading-none">
                    <span className="text-[8px] sm:text-[10px] lg:text-xs font-semibold uppercase tracking-wider text-[#890754] truncate">
                      {brandLabel}
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
                  <h4
                    onClick={() => onQuickView(product)}
                    className="font-sans font-medium text-[11px] sm:text-xs lg:text-sm text-slate-900 leading-snug truncate group-hover:text-[#890754] transition-colors cursor-pointer"
                    title={product.name}
                  >
                    {product.name}
                  </h4>

                  {/* Price & Cart Icon Row */}
                  <div className="flex items-center justify-between gap-2 pt-0.5 mt-0.5">
                    <div className="flex items-baseline min-w-0">
                      <Price
                        amount={product.discountPrice ?? product.price ?? 170}
                        className="text-xs sm:text-sm lg:text-base font-bold text-[#890754] tracking-tight leading-none"
                        countryPrices={product.countryPrices}
                      />
                    </div>

                    {/* Cart Icon Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToCart(e, product);
                      }}
                      className={`w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 rounded-full flex items-center justify-center shadow-xs transition-all active:scale-90 shrink-0 ${
                        isJustAdded
                          ? "bg-emerald-600 text-white"
                          : "bg-[#890754] hover:bg-[#540434] text-white"
                      }`}
                      title={isAr ? "إضافة إلى السلة" : "Add to Cart"}
                      aria-label="Add to Cart"
                    >
                      {isJustAdded ? (
                        <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      ) : (
                        <ShoppingCart className="w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
