"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, Eye, ShoppingBag, ArrowRight, Check, Heart, ShieldCheck } from "lucide-react";
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
    }, 2000);
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
                className="group relative rounded-2xl sm:rounded-3xl bg-white border border-rose-100 shadow-[0_6px_20px_rgba(72,5,47,0.06)] hover:shadow-[0_16px_40px_rgba(72,5,47,0.16)] hover:border-rose-300 transition-all duration-300 flex flex-col overflow-hidden"
              >
                {/* Top Floating Badge Bar */}
                <div className="absolute top-2 left-2 right-2 sm:top-3 sm:left-3 sm:right-3 z-20 flex items-center justify-between pointer-events-none gap-1">
                  <span className="px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[8px] sm:text-[10px] font-black uppercase tracking-wider bg-[#48052f] text-white shadow-xs truncate max-w-[85px] sm:max-w-none">
                    {finishBadge}
                  </span>
                  
                  {/* Shade Swatch Pill */}
                  <div className="px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-white/95 backdrop-blur-md border border-black/5 shadow-xs flex items-center gap-1 sm:gap-1.5 pointer-events-auto shrink-0">
                    <span
                      className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full border border-black/10 shadow-inner shrink-0"
                      style={{ backgroundColor: shadeHex }}
                    />
                    <span className="text-[8.5px] sm:text-[10px] font-bold text-gray-800 tracking-tight hidden xs:inline">
                      {shadeName}
                    </span>
                  </div>
                </div>

                {/* Product Image Stage */}
                <div
                  className="relative w-full aspect-square bg-gradient-to-b from-rose-50/40 via-white to-rose-50/20 p-2 sm:p-6 flex items-center justify-center cursor-pointer overflow-hidden"
                  onClick={() => onQuickView(product)}
                >
                  <Image
                    src={getOptimizedUrl(imgSrc, 600)}
                    alt={product.name}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-contain p-2 sm:p-6 transition-transform duration-500 ease-out group-hover:scale-108"
                  />

                  {/* Hover Quick View Trigger (desktop) */}
                  <div className="hidden sm:flex absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onQuickView(product);
                      }}
                      className="px-4 py-2 rounded-full bg-white text-[#48052f] font-bold text-xs uppercase tracking-wider shadow-lg flex items-center gap-1.5 hover:bg-[#48052f] hover:text-white transition-all transform hover:scale-105"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{isAr ? "نظرة سريعة" : "Quick View"}</span>
                    </button>
                  </div>
                </div>

                {/* Card Content & Details */}
                <div className="p-2.5 sm:p-5 flex-1 flex flex-col justify-between bg-white">
                  <div>
                    {/* Brand Headline */}
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[9px] sm:text-[11px] font-black uppercase tracking-widest text-[#890754] truncate">
                        {brandLabel}
                      </p>
                      <div className="hidden sm:flex items-center gap-1 text-[10px] text-gray-500 font-semibold shrink-0">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>100% Genuine</span>
                      </div>
                    </div>

                    {/* Product Name */}
                    <h3
                      onClick={() => onQuickView(product)}
                      className="font-bold text-xs sm:text-base text-gray-900 line-clamp-2 hover:text-[#890754] cursor-pointer transition-colors leading-tight min-h-[2rem] sm:min-h-[2.5rem]"
                      title={product.name}
                    >
                      {product.name}
                    </h3>
                  </div>

                  {/* Price & Action Row */}
                  <div className="mt-2.5 sm:mt-4 pt-2.5 sm:pt-4 border-t border-rose-100/60">
                    <div className="flex items-center justify-between mb-2 sm:mb-3">
                      <div>
                        <span className="text-[8px] sm:text-[10px] font-bold uppercase tracking-wider text-gray-400 block leading-none mb-0.5">
                          {isAr ? "السعر" : "Price"}
                        </span>
                        <div className="text-xs xs:text-sm sm:text-xl font-extrabold text-[#48052f] leading-none">
                          <Price
                            amount={product.discountPrice ?? product.price ?? 170}
                            countryPrices={product.countryPrices}
                          />
                        </div>
                      </div>

                      {/* Stock badge */}
                      <span className="text-[8px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                        In Stock
                      </span>
                    </div>

                    {/* Interactive Action Buttons */}
                    <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                      <button
                        type="button"
                        onClick={(e) => handleAddToCart(e, product)}
                        className={`w-full py-1.5 sm:py-2.5 px-1 sm:px-3 rounded-lg sm:rounded-xl font-bold text-[9px] sm:text-xs uppercase tracking-wider flex items-center justify-center gap-1 transition-all shadow-xs active:scale-95 border ${
                          isJustAdded
                            ? "bg-emerald-600 text-white border-emerald-600"
                            : "bg-white text-[#48052f] border-[#48052f]/30 hover:bg-rose-50"
                        }`}
                      >
                        {isJustAdded ? (
                          <>
                            <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                            <span className="truncate">{isAr ? "تمت" : "Added"}</span>
                          </>
                        ) : (
                          <>
                            <ShoppingBag className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                            <span className="truncate">{isAr ? "أضف" : "Add"}</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleOrderNow(e, product)}
                        className="w-full py-1.5 sm:py-2.5 px-1 sm:px-3 rounded-lg sm:rounded-xl font-bold text-[9px] sm:text-xs uppercase tracking-wider flex items-center justify-center gap-1 bg-[#48052f] hover:bg-[#680944] text-white transition-all shadow-xs active:scale-95"
                      >
                        <span className="truncate">{isAr ? "شراء" : "Buy Now"}</span>
                        <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                      </button>
                    </div>
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
