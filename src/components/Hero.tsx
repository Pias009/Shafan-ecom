"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Sparkles, Brain, MessageCircleQuestion } from "lucide-react";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";

const skinTypes = ["Oily", "Dry", "Combination", "Sensitive", "Normal"];

function AnimatedText({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
      style={{ willChange: "transform, opacity" }}
    >
      {children}
    </motion.div>
  );
}

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
      transition={{ delay: 0.5, duration: 0.5 }}
      whileHover={{ y: -6 }}
      className="glass-panel-heavy p-3 sm:p-4 md:p-5 lg:p-6 rounded-xl sm:rounded-2xl border border-white/60 shadow-sm cursor-pointer group relative overflow-hidden"
      style={{ willChange: "transform, opacity" }}
      onClick={() => toast.success("Coming Soon!")}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-pink-50/50 to-transparent pointer-events-none rounded-2xl" />
      <div className="relative flex flex-col items-center text-center gap-1.5 sm:gap-2 md:gap-3">
        <motion.div
          className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-gradient-to-br from-pink-400 to-rose-500 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg shadow-pink-200/60"
          animate={{ rotate: [0, 12, -12, 0] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          style={{ willChange: "transform" }}
        >
          <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white" />
        </motion.div>

        <h4 className="text-[9px] sm:text-[11px] md:text-xs font-black text-black/80 leading-tight">
          <span className="hidden sm:inline">Find Your </span>Skin Type
        </h4>

        <div className="h-5 sm:h-6 md:h-7 flex items-center justify-center overflow-hidden">
          <motion.span
            key={skinTypes[index]}
            initial={{ opacity: 0, y: 18, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="text-pink-500 font-black text-xs sm:text-sm md:text-base absolute"
          >
            {skinTypes[index]}
          </motion.span>
        </div>

        <div className="flex items-center gap-1 group-hover:gap-1.5 transition-all">
          <p className="text-[7px] sm:text-[8px] md:text-[10px] text-black/30 font-bold uppercase tracking-wider">
            Take the quiz
          </p>
          <svg className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-black/20 group-hover:text-pink-400 group-hover:translate-x-0.5 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </div>
      </div>
    </motion.div>
  );
}

function SkinConcernCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, duration: 0.5 }}
      whileHover={{ y: -6 }}
      className="glass-panel-heavy p-3 sm:p-4 md:p-5 lg:p-6 rounded-xl sm:rounded-2xl border border-white/60 shadow-sm cursor-pointer group relative overflow-hidden"
      style={{ willChange: "transform, opacity" }}
      onClick={() => toast.success("Coming Soon!")}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-violet-50/50 to-transparent pointer-events-none rounded-2xl" />
      <div className="relative flex flex-col items-center text-center gap-1.5 sm:gap-2 md:gap-3">
        <motion.div
          className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg shadow-purple-200/60"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 1.8, repeat: Infinity }}
        >
          <Brain className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white" />
        </motion.div>

        <h4 className="text-[9px] sm:text-[11px] md:text-xs font-black text-black/80 leading-tight">
          Skin Concern<span className="hidden sm:inline"> Test</span>
        </h4>

        <div className="h-5 sm:h-6 md:h-7 flex items-center justify-center">
          <motion.span
            animate={{ opacity: [0.45, 1, 0.45] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-purple-500 font-black text-xs sm:text-sm md:text-base absolute"
          >
            AI Analysis
          </motion.span>
        </div>

        <div className="flex items-center gap-1 group-hover:gap-1.5 transition-all">
          <p className="text-[7px] sm:text-[8px] md:text-[10px] text-black/30 font-bold uppercase tracking-wider">
            Personalized
          </p>
          <svg className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-black/20 group-hover:text-purple-400 group-hover:translate-x-0.5 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </div>
      </div>
    </motion.div>
  );
}

function ExpertsCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7, duration: 0.5 }}
      whileHover={{ y: -6 }}
      className="glass-panel-heavy p-3 sm:p-4 md:p-5 lg:p-6 rounded-xl sm:rounded-2xl border border-white/60 shadow-sm cursor-pointer group relative overflow-hidden"
      style={{ willChange: "transform, opacity" }}
      onClick={() => toast.success("Coming Soon!")}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-amber-50/50 to-transparent pointer-events-none rounded-2xl" />
      <div className="relative flex flex-col items-center text-center gap-1.5 sm:gap-2 md:gap-3">
        <motion.div
          className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg shadow-amber-200/60"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 1.8, repeat: Infinity }}
        >
          <MessageCircleQuestion className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white" />
        </motion.div>

        <h4 className="text-[9px] sm:text-[11px] md:text-xs font-black text-black/80 leading-tight">
          Ask<span className="hidden sm:inline"> Our</span> Experts
        </h4>

        <div className="h-5 sm:h-6 md:h-7 flex items-center justify-center">
          <motion.span
            animate={{ opacity: [0.45, 1, 0.45] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
            className="text-amber-500 font-black text-xs sm:text-sm md:text-base absolute"
          >
            Coming Soon
          </motion.span>
        </div>

        <div className="flex items-center gap-1 group-hover:gap-1.5 transition-all">
          <p className="text-[7px] sm:text-[8px] md:text-[10px] text-black/30 font-bold uppercase tracking-wider">
            Get guidance
          </p>
          <svg className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-black/20 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </div>
      </div>
    </motion.div>
  );
}

function Marquee() {
  const marqueeItems = [
    { icon: "✦", color: "text-pink-400", text: "Feel Confident" },
    { icon: "✦", color: "text-purple-400", text: "AI Skin Analysis" },
    { icon: "✦", color: "text-sky-400", text: "Dermatologist Approved" },
    { icon: "✦", color: "text-green-400", text: "100% Natural" },
    { icon: "✦", color: "text-amber-400", text: "Believe in Your Skin" },
    { icon: "✦", color: "text-rose-400", text: "Bloom Every Day" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.8, duration: 0.6 }}
      className="glass-panel rounded-xl sm:rounded-2xl border border-white/50 overflow-hidden py-2 sm:py-2.5"
    >
      <div className="flex whitespace-nowrap select-none animate-marquee" style={{ transform: 'translateZ(0)' }}>
        {[...marqueeItems, ...marqueeItems, ...marqueeItems, ...marqueeItems].map((item, i) => (
          <span key={i} className="inline-flex items-center gap-1.5 mx-4 sm:mx-5 text-[9px] sm:text-[10px] font-bold text-black/30 uppercase tracking-[0.15em]">
            <span className={item.color}>{item.icon}</span> {item.text}
          </span>
        ))}
      </div>
    </motion.div>
  );
}

function AnimatedBorder({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative group overflow-hidden">
      {/* Subtle glowing border - white/silver light effect */}
      <div className="absolute -inset-0.5 rounded-[1.75rem] sm:rounded-[2.25rem] md:rounded-[2.75rem] lg:rounded-[3.25rem] opacity-30 blur-sm"
           style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.8), rgba(255,255,255,0.3), rgba(255,255,255,0.6))" }} />
      
      {/* Main white/silver border */}
      <div className="absolute inset-0 rounded-[1.75rem] sm:rounded-[2.25rem] md:rounded-[2.75rem] lg:rounded-[3.25rem] border border-white/50" />
      
      {/* Inner content */}
      <div className="relative overflow-hidden">
        {children}
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <section className="flex flex-col items-center justify-center px-3 sm:px-5 md:px-6 pt-10 sm:pt-14 md:pt-20 pb-8 md:pb-16 overflow-x-hidden">
      <div className="max-w-7xl w-full mx-auto space-y-3 md:space-y-4 overflow-x-hidden">
        <AnimatedBorder>
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="glass-panel rounded-[1.5rem] sm:rounded-[2rem] md:rounded-[2.5rem] lg:rounded-[3rem] w-full flex flex-col lg:flex-row items-stretch overflow-hidden shadow-lg sm:shadow-xl md:shadow-2xl border border-white/60 min-h-[340px] sm:min-h-[380px] md:min-h-[440px] lg:h-[520px] xl:h-[560px]"
            style={{ willChange: "transform, opacity" }}
          >
            {/* White accent bar */}
            <div className="absolute top-0 left-0 right-0 h-[2.5px] rounded-t-[3rem] bg-white/60" />

            {/* Inner glow for 3D effect */}
            <div className="absolute inset-0 rounded-[3rem] pointer-events-none" style={{ boxShadow: "inset 0 0 60px rgba(255,255,255,0.4), inset 0 0 30px rgba(255,255,255,0.2)" }} />

            {/* Subtle decorative orbs */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="absolute -top-24 -left-24 w-72 h-72 bg-white/20 rounded-full blur-3xl" />
              <div className="absolute -bottom-24 -right-16 w-80 h-80 bg-white/15 rounded-full blur-3xl" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 bg-white/10 rounded-full blur-3xl" />
            </div>

            {/* Left — Brand Identity */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.9, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="flex-shrink-0 flex flex-col justify-center items-center pt-7 pb-3 px-4 sm:pt-9 sm:pb-4 sm:px-5 md:pt-10 md:pb-5 lg:w-[200px] xl:w-[240px] lg:py-12 lg:px-8 z-10 relative"
            >
              {/* Mobile: horizontal */}
              <div className="lg:hidden text-center">
                <div className="inline-flex items-center gap-2 mb-1.5">
                  <div className="w-2 h-2 rounded-full bg-gradient-to-br from-pink-400 to-violet-400" />
                  <p className="text-[9px] sm:text-[10px] text-black/30 font-bold tracking-[0.4em] uppercase">Skincare</p>
                  <div className="w-2 h-2 rounded-full bg-gradient-to-br from-violet-400 to-sky-400" />
                </div>
                <h1 className="font-display text-3xl sm:text-4xl md:text-5xl text-black leading-none tracking-[-0.04em] uppercase">
                  RADIANT SKIN
                </h1>
                <p className="text-[9px] sm:text-[10px] md:text-xs text-black/30 mt-1.5 italic tracking-[0.2em] uppercase font-medium">
                  Your skin, your story
                </p>
              </div>

              {/* Desktop: vertical */}
              <div className="hidden lg:flex flex-col items-center justify-center h-full">
                <div className="text-center" style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}>
                  <h1 className="font-display text-5xl xl:text-6xl text-black leading-none tracking-[-0.04em] uppercase whitespace-nowrap">
                    RADIANT SKIN
                  </h1>
                  <p className="text-xs xl:text-sm text-black/30 mt-4 italic tracking-[0.3em] uppercase font-medium whitespace-nowrap">
                    Your skin, your story
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Divider */}
            <div className="hidden lg:block w-px self-stretch bg-gradient-to-b from-transparent via-black/8 to-transparent my-8" />
            <div className="lg:hidden h-px w-3/5 self-center bg-gradient-to-r from-transparent via-black/8 to-transparent" />

            {/* Center — Hero Visual */}
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="flex-1 flex justify-center items-center relative overflow-hidden h-[150px] sm:h-[190px] md:h-[240px] lg:h-full"
            >
              {/* Girl image with floating animation */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="w-64 h-64 sm:w-72 sm:h-72 md:w-80 md:h-80 lg:w-96 lg:h-96 xl:w-[28rem] xl:h-[28rem] relative flex items-center justify-center"
              >
                <img
                  src="/images/hero-card.svg"
                  alt="Beautiful girl with radiant skin"
                  className="w-full h-full object-contain rounded-full"
                />
              </motion.div>

              {/* Floating micro-badges */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.7 }}
                className="absolute top-3 left-3 sm:top-5 sm:left-5"
              >
                <div className="glass-panel-heavy flex items-center gap-1.5 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-xl border border-white/50 shadow-sm">
                  <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2">
                    <span className="ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-full w-full bg-emerald-500" />
                  </span>
                  <span className="text-[8px] sm:text-[9px] font-bold text-gray-600 whitespace-nowrap">AI Powered</span>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.7 }}
                className="absolute bottom-3 right-3 sm:bottom-5 sm:right-5"
              >
                <div className="glass-panel-heavy flex items-center gap-1 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-xl border border-white/50 shadow-sm">
                  <span className="text-[10px] sm:text-xs">✨</span>
                  <span className="text-[8px] sm:text-[9px] font-bold text-gray-600">50K+ Trust</span>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.65, duration: 0.7 }}
                className="absolute top-3 right-3 sm:top-5 sm:right-5 hidden sm:flex"
              >
                <div className="glass-panel-heavy flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-white/50 shadow-sm">
                  <span className="text-xs">🌿</span>
                  <span className="text-[9px] font-bold text-gray-600">Clean</span>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.7 }}
                className="absolute bottom-3 left-3 sm:bottom-5 sm:left-5 hidden md:flex"
              >
                <div className="glass-panel-heavy flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-white/50 shadow-sm">
                  <span className="text-xs">💜</span>
                  <span className="text-[9px] font-bold text-gray-600">Loved</span>
                </div>
              </motion.div>
            </motion.div>

            {/* Divider */}
            <div className="hidden lg:block w-px self-stretch bg-gradient-to-b from-transparent via-black/8 to-transparent my-8" />
            <div className="lg:hidden h-px w-3/5 self-center bg-gradient-to-r from-transparent via-black/8 to-transparent" />

            {/* Right — Emotional Tagline */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.9, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="flex-shrink-0 flex flex-col justify-center pt-4 pb-7 px-5 sm:pt-5 sm:pb-9 sm:px-6 md:pb-10 lg:w-[240px] xl:w-[280px] lg:py-12 lg:px-10 lg:pr-12 text-center lg:text-right z-10 relative"
            >
              {/* Emotional Words */}
              <div className="space-y-0 lg:space-y-1">
                <AnimatedText delay={0.3}>
                  <p className="font-display italic text-2xl sm:text-3xl md:text-4xl lg:text-[2.6rem] xl:text-5xl text-black leading-[1] tracking-tight uppercase" style={{ textShadow: "0 0 40px rgba(236,72,153,0.15)" }}>
                    Feel.
                  </p>
                </AnimatedText>
                <AnimatedText delay={0.6}>
                  <p className="font-display italic text-2xl sm:text-3xl md:text-4xl lg:text-[2.6rem] xl:text-5xl text-black/70 leading-[1] tracking-tight uppercase">
                    Believe.
                  </p>
                </AnimatedText>
                <AnimatedText delay={0.9}>
                  <p className="font-display italic text-2xl sm:text-3xl md:text-4xl lg:text-[2.6rem] xl:text-5xl text-black/30 leading-[1] tracking-tight uppercase">
                    Bloom.
                  </p>
                </AnimatedText>
              </div>

              <p className="mt-3 sm:mt-4 text-[9px] sm:text-[10px] md:text-xs text-black/30 font-semibold tracking-[0.15em] uppercase">
                Because you deserve to glow
              </p>

              {/* CTA Button */}
              <div className="mt-4 sm:mt-5 md:mt-6 flex justify-center lg:justify-end">
                <Link href="/products" className="glass-panel-heavy group inline-flex items-center gap-1.5 sm:gap-2 px-4 sm:px-5 md:px-7 py-2 sm:py-2.5 md:py-3 rounded-full border border-black/8 text-[9px] sm:text-[10px] md:text-xs font-black uppercase tracking-[0.15em] hover:bg-black hover:text-white hover:border-black active:scale-[.97] transition-all duration-300 shadow-sm hover:shadow-lg">
                  <span>Explore Us</span>
                  <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </Link>
              </div>

              {/* Trust stats */}
              <div className="hidden md:flex mt-5 lg:mt-7 gap-4 justify-center lg:justify-end">
                <div className="text-center lg:text-right">
                  <p className="font-display text-sm md:text-base text-black">4.9 ⭐</p>
                  <p className="text-[8px] md:text-[9px] text-black/25 uppercase tracking-wider font-semibold">Rating</p>
                </div>
                <div className="w-px bg-black/8 self-stretch" />
                <div className="text-center lg:text-right">
                  <p className="font-display text-sm md:text-base text-black">100%</p>
                  <p className="text-[8px] md:text-[9px] text-black/25 uppercase tracking-wider font-semibold">Natural</p>
                </div>
                <div className="w-px bg-black/8 self-stretch" />
                <div className="text-center lg:text-right">
                  <p className="font-display text-sm md:text-base text-black">50K+</p>
                  <p className="text-[8px] md:text-[9px] text-black/25 uppercase tracking-wider font-semibold">Happy Skin</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </AnimatedBorder>

        {/* Feature Cards */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4">
          <SkinTypeCard />
          <SkinConcernCard />
          <ExpertsCard />
        </div>

        {/* Marquee */}
        <Marquee />
      </div>
    </section>
  );
}