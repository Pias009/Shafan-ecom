"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useLanguageStore } from "@/lib/language-store";
import {
  Pipette,
  Sparkles,
  Sun,
  Droplets,
  Feather,
  CircleDot,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";

interface ConcernItem {
  id: string;
  name: string;
  nameAr: string;
  tag: string;
  tagAr: string;
  active: string;
  activeAr: string;
  desc: string;
  descAr: string;
  href: string;
  Icon: LucideIcon;
  color: {
    primary: string;
    secondary: string;
    textColor: string;
    pillBg: string;
    gradientId: string;
  };
}

const CONCERNS: ConcernItem[] = [
  {
    id: "acne",
    name: "Acne",
    nameAr: "حب الشباب",
    tag: "Clarifying",
    tagAr: "تنقية البشرة",
    active: "Salicylic Acid",
    activeAr: "حمض الساليسيليك",
    desc: "Unclog deep pores and calm blemishes",
    descAr: "تنقية المسام وتهدئة الحبوب",
    href: "/products?concern=Acne",
    Icon: Pipette,
    color: {
      primary: "#059669",
      secondary: "#34d399",
      textColor: "text-emerald-700",
      pillBg: "bg-emerald-50 text-emerald-800 border-emerald-200",
      gradientId: "grad-acne",
    },
  },
  {
    id: "anti-aging",
    name: "Anti-Aging",
    nameAr: "مكافحة الشيخوخة",
    tag: "Youth Renewal",
    tagAr: "تجديد الشباب",
    active: "Retinol + Peptides",
    activeAr: "ريتينول + ببتيدات",
    desc: "Restore skin elasticity and smooth lines",
    descAr: "استعادة مرونة البشرة وتنعيم الخطوط",
    href: "/products?concern=Anti+Aging",
    Icon: Sparkles,
    color: {
      primary: "#890754",
      secondary: "#c026d3",
      textColor: "text-[#890754]",
      pillBg: "bg-pink-50 text-[#890754] border-pink-200",
      gradientId: "grad-aging",
    },
  },
  {
    id: "dark-spots",
    name: "Dark Spots",
    nameAr: "البقع الداكنة",
    tag: "Radiance",
    tagAr: "إشراقة وتفتيح",
    active: "Vitamin C",
    activeAr: "فيتامين سي",
    desc: "Fade post-acne marks and reveal glow",
    descAr: "تلاشي التصبغات وتوحيد لون البشرة",
    href: "/products?concern=Dark+Spot",
    Icon: Sun,
    color: {
      primary: "#ea580c",
      secondary: "#fbbf24",
      textColor: "text-amber-700",
      pillBg: "bg-amber-50 text-amber-800 border-amber-200",
      gradientId: "grad-spots",
    },
  },
  {
    id: "hydration",
    name: "Dryness",
    nameAr: "جفاف البشرة",
    tag: "Deep Hydrate",
    tagAr: "ترطيب مكثف",
    active: "Hyaluronic Acid",
    activeAr: "حمض الهيالورونيك",
    desc: "Quench parched skin with deep dew",
    descAr: "غمر البشرة الجافة بالترطيب العميق",
    href: "/products?skinType=Dry+Skin",
    Icon: Droplets,
    color: {
      primary: "#0284c7",
      secondary: "#38bdf8",
      textColor: "text-sky-700",
      pillBg: "bg-sky-50 text-sky-800 border-sky-200",
      gradientId: "grad-dry",
    },
  },
  {
    id: "redness",
    name: "Redness",
    nameAr: "الاحمرار",
    tag: "Barrier Care",
    tagAr: "عناية بالحاجز",
    active: "Centella Cica",
    activeAr: "سيكا سنتيلا",
    desc: "Soothe sensitive skin and fortify barrier",
    descAr: "تهدئة الاحمرار وتقوية حاجز البشرة",
    href: "/products?concern=Redness",
    Icon: Feather,
    color: {
      primary: "#e11d48",
      secondary: "#fda4af",
      textColor: "text-rose-700",
      pillBg: "bg-rose-50 text-rose-800 border-rose-200",
      gradientId: "grad-redness",
    },
  },
  {
    id: "pores",
    name: "Pores",
    nameAr: "المسام",
    tag: "Pore Balance",
    tagAr: "توازن المسام",
    active: "Niacinamide + Zinc",
    activeAr: "نياسيناميد + زنك",
    desc: "Refine enlarged pores and regulate shine",
    descAr: "تضييق المسام والتحكم باللمعان",
    href: "/products?concern=Anti+Pores",
    Icon: CircleDot,
    color: {
      primary: "#0d9488",
      secondary: "#2dd4bf",
      textColor: "text-teal-700",
      pillBg: "bg-teal-50 text-teal-800 border-teal-200",
      gradientId: "grad-pores",
    },
  },
];

export function ShopByConcernSection() {
  const { currentLanguage } = useLanguageStore();
  const isAr = currentLanguage?.code === "ar";
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canSlideLeft, setCanSlideLeft] = useState(false);
  const [canSlideRight, setCanSlideRight] = useState(true);

  const updateScrollState = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanSlideLeft(scrollLeft > 8);
    setCanSlideRight(scrollLeft < scrollWidth - clientWidth - 8);
  };

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);
    return () => {
      el.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, []);

  const handleScroll = (dir: "left" | "right") => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const card = el.firstElementChild as HTMLElement | null;
    const cardWidth = card ? card.offsetWidth : 180;
    const scrollAmount = (cardWidth + 14) * (window.innerWidth >= 1024 ? 2 : 1);
    el.scrollBy({
      left: dir === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  return (
    <section className="w-full py-6 sm:py-10 px-3 sm:px-6 select-none my-2 sm:my-4">
      <div className="max-w-[1280px] mx-auto">
        {/* Infographic Element Header with Luxury Skincare Accent */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-block relative">
            <h2 className="font-serif text-xl sm:text-2xl md:text-3xl font-extrabold uppercase tracking-widest text-gray-900 relative z-10">
              {isAr ? "تسوق حسب مشكلة البشرة" : "SHOP BY SKIN CONCERN"}
            </h2>
            {/* Elegant luxury brand stroke underline */}
            <div className="h-1.5 sm:h-2 w-full bg-gradient-to-r from-transparent via-[#890754]/25 to-transparent -mt-1 sm:-mt-1.5 rounded-full" />
          </div>
          <p className="text-[10px] sm:text-xs text-[#890754]/85 uppercase tracking-[0.22em] font-bold mt-1.5">
            {isAr ? "حلول علاجية موجهة لجميع مشاكل البشرة" : "TARGETED CLINICAL SOLUTIONS FOR EVERY SKIN CONCERN"}
          </p>
        </div>

        {/* Carousel / Slider Container */}
        <div className="relative max-w-[1100px] mx-auto px-1 sm:px-8 group/carousel">
          {/* Left Navigation Arrow */}
          <button
            type="button"
            onClick={() => handleScroll("left")}
            disabled={!canSlideLeft}
            aria-label="Previous concerns"
            className={`hidden sm:flex absolute left-0 sm:left-1 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white shadow-md border border-gray-100 items-center justify-center transition-all ${
              canSlideLeft
                ? "text-gray-800 hover:text-white hover:bg-[#890754] hover:scale-110 active:scale-95 cursor-pointer opacity-95"
                : "text-gray-300 cursor-not-allowed opacity-0 pointer-events-none"
            }`}
          >
            <ChevronLeft size={18} />
          </button>

          {/* Right Navigation Arrow */}
          <button
            type="button"
            onClick={() => handleScroll("right")}
            disabled={!canSlideRight}
            aria-label="Next concerns"
            className={`hidden sm:flex absolute right-0 sm:right-1 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white shadow-md border border-gray-100 flex items-center justify-center transition-all ${
              canSlideRight
                ? "text-gray-800 hover:text-white hover:bg-[#890754] hover:scale-110 active:scale-95 cursor-pointer opacity-95"
                : "text-gray-300 cursor-not-allowed opacity-0 pointer-events-none"
            }`}
          >
            <ChevronRight size={18} />
          </button>

          {/* Scroll Track: Compact mobile cards with smooth snap */}
          <div
            ref={scrollContainerRef}
            className="flex gap-2 xs:gap-2.5 sm:gap-4 overflow-x-auto scrollbar-none snap-x snap-mandatory py-2 px-0.5"
            style={{ scrollBehavior: "smooth" }}
          >
            {CONCERNS.map((item) => {
              const { Icon, color } = item;

              return (
                <div
                  key={item.id}
                  className="flex-shrink-0 w-[110px] xs:w-[124px] sm:w-[calc(33.333%-11px)] lg:w-[calc(16.666%-11px)] snap-start"
                >
                  <Link
                    href={item.href}
                    className="group relative block w-full aspect-[180/180] cursor-pointer select-none"
                  >
                    {/* Vector SVG Infographic Badge Architecture */}
                    <svg
                      viewBox="0 0 180 180"
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
                            dy="4"
                            stdDeviation="4"
                            floodColor="rgba(0, 0, 0, 0.08)"
                          />
                        </filter>
                      </defs>

                      {/* 1. Recessed Colored Bracket / Cradle Behind */}
                      <rect
                        x="8"
                        y="68"
                        width="164"
                        height="98"
                        rx="22"
                        fill={`url(#${color.gradientId})`}
                        className="group-hover:brightness-105 transition-all duration-300"
                      />

                      {/* 2. Elevated White Porcelain Card Body with Clean Rounded Bottom */}
                      <path
                        d="
                          M 14,28
                          Q 14,8 34,8
                          L 58,8
                          A 32,32 0 0,0 122,8
                          L 146,8
                          Q 166,8 166,28
                          L 166,142
                          Q 166,156 148,156
                          L 32,156
                          Q 14,156 14,142
                          Z
                        "
                        fill="#ffffff"
                        filter={`url(#shadow-${item.id})`}
                        className="transition-transform duration-300 group-hover:-translate-y-1"
                      />

                      {/* 3. Top Semi-Circular Arched Tab Fill */}
                      <path
                        d="M 58,0 L 58,8 A 32,32 0 0,0 122,8 L 122,0 Z"
                        fill={`url(#${color.gradientId})`}
                        className="transition-transform duration-300 group-hover:-translate-y-1"
                      />
                    </svg>

                    {/* Foreground Content: Icon at top arch + ONLY the Main Concern Text */}
                    <div className="absolute inset-0 flex flex-col items-center pointer-events-none transition-transform duration-300 group-hover:-translate-y-1">
                      {/* Dermatological White Logo in the Center of Top Arch */}
                      <div className="absolute top-[3px] sm:top-[4px] left-1/2 -translate-x-1/2 w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-white">
                        <Icon className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.4] text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)] group-hover:scale-115 transition-transform duration-300" />
                      </div>

                      {/* Card Body: Clean & Centered with ONLY the Main Concern Text */}
                      <div className="absolute inset-x-0 bottom-4 top-8 sm:top-10 flex flex-col items-center justify-center text-center px-1.5 sm:px-2">
                        <h3 className="font-sans font-black text-[12px] xs:text-[13px] sm:text-[14.5px] md:text-[15.5px] uppercase tracking-wider text-gray-900 group-hover:text-[#890754] transition-colors line-clamp-1 w-full">
                          {isAr ? item.nameAr : item.name}
                        </h3>
                      </div>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
