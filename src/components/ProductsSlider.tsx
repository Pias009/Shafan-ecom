"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import Image from "next/image";

const slides = [
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
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const slide = slides[index];

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
      
      <div className="absolute bottom-6 left-12 flex gap-3 z-10">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              i === index ? "bg-black w-8" : "bg-black/20 hover:bg-black/40"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
