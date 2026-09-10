"use client";

import { useState, useEffect, useRef } from "react";
import { useLanguageStore } from "@/lib/language-store";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CategoryItem {
  id: string;
  name: string;
  image?: string | null;
  link?: string | null;
  slug?: string | null;
}

const defaultCategories: CategoryItem[] = [
  { id: "c1", name: "SERUMS", link: "/products?category=Skin%20Care", image: "/images/categories/serums.jpg" },
  { id: "c2", name: "MOISTURIZERS", link: "/products?category=Skin%20Care", image: "/images/categories/moisturizers.jpg" },
  { id: "c3", name: "CLEANSERS", link: "/products?category=Skin%20Care", image: "/images/categories/cleansers.jpg" },
  { id: "c4", name: "TONERS", link: "/products?category=Hair%20Care", image: "/images/categories/toners.jpg" },
  { id: "c5", name: "EYECARE", link: "/products?category=Body%20Care", image: "/images/categories/eyecare.jpg" },
  { id: "c6", name: "SUNCARE", link: "/products?category=Fragrances", image: "/images/categories/suncare.jpg" },
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

function getCategoryFallbackImage(name: string, idx: number): string {
  const n = name.toLowerCase();
  if (n.includes("serum")) return "/images/categories/serums.jpg";
  if (n.includes("moistur") || n.includes("cream")) return "/images/categories/moisturizers.jpg";
  if (n.includes("clean") || n.includes("wash")) return "/images/categories/cleansers.jpg";
  if (n.includes("toner")) return "/images/categories/toners.jpg";
  if (n.includes("eye")) return "/images/categories/eyecare.jpg";
  if (n.includes("sun") || n.includes("spf")) return "/images/categories/suncare.jpg";
  return defaultCategories[idx % defaultCategories.length]?.image || "/images/categories/serums.jpg";
}

function CategoryCircleCard({
  category,
  idx,
  onClick,
}: {
  category: CategoryItem;
  idx: number;
  onClick: () => void;
}) {
  const fallback = getCategoryFallbackImage(category.name, idx);
  const [imgSrc, setImgSrc] = useState(category.image || fallback);
  const oneWordTitle = getOneWordTitle(category.name);

  useEffect(() => {
    setImgSrc(category.image || fallback);
  }, [category.image, fallback]);

  return (
    <div
      onClick={onClick}
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[88px] h-[88px] sm:w-[100px] sm:h-[100px] md:w-[112px] md:h-[112px] lg:w-[122px] lg:h-[122px] rounded-full overflow-hidden border-2 border-white shadow-[0_8px_20px_rgba(0,0,0,0.1),0_2px_6px_rgba(0,0,0,0.04)] group-hover:shadow-[0_16px_32px_rgba(137,7,84,0.22)] group-hover:scale-105 group-hover:border-pink-200 transition-all duration-300 ease-out cursor-pointer z-10 select-none"
    >
      {/* Full-Bleed Category Image Covering the Full Circle */}
      <Image
        src={imgSrc}
        alt={oneWordTitle}
        fill
        unoptimized
        onError={() => setImgSrc(fallback)}
        className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500 ease-out"
        sizes="(max-width: 640px) 25vw, 15vw"
      />

      {/* Subtle Legibility Gradient Vignette with One-Word Text */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent flex items-end justify-center pb-2 sm:pb-2.5 px-1.5 transition-opacity">
        <span className="font-black text-[9.5px] sm:text-[10.5px] md:text-[11.5px] lg:text-xs tracking-wider text-white uppercase drop-shadow-md text-center line-clamp-1">
          {oneWordTitle}
        </span>
      </div>
    </div>
  );
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
    const amount = 200;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  return (
    <section className="mx-auto max-w-[1440px] px-2 sm:px-4 pt-4 sm:pt-6 pb-6 sm:pb-8 select-none overflow-hidden">
      <style>{`
        @keyframes catLineDash {
          0% {
            stroke-dashoffset: 300;
          }
          100% {
            stroke-dashoffset: 0;
          }
        }
        @keyframes catGlowPulse {
          0%, 100% {
            opacity: 0.85;
            filter: drop-shadow(0 0 2px rgba(137, 7, 84, 0.3));
          }
          50% {
            opacity: 1;
            filter: drop-shadow(0 0 6px rgba(225, 29, 72, 0.75));
          }
        }
        .cat-animated-beam {
          stroke-dasharray: 45 255;
          animation: catLineDash 3s linear infinite;
        }
        .cat-glow-line {
          animation: catGlowPulse 2.6s ease-in-out infinite;
        }
      `}</style>
      {/* Header: Minimalist Architectural Infographic Title */}
      <div className="text-center mb-4 sm:mb-6">
        <div className="inline-flex items-center justify-center gap-2 sm:gap-3 text-[11px] sm:text-xs md:text-sm font-black uppercase tracking-[0.2em] text-gray-900">
          <span className="h-px w-6 sm:w-10 bg-gradient-to-r from-transparent to-[#890754]/40" />
          <span className="text-[#890754] font-bold">
            {isAr ? "تسوق حسب الفئة" : "SHOP BY CATEGORY"}
          </span>
          <span className="h-px w-6 sm:w-10 bg-gradient-to-l from-transparent to-[#890754]/40" />
        </div>
      </div>

      {/* Main Flowing Ribbon Chain Container */}
      <div className="relative w-full">
        {/* Navigation Chevrons for Mobile/Tablet Overflow */}
        {canScrollLeft && (
          <button
            onClick={() => handleScroll("left")}
            aria-label="Scroll Left"
            className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/95 backdrop-blur-md shadow-md border border-gray-200/80 flex items-center justify-center text-gray-700 hover:text-[#890754] hover:scale-110 transition-all lg:hidden"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
        {canScrollRight && (
          <button
            onClick={() => handleScroll("right")}
            aria-label="Scroll Right"
            className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/95 backdrop-blur-md shadow-md border border-gray-200/80 flex items-center justify-center text-gray-700 hover:text-[#890754] hover:scale-110 transition-all lg:hidden"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}

        {/* Scrollable Track that Centers on Desktop */}
        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="w-full overflow-x-auto scrollbar-none py-3 px-1 flex items-center justify-start lg:justify-center scroll-smooth"
        >
          <div className="flex items-center min-w-max py-1">
            {itemsToRender.map((category, idx) => {
              const isEven = idx % 2 === 0;
              const grad = NODE_GRADIENTS[idx % NODE_GRADIENTS.length];
              const gradId = `cat-ribbon-grad-${idx}`;

              return (
                <motion.div
                  key={category.id || idx}
                  initial={{ opacity: 0, y: isEven ? -12 : 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-10px" }}
                  transition={{ duration: 0.45, delay: idx * 0.05, ease: [0.16, 1, 0.3, 1] }}
                  className="group relative shrink-0 w-[124px] h-[124px] sm:w-[140px] sm:h-[140px] md:w-[155px] md:h-[155px] lg:w-[165px] lg:h-[165px] -ml-[16px] sm:-ml-[18px] md:-ml-[20px] lg:-ml-[21px] first:ml-0"
                >
                  {/* SVG Infographic Interconnected Track (viewBox 220x220, R=96, center 110,110) */}
                  <svg
                    viewBox="0 0 220 220"
                    className="w-full h-full overflow-visible drop-shadow-xs pointer-events-none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <defs>
                      <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor={grad.start} />
                        <stop offset="100%" stopColor={grad.end} />
                      </linearGradient>

                      {/* Soft Ambient Glow Filter on Ribbon */}
                      <filter id={`glow-${idx}`} x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="1" stdDeviation="2.5" floodColor={grad.start} floodOpacity="0.35" />
                      </filter>
                    </defs>

                    {/* Even Nodes: Top Arc Colored Ribbon, Bottom Arc Grey Track */}
                    {isEven ? (
                      <>
                        {/* Subtle Recessed Hairline Track on Bottom Half */}
                        <path
                          d="M 14,110 A 96,96 0 0,1 206,110"
                          fill="none"
                          stroke="#e2e8f0"
                          strokeWidth="1.5"
                          strokeDasharray="3 3"
                          strokeLinecap="round"
                          opacity="0.8"
                        />

                        {/* Slim Elegant Gradient Ribbon on Top Half */}
                        <path
                          d="M 14,110 A 96,96 0 0,0 206,110"
                          fill="none"
                          stroke={`url(#${gradId})`}
                          strokeWidth="4"
                          strokeLinecap="round"
                          filter={`url(#glow-${idx})`}
                          className="cat-glow-line transition-all duration-300 group-hover:stroke-[5px]"
                        />

                        {/* Animated Flowing Light Beam along the Slim Border */}
                        <path
                          d="M 14,110 A 96,96 0 0,0 206,110"
                          fill="none"
                          stroke="#ffffff"
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          className="cat-animated-beam opacity-90 group-hover:opacity-100"
                        />
                      </>
                    ) : (
                      /* Odd Nodes: Top Arc Grey Track, Bottom Arc Colored Ribbon */
                      <>
                        {/* Subtle Recessed Hairline Track on Top Half */}
                        <path
                          d="M 14,110 A 96,96 0 0,0 206,110"
                          fill="none"
                          stroke="#e2e8f0"
                          strokeWidth="1.5"
                          strokeDasharray="3 3"
                          strokeLinecap="round"
                          opacity="0.8"
                        />

                        {/* Slim Elegant Gradient Ribbon on Bottom Half */}
                        <path
                          d="M 14,110 A 96,96 0 0,1 206,110"
                          fill="none"
                          stroke={`url(#${gradId})`}
                          strokeWidth="4"
                          strokeLinecap="round"
                          filter={`url(#glow-${idx})`}
                          className="cat-glow-line transition-all duration-300 group-hover:stroke-[5px]"
                        />

                        {/* Animated Flowing Light Beam along the Slim Border */}
                        <path
                          d="M 14,110 A 96,96 0 0,1 206,110"
                          fill="none"
                          stroke="#ffffff"
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          className="cat-animated-beam opacity-90 group-hover:opacity-100"
                        />
                      </>
                    )}
                  </svg>

                  {/* Pristine Elevated White Disc (One Word Text Only + Big Prominent Category Image) */}
                  <CategoryCircleCard
                    category={category}
                    idx={idx}
                    onClick={() => handleCategoryClick(category)}
                  />
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
