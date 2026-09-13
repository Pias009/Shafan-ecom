"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ShoppingBag, Eye, ArrowRight, Check } from "lucide-react";
import { Price } from "./Price";
import { CountryPrice } from "./ProductCard";
import { useLanguageStore } from "@/lib/language-store";

interface RejuvenateBestProductsSectionProps {
  routineProducts?: any[];
  bestProducts?: any[];
  onQuickView: (product: any) => void;
  addToCart: (product: any) => void;
  orderNow?: (product: any) => void;
}

export default function RejuvenateBestProductsSection({
  routineProducts = [],
  bestProducts = [],
  onQuickView,
  addToCart,
  orderNow,
}: RejuvenateBestProductsSectionProps) {
  const { currentLanguage } = useLanguageStore();
  const isAr = currentLanguage?.code === "ar";

  const [addedId, setAddedId] = useState<string | null>(null);

  // Pick 3 best matching products related to routine & wellness
  const cardsData = useMemo(() => {
    const pool = routineProducts.length > 0 ? routineProducts : bestProducts;
    
    const product1 = pool[0] || null;
    const product2 = pool[1] || pool[0] || null;
    const product3 = pool[2] || pool[1] || pool[0] || null;

    return [
      {
        id: "serum",
        tabTitle: isAr ? "سينتلاري" : "Sentlary\nSinville",
        categoryTag: isAr ? "سيروم النضارة" : "Radiance Elixir",
        bgHex: "#fbe8df",
        bgStep: "#fbe8df",
        accentHex: "#d87a63",
        imageSrc: "/images/rejuvenate/card-serum.jpg",
        imageAlt: "Luxury face serum with coral flower",
        product: product1,
      },
      {
        id: "cream",
        tabTitle: isAr ? "جيبيلاري" : "Gpelari",
        categoryTag: isAr ? "كريم الترميم" : "Velvet Cream",
        bgHex: "#f4c7bf",
        bgStep: "#f4c7bf",
        accentHex: "#cf6d68",
        imageSrc: "/images/rejuvenate/card-cream.jpg",
        imageAlt: "Handmade ceramic bowls with botanical whipped cream",
        product: product2,
      },
      {
        id: "candle",
        tabTitle: isAr ? "سيوتي" : "Seoty\nSeciac",
        categoryTag: isAr ? "طقس التهدئة" : "Zen Calming",
        bgHex: "#cde2d6",
        bgStep: "#cde2d6",
        accentHex: "#5c9176",
        imageSrc: "/images/rejuvenate/card-candle.jpg",
        imageAlt: "White aromatherapy scented candle with fern leaves",
        product: product3,
      },
    ];
  }, [routineProducts, bestProducts, isAr]);

  const handleAddToCart = (e: React.MouseEvent, product: any) => {
    e.stopPropagation();
    if (!product) return;
    addToCart(product);
    setAddedId(product.id);
    setTimeout(() => setAddedId(null), 1800);
  };

  const handleQuickView = (e: React.MouseEvent, product: any) => {
    e.stopPropagation();
    if (!product) return;
    onQuickView(product);
  };

  return (
    <section className="relative my-6 sm:my-14 px-1 sm:px-2 md:px-4">
      {/* Outer Shell Wrapper with Luxury Border & Soft Shadow */}
      <div className="relative rounded-[22px] sm:rounded-[40px] overflow-hidden border border-amber-900/10 shadow-[0_16px_50px_rgba(137,7,84,0.06)] bg-white">
        
        {/* ========================================================================= */}
        {/* Refresh Your Mind & 3 Tabbed Cards (3 COLUMNS ON ALL SCREENS) */}
        {/* ========================================================================= */}
        <div className="pt-8 sm:pt-14 pb-8 sm:pb-14 px-2.5 sm:px-6 lg:px-12 bg-gradient-to-b from-[#fdfbf9] to-white">
          
          {/* Header Texts */}
          <div className="text-center max-w-xl mx-auto mb-6 sm:mb-12 px-2">
            <div className="inline-block text-[8.5px] sm:text-xs font-black uppercase tracking-[0.2em] sm:tracking-[0.25em] text-[#890754] mb-1 sm:mb-2">
              {isAr ? "طقوس الصفاء والنقاء :" : "SEAL SIP :"}
            </div>
            
            <h3 className="font-serif text-xl xs:text-2xl sm:text-4xl md:text-5xl font-bold text-gray-950 tracking-tight mb-1.5 sm:mb-2.5">
              {isAr ? "انعشي حواسك وبشرتك" : "Refresh Your Mind"}
            </h3>
            
            <p className="text-gray-600 text-[9.5px] sm:text-xs md:text-sm leading-relaxed font-medium line-clamp-2 sm:line-clamp-none">
              {isAr
                ? "اعتني بجمالك وصفاء روحك مع أفضل مستحضرات العناية الطبيعية المنتقاة بعناية فائقة لتمنحك إشراقة استثنائية."
                : "Nourish your skin and soul with pure botanical essentials crafted for profound radiance, clarity, and tranquility."}
            </p>
          </div>

          {/* 3 Step-Tabbed Product Cards (STRICTLY 3-COLUMNS on Mobile and Desktop, Same-to-Same) */}
          <div className="grid grid-cols-3 gap-2 sm:gap-5 md:gap-8 max-w-5xl mx-auto">
            {cardsData.map((card, idx) => {
              const p = card.product;
              const hasProduct = Boolean(p);
              const displayPrice = p ? (p.discountPrice ?? p.price ?? p.priceCents ?? 0) : 0;
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
                      className="w-3 h-3 sm:w-5 sm:h-5 md:w-6 md:h-6 shrink-0 -ml-[0.5px]" 
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

                  {/* Main Card Body (Same-to-Same Aesthetic as Reference Image) */}
                  <div 
                    style={{ backgroundColor: card.bgHex }}
                    className="flex-1 rounded-b-xl sm:rounded-b-[28px] rounded-tr-lg sm:rounded-tr-[22px] p-1.5 sm:p-3.5 md:p-5 flex flex-col justify-between shadow-[0_8px_24px_rgba(0,0,0,0.05)] group-hover:shadow-[0_16px_36px_rgba(0,0,0,0.1)] group-hover:-translate-y-1 transition-all duration-300 ease-out"
                  >
                    {/* Studio Photograph matching the reference composition */}
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
              href="/products?category=Routine"
              className="inline-flex items-center gap-1 sm:gap-2 text-[9.5px] sm:text-xs md:text-sm font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] text-[#890754] hover:text-[#540434] underline underline-offset-4 sm:underline-offset-8 transition-all"
            >
              <span>{isAr ? "اكتشفي كافة مستحضرات الروتين" : "Explore All Routine Essentials"}</span>
              <ArrowRight size={12} className="rtl:rotate-180" />
            </Link>
          </div>

        </div>

      </div>
    </section>
  );
}
