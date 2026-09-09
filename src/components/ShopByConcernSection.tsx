"use client";

import Link from "next/link";
import { useLanguageStore } from "@/lib/language-store";
import { motion } from "framer-motion";
import {
  ShieldAlert,
  Hourglass,
  Sun,
  Droplets,
  Heart,
  SlidersHorizontal,
  ArrowRight,
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
    desc: "Restore youthful elasticity and smooth fine lines",
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
    desc: "Fade hyperpigmentation and reveal radiant glow",
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
    desc: "Quench parched skin with multi-depth hydration",
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
    desc: "Soothe sensitive flare-ups and fortify moisture barrier",
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
    desc: "Refine enlarged pores and balance excess sebum",
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

  return (
    <section className="w-full py-8 sm:py-12 md:py-16 px-3 sm:px-6 select-none my-4">
      <div className="max-w-[1536px] mx-auto">
        {/* Infographic Element Header */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-block relative">
            <h2 className="font-serif text-xl sm:text-2xl md:text-3xl font-extrabold uppercase tracking-widest text-gray-900 relative z-10">
              {isAr ? "تسوق حسب مشكلة البشرة" : "SHOP BY SKIN CONCERN"}
            </h2>
            {/* Highlighter underline matching infographic template */}
            <div className="h-2.5 sm:h-3 w-full bg-amber-300/70 -mt-2 sm:-mt-2.5 rounded-xs" />
          </div>
          <p className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-widest font-semibold mt-2">
            {isAr ? "حلول علاجية موجهة" : "TARGETED BOTANICAL & CLINICAL FORMULATIONS"}
          </p>
        </div>

        {/* Infographic 6-Card Grid (Mobile swipeable, Desktop 6-columns) */}
        <div className="flex overflow-x-auto scrollbar-none gap-3 sm:gap-4 lg:gap-5 pb-4 px-1 sm:px-0 sm:grid sm:grid-cols-3 lg:grid-cols-6">
          {CONCERNS.map((item, idx) => {
            const { Icon, color } = item;
            const optionNum = String(idx + 1).padStart(2, "0");

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: idx * 0.06 }}
                className="flex-shrink-0 w-[180px] sm:w-auto"
              >
                <Link
                  href={item.href}
                  className="group relative block w-full aspect-[220/275] cursor-pointer"
                >
                  {/* Vector SVG Infographic Badge */}
                  <svg
                    viewBox="0 0 220 270"
                    className="w-full h-full overflow-visible drop-shadow-sm"
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

                      {/* Elevated 3D Shadow for the Foreground White Card */}
                      <filter
                        id={`shadow-${item.id}`}
                        x="-20%"
                        y="-10%"
                        width="140%"
                        height="130%"
                      >
                        <feDropShadow
                          dx="0"
                          dy="8"
                          stdDeviation="8"
                          floodColor="rgba(0, 0, 0, 0.08)"
                        />
                        <feDropShadow
                          dx="0"
                          dy="2"
                          stdDeviation="3"
                          floodColor="rgba(0, 0, 0, 0.04)"
                        />
                      </filter>
                    </defs>

                    {/* 1. Recessed Colored Bracket / Pocket Cradle behind bottom & sides */}
                    <rect
                      x="10"
                      y="110"
                      width="200"
                      height="152"
                      rx="28"
                      fill={`url(#${color.gradientId})`}
                      className="group-hover:brightness-105 transition-all duration-300"
                    />

                    {/* 2. Elevated Foreground White Card with Bottom Pointer */}
                    {/* Path: Rounded top, scoop cutout at top-center, bottom pointer tip */}
                    <path
                      d="
                        M 18,34
                        Q 18,10 42,10
                        L 70,10
                        A 40,40 0 0,0 150,10
                        L 178,10
                        Q 202,10 202,34
                        L 202,216
                        Q 202,236 182,236
                        L 126,236
                        L 110,252
                        L 94,236
                        L 38,236
                        Q 18,236 18,216
                        Z
                      "
                      fill="#ffffff"
                      filter={`url(#shadow-${item.id})`}
                      className="transition-transform duration-300 group-hover:-translate-y-1"
                    />

                    {/* 3. Top Semi-Circular Scoop Fill */}
                    <path
                      d="M 70,0 L 70,10 A 40,40 0 0,0 150,10 L 150,0 Z"
                      fill={`url(#${color.gradientId})`}
                      className="transition-transform duration-300 group-hover:-translate-y-1"
                    />
                  </svg>

                  {/* Foreground Content Overlay */}
                  <div className="absolute inset-0 flex flex-col items-center justify-between pt-3 pb-7 px-3 text-center pointer-events-none transition-transform duration-300 group-hover:-translate-y-1">
                    {/* Minimalist Line Icon inside the Top Colored Scoop */}
                    <div className="w-10 h-10 flex items-center justify-center text-gray-900 mt-1">
                      <Icon className="w-5 h-5 stroke-[1.9] text-gray-900 group-hover:scale-110 transition-transform duration-300" />
                    </div>

                    {/* Card Body Content */}
                    <div className="flex flex-col items-center justify-center px-1 my-auto">
                      {/* Option Index / Mini Label */}
                      <span className="text-[9px] font-black uppercase tracking-widest text-amber-600/90 mb-0.5">
                        {`CONCERN ${optionNum}`}
                      </span>

                      {/* Main Title */}
                      <h3 className="font-sans font-extrabold text-[11px] sm:text-xs uppercase tracking-wider text-gray-900 group-hover:text-[#890754] transition-colors line-clamp-1">
                        {item.name}
                      </h3>

                      {/* Benefit Description */}
                      <p className="text-[8.5px] sm:text-[9.5px] text-gray-500 font-medium leading-snug line-clamp-2 mt-1 px-1">
                        {item.desc}
                      </p>
                    </div>

                    {/* Bottom Action Pill */}
                    <span className="inline-flex items-center gap-1 text-[8.5px] font-bold uppercase tracking-wider text-gray-700 group-hover:text-[#890754] transition-colors">
                      <span>Explore</span>
                      <ArrowRight size={9} className="group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
