"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
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
      className="relative w-full overflow-hidden bg-[#96dacc]"
      onMouseEnter={pause}
      onMouseLeave={resume}
      suppressHydrationWarning
    >
      <div className="relative w-full aspect-video sm:aspect-auto sm:min-h-[500px] md:min-h-[620px] lg:min-h-[720px]">
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
            {/* Background image */}
            <Image
              src={slide.imageUrl}
              alt={slide.title || "SHANFA GLOBAL"}
              fill
              className="object-contain sm:object-cover object-center sm:object-[88%_center] lg:object-right"
              priority={current === 0}
              sizes="100vw"
            />

            {/* Gradient overlay from the bottom to ensure text readability without hiding the image */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#96dacc] via-[#96dacc]/40 via-10% to-transparent to-25% pointer-events-none" />

            {/* Optional custom bg color tint */}
            {slide.backgroundColor && (
              <div
                className="absolute inset-0"
                style={{ backgroundColor: slide.backgroundColor, opacity: 0.3 }}
              />
            )}

            {/* Decorative water droplet SVGs */}
            <svg className="absolute top-24 left-1/3 w-7 h-7 text-white/20 animate-pulse pointer-events-none" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
            </svg>
            <svg className="absolute bottom-16 left-1/4 w-5 h-5 text-white/25 animate-bounce pointer-events-none" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
            </svg>
          </motion.div>
        </AnimatePresence>

        {/* Text Content overlay — separate from image AnimatePresence so it animates in */}
        <AnimatePresence initial={false} mode="wait">
          <motion.div
            key={`content-${slide.id}`}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.55, ease: "easeOut", delay: 0.1 }}
            className="relative z-10 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-12 pt-16 sm:pt-36 lg:pt-40 pb-8 sm:pb-24 flex flex-col items-start"
            style={{ color: slide.textColor || undefined }}
          >
            <div className="max-w-xl space-y-4 sm:space-y-6 text-left">
              {/* Offer tag */}
              {slide.offerText && (
                <span className="inline-block text-[11px] sm:text-xs font-black uppercase tracking-[0.25em] text-white bg-white/15 backdrop-blur-md px-3.5 py-1 rounded-full border border-white/30 shadow-sm">
                  {slide.offerText}
                </span>
              )}

              {/* Headline */}
              {slide.title && (
                <h1 className="font-serif text-3xl sm:text-5xl lg:text-[4.25rem] font-normal leading-[1.06] tracking-tight text-white drop-shadow-md whitespace-pre-line">
                  {slide.title}
                </h1>
              )}

              {/* Subtitle */}
              {slide.subtitle && (
                <p className="text-xs sm:text-base text-white/92 font-medium leading-relaxed max-w-md drop-shadow-sm">
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
          <div className="hidden sm:flex absolute bottom-6 left-1/2 -translate-x-1/2 z-20 items-center gap-2">
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
    </section>
  );
}
