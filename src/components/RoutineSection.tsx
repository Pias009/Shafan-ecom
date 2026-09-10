"use client";

import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ArrowRight, ChevronLeft, ChevronRight, Layers, Sparkles, ShoppingCart } from 'lucide-react';
import { motion } from 'framer-motion';
import { ProductCard } from './ProductCard';
import { Price } from './Price';
import { WhiteSeaWaveCanvas } from './WhiteSeaWaveCanvas';

interface RoutineBanner {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string | null;
  linkUrl: string | null;
  active: boolean;
}

interface Props {
  products: any[];
  banners?: RoutineBanner[];
  onQuickView: (p: any) => void;
  addToCart: (p: any) => void;
  orderNow: (p: any) => void;
}

function HorizontalRoutineComboBanner({
  combo,
  onQuickView,
  onAddToCart,
  onOrderNow,
}: {
  combo: any;
  onQuickView: (p: any) => void;
  onAddToCart: (p: any) => void;
  onOrderNow?: (p: any) => void;
}) {
  const router = useRouter();
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  // Price calculations
  const displayPrice = combo.salePrice || combo.discountPrice || combo.price || 0;
  const originalPrice = (combo.salePrice || combo.discountPrice) && combo.price > displayPrice ? combo.price : null;
  const brandName = combo.brand?.name || combo.brand || "Shafan Beauty";
  const imageUrl = combo.mainImage || combo.imageUrl || "/images/routine-diagnostic-visual.jpg";

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: -(y * 6), y: x * 6 });
  };

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => {
    setIsHovered(false);
    setTilt({ x: 0, y: 0 });
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button")) return;
    if (combo.slug) {
      router.push(`/products/${combo.slug}`);
    } else if (combo.id) {
      router.push(`/products/${combo.id}`);
    } else {
      onQuickView(combo);
    }
  };

  return (
    <div
      ref={cardRef}
      onClick={handleCardClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: isHovered
          ? `perspective(1200px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateY(-2px)`
          : 'perspective(1200px) rotateX(0deg) rotateY(0deg) translateY(0px)',
        transition: isHovered ? 'transform 0.12s ease-out' : 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
        transformStyle: 'preserve-3d',
      }}
      className="group relative w-full max-w-5xl mx-auto mb-6 sm:mb-9 rounded-2xl sm:rounded-3xl p-1 bg-gradient-to-r from-[#890754]/30 via-pink-200/50 to-[#540434]/40 shadow-[0_16px_40px_rgba(137,7,84,0.12)] hover:shadow-[0_24px_60px_rgba(137,7,84,0.22)] transition-shadow duration-500 cursor-pointer overflow-hidden select-none"
    >
      {/* Inner card container containing the canvas and content */}
      <div className="relative w-full rounded-[calc(1rem-2px)] sm:rounded-[calc(1.5rem-2px)] overflow-hidden border border-pink-100/70 bg-white">
        
        {/* 3D WebGL White Sea Waves Canvas Layer - bottom to middle with pure white upper section */}
        <WhiteSeaWaveCanvas className="z-0 absolute inset-0 w-full h-full" />

        {/* Content layout sitting seamlessly over the waves */}
        <div className="relative z-10 flex flex-row items-center justify-between p-3 sm:p-6 md:p-8 gap-3 sm:gap-6 bg-transparent">
          
          {/* Left / Visual Side: Ultra-Large Hero Image (NO BG!) */}
          <div className="relative z-10 flex items-center justify-center shrink-0 w-[130px] xs:w-[160px] sm:w-[250px] md:w-[320px] lg:w-[370px] h-[145px] xs:h-[175px] sm:h-[220px] md:h-[265px] lg:h-[290px] p-0 bg-transparent">
            {/* Floating Top Badge */}
            <div className="absolute top-0.5 left-0.5 sm:top-1 sm:left-1 z-20">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-[#540434] to-[#890754] text-white font-black text-[8px] sm:text-[9.5px] uppercase tracking-wider shadow-sm border border-white/40">
                <Sparkles className="w-2 sm:w-2.5 h-2 sm:h-2.5 text-amber-300 animate-pulse" />
                Best Routine Pack
              </span>
            </div>

            {/* Floating Product Bottle Visual with Weightless 3D Wave Motion */}
            <motion.div
              animate={{
                y: [-4, 5, -4],
                rotate: [-0.6, 0.6, -0.6],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="relative w-full h-full transition-transform duration-700 ease-out group-hover:scale-106 group-hover:-translate-y-1"
            >
              <Image
                src={imageUrl}
                alt={combo.name}
                fill
                unoptimized
                sizes="(max-width: 640px) 200px, 450px"
                className="object-contain drop-shadow-[0_20px_35px_rgba(84,4,52,0.28)] group-hover:drop-shadow-[0_28px_48px_rgba(84,4,52,0.40)] transition-all duration-700"
                priority
              />
            </motion.div>

            {/* Quick View floating button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onQuickView(combo);
              }}
              className="absolute right-1 top-1 sm:right-1.5 sm:top-1.5 w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-white/95 backdrop-blur-md shadow-md border border-pink-100 flex items-center justify-center text-gray-700 hover:text-[#890754] hover:scale-110 active:scale-95 transition-all opacity-85 sm:opacity-0 group-hover:opacity-100"
              title="Quick View Combo Pack"
            >
              <Layers className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
            </button>
          </div>

          {/* Right / Information Side: NO BG! Clean, seamless, pure typography & buttons */}
          <div className="relative z-10 flex-1 min-w-0 bg-transparent p-1 sm:p-2 flex flex-col justify-center gap-1.5 sm:gap-2.5 text-left">
            {/* Header Badges & Rating */}
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2.5">
              <span className="hidden xs:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-[#540434] to-[#890754] text-white font-black text-[8.5px] sm:text-[10px] uppercase tracking-wider shadow-xs">
                <Sparkles className="w-2.5 sm:w-3 h-2.5 sm:h-3 text-amber-300 animate-pulse" />
                #1 Routine Combo
              </span>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-900 font-bold text-[8px] sm:text-[9.5px] tracking-tight">
                ★ 4.9 (420+ Reviews)
              </span>
              <span className="text-[8.5px] sm:text-[10px] font-black uppercase text-[#890754] tracking-wider ml-auto bg-pink-100/70 px-2 py-0.5 rounded-full border border-pink-200/60">
                Save 25% Off
              </span>
            </div>

            {/* Product Title & Brand */}
            <div>
              <span className="text-[8.5px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-[#890754]">
                {brandName}
              </span>
              <h3 className="font-extrabold text-sm sm:text-lg md:text-xl text-gray-900 leading-snug tracking-tight truncate group-hover:text-[#890754] transition-colors mt-0.5">
                {combo.name}
              </h3>
            </div>

            {/* Benefit Chips */}
            <div className="flex flex-wrap items-center gap-1 sm:gap-2 text-[8px] sm:text-[10px] text-gray-600 font-semibold">
              <span className="inline-flex items-center gap-1 bg-white/95 px-2 py-0.5 rounded-md border border-pink-100/70 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                Complete 3-Step Set
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 bg-white/95 px-2 py-0.5 rounded-md border border-pink-100/70 shadow-2xs">
                Dermatologist Tested
              </span>
              <span className="hidden md:inline-flex items-center gap-1 bg-white/95 px-2 py-0.5 rounded-md border border-pink-100/70 shadow-2xs">
                Deep Barrier Repair
              </span>
            </div>

            {/* Price & Action Row */}
            <div className="flex items-center justify-between gap-2.5 pt-1.5 sm:pt-2 border-t border-pink-200/60 mt-0.5 sm:mt-1">
              {/* Price Container */}
              <div className="flex items-baseline gap-1.5 sm:gap-2.5 shrink-0">
                <Price
                  amount={displayPrice}
                  countryPrices={combo.countryPrices}
                  className="text-base sm:text-xl md:text-2xl font-black text-gray-900 tracking-tight"
                />
                {originalPrice && (
                  <span className="text-[11px] sm:text-sm text-gray-400 line-through font-medium">
                    <Price amount={originalPrice} countryPrices={combo.countryPrices} />
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 sm:gap-2.5">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddToCart(combo);
                  }}
                  className="py-2 sm:py-2.5 px-3.5 sm:px-6 rounded-full bg-gradient-to-r from-[#540434] via-[#890754] to-[#a80b67] text-white font-black text-[9.5px] sm:text-xs uppercase tracking-wider shadow-md hover:shadow-lg hover:shadow-pink-900/25 active:scale-95 transition-all duration-200 flex items-center justify-center gap-1.5 shrink-0"
                  title="Add Combo Pack to Cart"
                >
                  <ShoppingCart className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
                  <span className="hidden xs:inline">Add Pack to Cart</span>
                  <span className="xs:hidden">Add Pack</span>
                </button>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}

// Skincare Routine Steps Metadata & Classifier
const ROUTINE_STEPS_META = [
  { step: 1, label: "Cleanse", sub: "Step 01 • Purify & Prep" },
  { step: 2, label: "Tone", sub: "Step 02 • Balance & Hydrate" },
  { step: 3, label: "Serum", sub: "Step 03 • Target & Treat" },
  { step: 4, label: "Moisturize", sub: "Step 04 • Lock & Barrier" },
  { step: 5, label: "Protect", sub: "Step 05 • Shield & Glow" },
  { step: 6, label: "Restore", sub: "Step 06 • Deep Renewal" },
];

function getRoutineStepForProduct(product: any, index: number) {
  const name = (product?.name || "").toLowerCase();
  const cat = (
    product?.category?.name ||
    (typeof product?.category === "string" ? product.category : "") ||
    ""
  ).toLowerCase();
  const text = `${name} ${cat}`;

  if (text.includes("clean") || text.includes("wash") || text.includes("foam") || text.includes("gel")) {
    return { stepNum: 1, label: "Cleanse", sub: "Step 01 • Purify" };
  }
  if (text.includes("tone") || text.includes("mist") || text.includes("essence") || text.includes("water")) {
    return { stepNum: 2, label: "Tone", sub: "Step 02 • Balance" };
  }
  if (text.includes("serum") || text.includes("ampoule") || text.includes("acid") || text.includes("peel") || text.includes("drop")) {
    return { stepNum: 3, label: "Serum", sub: "Step 03 • Treat" };
  }
  if (text.includes("cream") || text.includes("lotion") || text.includes("moist") || text.includes("emulsion")) {
    return { stepNum: 4, label: "Moisturize", sub: "Step 04 • Hydrate" };
  }
  if (text.includes("sun") || text.includes("spf") || text.includes("shield") || text.includes("uv") || text.includes("protect")) {
    return { stepNum: 5, label: "Protect", sub: "Step 05 • Shield" };
  }
  if (text.includes("mask") || text.includes("balm") || text.includes("oil") || text.includes("night") || text.includes("repair")) {
    return { stepNum: 6, label: "Restore", sub: "Step 06 • Renew" };
  }

  const fallback = ROUTINE_STEPS_META[index % ROUTINE_STEPS_META.length];
  return { stepNum: fallback.step, label: fallback.label, sub: `Step 0${(index % 6) + 1} • ${fallback.label}` };
}

function transformRoutineProduct(product: any) {
  const price = product.price || product.priceCents || 0;
  const salePrice = product.discountPrice || product.salePrice || product.salePriceCents || 0;
  return {
    ...product,
    price: price,
    discountPrice: salePrice > 0 ? salePrice : undefined,
    salePrice: salePrice > 0 ? salePrice : undefined,
    imageUrl: product.imageUrl || product.mainImage || "/placeholder-product.png",
    mainImage: product.mainImage || product.imageUrl,
    brand:
      product.brandName ||
      (typeof product.brand === "string" ? product.brand : product.brand?.name) ||
      "Shafan Beauty",
  };
}

export function RoutineSection({ products, banners = [], onQuickView, addToCart, orderNow }: Props) {
  const router = useRouter();
  const sectionRef = useRef<HTMLElement>(null);
  const stepPillsRef = useRef<HTMLDivElement>(null);
  const [activeBanner, setActiveBanner] = useState(0);

  // 1. Identify the Best Routine Combo / Pack product for the horizontal banner
  const bestComboProduct = products.find((p) => {
    const n = (p.name || '').toLowerCase();
    return (
      n.includes('daily routine') ||
      n.includes('barrier repair') ||
      n.includes('bundle') ||
      n.includes('combo') ||
      n.includes('routine set')
    );
  }) || products[0];

  // 3D Stepper Slider State
  const total = products.length;
  const [activeIndex, setActiveIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [windowWidth, setWindowWidth] = useState(1200);

  // "See All" expansion state & fade-out transition
  const [isExpanded, setIsExpanded] = useState(false);

  // Retrigger handwriting stroke drawing animation every time user scrolls to this section
  const [animationKey, setAnimationKey] = useState(0);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!sectionRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setAnimationKey((prev) => prev + 1);
          }
        });
      },
      { threshold: 0.15 }
    );

    observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  // Smoothly scroll the active step tab into center view
  useEffect(() => {
    if (!stepPillsRef.current || isExpanded) return;
    const activeBtn = stepPillsRef.current.children[activeIndex] as HTMLElement;
    if (activeBtn && typeof activeBtn.scrollIntoView === 'function') {
      activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [activeIndex, isExpanded]);

  const activeBanners = banners.filter((b) => b.active);
  const currentBanner = activeBanners[activeBanner] ?? null;

  // Slide navigation
  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + total) % total);
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % total);
  };

  // Touch handlers for mobile swipe
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null || isExpanded) return;
    const touchEnd = e.changedTouches[0].clientX;
    const distance = touchStart - touchEnd;
    if (distance > 40) {
      handleNext();
    } else if (distance < -40) {
      handlePrev();
    }
    setTouchStart(null);
  };

  // Track scrubber click
  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    const target = Math.min(total - 1, Math.max(0, Math.floor(ratio * total)));
    setActiveIndex(target);
  };

  if (products.length === 0) return null;

  const isMobile = windowWidth < 640;
  const isTablet = windowWidth >= 640 && windowWidth < 1024;
  const step = isMobile ? 128 : isTablet ? 165 : 205;
  const currentStepMeta = getRoutineStepForProduct(products[activeIndex] || {}, activeIndex);

  return (
    <section ref={sectionRef} className="pt-6 md:pt-10 pb-6 md:pb-10 px-1 sm:px-4">
      {/* Centered Luxury Signature Calligraphy Section Header with Pen Stroke Writing Animation */}
      <div className="text-center mb-6 sm:mb-10 flex flex-col items-center justify-center">
        <div className="inline-flex items-center justify-center gap-3 sm:gap-6 w-full max-w-4xl px-2">
          <span className="h-px flex-1 max-w-[40px] sm:max-w-[80px] md:max-w-[120px] bg-gradient-to-r from-transparent to-[#890754]/30" />
          
          {/* Animated Calligraphy Title "Routine" — Extra Large Statement Hero in Brand Velvet Plum */}
          <div key={animationKey} className="relative inline-flex flex-col items-center justify-center py-1 select-none">
            <h2
              className="routine-pen-draw font-['Great_Vibes','Alex_Brush',cursive] text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-normal tracking-wide text-[#890754] leading-none drop-shadow-xs px-2 sm:px-4"
            >
              Routine
            </h2>

            {/* Hand-drawn luxury calligraphy underline swash */}
            <svg
              viewBox="0 0 300 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-48 sm:w-64 md:w-80 lg:w-96 h-3.5 sm:h-5 -mt-1 sm:-mt-2 overflow-visible pointer-events-none"
              aria-hidden="true"
            >
              <path
                d="M8 14 C 60 18, 140 4, 210 10 C 255 14, 280 11, 295 11"
                stroke="#890754"
                strokeWidth="2.5"
                strokeLinecap="round"
                className="routine-swash-draw"
              />
            </svg>
          </div>

          <span className="h-px flex-1 max-w-[40px] sm:max-w-[80px] md:max-w-[120px] bg-gradient-to-l from-transparent to-[#890754]/30" />
        </div>
      </div>

      {/* Admin banner — shown only when one is active */}
      {currentBanner && (
        <div className="mb-4 relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#540434] to-[#890754]">
          {currentBanner.imageUrl && (
            <Image
              src={currentBanner.imageUrl}
              alt={currentBanner.title}
              fill
              className="object-cover opacity-30"
            />
          )}
          <div className="relative z-10 flex items-center justify-between px-6 py-5 sm:px-8 sm:py-7">
            <div>
              <p className="font-black text-white text-xl sm:text-3xl tracking-tight">{currentBanner.title}</p>
              {currentBanner.subtitle && (
                <p className="text-white/80 text-sm sm:text-base mt-1 font-medium">{currentBanner.subtitle}</p>
              )}
            </div>
            {currentBanner.linkUrl && (
              <Link
                href={currentBanner.linkUrl}
                className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 bg-white text-[#890754] rounded-full font-black text-xs uppercase tracking-widest hover:bg-white/90 transition-colors shadow-md"
              >
                Shop Now <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
          {activeBanners.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
              {activeBanners.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveBanner(i)}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${i === activeBanner ? 'bg-white w-4' : 'bg-white/40'}`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Horizontal Best Routine Combo Banner Card */}
      {bestComboProduct && (
        <HorizontalRoutineComboBanner
          combo={bestComboProduct}
          onQuickView={onQuickView}
          onAddToCart={addToCart}
          onOrderNow={orderNow}
        />
      )}

      {/* Routine Products Interactive Stepper Container */}
      <div className="relative py-2 select-none">
        {!isExpanded ? (
          <div>
            {/* 1. Top Routine Step Navigation Bar (Clickable Stepper Pills) */}
            <div className="mb-3 sm:mb-5 px-2">
              <div
                ref={stepPillsRef}
                className="flex items-center justify-start sm:justify-center gap-1.5 sm:gap-2.5 overflow-x-auto scrollbar-none py-1.5 px-1 max-w-4xl mx-auto"
              >
                {products.map((p, idx) => {
                  const meta = getRoutineStepForProduct(p, idx);
                  const isCurrent = idx === activeIndex;
                  return (
                    <button
                      key={p.id || idx}
                      type="button"
                      onClick={() => setActiveIndex(idx)}
                      className={`shrink-0 inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-full text-[10px] sm:text-xs font-bold transition-all duration-300 ${
                        isCurrent
                          ? "bg-gradient-to-r from-[#540434] via-[#890754] to-[#a80b67] text-white shadow-md shadow-pink-900/25 scale-105 border border-pink-300/40"
                          : "bg-white/95 text-gray-600 hover:text-[#890754] hover:bg-pink-50/80 border border-pink-100 shadow-2xs"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isCurrent ? "bg-amber-300 animate-pulse" : "bg-pink-300"
                        }`}
                      />
                      <span className="font-black tracking-wide">{`0${idx + 1}`}</span>
                      <span>{meta.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. 3D Coverflow Stepper Carousel Stage */}
            <div
              className="relative w-full h-[285px] sm:h-[320px] md:h-[355px] flex items-center justify-center overflow-hidden"
              style={{ perspective: "1200px" }}
              onTouchStart={onTouchStart}
              onTouchEnd={onTouchEnd}
            >
              {/* Left Navigation Chevron */}
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Previous routine step"
                className="no-min-size absolute left-1 sm:left-4 md:left-8 top-1/2 -translate-y-1/2 z-40 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white shadow-[0_4px_16px_rgba(137,7,84,0.16)] border border-pink-100 flex items-center justify-center text-[#890754] hover:bg-gradient-to-r hover:from-[#540434] hover:to-[#890754] hover:text-white hover:scale-110 active:scale-95 transition-all"
                style={{ minWidth: 0, minHeight: 0 }}
              >
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2]" />
              </button>

              {/* Right Navigation Chevron */}
              <button
                type="button"
                onClick={handleNext}
                aria-label="Next routine step"
                className="no-min-size absolute right-1 sm:right-4 md:right-8 top-1/2 -translate-y-1/2 z-40 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white shadow-[0_4px_16px_rgba(137,7,84,0.16)] border border-pink-100 flex items-center justify-center text-[#890754] hover:bg-gradient-to-r hover:from-[#540434] hover:to-[#890754] hover:text-white hover:scale-110 active:scale-95 transition-all"
                style={{ minWidth: 0, minHeight: 0 }}
              >
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2]" />
              </button>

              {/* Cards Stage with Inward 3D Vanity Perspective */}
              <div className="relative w-full h-full flex items-center justify-center overflow-visible">
                {products.map((rawProduct, i) => {
                  let diff = (i - activeIndex) % total;
                  if (diff > total / 2) diff -= total;
                  if (diff < -total / 2) diff += total;

                  const isVisible = Math.abs(diff) <= (isMobile ? 1 : 2);
                  if (!isVisible) return null;

                  const isActive = diff === 0;
                  const isNeighbor = Math.abs(diff) === 1;

                  const scale = isActive ? 1.06 : isNeighbor ? 0.88 : 0.72;
                  const zIndex = isActive ? 30 : isNeighbor ? 20 : 10;
                  const opacity = isActive ? 1 : isNeighbor ? (isMobile ? 0.65 : 0.85) : 0.45;
                  const rotateY = diff === 0 ? 0 : diff > 0 ? 12 : -12;
                  const offsetX = diff * step;

                  const product = transformRoutineProduct(rawProduct);
                  const stepMeta = getRoutineStepForProduct(product, i);

                  return (
                    <div
                      key={product.id || i}
                      onClickCapture={(e) => {
                        if (diff !== 0) {
                          e.stopPropagation();
                          e.preventDefault();
                          setActiveIndex(i);
                        }
                      }}
                      style={{
                        transform: `translate(calc(-50% + ${offsetX}px), -50%) scale(${scale}) rotateY(${rotateY}deg)`,
                        zIndex,
                        opacity,
                        transition: "transform 0.45s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.35s ease-out",
                      }}
                      className={`absolute top-1/2 left-1/2 w-[145px] xs:w-[155px] sm:w-[175px] md:w-[205px] cursor-pointer select-none transition-shadow ${
                        isActive ? "ring-2 ring-[#890754]/30 rounded-2xl shadow-[0_20px_45px_rgba(137,7,84,0.22)]" : ""
                      }`}
                    >
                      {/* Floating Step Badge */}
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-30 pointer-events-none whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[8px] sm:text-[9.5px] font-black uppercase tracking-wider transition-all duration-300 ${
                            isActive
                              ? "bg-gradient-to-r from-[#540434] via-[#890754] to-[#a80b67] text-white border border-pink-200/50 shadow-[0_4px_12px_rgba(137,7,84,0.25)] scale-105"
                              : "bg-white/95 text-[#890754] border border-pink-200/80 shadow-xs"
                          }`}
                        >
                          <Sparkles
                            className={`w-2 sm:w-2.5 h-2 sm:h-2.5 ${
                              isActive ? "text-amber-300 animate-pulse" : "text-[#890754]"
                            }`}
                          />
                          {stepMeta.sub}
                        </span>
                      </div>

                      <ProductCard
                        product={product}
                        onQuickView={onQuickView}
                        onAddToCart={addToCart}
                        onOrderNow={orderNow}
                        compact={true}
                        priority={isActive}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3. Routine Step Scrubber & Progress Bar */}
            <div className="mt-4 sm:mt-5 flex flex-col items-center justify-center gap-2 select-none max-w-md mx-auto px-4">
              {/* Step info pill */}
              <div className="flex items-center gap-2 text-xs font-bold text-gray-700 tracking-wide">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-pink-100 text-[#890754] text-[10px] sm:text-[11px] font-black uppercase tracking-wider">
                  Step {activeIndex + 1} of {total}
                </span>
                <span className="text-gray-300">•</span>
                <span className="text-gray-900 font-extrabold">{currentStepMeta.label}</span>
                <span className="text-gray-400 font-normal hidden xs:inline">({currentStepMeta.sub})</span>
              </div>

              {/* Scrubber track line */}
              <div
                onClick={handleTrackClick}
                className="w-full h-1.5 sm:h-2 bg-pink-100/90 hover:bg-pink-200/90 rounded-full relative overflow-hidden cursor-pointer shadow-inner transition-colors"
                title="Click along track to navigate routine steps"
              >
                <div
                  className="h-full bg-gradient-to-r from-[#540434] via-[#890754] to-pink-500 rounded-full transition-all duration-300 ease-out shadow-xs"
                  style={{
                    width: `${((activeIndex + 1) / total) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>
        ) : (
          /* Full Grid Mode when expanded */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-4 max-w-5xl mx-auto px-1 sm:px-2 pt-2"
          >
            {products.map((rawProduct, idx) => {
              const product = transformRoutineProduct(rawProduct);
              const meta = getRoutineStepForProduct(product, idx);
              return (
                <div key={product.id || idx} className="relative h-full pt-3">
                  <div className="absolute top-0 left-2 z-20">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-[#540434] to-[#890754] text-white text-[8px] font-black uppercase tracking-wider shadow-2xs">
                      Step 0{meta.stepNum} • {meta.label}
                    </span>
                  </div>
                  <ProductCard
                    product={product}
                    onQuickView={onQuickView}
                    onAddToCart={addToCart}
                    onOrderNow={orderNow}
                    compact={true}
                    priority={idx < 4}
                  />
                </div>
              );
            })}
          </motion.div>
        )}

        {/* Bottom Centered "See All Routine" / "Back to Slider" Toggle Button */}
        <div className="mt-6 sm:mt-8 flex justify-center items-center">
          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="group inline-flex items-center gap-2 px-6 sm:px-8 py-2.5 sm:py-3 rounded-full border border-pink-200 bg-white/95 hover:bg-gradient-to-r hover:from-[#540434] hover:to-[#890754] text-[#890754] hover:text-white text-xs font-black uppercase tracking-widest transition-all duration-300 shadow-xs hover:shadow-lg hover:shadow-pink-900/15 hover:scale-105 active:scale-95"
            title={isExpanded ? "Collapse to Routine Slider" : "See All Routine Products in a Grid"}
          >
            <Layers className="w-4 h-4 text-[#890754] group-hover:text-white transition-colors" />
            <span className="wave-text">
              {isExpanded ? "See Routine Slider" : `See All Routine (${products.length} Products)`}
            </span>
            <ArrowRight className="w-3.5 h-3.5 wave-icon group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </section>
  );
}
