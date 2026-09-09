"use client";

import { useState, useEffect, useRef } from "react";
import { useLanguageStore } from "@/lib/language-store";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Droplets,
  Sparkles,
  Waves,
  Flower2,
  Eye,
  Sun,
  Heart,
  FlaskConical,
  Leaf,
  ChevronLeft,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";

interface CategoryItem {
  id: string;
  name: string;
  image?: string | null;
  link?: string | null;
  slug?: string | null;
}

const defaultCategories: CategoryItem[] = [
  { id: "c1", name: "SERUMS", link: "/products?category=Skin%20Care" },
  { id: "c2", name: "MOISTURIZERS", link: "/products?category=Skin%20Care" },
  { id: "c3", name: "CLEANSERS", link: "/products?category=Skin%20Care" },
  { id: "c4", name: "TONERS", link: "/products?category=Hair%20Care" },
  { id: "c5", name: "EYECARE", link: "/products?category=Body%20Care" },
  { id: "c6", name: "SUNCARE", link: "/products?category=Fragrances" },
];

const NODE_GRADIENTS = [
  { id: "grad-0", start: "#F59E0B", end: "#F97316" }, // 0: Amber -> Tangerine
  { id: "grad-1", start: "#F97316", end: "#E11D48" }, // 1: Tangerine -> Coral Red
  { id: "grad-2", start: "#E11D48", end: "#BE123C" }, // 2: Coral Red -> Crimson
  { id: "grad-3", start: "#BE123C", end: "#890754" }, // 3: Crimson -> Shafan Berry
  { id: "grad-4", start: "#890754", end: "#6B0542" }, // 4: Shafan Berry -> Deep Wine
  { id: "grad-5", start: "#6B0542", end: "#F59E0B" }, // 5: Deep Wine -> Sunset Amber
];

// Strictly format category name to exactly one word uppercase
function getOneWordTitle(name: string): string {
  if (!name) return "";
  const trimmed = name.trim();
  if (/^eye\s*care$/i.test(trimmed)) return "EYECARE";
  if (/^sun\s*care$/i.test(trimmed)) return "SUNCARE";
  if (/^skin\s*care$/i.test(trimmed)) return "SKINCARE";
  if (/^hair\s*care$/i.test(trimmed)) return "HAIRCARE";
  if (/^body\s*care$/i.test(trimmed)) return "BODYCARE";
  return trimmed.split(/\s+/)[0].toUpperCase();
}

// Map category to a minimalist beauty line icon
function getCategoryIcon(name: string): LucideIcon {
  const n = name.toLowerCase();
  if (n.includes("serum")) return Droplets;
  if (n.includes("moistur") || n.includes("cream")) return Sparkles;
  if (n.includes("clean") || n.includes("wash")) return Waves;
  if (n.includes("toner")) return Flower2;
  if (n.includes("eye")) return Eye;
  if (n.includes("sun") || n.includes("spf")) return Sun;
  if (n.includes("hair")) return Leaf;
  if (n.includes("body")) return Heart;
  return FlaskConical;
}

export function CategorySection({
  onPick,
}: {
  onPick: (category: string) => void;
}) {
  const { currentLanguage } = useLanguageStore();
  const isAr = currentLanguage.code === "ar";
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);

  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await fetch("/api/categories");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setCategories(data);
          } else {
            setCategories(defaultCategories);
          }
        } else {
          setCategories(defaultCategories);
        }
      } catch (err) {
        console.error("Failed to load homepage categories:", err);
        setCategories(defaultCategories);
      }
    }
    loadCategories();
  }, []);

  const itemsToRender = categories.length > 0 ? categories : defaultCategories;

  const handleCategoryClick = (cat: CategoryItem) => {
    if (cat.link) {
      router.push(cat.link);
    } else {
      onPick(cat.name);
    }
  };

  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  const handleScroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = 240;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  return (
    <section className="mx-auto max-w-[1536px] px-3 sm:px-6 pt-10 sm:pt-14 pb-12 sm:pb-16 select-none overflow-hidden">
      {/* Header: Minimalist Architectural Infographic Title */}
      <div className="text-center mb-10 sm:mb-14">
        <div className="inline-flex items-center justify-center gap-3 text-xs sm:text-sm font-black uppercase tracking-[0.25em] text-gray-900">
          <span className="h-px w-8 sm:w-12 bg-gradient-to-r from-transparent to-[#890754]/40" />
          <span className="text-[#890754] font-bold">
            {isAr ? "تسوق حسب الفئة" : "SHOP BY CATEGORY"}
          </span>
          <span className="h-px w-8 sm:w-12 bg-gradient-to-l from-transparent to-[#890754]/40" />
        </div>
        <p className="text-[11px] sm:text-xs text-gray-400 font-medium tracking-wider uppercase mt-1">
          {isAr ? "المجموعات الأساسية" : "CURATED ESSENTIALS"}
        </p>
      </div>

      {/* Main Flowing Ribbon Chain Container */}
      <div className="relative w-full">
        {/* Navigation Chevrons for Mobile/Tablet Overflow */}
        {canScrollLeft && (
          <button
            onClick={() => handleScroll("left")}
            aria-label="Scroll Left"
            className="absolute left-1 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/95 backdrop-blur-md shadow-lg border border-gray-200/80 flex items-center justify-center text-gray-700 hover:text-[#890754] hover:scale-110 transition-all xl:hidden"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        {canScrollRight && (
          <button
            onClick={() => handleScroll("right")}
            aria-label="Scroll Right"
            className="absolute right-1 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/95 backdrop-blur-md shadow-lg border border-gray-200/80 flex items-center justify-center text-gray-700 hover:text-[#890754] hover:scale-110 transition-all xl:hidden"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}

        {/* Scrollable Track that Centers on Desktop */}
        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="w-full overflow-x-auto scrollbar-none py-6 px-2 flex items-center justify-start xl:justify-center scroll-smooth"
        >
          <div className="flex items-center min-w-max py-2">
            {itemsToRender.map((category, idx) => {
              const isEven = idx % 2 === 0;
              const grad = NODE_GRADIENTS[idx % NODE_GRADIENTS.length];
              const oneWordTitle = getOneWordTitle(category.name);
              const Icon = getCategoryIcon(category.name);
              const gradId = `cat-ribbon-grad-${idx}`;

              return (
                <motion.div
                  key={category.id || idx}
                  initial={{ opacity: 0, y: isEven ? -16 : 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-20px" }}
                  transition={{ duration: 0.5, delay: idx * 0.07, ease: [0.16, 1, 0.3, 1] }}
                  className="group relative shrink-0 w-[170px] h-[170px] sm:w-[190px] sm:h-[190px] md:w-[210px] md:h-[210px] lg:w-[220px] lg:h-[220px] -ml-[21px] sm:-ml-[24px] md:-ml-[26px] lg:-ml-[28px] first:ml-0"
                >
                  {/* SVG Infographic Interconnected Track (viewBox 220x220, R=96, center 110,110) */}
                  <svg
                    viewBox="0 0 220 220"
                    className="w-full h-full overflow-visible drop-shadow-sm pointer-events-none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <defs>
                      <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor={grad.start} />
                        <stop offset="100%" stopColor={grad.end} />
                      </linearGradient>

                      {/* Soft Glow Filter on Ribbon */}
                      <filter id={`glow-${idx}`} x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor={grad.start} floodOpacity="0.25" />
                      </filter>
                    </defs>

                    {/* Even Nodes: Top Arc Colored Ribbon, Bottom Arc Grey Track */}
                    {isEven ? (
                      <>
                        {/* Subtle Recessed Grey Track on Bottom Half */}
                        <path
                          d="M 14,110 A 96,96 0 0,1 206,110"
                          fill="none"
                          stroke="#e8eaed"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                        />

                        {/* Flowing Gradient Ribbon on Top Half */}
                        <path
                          d="M 14,110 A 96,96 0 0,0 206,110"
                          fill="none"
                          stroke={`url(#${gradId})`}
                          strokeWidth="15"
                          strokeLinecap="butt"
                          filter={`url(#glow-${idx})`}
                          className="transition-all duration-300 group-hover:brightness-110"
                        />
                      </>
                    ) : (
                      /* Odd Nodes: Top Arc Grey Track, Bottom Arc Colored Ribbon */
                      <>
                        {/* Subtle Recessed Grey Track on Top Half */}
                        <path
                          d="M 14,110 A 96,96 0 0,0 206,110"
                          fill="none"
                          stroke="#e8eaed"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                        />

                        {/* Flowing Gradient Ribbon on Bottom Half */}
                        <path
                          d="M 14,110 A 96,96 0 0,1 206,110"
                          fill="none"
                          stroke={`url(#${gradId})`}
                          strokeWidth="15"
                          strokeLinecap="butt"
                          filter={`url(#glow-${idx})`}
                          className="transition-all duration-300 group-hover:brightness-110"
                        />
                      </>
                    )}
                  </svg>

                  {/* Pristine Elevated White Disc (One Word Text Only + Icon) */}
                  <div
                    onClick={() => handleCategoryClick(category)}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[116px] h-[116px] sm:w-[130px] sm:h-[130px] md:w-[142px] md:h-[142px] lg:w-[150px] lg:h-[150px] rounded-full bg-white border border-gray-100/90 shadow-[0_12px_28px_rgba(0,0,0,0.08),0_4px_10px_rgba(0,0,0,0.03)] group-hover:shadow-[0_18px_36px_rgba(137,7,84,0.18),0_6px_14px_rgba(0,0,0,0.06)] group-hover:scale-105 group-hover:border-[#890754]/30 transition-all duration-300 ease-out flex flex-col items-center justify-center p-3 text-center cursor-pointer z-10 select-none"
                  >
                    {/* Minimalist Line Icon */}
                    <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full bg-gray-50/90 group-hover:bg-[#890754]/10 flex items-center justify-center transition-colors duration-300 mb-1 sm:mb-1.5">
                      <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700 group-hover:text-[#890754] transition-colors duration-300 stroke-[1.8]" />
                    </div>

                    {/* One Word Text Only (No subtitle, no paragraphs) */}
                    <span className="font-extrabold text-[11px] sm:text-xs md:text-[13px] tracking-wider text-gray-900 group-hover:text-[#890754] uppercase transition-colors duration-300 max-w-[92%] truncate">
                      {oneWordTitle}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
