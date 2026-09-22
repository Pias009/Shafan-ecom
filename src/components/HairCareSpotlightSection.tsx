"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Sparkles, Palette } from "lucide-react";
import { motion } from "framer-motion";
import { ProductCard } from "./ProductCard";
import { useLanguageStore } from "@/lib/language-store";
import { DEFAULT_HAIRCARE_SECTION } from "@/lib/haircare-section";

interface HairCareSpotlightSectionProps {
  products?: any[];
  sectionConfig?: any;
  onQuickView: (product: any) => void;
  addToCart: (product: any) => void;
  orderNow?: (product: any) => void;
}

export default function HairCareSpotlightSection({
  products = [],
  sectionConfig = null,
  onQuickView,
  addToCart,
  orderNow,
}: HairCareSpotlightSectionProps) {
  const { currentLanguage } = useLanguageStore();
  const isAr = currentLanguage?.code === "ar";

  const config = { ...DEFAULT_HAIRCARE_SECTION, ...(sectionConfig || {}) };

  // Pick hair care products from the pool (config order first, then smart matching)
  const featuredProducts = useMemo(() => {
    if (!products || products.length === 0) return [];

    const configIds: string[] = Array.isArray(config.productIds)
      ? config.productIds.filter(Boolean)
      : [];

    if (configIds.length > 0) {
      const byId = new Map(products.map((p: any) => [p.id, p]));
      const selected = configIds.map((id) => byId.get(id)).filter(Boolean);
      if (selected.length > 0) return selected;
    }

    // Smart fallback: hair / shampoo / rosemary products first
    const isHair = (p: any) => {
      const name = (p.name || "").toLowerCase();
      const cat = (
        p.category?.name ||
        (typeof p.category === "string" ? p.category : "") ||
        p.brandName ||
        ""
      ).toLowerCase();
      return (
        (name.includes("hair") ||
          name.includes("shampoo") ||
          name.includes("rosemary") ||
          name.includes("methi") ||
          name.includes("oil") ||
          name.includes("scalp") ||
          cat.includes("hair") ||
          cat.includes("shampoo")) &&
        !name.includes("parfum") &&
        !name.includes("eau de")
      );
    };

    const hairProducts = products.filter(isHair);
    if (hairProducts.length > 0) return hairProducts;

    return products.slice(0, 2);
  }, [products, config.productIds]);

  if (config.enabled === false) return null;
  if (featuredProducts.length === 0) return null;

  const title = isAr ? config.headingAr || config.heading : config.heading;
  const badge = isAr ? config.badgeAr || config.badge : config.badge;

  return (
    <section id="haircare" className="relative w-full py-8 sm:py-12 md:py-16 px-2 sm:px-6 lg:px-8 select-none overflow-hidden">
      {/* Soft Ambient Depth Illumination */}
      <div className="absolute inset-0 pointer-events-none -z-10 flex items-center justify-center">
        <div className="w-[1100px] h-[500px] bg-gradient-to-r from-amber-500/5 via-[#890754]/5 to-emerald-500/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-[1536px] mx-auto flex flex-col items-center">
        {/* 1. Ultra-Slim Section Header Bar (Matching other sections) */}
        <div className="w-full mb-4 sm:mb-6 md:mb-8 relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-[#3e0325] via-[#540434] to-[#3e0325] backdrop-blur-xl border border-pink-500/20 px-4 py-3 sm:px-6 sm:py-3.5 shadow-[0_8px_32px_rgba(84,4,52,0.2)]">
          {/* Glow accent */}
          <div className="absolute -top-12 -left-12 w-40 h-40 bg-pink-500/15 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-8 right-12 w-36 h-36 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative flex flex-wrap items-center justify-between gap-2 sm:gap-6">
            {/* Left: Title + Mini Badge */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <h2 className="font-sans text-base sm:text-lg md:text-xl font-bold tracking-tight text-white uppercase min-w-0 truncate">
                {title}
              </h2>
              <span className="inline-flex items-center gap-1 bg-[#890754] border border-pink-400/40 text-white text-[8.5px] sm:text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                <Sparkles className="w-2.5 h-2.5" />
                {badge}
              </span>
            </div>

            {/* Right: Slim See All CTA */}
            <Link
              href="/products?category=Hair%20Care"
              className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 rounded-full border border-pink-300/30 bg-white/10 hover:bg-white text-white hover:text-[#540434] hover:scale-105 transition-all text-xs font-semibold uppercase tracking-wider shadow-xs active:scale-95 shrink-0 whitespace-nowrap"
            >
              <span>{isAr ? "عرض الكل" : "See All"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* 2. Desktop: 2 columns side-by-side | Mobile: horizontal snap slider */}
        <div className="w-full">
          {/* Mobile Slider (below md) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="flex md:hidden gap-3 sm:gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar -mx-2 px-2 pt-1"
          >
            {featuredProducts.map((product: any, idx: number) => (
              <div
                key={product.id || idx}
                className="relative h-full min-w-[62%] sm:min-w-[46%] pt-3 shrink-0 snap-start"
              >
                <div className="absolute top-0 left-2 z-20 pointer-events-none">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-[#540434] to-[#890754] text-white text-[8px] sm:text-[10px] font-semibold uppercase tracking-wider shadow-xs">
                    <Palette className="w-2.5 h-2.5" />
                    {idx < 2 ? (isAr ? "الأكثر مبيعاً" : "Top Pick") : (isAr ? "جديد" : "New In")}
                  </span>
                </div>
                <ProductCard
                  product={product}
                  onQuickView={onQuickView}
                  onAddToCart={addToCart}
                  onOrderNow={orderNow}
                  compact={true}
                  priority={idx < 2}
                />
              </div>
            ))}
          </motion.div>

          {/* Desktop Grid: exactly 2 columns (left/right) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="hidden md:grid grid-cols-2 gap-5 sm:gap-8 max-w-5xl mx-auto px-2"
          >
            {featuredProducts.slice(0, 2).map((product: any, idx: number) => (
              <div key={product.id || idx} className="relative h-full pt-4">
                <div className="absolute top-0 left-2 z-20 pointer-events-none">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-[#540434] to-[#890754] text-white text-[8px] sm:text-[10px] font-semibold uppercase tracking-wider shadow-xs">
                    <Palette className="w-2.5 h-2.5" />
                    {idx === 0 ? (isAr ? "الأكثر مبيعاً" : "Top Pick") : (isAr ? "جديد" : "New In")}
                  </span>
                </div>
                <ProductCard
                  product={product}
                  onQuickView={onQuickView}
                  onAddToCart={addToCart}
                  onOrderNow={orderNow}
                  compact={true}
                  priority={idx < 2}
                />
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </section>
  );
}