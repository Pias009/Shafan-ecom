"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
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

export function HeroSlider({ initialBanners = [] }: { initialBanners?: SliderBanner[] }) {
  const [banners, setBanners] = useState<SliderBanner[]>(initialBanners);
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const [loaded, setLoaded] = useState(initialBanners.length > 0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
        if (heroOnes.length > 0) {
          setBanners(heroOnes);
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const activeBanners = banners;
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
  if (!slide) return null;
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

    </section>
  );
}
