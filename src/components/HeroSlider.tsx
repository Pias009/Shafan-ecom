"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Leaf, Droplets, FlaskConical } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Price } from "./Price";

interface SliderBanner {
  id: string;
  imageUrl: string;
  title?: string | null;
  subtitle?: string | null;
  offerText?: string | null;
  ctaText?: string | null;
  link?: string | null;
  backgroundColor?: string | null;
  textColor?: string | null;
}

// Custom Bunny Icon SVG for Cruelty Free feature matching reference screenshot
function BunnyIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z" />
      <path d="M9 10a1 1 0 1 1 0-2 1 1 0 0 1 0 2z" />
      <path d="M15 10a1 1 0 1 1 0-2 1 1 0 0 1 0 2z" />
      <path d="M9.5 15a3.5 3.5 0 0 0 5 0" />
      <path d="M7 3L5.5 8" />
      <path d="M17 3l1.5 5" />
    </svg>
  );
}

function normalizeLink(url?: string | null): string {
  if (!url) return "/products";
  try {
    if (url.startsWith("http://") || url.startsWith("https://")) {
      const u = new URL(url);
      return u.pathname + u.search;
    }
  } catch {}
  return url;
}

// Static fallback banner (shown when no admin banners exist)
const FALLBACK_BANNERS: SliderBanner[] = [
  {
    id: "fallback-1",
    imageUrl: "/images/hero-banner-2to1-ratio.png",
    title: "Skincare that cares,\nbeauty that shines.",
    subtitle: "Discover the perfect blend of nature and science for healthy, glowing skin every day.",
    offerText: "NATURALLY RADIANT",
    ctaText: "SHOP NOW",
    link: "/products",
  },
];

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? "100%" : "-100%",
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? "100%" : "-100%",
    opacity: 0,
  }),
};

export function HeroSlider() {
  const [banners, setBanners] = useState<SliderBanner[]>([]);
  const [glowProducts, setGlowProducts] = useState<any[]>([]);
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const [loaded, setLoaded] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const productScrollRef = useRef<HTMLDivElement>(null);

  // Touch swipe support for mobile
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  useEffect(() => {
    fetch("/api/admin/offer-banners?active=true")
      .then((r) => (r.ok ? r.json() : []))
      .then((data: SliderBanner[]) => {
        const heroOnes = data.filter(
          (b) => b.imageUrl && b.imageUrl.trim() !== ""
        );
        setBanners(heroOnes.length > 0 ? heroOnes : FALLBACK_BANNERS);
      })
      .catch(() => setBanners(FALLBACK_BANNERS))
      .finally(() => setLoaded(true));

    fetch("/api/products?limit=12")
      .then((r) => (r.ok ? r.json() : { products: [] }))
      .then((d) => {
        const prods = Array.isArray(d) ? d : d.products || [];
        if (prods.length > 0) setGlowProducts(prods);
      })
      .catch(() => {});
  }, []);

  const activeBanners = loaded ? banners : FALLBACK_BANNERS;
  const total = activeBanners.length;

  const goTo = useCallback(
    (index: number, dir: number) => {
      setDirection(dir);
      setCurrent(index);
    },
    []
  );

  const next = useCallback(() => {
    goTo((current + 1) % total, 1);
  }, [current, total, goTo]);

  const prev = useCallback(() => {
    goTo((current - 1 + total) % total, -1);
  }, [current, total, goTo]);

  // Auto-play
  useEffect(() => {
    if (total <= 1) return;
    timerRef.current = setInterval(next, 5500);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [next, total]);

  const pause = () => {
    if (timerRef.current) clearInterval(timerRef.current);
  };
  const resume = () => {
    if (total <= 1) return;
    timerRef.current = setInterval(next, 5500);
  };

  // Touch swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    const diff = touchStartX.current - touchEndX.current;
    if (diff > 45) {
      next(); // Swiped left -> next
    } else if (diff < -45) {
      prev(); // Swiped right -> prev
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  const slide = activeBanners[current] || activeBanners[0];
  const slideLink = normalizeLink(slide?.link);

  return (
    <section
      className="relative w-full overflow-hidden bg-transparent pb-2 sm:pb-4"
      onMouseEnter={pause}
      onMouseLeave={resume}
      suppressHydrationWarning
    >
      {/* Banner Container: 2:1 Native Aspect Ratio to fit banner graphics perfectly without cropping */}
      <div
        className="relative w-full aspect-[2/1] sm:aspect-[2.1/1] md:aspect-[2.2/1] lg:aspect-[2.3/1] max-h-[calc(100vh-210px)] flex items-center select-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Slides */}
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={slide.id}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.55, ease: [0.32, 0.72, 0, 1] }}
            className="absolute inset-0 w-full h-full"
          >
            {/* Clickable Banner Image */}
            <Link
              href={slideLink}
              className="block relative w-full h-full cursor-pointer"
              aria-label={slide.title || "Promotional Banner"}
            >
              <Image
                src={slide.imageUrl}
                alt={slide.title || "SHANFA GLOBAL"}
                fill
                className="object-cover object-center"
                priority={current === 0}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 1536px"
              />

              {/* Optional custom bg color tint */}
              {slide.backgroundColor && (
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{ backgroundColor: slide.backgroundColor, opacity: 0.25 }}
                />
              )}
            </Link>
          </motion.div>
        </AnimatePresence>

        {/* Text Content overlay (rendered only if explicit text is provided) */}
        {(slide.title || slide.subtitle || slide.offerText) && (
          <div className="absolute inset-0 pointer-events-none z-10 flex items-center">
            <div
              className="max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-12 py-4 sm:py-12"
              style={{ color: slide.textColor || undefined }}
            >
              <div className="max-w-md sm:max-w-lg space-y-2 sm:space-y-4 pointer-events-auto text-left">
                {slide.offerText && (
                  <span className="inline-block text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-white bg-white/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/30 shadow-xs">
                    ✨ {slide.offerText}
                  </span>
                )}

                {slide.title && (
                  <h1 className="font-serif text-2xl xs:text-3xl sm:text-5xl lg:text-6xl font-normal leading-[1.1] tracking-tight text-white drop-shadow-md whitespace-pre-line">
                    {slide.title}
                  </h1>
                )}

                {slide.subtitle && (
                  <p className="text-[11px] sm:text-sm md:text-base text-white/95 font-medium leading-relaxed max-w-md drop-shadow-xs line-clamp-2 sm:line-clamp-none">
                    {slide.subtitle}
                  </p>
                )}

                {slide.ctaText && (
                  <Link
                    href={slideLink}
                    className="inline-flex items-center gap-2 mt-2 px-5 py-2 sm:px-6 sm:py-2.5 rounded-full bg-[#890754] text-white font-bold text-xs sm:text-sm hover:bg-[#6b0542] shadow-md transition-transform active:scale-95"
                  >
                    <span>{slide.ctaText}</span>
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Desktop Prev / Next arrows (Hidden on mobile so banner artwork is 100% unobstructed) */}
        {total > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              className="hidden sm:flex absolute left-3 md:left-5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-11 md:h-11 rounded-full bg-white/25 hover:bg-white/45 backdrop-blur-md border border-white/40 text-white items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 shadow-md"
              aria-label="Previous slide"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              onClick={next}
              className="hidden sm:flex absolute right-3 md:right-5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-11 md:h-11 rounded-full bg-white/25 hover:bg-white/45 backdrop-blur-md border border-white/40 text-white items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 shadow-md"
              aria-label="Next slide"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}

        {/* Slide Indicator Dots (Hidden on mobile view, desktop only) */}
        {total > 1 && (
          <div className="hidden sm:flex absolute bottom-4 left-1/2 -translate-x-1/2 z-20 items-center gap-2 bg-black/25 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/25">
            {activeBanners.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => goTo(i, i > current ? 1 : -1)}
                className={`transition-all duration-300 rounded-full ${
                  i === current
                    ? "w-5 sm:w-6 h-1.5 sm:h-2 bg-white shadow-xs"
                    : "w-1.5 sm:w-2 h-1.5 sm:h-2 bg-white/50 hover:bg-white/80"
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Feature Trust Bar: 4 Living Animated Logos in 1 Single Row */}
      <div className="relative z-30 max-w-[1440px] mx-auto px-2 sm:px-6 mt-3 sm:mt-4 mb-2 sm:mb-4">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.15 }}
          className="relative overflow-hidden bg-white/95 backdrop-blur-xl border border-pink-100/90 rounded-2xl px-1 sm:px-4 py-2 sm:py-3 shadow-[0_6px_24px_rgba(137,7,84,0.06)] grid grid-cols-4 divide-x divide-pink-100/70"
        >
          {/* Subtle soft blush glow */}
          <div className="absolute -top-8 left-1/3 w-60 h-24 bg-pink-500/5 rounded-full blur-2xl pointer-events-none" />

          {/* Feature 1: Natural Ingredients (Animated Swaying Leaf & Dew Sparkle) */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2.5 px-0.5 sm:px-3 text-center sm:text-left group cursor-default">
            <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-pink-50 to-rose-100/60 border border-pink-200/80 flex items-center justify-center shrink-0 shadow-xs overflow-hidden group-hover:scale-110 transition-transform">
              <span className="absolute inset-0 bg-pink-400/10 rounded-xl animate-pulse pointer-events-none" />
              <svg
                className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-[#890754] drop-shadow-xs"
                style={{
                  transformOrigin: "bottom left",
                  animation: "leafSway 3s ease-in-out infinite",
                }}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
                <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
              </svg>
              <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-amber-400 rounded-full animate-ping opacity-75" />
            </div>
            <div className="min-w-0 max-w-full">
              <h4 className="font-bold text-[9px] xs:text-[10px] sm:text-xs text-gray-900 group-hover:text-[#890754] transition-colors leading-tight truncate">
                Natural Actives
              </h4>
              <p className="text-[7.5px] xs:text-[8.5px] sm:text-[10px] text-gray-400 font-medium hidden xs:block truncate">
                100% Pure
              </p>
            </div>
          </div>

          {/* Feature 2: Dermatologist Tested (Animated Concentric Ripple & Droplet) */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2.5 px-0.5 sm:px-3 text-center sm:text-left group cursor-default">
            <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-amber-50 to-orange-100/60 border border-amber-200/80 flex items-center justify-center shrink-0 shadow-xs overflow-hidden group-hover:scale-110 transition-transform">
              <span
                className="absolute w-5 h-5 rounded-full border border-amber-400/60 pointer-events-none"
                style={{
                  animation: "dropRipple 2.2s cubic-bezier(0, 0.2, 0.8, 1) infinite",
                }}
              />
              <svg
                className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-amber-700 relative z-10 drop-shadow-xs"
                style={{
                  animation: "dropPulse 2.2s ease-in-out infinite",
                }}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z" />
                <path d="M12 18a3 3 0 0 0 3-3" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <div className="min-w-0 max-w-full">
              <h4 className="font-bold text-[9px] xs:text-[10px] sm:text-xs text-gray-900 group-hover:text-[#890754] transition-colors leading-tight truncate">
                Derm Tested
              </h4>
              <p className="text-[7.5px] xs:text-[8.5px] sm:text-[10px] text-gray-400 font-medium hidden xs:block truncate">
                All Skin Types
              </p>
            </div>
          </div>

          {/* Feature 3: Clean & Pure (Animated Rising Chemistry Bubbles) */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2.5 px-0.5 sm:px-3 text-center sm:text-left group cursor-default">
            <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-purple-50 to-pink-100/60 border border-purple-200/80 flex items-center justify-center shrink-0 shadow-xs overflow-hidden group-hover:scale-110 transition-transform">
              <svg
                className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-purple-700 relative z-10 drop-shadow-xs"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M10 2v7.527a2 2 0 0 1-.211.896L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.069-10.127A2 2 0 0 1 14 9.527V2" />
                <path d="M8.5 2h7" />
                <path d="M7 16h10" strokeDasharray="2 2" />
              </svg>
              <span
                className="absolute bottom-2 left-3 w-1 h-1 bg-purple-500 rounded-full pointer-events-none"
                style={{ animation: "bubbleFloat1 1.8s ease-in-out infinite" }}
              />
              <span
                className="absolute bottom-2.5 right-2.5 w-1.5 h-1.5 bg-pink-500 rounded-full pointer-events-none"
                style={{ animation: "bubbleFloat2 2.2s ease-in-out 0.6s infinite" }}
              />
            </div>
            <div className="min-w-0 max-w-full">
              <h4 className="font-bold text-[9px] xs:text-[10px] sm:text-xs text-gray-900 group-hover:text-[#890754] transition-colors leading-tight truncate">
                Clean Formulas
              </h4>
              <p className="text-[7.5px] xs:text-[8.5px] sm:text-[10px] text-gray-400 font-medium hidden xs:block truncate">
                Toxin Free
              </p>
            </div>
          </div>

          {/* Feature 4: Cruelty Free (Animated Heartbeat Bunny) */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2.5 px-0.5 sm:px-3 text-center sm:text-left group cursor-default">
            <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-100/60 border border-emerald-200/80 flex items-center justify-center shrink-0 shadow-xs overflow-hidden group-hover:scale-110 transition-transform">
              <span className="absolute inset-0 bg-emerald-400/10 rounded-xl animate-pulse pointer-events-none" />
              <div
                className="relative z-10 flex items-center justify-center"
                style={{
                  animation: "bunnyHeartbeat 2.4s ease-in-out infinite",
                }}
              >
                <svg
                  className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-emerald-700 drop-shadow-xs"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                </svg>
              </div>
            </div>
            <div className="min-w-0 max-w-full">
              <h4 className="font-bold text-[9px] xs:text-[10px] sm:text-xs text-gray-900 group-hover:text-[#890754] transition-colors leading-tight truncate">
                Cruelty Free
              </h4>
              <p className="text-[7.5px] xs:text-[8.5px] sm:text-[10px] text-gray-400 font-medium hidden xs:block truncate">
                100% Ethical
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
