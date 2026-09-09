"use client";

import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ArrowRight, ChevronUp, ChevronDown, Layers } from 'lucide-react';
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
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [activeBanner, setActiveBanner] = useState(0);

  // 3-Row Vertical Slide & Fade-Out on "See" button
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [verticalProgress, setVerticalProgress] = useState(0);

  // Retrigger handwriting stroke drawing animation every time the user visits/scrolls to this section
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

  // Track vertical scroll progress
  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
      const maxScroll = scrollHeight - clientHeight;
      if (maxScroll > 0) {
        setVerticalProgress((scrollTop / maxScroll) * 100);
      } else {
        setVerticalProgress(0);
      }
    }
  };

  // Vertical scroll control (slides up and down by 1 row / step)
  const scrollVertical = (dir: 'up' | 'down') => {
    if (scrollContainerRef.current) {
      const rowStep = Math.max(180, Math.floor(scrollContainerRef.current.clientHeight / 3));
      scrollContainerRef.current.scrollBy({
        top: dir === 'up' ? -rowStep : rowStep,
        behavior: 'smooth',
      });
    }
  };

  // Interactive track scrubber
  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (scrollContainerRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickRatio = (e.clientX - rect.left) / rect.width;
      const maxScroll = scrollContainerRef.current.scrollHeight - scrollContainerRef.current.clientHeight;
      scrollContainerRef.current.scrollTo({
        top: clickRatio * maxScroll,
        behavior: 'smooth',
      });
    }
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

  return (
    <section ref={sectionRef} className="pt-6 md:pt-10 pb-6 md:pb-10 px-1 sm:px-4">
      {/* Centered Clean Section Header with Drawing / Handwriting Text Animation (No clutter) */}
      <div className="text-center mb-6 sm:mb-9 flex flex-col items-center justify-center">
        <div className="inline-flex items-center justify-center gap-3 sm:gap-6">
          <span className="h-px w-10 sm:w-20 bg-gradient-to-r from-transparent to-[#890754]/40" />
          
          {/* Animated Drawing / Handwriting Text "ROUTINE" — in Brand Velvet Plum with Luxury Italiana Serif Font */}
          <div className="relative inline-flex items-center justify-center py-1">
            <svg
              key={animationKey}
              viewBox="0 0 280 52"
              className="w-48 sm:w-64 md:w-80 h-11 sm:h-16 overflow-visible"
              aria-label="ROUTINE"
            >
              <text
                x="50%"
                y="52%"
                textAnchor="middle"
                dominantBaseline="central"
                fill="#890754"
                stroke="#890754"
                className="font-['Italiana',serif] text-3xl sm:text-4xl md:text-5xl font-bold tracking-widest routine-draw-text select-none"
              >
                ROUTINE
              </text>
            </svg>
          </div>

          <span className="h-px w-10 sm:w-20 bg-gradient-to-l from-transparent to-[#890754]/40" />
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
      <div className="relative py-2">
        {/* Floating Up & Down Buttons (Desktop/Tablet) - Active when in 3-Row sliding mode */}
        {!isExpanded && (
          <div className="hidden md:flex flex-col gap-2.5 absolute -right-3 lg:-right-5 top-1/2 -translate-y-1/2 z-20">
            <button
              type="button"
              onClick={() => scrollVertical('up')}
              className="w-10 h-10 flex items-center justify-center bg-white shadow-xl rounded-full border border-pink-100 text-[#890754] hover:bg-[#890754] hover:text-white transition-all active:scale-95"
              aria-label="Slide up to previous routine rows"
              title="Slide Up"
            >
              <ChevronUp className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => scrollVertical('down')}
              className="w-10 h-10 flex items-center justify-center bg-white shadow-xl rounded-full border border-pink-100 text-[#890754] hover:bg-[#890754] hover:text-white transition-all active:scale-95"
              aria-label="Slide down to next routine rows"
              title="Slide Down"
            >
              <ChevronDown className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* 3 Columns Grid, 3-Row Viewport with Fade-Out / Fade-In Transition on "See" click */}
        <div
          style={{
            opacity: isFadingOut ? 0 : 1,
            transform: isFadingOut ? 'scale(0.98)' : 'scale(1)',
            transition: 'opacity 0.35s cubic-bezier(0.16, 1, 0.3, 1), transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className={`transition-all duration-300 ${
              isExpanded
                ? 'max-h-none overflow-visible'
                : 'max-h-[620px] sm:max-h-[700px] md:max-h-[780px] lg:max-h-[860px] overflow-y-auto scrollbar-hide snap-y snap-mandatory'
            }`}
          >
            {/* Exactly 3 in Column (grid-cols-3) across mobile & desktop with original ProductCard UI */}
            <div className="grid grid-cols-3 gap-1.5 sm:gap-3 md:gap-4 px-0.5 sm:px-2">
              {products.map((product, idx) => (
                <div key={product.id} className="snap-start h-full">
                  <ProductCard
                    product={product}
                    onQuickView={onQuickView}
                    onAddToCart={addToCart}
                    onOrderNow={orderNow}
                    priority={idx < 3}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Slide Indicator / Track Line so users understand this could be slid */}
        {!isExpanded && (
          <div className="mt-4 sm:mt-6 flex flex-col items-center justify-center gap-1.5 select-none">
            <div
              onClick={handleTrackClick}
              className="w-36 sm:w-56 h-1 sm:h-1.5 bg-pink-100/90 hover:bg-pink-200/90 rounded-full relative overflow-hidden cursor-pointer shadow-inner transition-colors"
              title="Click along track to slide routine rows"
            >
              <div
                className="h-full bg-gradient-to-r from-[#540434] via-[#890754] to-pink-500 rounded-full transition-all duration-150 ease-out"
                style={{
                  width: '35%',
                  marginLeft: `${(verticalProgress / 100) * 65}%`,
                }}
              />
            </div>
            <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-gray-400 tracking-wider uppercase">
              <span className="inline-block animate-pulse text-[#890754]">↕</span>
              <span>Slide Up & Down to explore</span>
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
