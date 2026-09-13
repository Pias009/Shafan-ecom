"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { ShoppingCart, Eye, Star, CheckCircle2, ShieldCheck } from "lucide-react";
import { Price } from "./Price";
import { CountryPrice } from "./ProductCard";
import { useLanguageStore } from "@/lib/language-store";

interface ProblemNode {
  id: string;
  name: string;
  nameAr: string;
  badgeStyle: {
    left: string;
    top: string;
    transform: string;
  };
  hx: number;
  hy: number;
  ox: number;
  oy: number;
}

// 6 Core Skin Concerns Controlled by the One Pack Solution (Short, punchy one-word editorial labels)
// Coordinate System: viewBox 0 0 800 680, Center (400, 340)
const PROBLEM_NODES: ProblemNode[] = [
  {
    id: "acne",
    name: "Acne",
    nameAr: "حب الشباب",
    badgeStyle: { left: "50%", top: "14%", transform: "translate(-50%, -100%)" },
    hx: 400,
    hy: 195,
    ox: 400,
    oy: 125,
  },
  {
    id: "pigmentation",
    name: "Dark Spots",
    nameAr: "التصبغات",
    badgeStyle: { left: "77%", top: "34.2%", transform: "translate(0%, -50%)" },
    hx: 525.57,
    hy: 267.5,
    ox: 586.2,
    oy: 232.5,
  },
  {
    id: "aging",
    name: "Wrinkles",
    nameAr: "التجاعيد",
    badgeStyle: { left: "77%", top: "65.8%", transform: "translate(0%, -50%)" },
    hx: 525.57,
    hy: 412.5,
    ox: 586.2,
    oy: 447.5,
  },
  {
    id: "dehydration",
    name: "Hydration",
    nameAr: "الترطيب",
    badgeStyle: { left: "50%", top: "86%", transform: "translate(-50%, 0%)" },
    hx: 400,
    hy: 485,
    ox: 400,
    oy: 555,
  },
  {
    id: "barrier",
    name: "Barrier",
    nameAr: "حاجز البشرة",
    badgeStyle: { left: "23%", top: "65.8%", transform: "translate(-100%, -50%)" },
    hx: 274.43,
    hy: 412.5,
    ox: 213.8,
    oy: 447.5,
  },
  {
    id: "pores",
    name: "Oil",
    nameAr: "الدهون",
    badgeStyle: { left: "23%", top: "34.2%", transform: "translate(-100%, -50%)" },
    hx: 274.43,
    hy: 267.5,
    ox: 213.8,
    oy: 232.5,
  },
];

interface Props {
  routineProducts?: any[];
  allProducts?: any[];
  onQuickView: (product: any) => void;
  addToCart: (product: any) => void;
  orderNow?: (product: any) => void;
}

export function OnePackSolutionSection({
  routineProducts = [],
  allProducts = [],
  onQuickView,
  addToCart,
  orderNow,
}: Props) {
  const { currentLanguage } = useLanguageStore();
  const isAr = currentLanguage.code === "ar";
  const [activeProblem, setActiveProblem] = useState<string | null>(null);
  const [justAdded, setJustAdded] = useState(false);

  // Pick the hero routine bundle pack: prioritize a dedicated set or high-value routine product
  const heroProduct =
    routineProducts.find(
      (p) =>
        p.name?.toLowerCase().includes("set") ||
        p.name?.toLowerCase().includes("routine") ||
        p.name?.toLowerCase().includes("pack") ||
        p.name?.toLowerCase().includes("combo")
    ) ||
    routineProducts[0] ||
    allProducts.find(
      (p) =>
        p.name?.toLowerCase().includes("set") ||
        p.name?.toLowerCase().includes("routine") ||
        p.name?.toLowerCase().includes("pack")
    ) ||
    allProducts[0] || {
      id: "one-pack-solution-default",
      name: "Complete Botanical 6-in-1 Renewal Ritual Pack",
      brand: { name: "Shafan Beauty" },
      price: 185,
      discountPrice: 145,
      imageUrl: "/images/routine-diagnostic-visual.jpg",
      mainImage: "/images/routine-diagnostic-visual.jpg",
      averageRating: 4.95,
      ratingCount: 148,
    };

  const displayPrice = heroProduct.salePrice || heroProduct.discountPrice || heroProduct.price || 145;
  const originalPrice =
    (heroProduct.salePrice || heroProduct.discountPrice) && heroProduct.price > displayPrice
      ? heroProduct.price
      : null;
  const brandName =
    typeof heroProduct.brand === "string"
      ? heroProduct.brand
      : heroProduct.brand?.name || "Shafan Beauty";
  const productImg =
    heroProduct.mainImage || heroProduct.imageUrl || "/images/routine-diagnostic-visual.jpg";

  const handleAddToCart = () => {
    addToCart(heroProduct);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1600);
  };

  const handleOrderNow = () => {
    if (orderNow) {
      orderNow(heroProduct);
    } else {
      handleAddToCart();
    }
  };

  return (
    <section className="relative w-full max-w-[1440px] mx-auto px-2 sm:px-6 py-4 sm:py-10 overflow-hidden select-none">
      <style>{`
        @keyframes onePackTextFlow {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
        @keyframes onePackHeadingGlow {
          0%, 100% {
            filter: drop-shadow(0 0 10px rgba(137, 7, 84, 0.15));
          }
          50% {
            filter: drop-shadow(0 0 20px rgba(217, 41, 130, 0.3));
          }
        }
        @keyframes onePackLineExpand {
          0%, 100% {
            width: 50px;
            opacity: 0.7;
          }
          50% {
            width: 100px;
            opacity: 1;
          }
        }
        @keyframes luxuryColorWave {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
        .one-pack-heading {
          background: linear-gradient(135deg, #540434 0%, #890754 38%, #d92982 70%, #890754 100%);
          background-size: 240% auto;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: onePackTextFlow 5s ease-in-out infinite, onePackHeadingGlow 4s ease-in-out infinite;
        }
        .one-pack-line {
          animation: onePackLineExpand 3.8s ease-in-out infinite;
        }
        .luxury-wave-text {
          background: linear-gradient(
            135deg,
            #890754 0%,
            #d92982 25%,
            #ff758c 50%,
            #890754 75%,
            #d92982 100%
          );
          background-size: 250% 250%;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: luxuryColorWave 4s ease-in-out infinite;
        }
      `}</style>

      {/* Subtle Ambient Radial Glow in Background - Compact and restrained */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[280px] sm:w-[400px] sm:h-[400px] bg-gradient-to-tr from-[#890754]/5 via-pink-400/5 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Section Header */}
      <div className="text-center mb-5 sm:mb-7 relative z-10 px-2">
        <h2 className="one-pack-heading font-serif text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight pb-1">
          {isAr ? "حل الباقة الواحدة" : "One Pack Solution"}
        </h2>

        {/* Dynamic Expanding Horizon Brand Line */}
        <div className="one-pack-line mx-auto h-[2.5px] rounded-full bg-gradient-to-r from-transparent via-[#890754] to-transparent mt-1.5" />
      </div>

      {/* Main Diagram Area (Spider Web / Hexagon Wireframe - Compact & perfectly proportioned on Mobile) */}
      <div dir="ltr" className="relative w-full max-w-[360px] sm:max-w-[480px] md:max-w-[560px] aspect-[800/680] mx-auto flex items-center justify-center">
        {/* Responsive Full-Vector SVG containing the complete Diagram + Spider Web Points + Labels */}
        <svg
          viewBox="0 0 800 680"
          className="w-full h-full overflow-visible pointer-events-auto select-none"
        >
          <defs>
            {/* Soft peach/rose shadow under center orb */}
            <radialGradient id="center-ambient-shadow-800" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fbcfe8" stopOpacity="0.45" />
              <stop offset="60%" stopColor="#f43f5e" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#890754" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Background Ambient Radial Glow - Scaled down so it never overpowers */}
          <circle cx="400" cy="340" r="75" fill="url(#center-ambient-shadow-800)" />

          {/* Animated Spider Web Wireframe (Spin Entrance) */}
          <motion.g
            initial={{ rotate: -32, scale: 0.9, opacity: 0 }}
            whileInView={{ rotate: 0, scale: 1, opacity: 1 }}
            viewport={{ once: false, margin: "-20px" }}
            transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
            style={{ transformOrigin: "400px 340px" }}
          >
            {/* Outer Concentric Hairline Guide Ring (r = 215) */}
            <circle
              cx="400"
              cy="340"
              r="215"
              fill="none"
              stroke="#e2e8f0"
              strokeWidth="1.2"
              opacity="0.9"
            />

            {/* Inner Concentric Hairline Guide Ring (r = 145) */}
            <circle
              cx="400"
              cy="340"
              r="145"
              fill="none"
              stroke="#f1f5f9"
              strokeWidth="1"
              strokeDasharray="4 4"
              opacity="0.65"
            />

            {/* Outer Hexagon Perimeter (Connecting the 6 Vertices: V0 -> V1 -> V2 -> V3 -> V4 -> V5 -> V0) */}
            <polygon
              points="400,195 525.57,267.5 525.57,412.5 400,485 274.43,412.5 274.43,267.5"
              fill="none"
              stroke="#cbd5e1"
              strokeWidth="1.5"
              strokeLinejoin="round"
              opacity="0.8"
            />

            {/* 3D Isometric Box Internal Edges (Center (400, 340) to Primary Vertices) */}
            {/* Center to Top (400, 195) */}
            <line x1="400" y1="340" x2="400" y2="195" stroke="#94a3b8" strokeWidth="1.6" opacity="0.75" />
            {/* Center to Bottom-Right (525.57, 412.5) */}
            <line x1="400" y1="340" x2="525.57" y2="412.5" stroke="#94a3b8" strokeWidth="1.6" opacity="0.75" />
            {/* Center to Bottom-Left (274.43, 412.5) */}
            <line x1="400" y1="340" x2="274.43" y2="412.5" stroke="#94a3b8" strokeWidth="1.6" opacity="0.75" />

            {/* Faint Complementary Isometric Internal Facet Lines */}
            <line x1="400" y1="340" x2="525.57" y2="267.5" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
            <line x1="400" y1="340" x2="274.43" y2="267.5" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
            <line x1="400" y1="340" x2="400" y2="485" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />

            {/* 6 Radial Extension Spokes Extending Outward to the Spider Web Ring */}
            {PROBLEM_NODES.map((node) => {
              const isActive = activeProblem === node.id;
              return (
                <line
                  key={`spoke-${node.id}`}
                  x1={node.hx}
                  y1={node.hy}
                  x2={node.ox}
                  y2={node.oy}
                  stroke={isActive ? "#890754" : "#cbd5e1"}
                  strokeWidth={isActive ? 2 : 1.3}
                  opacity={isActive ? 1 : 0.75}
                  className="transition-all duration-300"
                />
              );
            })}

            {/* 6 Inner Hexagon Vertex Points (Inner Ring Junctions) */}
            {PROBLEM_NODES.map((node) => {
              const isActive = activeProblem === node.id;
              return (
                <g key={`inner-pt-${node.id}`}>
                  <circle
                    cx={node.hx}
                    cy={node.hy}
                    r={isActive ? 5.5 : 4}
                    fill={isActive ? "#890754" : "#ffffff"}
                    stroke={isActive ? "#d92982" : "#94a3b8"}
                    strokeWidth={isActive ? 2 : 1.5}
                    className="transition-all duration-300"
                  />
                </g>
              );
            })}

            {/* 6 Outer Spider Web Points (Where Spokes Intersect Outer Ring) */}
            {PROBLEM_NODES.map((node) => {
              const isActive = activeProblem === node.id;
              return (
                <g key={`outer-pt-${node.id}`}>
                  {/* Subtle outer halo */}
                  <circle
                    cx={node.ox}
                    cy={node.oy}
                    r={isActive ? 8 : 6}
                    fill={isActive ? "rgba(137, 7, 84, 0.18)" : "rgba(203, 213, 225, 0.25)"}
                    className="transition-all duration-300"
                  />
                  {/* Outer Spoke Dot */}
                  <circle
                    cx={node.ox}
                    cy={node.oy}
                    r={isActive ? 4.5 : 3.5}
                    fill={isActive ? "#890754" : "#94a3b8"}
                    stroke="#ffffff"
                    strokeWidth={1.5}
                    className="transition-all duration-300"
                  />
                  {isActive && (
                    <circle
                      cx={node.ox}
                      cy={node.oy}
                      r="12"
                      fill="none"
                      stroke="#890754"
                      strokeWidth="1.5"
                      opacity="0.45"
                      className="animate-ping"
                    />
                  )}
                </g>
              );
            })}
          </motion.g>
        </svg>

        {/* 6 Luxury Minimal Concern Badges (One-word, sleek, crisp, animated wave text) */}
        {PROBLEM_NODES.map((node, idx) => {
          const isActive = activeProblem === node.id;
          return (
            <button
              key={node.id}
              type="button"
              onClick={() => setActiveProblem(activeProblem === node.id ? null : node.id)}
              onMouseEnter={() => setActiveProblem(node.id)}
              onMouseLeave={() => setActiveProblem(null)}
              style={node.badgeStyle}
              className={`absolute z-30 inline-flex items-center gap-1.5 px-3 py-1 sm:px-4 sm:py-1.5 rounded-full transition-all duration-300 select-none shadow-[0_4px_14px_rgba(137,7,84,0.08)] hover:shadow-[0_6px_20px_rgba(137,7,84,0.18)] hover:scale-105 active:scale-95 whitespace-nowrap border ${
                isActive
                  ? "bg-gradient-to-r from-[#540434] via-[#890754] to-[#d92982] border-transparent shadow-[0_6px_22px_rgba(137,7,84,0.35)] scale-105 text-white"
                  : "bg-white/95 backdrop-blur-md border-pink-200/80 hover:border-[#890754]/40"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                  isActive
                    ? "bg-amber-300 animate-ping"
                    : "bg-gradient-to-tr from-[#890754] to-pink-400"
                }`}
              />
              <span
                className={`font-serif text-[11.5px] xs:text-[13px] sm:text-[14.5px] font-bold tracking-wide transition-all ${
                  isActive ? "text-white" : "luxury-wave-text"
                }`}
                style={!isActive ? { animationDelay: `${idx * 0.65}s` } : undefined}
              >
                {isAr ? node.nameAr : node.name}
              </span>
            </button>
          );
        })}

        {/* Central Circular Product Portal (Matching the Peach/Rose Glowing Hub in Reference Image) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center justify-center pointer-events-auto">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: false }}
            transition={{ duration: 0.8, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="group relative cursor-pointer"
            onClick={() => onQuickView(heroProduct)}
          >
            {/* Glowing Peach/Rose Aura Drop Shadow - Restrained */}
            <div className="absolute -inset-1.5 rounded-full bg-gradient-to-b from-[#ffedd5] via-[#fecdd3] to-[#890754]/20 blur-sm opacity-80 group-hover:opacity-100 transition-opacity duration-500" />

            {/* Main Center Disc Container */}
            <div className="relative w-[96px] h-[96px] sm:w-[124px] sm:h-[124px] md:w-[145px] md:h-[145px] rounded-full bg-gradient-to-b from-white via-[#fff7f5] to-[#fef2f2] border-2 sm:border-3 border-white shadow-[0_12px_28px_rgba(244,63,94,0.16),0_4px_10px_rgba(137,7,84,0.1)] group-hover:shadow-[0_16px_36px_rgba(137,7,84,0.25)] group-hover:scale-105 transition-all duration-500 overflow-hidden flex items-center justify-center">
              {/* Product Image Centered */}
              <div className="relative w-[86%] h-[86%] flex items-center justify-center">
                <Image
                  src={productImg}
                  alt={heroProduct.name}
                  fill
                  unoptimized
                  sizes="(max-width: 640px) 96px, 145px"
                  className="object-contain drop-shadow-sm group-hover:scale-110 transition-transform duration-500 ease-out"
                />
              </div>

              {/* Quick View Hover Indicator */}
              <div className="absolute inset-0 bg-[#890754]/40 backdrop-blur-[1.5px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full bg-white/95 text-[#890754] text-[9px] sm:text-[11px] font-bold shadow-md flex items-center gap-1 scale-90 group-hover:scale-100 transition-transform">
                  <Eye size={12} />
                  <span>{isAr ? "معاينة" : "Quick View"}</span>
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom Hero Promotion Purchase Deck */}
      <div className="mt-6 sm:mt-10 max-w-2xl mx-auto px-2">
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-white/95 backdrop-blur-xl border border-pink-200/70 p-3.5 sm:p-6 shadow-[0_12px_32px_rgba(137,7,84,0.08)] flex flex-col sm:flex-row items-center justify-between gap-3.5 sm:gap-6">
          {/* Subtle Ambient Shimmer Corner */}
          <div className="absolute -top-10 -right-10 w-28 h-28 bg-[#890754]/8 rounded-full blur-xl pointer-events-none" />

          {/* Product Meta Info */}
          <div className="flex-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
              <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-[#890754]">
                {brandName}
              </span>
              <span className="text-gray-300">•</span>
              <div className="flex items-center gap-1 text-[10px] sm:text-[11px] text-amber-500 font-bold">
                <Star size={11} className="fill-amber-400 text-amber-400" />
                <span>{heroProduct.averageRating || 4.9}</span>
                <span className="text-gray-400 font-normal">
                  ({heroProduct.ratingCount || 148})
                </span>
              </div>
            </div>

            <h3 className="font-serif font-bold text-sm sm:text-base md:text-lg text-gray-900 leading-snug line-clamp-1">
              {heroProduct.name}
            </h3>

            {/* Checkmark Features */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-3 gap-y-1 mt-1.5 text-[10px] sm:text-[11px] text-gray-600 font-medium">
              <span className="inline-flex items-center gap-1">
                <CheckCircle2 size={12} className="text-[#890754]" />
                {isAr ? "شامل ٦ خطوات علاجية" : "Targets 6 Concerns"}
              </span>
              <span className="inline-flex items-center gap-1">
                <ShieldCheck size={12} className="text-[#890754]" />
                {isAr ? "مختبر جلدياً" : "Dermatologist Tested"}
              </span>
            </div>
          </div>

          {/* Price & Action Buttons */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0 w-full sm:w-auto justify-between sm:justify-end">
            <div className="text-left">
              <div className="text-[9px] sm:text-[10px] text-gray-400 uppercase font-semibold">
                {isAr ? "سعر الباقة" : "Pack Price"}
              </div>
              <div className="flex items-baseline gap-1.5">
                <Price
                  amount={displayPrice}
                  countryPrices={heroProduct.countryPrices as CountryPrice[]}
                  className="text-base sm:text-xl md:text-2xl font-black text-[#890754] tracking-tight leading-none"
                />
                {originalPrice && (
                  <span className="text-[11px] sm:text-xs text-gray-400 line-through font-bold">
                    <Price amount={originalPrice} countryPrices={heroProduct.countryPrices as CountryPrice[]} />
                  </span>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleAddToCart}
                className={`p-2.5 sm:px-3 sm:py-2.5 rounded-xl border border-pink-200 text-[#890754] hover:bg-pink-50 transition-all active:scale-95 ${
                  justAdded ? "bg-emerald-50 border-emerald-300 text-emerald-700" : "bg-white"
                }`}
                title="Add to Cart"
                aria-label="Add to Cart"
              >
                {justAdded ? <CheckCircle2 size={16} className="text-emerald-600" /> : <ShoppingCart size={16} />}
              </button>

              <button
                onClick={handleOrderNow}
                className="px-3.5 sm:px-5 py-2.5 sm:py-3 rounded-xl font-bold text-xs sm:text-sm text-white shadow-md flex items-center justify-center gap-1.5 transition-all duration-300 active:scale-95 bg-gradient-to-r from-[#890754] to-[#c01874] hover:from-[#540434] hover:to-[#890754] shadow-pink-300/40 hover:shadow-lg"
              >
                <span>{isAr ? "طلب الباقة" : "Order Complete Pack"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
