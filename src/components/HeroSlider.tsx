"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight, Leaf, Droplets, FlaskConical } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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

// Static fallback banner (shown when no admin banners exist)
const FALLBACK_BANNERS: SliderBanner[] = [
  {
    id: "fallback-1",
    imageUrl: "/images/hero-glowerive-fullcover.png",
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
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const [loaded, setLoaded] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetch("/api/admin/offer-banners?active=true")
      .then((r) => r.ok ? r.json() : [])
      .then((data: SliderBanner[]) => {
        const heroOnes = data.filter(
          (b) => b.imageUrl && b.imageUrl.trim() !== ""
        );
        setBanners(heroOnes.length > 0 ? heroOnes : FALLBACK_BANNERS);
      })
      .catch(() => setBanners(FALLBACK_BANNERS))
      .finally(() => setLoaded(true));
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

  const pause = () => { if (timerRef.current) clearInterval(timerRef.current); };
  const resume = () => {
    if (total <= 1) return;
    timerRef.current = setInterval(next, 5500);
  };

  const slide = activeBanners[current];

  return (
    <section
      className="relative w-full overflow-hidden bg-[#72ccbd] pb-4 sm:pb-6"
      onMouseEnter={pause}
      onMouseLeave={resume}
      suppressHydrationWarning
    >
      <div className="relative w-full aspect-[1.85/1] sm:aspect-auto sm:min-h-[640px] md:min-h-[720px] lg:min-h-[780px] xl:min-h-[840px] flex items-center">
        {/* Slides */}
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={slide.id}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.65, ease: [0.77, 0, 0.175, 1] }}
            className="absolute inset-0 w-full h-full"
          >
            {/* Background image - 100% full view fit on mobile & desktop */}
            <Image
              src={slide.imageUrl}
              alt={slide.title || "SHANFA GLOBAL"}
              fill
              className="object-contain sm:object-cover object-center sm:object-[88%_center] lg:object-right"
              priority={current === 0}
              sizes="100vw"
            />

            {/* Clean presentation with no heavy left side blur overlay */}
            <div className="absolute bottom-0 inset-x-0 h-12 sm:h-20 bg-gradient-to-t from-[#72ccbd]/30 to-transparent pointer-events-none" />

            {/* Optional custom bg color tint */}
            {slide.backgroundColor && (
              <div
                className="absolute inset-0"
                style={{ backgroundColor: slide.backgroundColor, opacity: 0.3 }}
              />
            )}

            {/* Decorative water droplet SVGs */}
            <svg className="hidden sm:block absolute top-24 left-1/3 w-7 h-7 text-white/20 animate-pulse pointer-events-none" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
            </svg>
            <svg className="hidden sm:block absolute bottom-28 left-1/4 w-5 h-5 text-white/25 animate-bounce pointer-events-none" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
            </svg>
          </motion.div>
        </AnimatePresence>

        {/* Text Content overlay */}
        <AnimatePresence initial={false} mode="wait">
          <motion.div
            key={`content-${slide.id}`}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.55, ease: "easeOut", delay: 0.1 }}
            className="relative z-10 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-12 pt-8 sm:pt-36 md:pt-40 lg:pt-44 pb-8 sm:pb-32 lg:pb-36 flex flex-col items-start"
            style={{ color: slide.textColor || undefined }}
          >
            <div className="max-w-xl space-y-4 sm:space-y-6 text-left">
              {/* Offer tag */}
              {slide.offerText && (
                <span className="inline-block text-[11px] sm:text-xs font-bold uppercase tracking-[0.25em] text-white bg-white/15 backdrop-blur-md px-3.5 py-1 rounded-full border border-white/30 shadow-sm">
                  ✨ {slide.offerText}
                </span>
              )}

              {/* Headline */}
              {slide.title && (
                <h1 className="font-serif text-3xl sm:text-5xl lg:text-7xl font-normal leading-[1.08] tracking-tight text-white drop-shadow-md whitespace-pre-line">
                  {slide.title}
                </h1>
              )}

              {/* Subtitle */}
              {slide.subtitle && (
                <p className="text-xs sm:text-base text-white/95 font-medium leading-relaxed max-w-md drop-shadow-sm whitespace-pre-line">
                  {slide.subtitle}
                </p>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Prev / Next arrows */}
        {total > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/20 hover:bg-white/35 backdrop-blur-md border border-white/40 text-white flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 shadow-lg"
              aria-label="Previous slide"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={next}
              className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/20 hover:bg-white/35 backdrop-blur-md border border-white/40 text-white flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 shadow-lg"
              aria-label="Next slide"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}

        {/* Dot indicators (Hidden on mobile as requested) */}
        {total > 1 && (
          <div className="hidden sm:flex absolute bottom-20 left-1/2 -translate-x-1/2 z-20 items-center gap-2">
            {activeBanners.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i, i > current ? 1 : -1)}
                className={`transition-all duration-300 rounded-full ${
                  i === current
                    ? "w-7 h-2.5 bg-white shadow-md"
                    : "w-2.5 h-2.5 bg-white/40 hover:bg-white/70"
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Floating 4-Column Feature Trust Bar */}
      <div className="relative z-30 max-w-[1440px] mx-auto px-2 sm:px-6 -mt-5 sm:-mt-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white/95 sm:bg-white backdrop-blur-2xl border border-white/90 rounded-full sm:rounded-[2rem] px-2 py-2 sm:px-6 sm:py-4 shadow-[0_12px_35px_rgba(4,43,36,0.08)] grid grid-cols-4 gap-1 sm:gap-4 divide-x divide-black/5 text-[#042b24] items-center"
        >
          {/* Feature 1 */}
          <div className="flex items-center gap-1 sm:gap-3.5 px-0.5 sm:px-3 justify-center sm:justify-start group min-w-0">
            <div className="w-5 h-5 sm:w-10 sm:h-10 lg:w-11 lg:h-11 rounded-full bg-[#72ccbd]/20 text-[#0c433a] flex items-center justify-center shrink-0 border border-[#72ccbd]/30 shadow-2xs group-hover:scale-105 group-hover:bg-[#0c433a] group-hover:text-white transition-all duration-300">
              <Leaf size={11} className="sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0 truncate">
              <h4 className="font-serif font-bold text-[7.5px] sm:text-xs lg:text-sm text-[#042b24] leading-tight truncate">
                <span className="sm:hidden">Natural</span>
                <span className="hidden sm:inline">Natural Ingredients</span>
              </h4>
              <p className="text-[7.5px] sm:text-[11px] text-[#042b24]/60 mt-0.5 font-medium truncate">
                <span className="sm:hidden">100% Organic</span>
                <span className="hidden sm:inline">Safe & Effective</span>
              </p>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="flex items-center gap-1 sm:gap-3.5 px-0.5 sm:px-3 justify-center sm:justify-start group min-w-0">
            <div className="w-5 h-5 sm:w-10 sm:h-10 lg:w-11 lg:h-11 rounded-full bg-[#72ccbd]/20 text-[#0c433a] flex items-center justify-center shrink-0 border border-[#72ccbd]/30 shadow-2xs group-hover:scale-105 group-hover:bg-[#0c433a] group-hover:text-white transition-all duration-300">
              <Droplets size={11} className="sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0 truncate">
              <h4 className="font-serif font-bold text-[7.5px] sm:text-xs lg:text-sm text-[#042b24] leading-tight truncate">
                <span className="sm:hidden">Derm Tested</span>
                <span className="hidden sm:inline">Dermatologist Tested</span>
              </h4>
              <p className="text-[7.5px] sm:text-[11px] text-[#042b24]/60 mt-0.5 font-medium truncate">
                <span className="sm:hidden">All Skin Types</span>
                <span className="hidden sm:inline">For All Skin Types</span>
              </p>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="flex items-center gap-1 sm:gap-3.5 px-0.5 sm:px-3 justify-center sm:justify-start group min-w-0">
            <div className="w-5 h-5 sm:w-10 sm:h-10 lg:w-11 lg:h-11 rounded-full bg-[#72ccbd]/20 text-[#0c433a] flex items-center justify-center shrink-0 border border-[#72ccbd]/30 shadow-2xs group-hover:scale-105 group-hover:bg-[#0c433a] group-hover:text-white transition-all duration-300">
              <FlaskConical size={11} className="sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0 truncate">
              <h4 className="font-serif font-bold text-[7.5px] sm:text-xs lg:text-sm text-[#042b24] leading-tight truncate">
                <span className="sm:hidden">Clean & Pure</span>
                <span className="hidden sm:inline">Paraben & Sulfate Free</span>
              </h4>
              <p className="text-[7.5px] sm:text-[11px] text-[#042b24]/60 mt-0.5 font-medium truncate">
                <span className="sm:hidden">Paraben Free</span>
                <span className="hidden sm:inline">Clean & Gentle</span>
              </p>
            </div>
          </div>

          {/* Feature 4 */}
          <div className="flex items-center gap-1 sm:gap-3.5 px-0.5 sm:px-3 justify-center sm:justify-start group min-w-0">
            <div className="w-5 h-5 sm:w-10 sm:h-10 lg:w-11 lg:h-11 rounded-full bg-[#72ccbd]/20 text-[#0c433a] flex items-center justify-center shrink-0 border border-[#72ccbd]/30 shadow-2xs group-hover:scale-105 group-hover:bg-[#0c433a] group-hover:text-white transition-all duration-300">
              <BunnyIcon className="w-3 h-3 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0 truncate">
              <h4 className="font-serif font-bold text-[7.5px] sm:text-xs lg:text-sm text-[#042b24] leading-tight truncate">
                <span className="sm:hidden">Cruelty Free</span>
                <span className="hidden sm:inline">Cruelty Free</span>
              </h4>
              <p className="text-[7.5px] sm:text-[11px] text-[#042b24]/60 mt-0.5 font-medium truncate">
                <span className="sm:hidden">100% Vegan</span>
                <span className="hidden sm:inline">Never Tested on Animals</span>
              </p>
            </div>
          </div>
        </motion.div>
      </div>

    </section>
  );
}
