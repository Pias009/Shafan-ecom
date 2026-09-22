"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { ShoppingBag, Eye, Star, Zap, Check } from "lucide-react";
import { Price } from "./Price";
import { CountryPrice } from "./ProductCard";
import { useLanguageStore } from "@/lib/language-store";
import { useCountryStore } from "@/lib/country-store";
import { resolveProductPrice } from "@/lib/product-utils";

interface HairCareSpotlightSectionProps {
  products?: any[];
  onQuickView: (product: any) => void;
  addToCart: (product: any) => void;
  orderNow?: (product: any) => void;
}

export default function HairCareSpotlightSection({
  products = [],
  onQuickView,
  addToCart,
  orderNow,
}: HairCareSpotlightSectionProps) {
  const { currentLanguage } = useLanguageStore();
  const isAr = currentLanguage?.code === "ar";
  const { selectedCountry } = useCountryStore();

  const [isAdded, setIsAdded] = useState(false);

  // Pick accurate hair care / shampoo product from database
  const matchedProduct = useMemo(() => {
    if (!products || products.length === 0) return null;
    
    // First priority: specific shampoo product
    const shampoo = products.find((p: any) => {
      const name = (p.name || "").toLowerCase();
      return name.includes("shampoo") && !name.includes("parfum");
    });
    if (shampoo) return shampoo;

    // Second priority: hair oil or hair care
    const hair = products.find((p: any) => {
      const name = (p.name || "").toLowerCase();
      const cat = (p.category?.name || p.category || "").toLowerCase();
      return (name.includes("hair") || cat.includes("hair") || name.includes("rosemary")) && 
             !name.includes("parfum") && !name.includes("eau de");
    });
    if (hair) return hair;

    return products[0];
  }, [products]);

  const resolvedHairPrice = matchedProduct
    ? resolveProductPrice(matchedProduct, selectedCountry)
    : null;
  const displayPrice = resolvedHairPrice
    ? (resolvedHairPrice.displayPrice || 49)
    : 49;
  const originalPrice = resolvedHairPrice && resolvedHairPrice.hasDiscount
    ? (resolvedHairPrice.originalPrice || null)
    : null;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!matchedProduct) return;
    addToCart(matchedProduct);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  const handleOrderNow = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!matchedProduct) return;
    if (orderNow) {
      orderNow(matchedProduct);
    } else {
      addToCart(matchedProduct);
    }
  };

  return (
    <section className="relative my-8 sm:my-14 px-2 sm:px-4">
      {/* Centered Slim Visual Showcase with Floating Order Now Button */}
      <motion.div 
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: false, amount: 0.2 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative max-w-xl mx-auto rounded-3xl sm:rounded-[36px] overflow-hidden border border-amber-900/10 shadow-[0_20px_50px_rgba(78,42,20,0.12)] bg-[#f5ede3] group cursor-pointer"
        onClick={() => matchedProduct && onQuickView(matchedProduct)}
      >
        {/* Poster Visual (Contains the bottle, seeds, and 4 circular benefits) */}
        <div className="relative w-full aspect-[9/14] sm:aspect-[9/13] overflow-hidden">
          <Image
            src="/images/showcase/methi-shampoo.png"
            alt="Methi Fenugreek Hair Therapy Formula"
            fill
            sizes="(max-width: 768px) 100vw, 580px"
            className="object-cover object-center group-hover:scale-103 transition-transform duration-700 ease-out"
            priority={false}
          />

          {/* Top Micro Live Pill */}
          <div className="absolute top-3.5 left-3.5 sm:top-5 sm:left-5 z-10 px-3 py-1 rounded-full bg-white/90 backdrop-blur-md border border-amber-900/15 shadow-xs flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-950">
              {isAr ? "١٠٠٪ تركيبة نباتية" : "100% Herbal Active"}
            </span>
          </div>

          {/* Top-Right Quick View Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (matchedProduct) onQuickView(matchedProduct);
            }}
            className="absolute top-3.5 right-3.5 sm:top-5 sm:right-5 z-10 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-gray-800 shadow-md backdrop-blur-md flex items-center justify-center active:scale-95 transition-all"
            title={isAr ? "معاينة سريعة" : "Quick View"}
          >
            <Eye size={15} className="text-[#890754]" />
          </button>

          {/* ========================================================================= */}
          {/* FLOATING ORDER NOW BUTTON AT THE BOTTOM */}
          {/* ========================================================================= */}
          <div className="absolute bottom-3 sm:bottom-6 left-3 right-3 sm:left-6 sm:right-6 z-20">
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="p-2 sm:p-2.5 rounded-2xl sm:rounded-full bg-white/95 backdrop-blur-xl border border-amber-900/15 shadow-[0_12px_32px_rgba(40,20,10,0.22)] flex items-center justify-between gap-2 sm:gap-4"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Left: Price & Rating */}
              <div className="pl-2 sm:pl-4 min-w-0">
                <div className="flex items-baseline gap-1.5">
                  <Price
                    amount={displayPrice}
                    countryPrices={matchedProduct?.countryPrices as CountryPrice[]}
                    currency={resolvedHairPrice?.currency}
                    className="text-base sm:text-xl font-black text-[#890754] leading-none"
                  />
                  {originalPrice && (
                    <span className="text-[10px] sm:text-xs text-gray-400 line-through font-bold">
                      <Price amount={originalPrice} countryPrices={matchedProduct?.countryPrices as CountryPrice[]} currency={resolvedHairPrice?.currency} />
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 mt-0.5 text-amber-500">
                  <Star size={10} className="fill-amber-400 text-amber-400" />
                  <span className="text-[9.5px] font-bold text-gray-700">4.9</span>
                  <span className="text-[8.5px] text-gray-400 font-medium truncate hidden xs:inline">
                    {isAr ? "شامبو طبيعي" : "Methi Scalp Care"}
                  </span>
                </div>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-1.5 shrink-0">
                {/* Add to Cart Icon Button */}
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all shadow-xs active:scale-95 ${
                    isAdded
                      ? "bg-emerald-600 text-white"
                      : "bg-gray-100 hover:bg-pink-50 text-[#890754]"
                  }`}
                  title={isAr ? "أضف للسلة" : "Add to Cart"}
                >
                  {isAdded ? <Check size={16} /> : <ShoppingBag size={16} />}
                </button>

                {/* Main ORDER NOW Floating Button */}
                <button
                  type="button"
                  onClick={handleOrderNow}
                  className="px-5 sm:px-7 py-2.5 rounded-full bg-[#890754] hover:bg-[#6e0543] text-white text-xs sm:text-sm font-black uppercase tracking-wider shadow-[0_6px_20px_rgba(137,7,84,0.35)] hover:shadow-[0_8px_24px_rgba(137,7,84,0.45)] hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5"
                >
                  <Zap size={14} className="fill-white" />
                  <span>{isAr ? "اطلب الآن" : "Order Now"}</span>
                </button>
              </div>
            </motion.div>
          </div>

        </div>
      </motion.div>
    </section>
  );
}
