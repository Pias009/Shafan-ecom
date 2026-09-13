"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Eye } from "lucide-react";

interface BestSellersSectionProps {
  products: any[];
  onQuickView: (p: any) => void;
  addToCart?: (p: any) => void;
  orderNow?: (p: any) => void;
}

import { motion } from "framer-motion";

export function BestSellersSection({
  products,
  onQuickView,
}: BestSellersSectionProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const count = products.length;

  // Move forward to next card (left-to-right conveyer)
  const handleNext = useCallback(() => {
    if (count === 0) return;
    setActiveIndex((prev) => (prev + 1) % count);
  }, [count]);

  // Move back to previous card
  const handlePrev = useCallback(() => {
    if (count === 0) return;
    setActiveIndex((prev) => (prev - 1 + count) % count);
  }, [count]);

  // Auto-advance every 2 seconds
  useEffect(() => {
    if (count <= 1 || isPaused) return;

    timerRef.current = setInterval(() => {
      handleNext();
    }, 2000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [count, isPaused, handleNext]);

  if (!products || products.length === 0) return null;

  const activeProduct = products[activeIndex] || products[0];
  const activeBrand =
    typeof activeProduct.brand === "string"
      ? activeProduct.brand
      : activeProduct.brand?.name || "Prestige House";
  const activePrice =
    activeProduct.discountPrice || activeProduct.salePrice || activeProduct.price || 0;

  return (
    <motion.section
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: false, margin: "-100px" }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className="relative w-full py-12 sm:py-20 px-3 sm:px-6 overflow-hidden select-none bg-transparent my-4 sm:my-6 hover:scale-[1.02] transition-transform duration-500 hover:shadow-[0_0_30px_rgba(137,7,84,0.15)] rounded-3xl"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      {/* Soft Ambient Depth Illumination */}
      <div className="absolute inset-0 pointer-events-none -z-10 flex items-center justify-center">
        <div className="w-[850px] h-[450px] bg-gradient-to-r from-pink-500/5 via-[#890754]/5 to-amber-500/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-[1400px] mx-auto flex flex-col items-center">
        {/* ── 1. Pure Luxury Animated Brand Heading (No Extra Text) ── */}
        <div className="flex flex-col items-center justify-center mb-6 sm:mb-8 text-center">
          <h2 className="fancy-brand-heading font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight sm:tracking-normal select-none text-[#890754]">
            Best Arrived
          </h2>
          <div className="luxury-heading-line h-0.5 mt-2 sm:mt-2.5 bg-gradient-to-r from-transparent via-[#890754] to-transparent rounded-full" />
        </div>

        {/* ── 2. 3D Cylindrical Arc Card Carousel (5 Cards in 3D Convex Curve) ── */}
        <div
          className="relative w-full max-w-[1000px] h-[235px] sm:h-[285px] md:h-[330px] flex items-center justify-center mb-4 sm:mb-7"
          style={{ perspective: "1200px" }}
        >
          {products.map((product, i) => {
            // Circular relative offset from activeIndex
            let diff = i - activeIndex;
            if (diff > count / 2) diff -= count;
            if (diff < -count / 2) diff += count;

            const isVisible = Math.abs(diff) <= 2;
            if (!isVisible) return null;

            // 3D convex arc transformation coordinates
            let translateX = "0%";
            let translateY = "0px";
            let translateZ = "50px";
            let rotateY = 0;
            let rotateZ = 0;
            let scale = 1.05;
            let zIndex = 30;
            let opacity = 1;

            if (diff === 1) {
              // Right 1 (immediate right)
              translateX = "65%";
              translateY = "14px";
              translateZ = "-25px";
              rotateY = -24;
              rotateZ = 3.5;
              scale = 0.88;
              zIndex = 20;
              opacity = 0.96;
            } else if (diff === 2) {
              // Right 2 (far right)
              translateX = "128%";
              translateY = "28px";
              translateZ = "-90px";
              rotateY = -38;
              rotateZ = 7;
              scale = 0.72;
              zIndex = 10;
              opacity = 0.65;
            } else if (diff === -1) {
              // Left 1 (immediate left)
              translateX = "-65%";
              translateY = "14px";
              translateZ = "-25px";
              rotateY = 24;
              rotateZ = -3.5;
              scale = 0.88;
              zIndex = 20;
              opacity = 0.96;
            } else if (diff === -2) {
              // Left 2 (far left)
              translateX = "-128%";
              translateY = "28px";
              translateZ = "-90px";
              rotateY = 38;
              rotateZ = -7;
              scale = 0.72;
              zIndex = 10;
              opacity = 0.65;
            }

            const isCenter = diff === 0;
            const imgSrc =
              product.imageUrl || product.mainImage || "/placeholder-product.png";

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
                className="absolute w-[145px] h-[185px] sm:w-[190px] sm:h-[240px] md:w-[225px] md:h-[285px] rounded-2xl sm:rounded-3xl p-1 flex flex-col items-center justify-center cursor-pointer select-none transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]"
                style={{
                  transform: `translateX(${translateX}) translateY(${translateY}) translateZ(${translateZ}) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg) scale(${scale})`,
                  zIndex,
                  opacity,
                  transformStyle: "preserve-3d",
                  willChange: "transform, opacity",
                }}
              >
                {/* 3D Card Shell — Image Fits & Covers Fully */}
                <div
                  className="relative w-full h-full rounded-2xl sm:rounded-3xl bg-white border border-gray-200/90 overflow-hidden shadow-xl transition-transform duration-300 group"
                  style={{
                    boxShadow: isCenter
                      ? "0 20px 48px -8px rgba(137,7,84,0.22), 0 8px 24px rgba(0,0,0,0.08), inset 0 1.5px 2px rgba(255,255,255,0.9)"
                      : "0 10px 28px rgba(20,5,15,0.08), inset 0 1px 1.5px rgba(255,255,255,0.6)",
                  }}
                >
                  {/* Image Fills & Covers Fully */}
                  <Image
                    src={imgSrc}
                    alt={product.name || "Best Seller"}
                    fill
                    className="object-cover w-full h-full rounded-2xl sm:rounded-3xl transition-transform duration-700 ease-out group-hover:scale-105"
                    sizes="(max-width: 640px) 50vw, 30vw"
                    priority={isCenter}
                  />

                  {/* Top Specular Glass Reflection */}
                  <div className="absolute inset-x-0 top-0 h-[40%] bg-gradient-to-b from-white/30 via-white/5 to-transparent pointer-events-none rounded-t-2xl sm:rounded-t-3xl" />

                  {/* Center Card Interactive Quick View Tag on Hover */}
                  {isCenter && (
                    <div className="absolute inset-x-2.5 bottom-2.5 sm:inset-x-4 sm:bottom-4 py-1.5 sm:py-2 px-2.5 sm:px-3 rounded-full bg-black/75 backdrop-blur-md border border-white/20 flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-lg">
                      <Eye size={12} className="text-white" />
                      <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-white">
                        Quick View
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── 3. Bottom Active Info & Capsule Action Pill ── */}
        <div className="flex flex-col items-center text-center z-20">
          {/* Active Product Name & Price */}
          <div className="flex items-center justify-center gap-2 text-xs sm:text-sm font-medium text-gray-600 mb-5 max-w-md px-4">
            <span className="text-[#890754] font-bold uppercase tracking-wider text-[11px]">
              {activeBrand}
            </span>
            <span className="text-gray-300">•</span>
            <span className="truncate text-gray-900 font-bold max-w-[200px] sm:max-w-[260px]">
              {activeProduct.name}
            </span>
            {activePrice > 0 && (
              <>
                <span className="text-gray-300">•</span>
                <span className="text-[#890754] font-black shrink-0">
                  {activePrice} AED
                </span>
              </>
            )}
          </div>

          {/* Action Navigation Pill */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Previous Chevron button */}
            <button
              onClick={handlePrev}
              className="w-9 h-9 rounded-full bg-white hover:bg-gray-50 border border-gray-200 shadow-xs flex items-center justify-center text-gray-700 hover:text-black transition-all active:scale-95"
              aria-label="Previous product"
            >
              <ArrowRight size={14} className="rotate-180" />
            </button>

            {/* Capsule Pill Button matching reference */}
            <Link
              href="/products?sort=best-selling"
              className="group inline-flex items-center gap-3 pl-5 pr-2 py-2 sm:py-2.5 rounded-full bg-gradient-to-r from-[#540434] via-[#890754] to-[#540434] text-white hover:from-[#65033d] hover:to-[#65033d] transition-all duration-300 shadow-[0_4px_16px_rgba(137,7,84,0.3)] hover:scale-105 active:scale-95 select-none"
            >
              <span className="text-xs sm:text-sm font-bold tracking-tight text-white">
                Explore Best Arrived
              </span>
              <div className="w-6 h-6 rounded-full bg-white text-[#890754] flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:translate-x-0.5 shadow-xs">
                <ArrowRight size={12} />
              </div>
            </Link>

            {/* Next Chevron button */}
            <button
              onClick={handleNext}
              className="w-9 h-9 rounded-full bg-white hover:bg-gray-50 border border-gray-200 shadow-xs flex items-center justify-center text-gray-700 hover:text-black transition-all active:scale-95"
              aria-label="Next product"
            >
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
