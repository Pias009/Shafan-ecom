"use client";

import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ChevronLeft, ChevronRight, Layers, Sparkles, ShoppingCart, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { ProductCard } from './ProductCard';
import { Price } from './Price';
import { getOptimizedUrl } from '@/lib/cloudinary-url';
import { useLanguageStore } from '@/lib/language-store';

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
  const { currentLanguage } = useLanguageStore();
  const isAr = currentLanguage?.code === "ar";
  const sectionRef = useRef<HTMLElement>(null);
  const stepPillsRef = useRef<HTMLDivElement>(null);
  const [activeBanner, setActiveBanner] = useState(0);



  // 3D Stepper Slider State
  const total = products.length;
  const [activeIndex, setActiveIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  // "See All" expansion state & fade-out transition
  const [isExpanded, setIsExpanded] = useState(false);

  // Retrigger handwriting stroke drawing animation every time user scrolls to this section
  const [animationKey, setAnimationKey] = useState(0);

  // Auto-advance routine cards every 2 seconds like the other sections
  useEffect(() => {
    if (total <= 1 || isPaused || isExpanded) return;

    timerRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % total);
    }, 2000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [total, isPaused, isExpanded]);

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

  // Smoothly scroll the active step tab into center view without scrolling the page vertically
  useEffect(() => {
    if (!stepPillsRef.current || isExpanded) return;
    const activeBtn = stepPillsRef.current.children[activeIndex] as HTMLElement;
    if (activeBtn) {
      const container = stepPillsRef.current;
      const scrollLeft = activeBtn.offsetLeft - (container.clientWidth / 2) + (activeBtn.clientWidth / 2);
      container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
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

  const rawActive = products[activeIndex] || products[0];
  const currentStepMeta = getRoutineStepForProduct(rawActive, activeIndex);

  return (
    <section
      ref={sectionRef}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="relative w-full py-8 sm:py-12 md:py-16 px-2 sm:px-6 lg:px-8 select-none overflow-hidden"
    >
      {/* Soft Ambient Depth Illumination */}
      <div className="absolute inset-0 pointer-events-none -z-10 flex items-center justify-center">
        <div className="w-[1100px] h-[500px] bg-gradient-to-r from-pink-500/5 via-[#890754]/5 to-amber-500/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-[1536px] mx-auto flex flex-col items-center">
        {/* 1. Ultra-Slim Section Header Bar (Matching Flash Sales style) */}
        <div className="w-full mb-4 sm:mb-6 md:mb-8 relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-[#3e0325] via-[#540434] to-[#3e0325] backdrop-blur-xl border border-pink-500/20 px-4 py-3 sm:px-6 sm:py-3.5 shadow-[0_8px_32px_rgba(84,4,52,0.2)]">
          {/* Glow accent */}
          <div className="absolute -top-12 -left-12 w-40 h-40 bg-pink-500/15 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-8 right-12 w-36 h-36 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative flex items-center justify-between gap-3 sm:gap-6">
            {/* Left: Title + Mini Badge */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <h2 className="font-sans text-base sm:text-lg md:text-xl font-bold tracking-tight text-white uppercase whitespace-nowrap">
                {isAr ? "العناية اليومية" : "Routine"}
              </h2>
              <span className="inline-flex items-center gap-1 bg-[#890754] border border-pink-400/40 text-white text-[8.5px] sm:text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                {isAr ? "خطوات" : "STEPS"}
              </span>
            </div>

            {/* Right: Slim See All CTA */}
            <Link
              href="/products?category=Skin%20Care"
              className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 rounded-full border border-pink-300/30 bg-white/10 hover:bg-white text-white hover:text-[#540434] hover:scale-105 transition-all text-xs font-semibold uppercase tracking-wider shadow-xs active:scale-95 shrink-0 whitespace-nowrap"
            >
              <span>{isAr ? "عرض الكل" : "See All"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Admin banner — shown only when one is active */}
        {currentBanner && (
          <div className="w-full mb-8 relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#540434] to-[#890754]">
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
                <p className="font-sans font-bold text-white text-xl sm:text-3xl tracking-tight">{currentBanner.title}</p>
                {currentBanner.subtitle && (
                  <p className="text-white/80 text-sm sm:text-base mt-1 font-medium">{currentBanner.subtitle}</p>
                )}
              </div>
              {currentBanner.linkUrl && (
                <Link
                  href={currentBanner.linkUrl}
                  className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 bg-white text-[#890754] rounded-full font-sans font-semibold text-xs uppercase tracking-wider hover:bg-white/90 transition-colors shadow-md"
                >
                  Shop Now <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
            {activeBanners.length > 1 && (
              <div className="hidden sm:flex absolute bottom-3 left-1/2 -translate-x-1/2 gap-1.5 z-20">
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

        {/* Routine Products Interactive Stepper Container */}
        <div className="relative w-full py-2 select-none">
          {!isExpanded ? (
            <div>
              {/* 2. 3D Convex Arc Coverflow Stepper Carousel Stage (Harmonized with Best Sellers) */}
              <div
                className="relative w-full h-[290px] sm:h-[370px] md:h-[440px] lg:h-[500px] xl:h-[540px] flex items-center justify-center overflow-hidden"
                style={{ perspective: "1400px" }}
                onTouchStart={(e) => {
                  setIsPaused(true);
                  onTouchStart(e);
                }}
                onTouchEnd={(e) => {
                  setIsPaused(false);
                  onTouchEnd(e);
                }}
              >
                {/* Left Navigation Chevron */}
                <button
                  type="button"
                  onClick={handlePrev}
                  aria-label="Previous routine step"
                  className="no-min-size absolute left-2 sm:left-6 lg:left-10 top-1/2 -translate-y-1/2 z-40 w-8 h-8 sm:w-11 sm:h-11 rounded-full bg-white shadow-[0_4px_16px_rgba(0,0,0,0.08)] border border-slate-200 flex items-center justify-center text-slate-700 hover:text-slate-900 hover:bg-slate-50 hover:scale-105 active:scale-95 transition-all"
                  style={{ minWidth: 0, minHeight: 0 }}
                >
                  <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2]" />
                </button>

                {/* Right Navigation Chevron */}
                <button
                  type="button"
                  onClick={handleNext}
                  aria-label="Next routine step"
                  className="no-min-size absolute right-2 sm:right-6 lg:right-10 top-1/2 -translate-y-1/2 z-40 w-8 h-8 sm:w-11 sm:h-11 rounded-full bg-white shadow-[0_4px_16px_rgba(0,0,0,0.08)] border border-slate-200 flex items-center justify-center text-slate-700 hover:text-slate-900 hover:bg-slate-50 hover:scale-105 active:scale-95 transition-all"
                  style={{ minWidth: 0, minHeight: 0 }}
                >
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2]" />
                </button>

                {/* Cards Stage with Symmetrical 3D Convex Arc Horizon */}
                <div className="relative w-full h-full flex items-center justify-center overflow-visible">
                  {products.map((rawProduct, i) => {
                    let diff = (i - activeIndex) % total;
                    if (diff > total / 2) diff -= total;
                    if (diff < -total / 2) diff += total;

                    const isVisible = Math.abs(diff) <= 2;
                    if (!isVisible) return null;

                    let translateX = "0%";
                    let translateY = "0px";
                    let translateZ = "80px";
                    let rotateY = 0;
                    let rotateZ = 0;
                    let scale = 1.06;
                    let zIndex = 30;
                    let opacity = 1;

                    if (diff === 1) {
                      translateX = "82%";
                      translateY = "20px";
                      translateZ = "-35px";
                      rotateY = -22;
                      rotateZ = 3;
                      scale = 0.88;
                      zIndex = 20;
                      opacity = 0.95;
                    } else if (diff === 2) {
                      translateX = "162%";
                      translateY = "40px";
                      translateZ = "-120px";
                      rotateY = -36;
                      rotateZ = 6.5;
                      scale = 0.74;
                      zIndex = 10;
                      opacity = 0.65;
                    } else if (diff === -1) {
                      translateX = "-82%";
                      translateY = "20px";
                      translateZ = "-35px";
                      rotateY = 22;
                      rotateZ = -3;
                      scale = 0.88;
                      zIndex = 20;
                      opacity = 0.95;
                    } else if (diff === -2) {
                      translateX = "-162%";
                      translateY = "40px";
                      translateZ = "-120px";
                      rotateY = 36;
                      rotateZ = -6.5;
                      scale = 0.74;
                      zIndex = 10;
                      opacity = 0.65;
                    }

                    const isCenter = diff === 0;
                    const product = transformRoutineProduct(rawProduct);
                    const stepMeta = getRoutineStepForProduct(product, i);
                    const rawImg = product.imageUrl || product.mainImage || "/placeholder-product.png";
                    const imgSrc = getOptimizedUrl(rawImg, 800);

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
                        className="absolute w-[155px] h-[240px] sm:w-[220px] sm:h-[320px] md:w-[270px] md:h-[380px] lg:w-[320px] lg:h-[440px] xl:w-[360px] xl:h-[480px] rounded-2xl sm:rounded-3xl p-1 flex flex-col items-center justify-center cursor-pointer select-none transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]"
                        style={{
                          transform: `translateX(${translateX}) translateY(${translateY}) translateZ(${translateZ}) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg) scale(${scale})`,
                          zIndex,
                          opacity,
                          transformStyle: "preserve-3d",
                          willChange: "transform, opacity",
                        }}
                      >
                        {/* 3D Card Shell — Clean and Modern Aesthetic */}
                        <div
                          className="relative w-full h-full rounded-2xl sm:rounded-3xl bg-white border border-slate-200/80 overflow-hidden shadow-lg transition-transform duration-300 group flex flex-col justify-between"
                          style={{
                            boxShadow: isCenter
                              ? "0 28px 60px -12px rgba(137,7,84,0.22), 0 12px 32px rgba(0,0,0,0.06), inset 0 1.5px 2px rgba(255,255,255,0.9)"
                              : "0 10px 28px rgba(20,5,15,0.08), inset 0 1px 1.5px rgba(255,255,255,0.6)",
                          }}
                        >
                          {/* Floating Step Badge */}
                          <div className="absolute top-2 left-2 sm:top-3 sm:left-3 z-20 pointer-events-none">
                            <span className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-white/95 backdrop-blur-md text-[#890754] text-[7.5px] sm:text-[9.5px] lg:text-[10px] font-semibold uppercase tracking-wider border border-pink-100 shadow-xs">
                              <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#890754]" />
                              {stepMeta.sub}
                            </span>
                          </div>

                          {/* Top Specular Soft Reflection */}
                          <div className="absolute inset-x-0 top-0 h-[35%] bg-gradient-to-b from-white/35 via-white/5 to-transparent pointer-events-none rounded-t-2xl sm:rounded-t-3xl z-10" />

                          {/* Image Stage: Edge-to-edge on mobile so image size is maximized */}
                          <div className="relative flex-1 w-full min-h-0 flex items-center justify-center p-1 sm:p-4">
                            <Image
                              src={imgSrc}
                              alt={product.name || "Routine Step"}
                              fill
                              className="object-contain p-1 sm:p-3 transition-transform duration-700 ease-out group-hover:scale-105"
                              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                              priority={isCenter}
                            />
                          </div>

                          {/* Bottom Info Area: Clean Brand, Title, Price, Cart & Rating */}
                          <div className="relative z-20 bg-white border-t border-slate-100 px-2.5 py-2 sm:px-4 sm:py-3 flex flex-col gap-1">
                            {/* Brand & Rating Row */}
                            <div className="flex items-center justify-between gap-1 leading-none">
                              <span className="text-[8px] sm:text-[10px] lg:text-xs font-semibold uppercase tracking-wider text-[#890754] truncate">
                                {product.brand}
                              </span>
                              <div className="flex items-center gap-0.5 shrink-0">
                                <Star size={10} className="text-amber-400 fill-amber-400 sm:w-3 sm:h-3" />
                                <span className="text-[8.5px] sm:text-[10px] lg:text-xs font-semibold text-slate-600">
                                  {product.averageRating || 4.9}
                                </span>
                              </div>
                            </div>

                            {/* Title Row */}
                            <h4 className="font-sans font-medium text-[11px] sm:text-xs lg:text-sm text-slate-900 leading-snug truncate group-hover:text-[#890754] transition-colors">
                              {product.name}
                            </h4>

                            {/* Price & Cart Icon Row */}
                            <div className="flex items-center justify-between gap-2 pt-0.5 mt-0.5">
                              <div className="flex items-baseline min-w-0">
                                <Price
                                  amount={product.discountPrice || product.price}
                                  className="text-xs sm:text-sm lg:text-base font-bold text-[#890754] tracking-tight leading-none"
                                  countryPrices={product.countryPrices}
                                />
                              </div>

                              {/* Cart Icon Button */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  addToCart(product);
                                }}
                                className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 rounded-full bg-[#890754] hover:bg-[#540434] text-white flex items-center justify-center shadow-xs transition-all active:scale-90 shrink-0"
                                title="Add to Cart"
                                aria-label="Add to Cart"
                              >
                                <ShoppingCart className="w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 3. Routine Step Scrubber & Progress Bar */}
              <div className="mt-5 sm:mt-8 flex flex-col items-center justify-center gap-2.5 select-none max-w-md mx-auto px-4">
                {/* Step info pill */}
                <div className="flex items-center gap-2 text-xs sm:text-sm font-sans text-slate-600 tracking-normal">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-pink-50 text-[#890754] text-[10px] sm:text-xs font-semibold uppercase tracking-wider border border-pink-100">
                    Step {activeIndex + 1} of {total}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="text-slate-900 font-medium">{currentStepMeta.label}</span>
                  <span className="text-slate-400 font-normal hidden xs:inline">({currentStepMeta.sub})</span>
                </div>

                {/* Scrubber track line */}
                <div
                  onClick={handleTrackClick}
                  className="w-full h-1.5 sm:h-2 bg-slate-100 hover:bg-slate-200/80 rounded-full relative overflow-hidden cursor-pointer transition-colors"
                  title="Click along track to navigate routine steps"
                >
                  <div
                    className="h-full bg-gradient-to-r from-[#540434] to-[#890754] rounded-full transition-all duration-300 ease-out shadow-xs"
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
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-6 max-w-6xl mx-auto px-2 pt-4"
            >
              {products.map((rawProduct, idx) => {
                const product = transformRoutineProduct(rawProduct);
                const meta = getRoutineStepForProduct(product, idx);
                return (
                  <div key={product.id || idx} className="relative h-full pt-3">
                    <div className="absolute top-0 left-2 z-20">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-[#540434] to-[#890754] text-white text-[8px] sm:text-[10px] font-semibold uppercase tracking-wider shadow-xs">
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
          <div className="mt-8 sm:mt-10 flex justify-center items-center">
            <button
              type="button"
              onClick={() => setIsExpanded((prev) => !prev)}
              className="group inline-flex items-center gap-2.5 px-6 sm:px-8 py-2.5 sm:py-3 rounded-full border border-slate-200 bg-white hover:border-[#890754]/30 hover:bg-slate-50 text-slate-800 hover:text-slate-900 text-xs sm:text-sm font-sans font-medium tracking-wide transition-all duration-300 shadow-sm hover:shadow-md hover:scale-105 active:scale-95"
              title={isExpanded ? "Collapse to Routine Slider" : "See All Routine Products in a Grid"}
            >
              <Layers className="w-4 h-4 text-[#890754]" />
              <span>
                {isExpanded ? "See Routine Slider" : `See All Routine (${products.length} Products)`}
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#890754] group-hover:translate-x-0.5 transition-all" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
