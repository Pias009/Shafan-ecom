"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Sparkles, Brain, CalendarCheck } from "lucide-react";
import { useState, useEffect } from "react";
import { useLanguageStore } from "@/lib/language-store";
import { translations } from "@/lib/translations";

const skinTypes = ["Oily", "Dry", "Combination", "Sensitive", "Normal"];

function SkinTypeCard() {
  const [index, setIndex] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % skinTypes.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.5 }}
      whileHover={{ y: -3 }}
      className="glass-panel-heavy p-3 md:p-4 rounded-xl md:rounded-2xl border border-black/5 hover:shadow-lg transition-all cursor-pointer group"
    >
      <Link href="/skin-type-quiz" className="flex flex-col items-center text-center gap-2">
        {/* Icon */}
        <motion.div
          className="w-10 h-10 md:w-12 md:h-12 bg-pink-500 rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300"
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-white" />
        </motion.div>
        
        {/* Title */}
        <h4 className="text-[10px] md:text-xs font-bold text-black leading-tight">Find Your Skin Type</h4>
        
        {/* Animated Skin Types */}
        <div className="h-6 flex items-center justify-center overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.span
              key={skinTypes[index]}
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.8 }}
              transition={{ duration: 0.4 }}
              className="text-pink-500 font-bold text-sm md:text-base"
            >
              {skinTypes[index]}
            </motion.span>
          </AnimatePresence>
        </div>
        
        {/* Description */}
        <p className="text-[8px] md:text-[10px] text-black/40 font-medium">Take the quiz</p>
      </Link>
    </motion.div>
  );
}

function SkinConcernCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.5 }}
      whileHover={{ y: -3 }}
      className="glass-panel-heavy p-3 md:p-4 rounded-xl md:rounded-2xl border border-black/5 hover:shadow-lg transition-all cursor-pointer group"
    >
      <Link href="/skin-concern-test" className="flex flex-col items-center text-center gap-2">
        {/* Icon with pulse */}
        <motion.div
          className="w-10 h-10 md:w-12 md:h-12 bg-purple-500 rounded-xl flex items-center justify-center shadow-md"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <Brain className="w-5 h-5 md:w-6 md:h-6 text-white" />
        </motion.div>
        
        {/* Title */}
        <h4 className="text-[10px] md:text-xs font-bold text-black leading-tight">Skin Concern Test</h4>
        
        {/* Animated AI Text */}
        <motion.div
          className="h-6 flex items-center justify-center"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <span className="text-purple-500 font-bold text-sm md:text-base">Analyze by AI</span>
        </motion.div>
        
        {/* Description */}
        <p className="text-[8px] md:text-[10px] text-black/40 font-medium">Get personalized solutions</p>
      </Link>
    </motion.div>
  );
}

function ConsultationCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, duration: 0.5 }}
      whileHover={{ y: -3 }}
      className="glass-panel-heavy p-3 md:p-4 rounded-xl md:rounded-2xl border border-black/5 hover:shadow-lg transition-all cursor-pointer group"
    >
      <Link href="/consultation" className="flex flex-col items-center text-center gap-2">
        {/* Icon */}
        <motion.div
          className="w-10 h-10 md:w-12 md:h-12 bg-blue-500 rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300"
        >
          <CalendarCheck className="w-5 h-5 md:w-6 md:h-6 text-white" />
        </motion.div>
        
        {/* Title */}
        <h4 className="text-[10px] md:text-xs font-bold text-black leading-tight">Book Consultation</h4>
        
        {/* Text */}
        <div className="h-6 flex items-center justify-center">
          <span className="text-blue-500 font-bold text-sm md:text-base">Expert Advice</span>
        </div>
        
        {/* Description */}
        <p className="text-[8px] md:text-[10px] text-black/40 font-medium">1-on-1 with specialists</p>
      </Link>
    </motion.div>
  );
}

export function Hero() {
  const { currentLanguage } = useLanguageStore();
  const t = translations[currentLanguage.code as keyof typeof translations];

  return (
    <section className="flex flex-col items-center justify-center px-3 md:px-6 pt-12 md:pt-24 pb-8 md:pb-16">
      <div className="max-w-7xl w-full mx-auto space-y-3 md:space-y-4">

        <div className="glass-panel rounded-[1.5rem] md:rounded-[3rem] w-full flex flex-col lg:flex-row items-stretch overflow-hidden relative shadow-xl md:shadow-2xl border border-black/5 min-h-[260px] md:min-h-0 md:h-[500px]">

          {/* Left — Brand Text */}
          <div
            className="flex-shrink flex flex-col justify-center items-center pt-5 pb-2 px-3 md:p-6 lg:w-[220px] xl:w-[250px] z-10"
          >
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1.2, delay: 0.2 }}
              className="lg:-rotate-90 whitespace-nowrap text-center"
            >
              <h1 className="font-display text-xl md:text-4xl lg:text-5xl font-black text-black leading-none tracking-tighter uppercase">
                {t.home.glow}
              </h1>
              <p className="font-display text-[8px] md:text-base lg:text-lg text-black/40 mt-1 md:mt-2 italic tracking-[0.2em] md:tracking-[0.3em] uppercase">
                {t.home.pureEssence}
              </p>
            </motion.div>
          </div>

          {/* Center — Hero Graphic */}
          <div className="flex-1 flex justify-center items-center relative overflow-hidden bg-black/[0.01] h-[120px] md:h-full">
            <motion.img
              initial={{ scale: 1.1, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1.5 }}
              src="/images/hero-card.svg"
              alt="Hero Graphic"
              className="h-full w-full object-contain z-0"
            />
          </div>

          {/* Right — Tagline */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1.2, delay: 0.4 }}
            className="flex-shrink flex flex-col justify-center pt-2 pb-5 px-3 md:p-8 lg:p-12 text-center lg:text-right z-10"
          >
            <p className="font-display text-lg md:text-3xl lg:text-5xl text-black font-bold italic leading-[1.1] tracking-tight uppercase">
              {t.home.water} <span className="lg:hidden text-black/20">·</span> <br className="hidden lg:block" />
              {t.home.sun} <span className="lg:hidden text-black/20">·</span> <br className="hidden lg:block" />
              <span className="text-black/30 lg:text-black/20">{t.home.ice}</span>
            </p>
            <div className="mt-2 md:mt-4 lg:mt-6 flex justify-center lg:justify-end">
              <Link href="/products" className="glass-panel inline-flex items-center gap-1 md:gap-3 px-3 md:px-6 lg:px-8 py-1.5 md:py-3 rounded-full text-[8px] md:text-xs font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all shadow-md md:shadow-lg active:scale-95">
                {t.home.exploreAll}
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-3 gap-2 md:gap-4">
          <SkinTypeCard />
          <SkinConcernCard />
          <ConsultationCard />
        </div>

      </div>
    </section>
  );
}
