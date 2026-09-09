"use client";

import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ArrowRight, ChevronUp, ChevronDown, Layers } from 'lucide-react';
import { motion } from 'framer-motion';
import { ProductCard } from './ProductCard';

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

export function RoutineSection({ products, banners = [], onQuickView, addToCart, orderNow }: Props) {
  const router = useRouter();
  const sectionRef = useRef<HTMLElement>(null);
  const [activeBanner, setActiveBanner] = useState(0);

  // Exactly 3 rows: 3 columns x 3 rows = 9 items per set
  const ITEMS_PER_SET = 9;
  const totalPages = Math.max(1, Math.ceil(products.length / ITEMS_PER_SET));
  const [pageIndex, setPageIndex] = useState(0);
  const [slideDirection, setSlideDirection] = useState<'up' | 'down'>('down');

  // "See All" expansion state & fade-out transition
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);

  // Retrigger handwriting stroke drawing animation every time user scrolls to this section
  const [animationKey, setAnimationKey] = useState(0);

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

  const activeBanners = banners.filter((b) => b.active);
  const currentBanner = activeBanners[activeBanner] ?? null;

  // Slide controls
  const handleSlideUp = () => {
    if (pageIndex > 0) {
      setSlideDirection('up');
      setPageIndex((p) => p - 1);
    }
  };

  const handleSlideDown = () => {
    if (pageIndex < totalPages - 1) {
      setSlideDirection('down');
      setPageIndex((p) => p + 1);
    }
  };

  // Touch swipe support for vertical sliding
  const touchStartY = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current === null || isExpanded) return;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;
    if (deltaY < -40 && pageIndex < totalPages - 1) {
      handleSlideDown();
    } else if (deltaY > 40 && pageIndex > 0) {
      handleSlideUp();
    }
    touchStartY.current = null;
  };

  // Track click to jump to page
  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    const targetPage = Math.min(totalPages - 1, Math.max(0, Math.floor(ratio * totalPages)));
    setSlideDirection(targetPage > pageIndex ? 'down' : 'up');
    setPageIndex(targetPage);
  };

  // Fade-out animation when clicking the "See" button
  const handleSeeButtonClick = () => {
    setIsFadingOut(true);
    setTimeout(() => {
      setIsExpanded((prev) => !prev);
      setIsFadingOut(false);
    }, 350);
  };

  if (products.length === 0) return null;

  // Products to render: exactly 9 products (3 rows of 3) when compact, or all products when expanded
  const currentProducts = isExpanded
    ? products
    : products.slice(pageIndex * ITEMS_PER_SET, (pageIndex + 1) * ITEMS_PER_SET);

  const thumbWidthPct = Math.max(25, (1 / totalPages) * 100);
  const thumbMarginLeftPct = totalPages > 1 ? (pageIndex / (totalPages - 1)) * (100 - thumbWidthPct) : 0;

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

      {/* Routine Products Container */}
      <div 
        className="relative py-2"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Floating Up & Down Buttons (Desktop/Tablet) - Active when in 3-Row sliding mode */}
        {!isExpanded && totalPages > 1 && (
          <div className="hidden md:flex flex-col gap-2.5 absolute -right-3 lg:-right-5 top-1/2 -translate-y-1/2 z-20">
            <button
              type="button"
              disabled={pageIndex === 0}
              onClick={handleSlideUp}
              className="w-10 h-10 flex items-center justify-center bg-white shadow-xl rounded-full border border-pink-100 text-[#890754] hover:bg-[#890754] hover:text-white transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Slide up to previous 3 rows"
              title="Previous 3 Rows"
            >
              <ChevronUp className="w-5 h-5" />
            </button>
            <button
              type="button"
              disabled={pageIndex === totalPages - 1}
              onClick={handleSlideDown}
              className="w-10 h-10 flex items-center justify-center bg-white shadow-xl rounded-full border border-pink-100 text-[#890754] hover:bg-[#890754] hover:text-white transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Slide down to next 3 rows"
              title="Next 3 Rows"
            >
              <ChevronDown className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* 3-Row Grid Viewport with Fade-Out / Fade-In Transition on "See" click & Slide Up/Down */}
        <div
          style={{
            opacity: isFadingOut ? 0 : 1,
            transform: isFadingOut ? 'scale(0.98)' : 'scale(1)',
            transition: 'opacity 0.35s cubic-bezier(0.16, 1, 0.3, 1), transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          {/* Exactly 3 Columns, Exactly 3 Rows (9 Cards total) — Compact Height & 3D Spatial Layout */}
          <motion.div
            key={isExpanded ? 'all' : pageIndex}
            initial={{ opacity: 0, y: slideDirection === 'down' ? 24 : -24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="grid grid-cols-3 gap-2 sm:gap-3.5 md:gap-4.5 px-0.5 sm:px-2 max-w-5xl mx-auto"
          >
            {currentProducts.map((product, idx) => (
              <div key={product.id} className="h-full">
                <ProductCard
                  product={product}
                  onQuickView={onQuickView}
                  onAddToCart={addToCart}
                  onOrderNow={orderNow}
                  compact={true}
                  priority={idx < 3}
                />
              </div>
            ))}
          </motion.div>
        </div>

        {/* Bottom Slide Indicator / Track Line so users understand this could be slid */}
        {!isExpanded && totalPages > 1 && (
          <div className="mt-4 sm:mt-6 flex flex-col items-center justify-center gap-1.5 select-none">
            <div
              onClick={handleTrackClick}
              className="w-36 sm:w-56 h-1 sm:h-1.5 bg-pink-100/90 hover:bg-pink-200/90 rounded-full relative overflow-hidden cursor-pointer shadow-inner transition-colors"
              title="Click along track to slide routine rows"
            >
              <div
                className="h-full bg-gradient-to-r from-[#540434] via-[#890754] to-pink-500 rounded-full transition-all duration-200 ease-out"
                style={{
                  width: `${thumbWidthPct}%`,
                  marginLeft: `${thumbMarginLeftPct}%`,
                }}
              />
            </div>
            <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-gray-400 tracking-wider uppercase">
              <span className="inline-block animate-pulse text-[#890754]">↕</span>
              <span>Slide Up & Down to explore (3 Rows • Set {pageIndex + 1}/{totalPages})</span>
              <span className="inline-block animate-pulse text-[#890754]">↕</span>
            </div>
          </div>
        )}

        {/* Bottom Centered "See All" Action Button (moved after section bottom) */}
        <div className="mt-6 sm:mt-8 flex justify-center items-center">
          <button
            type="button"
            onClick={handleSeeButtonClick}
            className="group inline-flex items-center gap-2 px-6 sm:px-8 py-2.5 sm:py-3 rounded-full border border-pink-200 bg-white/95 hover:bg-gradient-to-r hover:from-[#540434] hover:to-[#890754] text-[#890754] hover:text-white text-xs font-black uppercase tracking-widest transition-all duration-300 shadow-xs hover:shadow-lg hover:shadow-pink-900/15 hover:scale-105 active:scale-95"
            title={isExpanded ? "Collapse to 3 rows" : "See all routine"}
          >
            <Layers className="w-4 h-4 text-[#890754] group-hover:text-white transition-colors" />
            <span className="wave-text">
              {isExpanded ? "See 3 Rows (Compact)" : "See All Routine"}
            </span>
            <ArrowRight className="w-3.5 h-3.5 wave-icon" />
          </button>
        </div>
      </div>
    </section>
  );
}
