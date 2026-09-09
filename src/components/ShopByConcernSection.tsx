"use client";

import { useState } from "react";
import Link from "next/link";
import { useLanguageStore } from "@/lib/language-store";
import {
  ShieldAlert,
  Hourglass,
  Sun,
  Droplets,
  Heart,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";

interface ConcernItem {
  id: string;
  name: string;
  tag: string;
  desc: string;
  href: string;
  Icon: LucideIcon;
  color: {
    primary: string;
    secondary: string;
    gradientId: string;
  };
}

const CONCERNS: ConcernItem[] = [
  {
    id: "acne",
    name: "Acne & Blemishes",
    tag: "Purify",
    desc: "Target breakouts and clear congested pores",
    href: "/products?concern=Acne",
    Icon: ShieldAlert,
    color: {
      primary: "#F59E0B",
      secondary: "#FBBF24",
      gradientId: "grad-acne",
    },
  },
  {
    id: "anti-aging",
    name: "Anti-Aging",
    tag: "Firm & Lift",
    desc: "Restore elasticity and smooth fine lines",
    href: "/products?concern=Anti+Aging",
    Icon: Hourglass,
    color: {
      primary: "#EAB308",
      secondary: "#FDE047",
      gradientId: "grad-aging",
    },
  },
  {
    id: "dark-spots",
    name: "Dark Spots",
    tag: "Brighten",
    desc: "Fade dark spots and reveal radiant tone",
    href: "/products?concern=Dark+Spot",
    Icon: Sun,
    color: {
      primary: "#F59E0B",
      secondary: "#FBBF24",
      gradientId: "grad-spots",
    },
  },
  {
    id: "hydration",
    name: "Dryness",
    tag: "Deep Hydrate",
    desc: "Quench parched skin with multi-depth moisture",
    href: "/products?skinType=Dry+Skin",
    Icon: Droplets,
    color: {
      primary: "#EAB308",
      secondary: "#FACC15",
      gradientId: "grad-dry",
    },
  },
  {
    id: "redness",
    name: "Redness & Calming",
    tag: "Barrier Care",
    desc: "Soothe sensitive skin and fortify barrier",
    href: "/products?concern=Redness",
    Icon: Heart,
    color: {
      primary: "#F59E0B",
      secondary: "#FBBF24",
      gradientId: "grad-redness",
    },
  },
  {
    id: "pores",
    name: "Pores & Oil",
    tag: "Balance",
    desc: "Refine enlarged pores and balance sebum",
    href: "/products?concern=Anti+Pores",
    Icon: SlidersHorizontal,
    color: {
      primary: "#EAB308",
      secondary: "#FDE047",
      gradientId: "grad-pores",
    },
  },
];

export function ShopByConcernSection() {
  const { currentLanguage } = useLanguageStore();
  const isAr = currentLanguage?.code === "ar";
  const [currentIndex, setCurrentIndex] = useState(0);

  // Show exactly 4 cards on desktop at a time, then slide
  const maxDesktopIndex = Math.max(0, CONCERNS.length - 4);
  const canSlideLeft = currentIndex > 0;
  const canSlideRight = currentIndex < maxDesktopIndex;

  const handlePrev = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => Math.min(maxDesktopIndex, prev + 1));
  };

  return (
    <section className="w-full py-6 sm:py-10 px-3 sm:px-6 select-none my-2 sm:my-4">
      <div className="max-w-[1280px] mx-auto">
        {/* Infographic Element Header with Highlighter Accent */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-block relative">
            <h2 className="font-serif text-xl sm:text-2xl md:text-3xl font-extrabold uppercase tracking-widest text-gray-900 relative z-10">
              {isAr ? "تسوق حسب مشكلة البشرة" : "SHOP BY SKIN CONCERN"}
            </h2>
            {/* Highlighter underline matching infographic template */}
            <div className="h-2.5 sm:h-3 w-full bg-amber-300/70 -mt-2 sm:-mt-2.5 rounded-xs" />
          </div>
          <p className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-widest font-semibold mt-1.5">
            {isAr ? "حلول علاجية موجهة" : "TARGETED SOLUTIONS FOR EVERY SKIN TYPE"}
          </p>
        </div>

        {/* 4-Card Stage with Slide Controls */}
        <div className="relative max-w-[960px] mx-auto px-6 sm:px-10">
          {/* Left Slider Arrow */}
          <button
            onClick={handlePrev}
            disabled={!canSlideLeft}
            aria-label="Previous concerns"
            className={`absolute left-0 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white shadow-md border border-gray-100 flex items-center justify-center transition-all ${
              canSlideLeft
                ? "text-gray-800 hover:text-[#890754] hover:scale-110 cursor-pointer"
                : "text-gray-300 cursor-not-allowed opacity-40"
            }`}
          >
            <ChevronLeft size={18} />
          </button>

          {/* Right Slider Arrow */}
          <button
            onClick={handleNext}
            disabled={!canSlideRight}
            aria-label="Next concerns"
            className={`absolute right-0 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white shadow-md border border-gray-100 flex items-center justify-center transition-all ${
              canSlideRight
                ? "text-gray-800 hover:text-[#890754] hover:scale-110 cursor-pointer"
                : "text-gray-300 cursor-not-allowed opacity-40"
            }`}
          >
            <ChevronRight size={18} />
          </button>

          {/* Slider Viewport */}
          <div className="overflow-hidden w-full py-2">
            {/* Desktop: 4 Cards Visible (w-1/4), sliding by 25% | Mobile: horizontal touch-swipe */}
            <div
              className="flex sm:transition-transform sm:duration-500 sm:ease-[cubic-bezier(0.16,1,0.3,1)] overflow-x-auto sm:overflow-x-visible scrollbar-none snap-x gap-3 sm:gap-0"
              style={{
                transform: `translateX(-${currentIndex * 25}%)`,
              }}
            >
              {CONCERNS.map((item, idx) => {
                const { Icon, color } = item;
                const optionNum = String(idx + 1).padStart(2, "0");

                return (
                  <div
                    key={item.id}
                    className="flex-shrink-0 w-[150px] sm:w-1/4 px-1.5 snap-start"
                  >
                    <Link
                      href={item.href}
                      className="group relative block w-full aspect-[180/220] cursor-pointer"
                    >
                      {/* Vector SVG Infographic Badge (2x Smaller Compact Geometry) */}
                      <svg
                        viewBox="0 0 180 220"
                        className="w-full h-full overflow-visible drop-shadow-sm pointer-events-none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <defs>
                          <linearGradient
                            id={color.gradientId}
                            x1="0%"
                            y1="0%"
                            x2="100%"
                            y2="100%"
                          >
                            <stop offset="0%" stopColor={color.secondary} />
                            <stop offset="100%" stopColor={color.primary} />
                          </linearGradient>

                          {/* Soft 3D Shadow for the Foreground White Card */}
                          <filter
                            id={`shadow-${item.id}`}
                            x="-15%"
                            y="-10%"
                            width="130%"
                            height="125%"
                          >
                            <feDropShadow
                              dx="0"
                              dy="5"
                              stdDeviation="5"
                              floodColor="rgba(0, 0, 0, 0.07)"
                            />
                          </filter>
                        </defs>

                        {/* 1. Recessed Colored Bracket / Cradle Behind */}
                        <rect
                          x="8"
                          y="90"
                          width="164"
                          height="120"
                          rx="22"
                          fill={`url(#${color.gradientId})`}
                          className="group-hover:brightness-105 transition-all duration-300"
                        />

                        {/* 2. Elevated White Card with Bottom Pointer Tip */}
                        <path
                          d="
                            M 14,28
                            Q 14,8 34,8
                            L 58,8
                            A 32,32 0 0,0 122,8
                            L 146,8
                            Q 166,8 166,28
                            L 166,176
                            Q 166,194 148,194
                            L 104,194
                            L 90,208
                            L 76,194
                            L 32,194
                            Q 14,194 14,176
                            Z
                          "
                          fill="#ffffff"
                          filter={`url(#shadow-${item.id})`}
                          className="transition-transform duration-300 group-hover:-translate-y-1"
                        />

                        {/* 3. Top Semi-Circular Scoop Fill */}
                        <path
                          d="M 58,0 L 58,8 A 32,32 0 0,0 122,8 L 122,0 Z"
                          fill={`url(#${color.gradientId})`}
                          className="transition-transform duration-300 group-hover:-translate-y-1"
                        />
                      </svg>

                      {/* Foreground Content with Mathematically Centered Logo */}
                      <div className="absolute inset-0 flex flex-col items-center pointer-events-none transition-transform duration-300 group-hover:-translate-y-1">
                        {/* Logo in the 100% Perfect Center of the Top Scoop */}
                        <div className="absolute top-[5px] left-1/2 -translate-x-1/2 w-8 h-8 flex items-center justify-center text-gray-900">
                          <Icon className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2] text-gray-900 group-hover:scale-110 transition-transform duration-300" />
                        </div>

                        {/* Card Body Content (Compact 2x smaller size) */}
                        <div className="flex flex-col items-center justify-center text-center mt-[46px] px-2 w-full">
                          {/* Option / Mini Index */}
                          <span className="text-[8px] font-black uppercase tracking-widest text-amber-600 mb-0.5">
                            {`OPTION ${optionNum}`}
                          </span>

                          {/* Main Title */}
                          <h3 className="font-sans font-extrabold text-[10px] sm:text-[11px] uppercase tracking-wider text-gray-900 group-hover:text-[#890754] transition-colors line-clamp-1 w-full">
                            {item.name}
                          </h3>

                          {/* Short Description */}
                          <p className="text-[7.5px] sm:text-[8px] text-gray-500 font-medium leading-tight line-clamp-2 mt-1 px-1">
                            {item.desc}
                          </p>

                          {/* Subtle Action Link */}
                          <span className="text-[7.5px] font-bold uppercase tracking-wider text-gray-700 group-hover:text-[#890754] transition-colors mt-2">
                            Explore →
                          </span>
                        </div>
                      </div>
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Slide Indicator Dots (Desktop) */}
        <div className="hidden sm:flex items-center justify-center gap-1.5 mt-4">
          {Array.from({ length: maxDesktopIndex + 1 }).map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`transition-all duration-300 ${
                currentIndex === i
                  ? "w-5 h-1.5 rounded-full bg-amber-500"
                  : "w-1.5 h-1.5 rounded-full bg-amber-200 hover:bg-amber-300"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
