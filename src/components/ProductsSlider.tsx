"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import Image from "next/image";

interface SliderBanner {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string;
  active: boolean;
  sortOrder: number;
}

export function ProductsSlider() {
  const [slides, setSlides] = useState<SliderBanner[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchSlides() {
      try {
        const res = await fetch("/api/offer-banners?isHero=true&active=true");
        if (res.ok) {
          const data = await res.json();
          const activeBanners = data
            .filter((b: SliderBanner) => b.active)
            .sort((a: SliderBanner, b: SliderBanner) => a.sortOrder - b.sortOrder);
          
          if (activeBanners.length > 0) {
            setSlides(activeBanners);
          } else {
            setError(true);
          }
        } else {
          setError(true);
        }
      } catch (err) {
        console.error("Error fetching slider banners:", err);
        setError(true);
      }
      setLoading(false);
    }
    
    fetchSlides();
  }, []);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  if (loading || error || slides.length === 0) {
    return null;
  }

  const slide = slides[index];

return (
    <div className="relative w-full h-[250px] sm:h-[320px] md:h-[400px] overflow-hidden rounded-2xl sm:rounded-3xl glass-panel">
      <AnimatePresence mode="wait">
        <motion.div
          key={slide.id}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 1, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          <Image
            src={slide.imageUrl}
            alt={slide.title}
            fill
            className="object-cover brightness-110 contrast-100"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white/40 to-transparent" />
          
          <div className="absolute inset-0 flex flex-col justify-center px-6 sm:px-12 md:px-20 max-w-3xl">
            <motion.h1 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="font-display text-2xl sm:text-4xl md:text-6xl lg:text-7xl font-bold text-black"
            >
              {slide.title}
            </motion.h1>
            <motion.p 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="font-body text-sm sm:text-lg md:text-xl text-black mt-2 sm:mt-4 max-w-lg leading-relaxed font-medium"
            >
              {slide.subtitle}
            </motion.p>
          </div>
        </motion.div>
      </AnimatePresence>

      {slides.length > 1 && (
        <>
          <button 
            onClick={() => setIndex((i) => (i - 1 + slides.length) % slides.length)}
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-all shadow-lg"
            aria-label="Previous slide"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="sm:w-5 sm:h-5">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <button 
            onClick={() => setIndex((i) => (i + 1) % slides.length)}
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-all shadow-lg"
            aria-label="Next slide"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="sm:w-5 sm:h-5">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </>
      )}
    </div>
  );
}