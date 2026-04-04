"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

interface SliderBanner {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string;
  active: boolean;
  sortOrder: number;
}

const defaultSlides = [
  {
    id: 1,
    title: "Eco-Conscious Skincare",
    subtitle: "Premium formulas for a natural glow. All text set to black for clarity.",
    imageUrl: "https://images.unsplash.com/photo-1570172619380-2826dbd5bc56?auto=format&fit=crop&w=1600&q=80",
  },
  {
    id: 2,
    title: "Pure Reflection",
    subtitle: "Harness the power of nature with our glass-skin collections.",
    imageUrl: "https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?auto=format&fit=crop&w=1600&q=80",
  },
  {
    id: 3,
    title: "Modern Aromas",
    subtitle: "Complex notes that linger and inspire all day long.",
    imageUrl: "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=1600&q=80",
  }
];

export function ProductsSlider() {
  const [slides, setSlides] = useState<SliderBanner[]>([]);
  const [index, setIndex] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    
    // Fetch slider banners from API
    async function fetchSlides() {
      try {
        const res = await fetch("/api/offer-banners?isHero=true&active=true");
        if (res.ok) {
          const data = await res.json();
          // Filter active banners and sort by sortOrder
          const activeBanners = data
            .filter((b: SliderBanner) => b.active)
            .sort((a: SliderBanner, b: SliderBanner) => a.sortOrder - b.sortOrder);
          
          if (activeBanners.length > 0) {
            setSlides(activeBanners);
          }
        }
      } catch (error) {
        console.error("Error fetching slider banners:", error);
      }
      setLoading(false);
    }
    
    fetchSlides();
  }, []);

  useEffect(() => {
    const activeSlides = slides.length > 0 ? slides : defaultSlides;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % activeSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides]);

  // Use default slides if no custom slides exist
  const displaySlides = slides.length > 0 ? slides : defaultSlides;
  const slide = displaySlides[index];

  if (loading) {
    return (
      <div className="relative w-full h-[400px] overflow-hidden rounded-3xl bg-black/5 animate-pulse">
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-black/30 text-sm font-bold uppercase tracking-widest">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[400px] overflow-hidden rounded-3xl glass-panel">
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
          {/* Overlay to ensure black text contrast */}
          <div className="absolute inset-0 bg-gradient-to-r from-white/40 to-transparent" />
          
          <div className="absolute inset-0 flex flex-col justify-center px-12 md:px-20 max-w-3xl">
            <motion.h1 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="font-display text-5xl md:text-7xl font-bold text-black"
            >
              {slide.title}
            </motion.h1>
            <motion.p 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="font-body text-xl text-black mt-4 max-w-lg leading-relaxed font-medium"
            >
              {slide.subtitle}
            </motion.p>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Dots */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
        {displaySlides.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            className={`w-3 h-3 rounded-full transition-all ${
              i === index ? "bg-black w-8" : "bg-black/30 hover:bg-black/50"
            }`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>

      {/* Navigation Arrows */}
      <button 
        onClick={() => setIndex((i) => (i - 1 + displaySlides.length) % displaySlides.length)}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-all shadow-lg"
        aria-label="Previous slide"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>
      <button 
        onClick={() => setIndex((i) => (i + 1) % displaySlides.length)}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-all shadow-lg"
        aria-label="Next slide"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>
    </div>
  );
}