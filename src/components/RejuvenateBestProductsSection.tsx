"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ShoppingBag, ArrowRight, Check } from "lucide-react";
import { Price } from "./Price";
import { CountryPrice } from "./ProductCard";
import { useLanguageStore } from "@/lib/language-store";
import { useCountryStore } from "@/lib/country-store";
import { resolveProductPrice } from "@/lib/product-utils";
import { DEFAULT_REJUVENATE_SECTION, RejuvenateSectionConfig } from "@/lib/rejuvenate-section";

interface RejuvenateBestProductsSectionProps {
  routineProducts?: any[];
  bestProducts?: any[];
  sectionData?: RejuvenateSectionConfig | null;
  onQuickView: (product: any) => void;
  addToCart: (product: any) => void;
  orderNow?: (product: any) => void;
}

export default function RejuvenateBestProductsSection({
  routineProducts = [],
  bestProducts = [],
  sectionData,
  onQuickView,
  addToCart,
}: RejuvenateBestProductsSectionProps) {
  const { currentLanguage } = useLanguageStore();
  const isAr = currentLanguage?.code === "ar";
  const { selectedCountry } = useCountryStore();

  const [addedId, setAddedId] = useState<string | null>(null);

  // Merge saved section config with defaults
  const section = useMemo<RejuvenateSectionConfig>(() => {
    return {
      ...DEFAULT_REJUVENATE_SECTION,
      ...(sectionData || {}),
    };
  }, [sectionData]);

  // Build the 3 cards data dynamically from section configuration
  const cardsData = useMemo(() => {
    const pool = routineProducts.length > 0 ? routineProducts : bestProducts;
    const cardsConfig =
      section.cards && section.cards.length > 0
        ? section.cards
        : DEFAULT_REJUVENATE_SECTION.cards;

    return cardsConfig.slice(0, 3).map((c, idx) => {
      // If an explicit product was chosen in admin controller, look for it in pool or bestProducts
      const explicitProduct = c.productId
        ? (pool.find((p) => p.id === c.productId) ||
           bestProducts.find((p) => p.id === c.productId) ||
           null)
        : null;

      const fallbackProduct = pool[idx] || pool[0] || null;
      const product = explicitProduct || fallbackProduct;

      return {
        id: c.id || `card-${idx}`,
        tabTitle: isAr ? (c.tabTitleAr || c.tabTitle) : c.tabTitle,
        categoryTag: isAr ? (c.categoryTagAr || c.categoryTag) : c.categoryTag,
        bgHex: c.bgHex || "#fbe8df",
        bgStep: c.bgHex || "#fbe8df",
        accentHex: c.accentHex || "#d87a63",
        imageSrc:
          c.imageSrc ||
          `/images/rejuvenate/card-${idx === 0 ? "serum" : idx === 1 ? "cream" : "candle"}.jpg`,
        imageAlt: c.imageAlt || c.categoryTag,
        product,
      };
    });
  }, [section, routineProducts, bestProducts, isAr]);

  const handleAddToCart = (e: React.MouseEvent, product: any) => {
    e.stopPropagation();
    if (!product) return;
    addToCart(product);
    setAddedId(product.id);
    setTimeout(() => setAddedId(null), 1800);
  };

  return (
    <section id="refresh-your-mind" className="relative my-6 sm:my-14 px-1 sm:px-2 md:px-4">
      {/* Outer Shell Wrapper with Luxury Border & Soft Shadow */}
      <div className="relative rounded-[22px] sm:rounded-[40px] overflow-hidden border border-amber-900/10 shadow-[0_16px_50px_rgba(137,7,84,0.06)] bg-white">
        
        {/* ========================================================================= */}
        {/* Refresh Your Mind & 3 Tabbed Cards (3 COLUMNS ON ALL SCREENS) */}
        {/* ========================================================================= */}
        <div className="pt-8 sm:pt-14 pb-8 sm:pb-14 px-2.5 sm:px-6 lg:px-12 bg-gradient-to-b from-[#fdfbf9] to-white">
          
          {/* Header Texts */}
          <div className="text-center max-w-xl mx-auto mb-6 sm:mb-12 px-2">
            <div className="inline-block text-[8.5px] sm:text-xs font-black uppercase tracking-[0.2em] sm:tracking-[0.25em] text-[#890754] mb-1 sm:mb-2">
              {isAr ? (section.badgeTextAr || section.badgeText) : section.badgeText}
            </div>
            
            <h3 className="font-serif text-xl xs:text-2xl sm:text-4xl md:text-5xl font-bold text-gray-950 tracking-tight mb-1.5 sm:mb-2.5">
              {isAr ? (section.headingAr || section.heading) : section.heading}
            </h3>
            
            <p className="text-gray-600 text-[9.5px] sm:text-xs md:text-sm leading-relaxed font-medium line-clamp-2 sm:line-clamp-none">
              {isAr ? (section.descriptionAr || section.description) : section.description}
            </p>
          </div>

          {/* 3 Step-Tabbed Product Cards (STRICTLY 3-COLUMNS on Mobile and Desktop) */}
          <div className="grid grid-cols-3 gap-2 sm:gap-5 md:gap-8 max-w-5xl mx-auto">
            {cardsData.map((card, idx) => {
              const p = card.product;
              const hasProduct = Boolean(p);
              const resolvedRej = p ? resolveProductPrice(p, selectedCountry) : null;
              const displayPrice = resolvedRej ? (resolvedRej.displayPrice || 0) : 0;
              const isAdded = p && addedId === p.id;

              return (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: idx * 0.1 }}
                  className="flex flex-col group relative select-none cursor-pointer"
                  onClick={() => {
                    if (p) onQuickView(p);
                  }}
                >
                  {/* Folder Tab Bar Header */}
                  <div className="flex items-end h-8 sm:h-12 md:h-14 w-full relative z-10">
                    {/* Elevated Tab */}
                    <div 
                      style={{ backgroundColor: card.bgHex }}
                      className="w-[72%] sm:w-[64%] h-full rounded-t-xl sm:rounded-t-2xl px-2 sm:px-4 pt-1 sm:pt-2.5 flex flex-col justify-center"
                    >
                      <span className="font-serif text-[9px] xs:text-[11px] sm:text-base md:text-xl font-bold leading-[1.05] sm:leading-tight text-gray-950 whitespace-pre-line tracking-tight line-clamp-2">
                        {card.tabTitle}
                      </span>
                    </div>

                    {/* Smooth S-curve transition from tab to lower shelf */}
                    <svg 
                      className="w-3 h-3 sm:w-5 sm:h-5 md:w-6 md:h-6 shrink-0 -ml-[0.5px] rtl:-mr-[0.5px] rtl:scale-x-[-1]" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path 
                        d="M 0 0 C 0 14 6 24 24 24 L 0 24 Z" 
                        fill={card.bgStep} 
                      />
                    </svg>
                  </div>

                  {/* Main Card Body */}
                  <div 
                    style={{ backgroundColor: card.bgHex }}
                    className="flex-1 rounded-b-xl sm:rounded-b-[28px] rounded-tr-lg sm:rounded-tr-[22px] p-1.5 sm:p-3.5 md:p-5 flex flex-col justify-between shadow-[0_8px_24px_rgba(0,0,0,0.05)] group-hover:shadow-[0_16px_36px_rgba(0,0,0,0.1)] group-hover:-translate-y-1 transition-all duration-300 ease-out"
                  >
                    {/* Studio Photograph */}
                    <div className="relative w-full aspect-square rounded-lg sm:rounded-2xl overflow-hidden bg-white/40 shadow-2xs">
                      <Image
                        src={card.imageSrc}
                        alt={card.imageAlt}
                        fill
                        sizes="(max-width: 768px) 33vw, 320px"
                        className="object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
                      />

                      {/* Subtle hover overlay for desktop */}
                      <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:flex items-center justify-center pointer-events-none">
                        <span className="px-2.5 py-1 rounded-full bg-white/90 text-gray-900 text-[10px] font-black uppercase tracking-wider shadow-sm backdrop-blur-sm">
                          {isAr ? "معاينة" : "Quick View"}
                        </span>
                      </div>
                    </div>

                    {/* Bottom Mini Product Bar (Slim & Elegant) */}
                    <div className="mt-1.5 sm:mt-3 pt-1 sm:pt-2 border-t border-black/5 flex items-center justify-between gap-1">
                      <div className="min-w-0 flex-1">
                        <div className="text-[8px] xs:text-[9.5px] sm:text-xs font-bold text-gray-900 truncate leading-tight">
                          {p?.name || card.categoryTag}
                        </div>
                        {hasProduct && (
                          <Price
                            amount={displayPrice}
                            countryPrices={p?.countryPrices as CountryPrice[]}
                            currency={resolvedRej?.currency}
                            className="text-[8.5px] xs:text-[10px] sm:text-xs font-black text-[#890754] leading-tight block mt-0.5"
                          />
                        )}
                      </div>

                      {/* Quick Add Button */}
                      <button
                        type="button"
                        onClick={(e) => handleAddToCart(e, p)}
                        className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 transition-all shadow-2xs active:scale-90 ${
                          isAdded
                            ? "bg-emerald-600 text-white"
                            : "bg-white text-[#890754] hover:bg-[#890754] hover:text-white"
                        }`}
                        title={isAr ? "إضافة" : "Add to Cart"}
                      >
                        {isAdded ? <Check size={11} /> : <ShoppingBag size={11} />}
                      </button>
                    </div>

                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Bottom Call to Action Link */}
          <div className="text-center mt-6 sm:mt-10">
            <Link
              href={section.bottomLinkUrl || "/products?category=Routine"}
              className="inline-flex items-center gap-1 sm:gap-2 text-[9.5px] sm:text-xs md:text-sm font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] text-[#890754] hover:text-[#540434] underline underline-offset-4 sm:underline-offset-8 transition-all"
            >
              <span>
                {isAr ? (section.bottomLinkTextAr || section.bottomLinkText) : section.bottomLinkText}
              </span>
              <ArrowRight size={12} className="rtl:rotate-180" />
            </Link>
          </div>

        </div>

      </div>
    </section>
  );
}
