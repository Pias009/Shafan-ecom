"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Play, Leaf, Droplets, FlaskConical, Sparkles } from "lucide-react";
import toast from "react-hot-toast";

// Custom Bunny Icon SVG for Cruelty Free feature
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

export function Hero() {
  return (
    <section className="relative w-full overflow-hidden bg-[#72ccbd]" suppressHydrationWarning>
      
      {/* Seamless Hero Container with 100% Blended Right Model Image */}
      <div className="relative w-full min-h-[540px] sm:min-h-[620px] lg:min-h-[720px] flex items-center">
        
        {/* Single 8K Full Cover Studio Background Image */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <Image
            src="/images/hero-banner-2to1-ratio.png"
            alt="SHANFA GLOBAL Flash Sale Luxury Banner"
            fill
            className="object-cover object-[85%_center] sm:object-[88%_center] lg:object-right"
            priority
          />
          {/* Gentle text backdrop gradient matching sky fresh #72ccbd color */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#72ccbd] via-[#72ccbd]/90 via-45% to-transparent w-full md:w-[70%] lg:w-[60%]" />
          {/* Subtle SVG Floating Water Droplets */}
          <svg className="absolute top-24 left-1/3 w-7 h-7 text-white/30 animate-pulse pointer-events-none" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
          </svg>
          <svg className="absolute bottom-16 left-1/4 w-5 h-5 text-white/35 animate-bounce pointer-events-none" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
          </svg>
        </div>

        {/* Hero Left Content Container */}
        <div className="relative z-10 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-12 pt-28 sm:pt-36 lg:pt-40 pb-16 sm:pb-20">
          <div className="max-w-xl space-y-4 sm:space-y-6 text-left">
            
            {/* Tag Subtitle */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-block"
            >
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.25em] text-white bg-white/15 backdrop-blur-md px-3.5 py-1 rounded-full border border-white/30 shadow-sm">
                NATURALLY RADIANT
              </span>
            </motion.div>

            {/* H1 Display Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="font-serif text-3xl sm:text-5xl lg:text-7xl font-normal leading-[1.08] tracking-tight text-white drop-shadow-md"
            >
              Skincare <br />
              that cares, <br />
              beauty that <br />
              shines.
            </motion.h1>

            {/* Subtitle with leaf icon divider line */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="space-y-2 pt-1"
            >
              <div className="flex items-center gap-2 text-white/90">
                <Leaf size={14} className="rotate-45" />
                <span className="h-px w-8 bg-white/40" />
              </div>
              <p className="text-xs sm:text-base text-white/95 font-normal leading-relaxed max-w-md drop-shadow-sm font-medium">
                Discover the perfect blend of nature and science for healthy, glowing skin every day.
              </p>
            </motion.div>

            {/* 3D Interactive Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="flex items-center gap-3.5 pt-3"
            >
              <Link
                href="/products"
                className="inline-flex items-center justify-center gap-2 bg-[#0c433a] hover:bg-[#072a24] text-white px-7 sm:px-9 py-3 sm:py-4 rounded-full font-black text-xs sm:text-sm uppercase tracking-wider transition-all duration-300 shadow-[0_10px_25px_rgba(12,67,58,0.4)] hover:shadow-[0_15px_35px_rgba(12,67,58,0.6)] hover:-translate-y-1 active:translate-y-0 transform-gpu group border border-emerald-500/30"
              >
                <span>SHOP NOW</span>
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>

              <button
                onClick={() => toast.success("Playing Skincare Video...")}
                className="inline-flex items-center justify-center gap-2.5 bg-white/20 hover:bg-white/30 text-white backdrop-blur-md border border-white/40 px-5 sm:px-7 py-3 sm:py-4 rounded-full font-bold text-xs sm:text-sm uppercase tracking-wider transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transform-gpu"
              >
                <div className="w-5 h-5 rounded-full bg-white text-[#0c433a] flex items-center justify-center shadow-sm">
                  <Play size={10} className="fill-current ml-0.5" />
                </div>
                <span>WATCH VIDEO</span>
              </button>
            </motion.div>

          </div>
        </div>

      </div>

      {/* Floating 4-Column Feature Trust Bar */}
      <div className="relative z-20 max-w-[1440px] mx-auto px-4 sm:px-6 pb-4 sm:pb-8 -mt-6 sm:-mt-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          suppressHydrationWarning
          className="relative bg-white/95 backdrop-blur-2xl border border-white/80 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-[0_15px_35px_rgba(4,43,36,0.08)] grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 divide-y md:divide-y-0 md:divide-x divide-black/5 text-[#042b24]"
        >
          <div className="flex items-center gap-3.5 p-2 sm:p-3 group">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#72ccbd]/20 text-[#0c433a] flex items-center justify-center shrink-0 border border-[#72ccbd]/30 shadow-xs group-hover:scale-105 group-hover:bg-[#0c433a] group-hover:text-white transition-all duration-300">
              <Leaf size={20} />
            </div>
            <div>
              <h4 className="font-serif font-bold text-xs sm:text-sm text-[#042b24] leading-tight">Natural Ingredients</h4>
              <p className="text-[10px] sm:text-xs text-[#042b24]/60 mt-0.5 font-medium">Safe & Effective</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-2 sm:p-3 md:pl-6 group">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#72ccbd]/20 text-[#0c433a] flex items-center justify-center shrink-0 border border-[#72ccbd]/30 shadow-xs group-hover:scale-105 group-hover:bg-[#0c433a] group-hover:text-white transition-all duration-300">
              <Droplets size={20} />
            </div>
            <div>
              <h4 className="font-serif font-bold text-xs sm:text-sm text-[#042b24] leading-tight">Dermatologist Tested</h4>
              <p className="text-[10px] sm:text-xs text-[#042b24]/60 mt-0.5 font-medium">For All Skin Types</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-2 sm:p-3 md:pl-6 group">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#72ccbd]/20 text-[#0c433a] flex items-center justify-center shrink-0 border border-[#72ccbd]/30 shadow-xs group-hover:scale-105 group-hover:bg-[#0c433a] group-hover:text-white transition-all duration-300">
              <FlaskConical size={20} />
            </div>
            <div>
              <h4 className="font-serif font-bold text-xs sm:text-sm text-[#042b24] leading-tight">Paraben & Sulfate Free</h4>
              <p className="text-[10px] sm:text-xs text-[#042b24]/60 mt-0.5 font-medium">Clean & Gentle</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-2 sm:p-3 md:pl-6 group">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#72ccbd]/20 text-[#0c433a] flex items-center justify-center shrink-0 border border-[#72ccbd]/30 shadow-xs group-hover:scale-105 group-hover:bg-[#0c433a] group-hover:text-white transition-all duration-300">
              <BunnyIcon className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-serif font-bold text-xs sm:text-sm text-[#042b24] leading-tight">Cruelty Free</h4>
              <p className="text-[10px] sm:text-xs text-[#042b24]/60 mt-0.5 font-medium">Never Tested on Animals</p>
            </div>
          </div>
        </motion.div>
      </div>

    </section>
  );
}



