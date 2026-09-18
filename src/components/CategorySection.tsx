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
  { id: "grad-0", start: "#540434", end: "#890754" }, // 0: Deep Plum -> Shafan Berry
  { id: "grad-1", start: "#890754", end: "#b8176e" }, // 1: Shafan Berry -> Vivid Orchid
  { id: "grad-2", start: "#b8176e", end: "#e11d48" }, // 2: Vivid Orchid -> Rose Carmine
  { id: "grad-3", start: "#e11d48", end: "#c01874" }, // 3: Rose Carmine -> Radiant Rose
  { id: "grad-4", start: "#c01874", end: "#890754" }, // 4: Radiant Rose -> Shafan Berry
  { id: "grad-5", start: "#890754", end: "#540434" }, // 5: Shafan Berry -> Deep Plum
];

function getCategoryTitle(name: string): string {
  if (!name) return "";
  const trimmed = name.trim();
  if (/^eye\s*care$/i.test(trimmed)) return "EYECARE";
  if (/^sun\s*care$/i.test(trimmed)) return "SUNCARE";
  if (/^skin\s*care$/i.test(trimmed)) return "SKINCARE";
  if (/^hair\s*care$/i.test(trimmed)) return "HAIRCARE";
  if (/^body\s*care$/i.test(trimmed)) return "BODYCARE";
  if (/^makeup$/i.test(trimmed)) return "MAKEUP";
  if (/^fragrance[s]?$/i.test(trimmed)) return "FRAGRANCES";
  return trimmed.toUpperCase();
}

function getCategoryFallbackImage(name: string, idx: number): string {
  const n = name.toLowerCase();
  if (n.includes("serum")) return "/images/categories/serums.jpg";
  if (n.includes("moistur") || n.includes("cream")) return "/images/categories/moisturizers.jpg";
  if (n.includes("clean") || n.includes("wash")) return "/images/categories/cleansers.jpg";
  if (n.includes("toner")) return "/images/categories/toners.jpg";
  if (n.includes("eye")) return "/images/categories/eyecare.jpg";
  if (n.includes("sun") || n.includes("spf")) return "/images/categories/suncare.jpg";
  if (n.includes("makeup") || n.includes("lipstick") || n.includes("cosmetic")) {
    return "https://res.cloudinary.com/dvdyut9xh/image/upload/v1789661808/ecommerce/products/r8xcvbpksnxxootik6j4_d5d541.jpg";
  }
  if (n.includes("fragran") || n.includes("perfume") || n.includes("scent")) {
    return "https://res.cloudinary.com/dvdyut9xh/image/upload/v1789308549/ecommerce/products/ovcphgu3uyhi95tzq27u_grkjov_bdu49j.jpg";
  }
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
  const [hasError, setHasError] = useState(false);
  const displayTitle = getCategoryTitle(category.name);
  const imgSrc = !hasError && category.image ? category.image : fallback;

  return (
    <div
      onClick={onClick}
      className="absolute inset-[2px] rounded-full overflow-hidden border-2 border-white shadow-[0_8px_24px_rgba(0,0,0,0.1),0_2px_6px_rgba(0,0,0,0.04)] group-hover:shadow-[0_16px_32px_rgba(137,7,84,0.22)] group-hover:scale-[1.02] transition-all duration-300 ease-out cursor-pointer z-10 select-none bg-white"
    >
      {/* Full-Bleed Category Image Covering the Full Circle */}
      <Image
        src={imgSrc}
        alt={displayTitle}
        fill
        unoptimized
        onError={() => setHasError(true)}
        className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500 ease-out"
        sizes="(max-width: 640px) 35vw, 25vw"
      />

      {/* Elegant Frosted Porcelain Underlay with Signature Brand Color Text */}
      <div className="absolute inset-x-0 bottom-0 pt-6 pb-2.5 px-1 bg-gradient-to-t from-white via-white/94 to-transparent flex items-end justify-center pointer-events-none">
        <span className="font-extrabold text-[10px] sm:text-[11px] md:text-[11.5px] lg:text-xs tracking-tight sm:tracking-normal text-[#890754] group-hover:text-[#540434] uppercase text-center line-clamp-1 transition-colors drop-shadow-2xs px-0.5">
          {displayTitle}
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

  const totalNodes = itemsToRender.length || 6;
  const arcLength = 314.16; // π * 100 for semicircle with R=100
  const beamLength = 75;
  const totalLength = totalNodes * arcLength;
  const blankLength = Math.round(totalLength - beamLength);
  const totalDuration = 12; // 12 seconds total cycle time across all nodes

  return (
    <section className="mx-auto max-w-[1440px] px-2 sm:px-4 pt-4 sm:pt-6 pb-6 sm:pb-8 select-none overflow-hidden">
      <style>{`
        @keyframes catSingleFlow {
          0% {
            stroke-dashoffset: ${beamLength};
          }
          100% {
            stroke-dashoffset: -${blankLength};
          }
        }
        @keyframes catGlowPulse {
          0%, 100% {
            opacity: 0.85;
            filter: drop-shadow(0 0 2px rgba(137, 7, 84, 0.25));
          }
          50% {
            opacity: 1;
            filter: drop-shadow(0 0 5px rgba(225, 29, 72, 0.5));
          }
        }
        .cat-animated-beam {
          stroke-dasharray: ${beamLength} ${blankLength};
          animation: catSingleFlow ${totalDuration}s linear infinite;
        }
        .cat-glow-line {
          animation: catGlowPulse 3.5s ease-in-out infinite;
        }
      `}</style>
      {/* Header: Unified Luxury Editorial Architecture */}
      <div className="text-center mb-6 sm:mb-8">
        <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-[#890754] tracking-tight">
          {isAr ? "الفئات الرئيسية" : "Shop By Category"}
        </h2>
      </div>

      {/* Main Flowing Ribbon Chain Container */}
      <div className="relative w-full">

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
              const delaySeconds = -((totalNodes - (idx % totalNodes)) % totalNodes) * (totalDuration / totalNodes);

              return (
                <motion.div
                  key={category.id || idx}
                  initial={{ opacity: 0, y: isEven ? -10 : 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-10px" }}
                  transition={{ duration: 0.45, delay: idx * 0.05, ease: [0.16, 1, 0.3, 1] }}
                  className="group relative shrink-0 w-[136px] h-[136px] sm:w-[152px] sm:h-[152px] md:w-[168px] md:h-[168px] lg:w-[180px] lg:h-[180px] xl:w-[190px] xl:h-[190px]"
                >
                  {/* SVG Infographic Interconnected Track (viewBox 200x200, R=100, center 100,100) */}
                  <svg
                    viewBox="0 0 200 200"
                    className="absolute inset-0 w-full h-full overflow-visible pointer-events-none z-20"
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

                    {/* Even Nodes: Top Arc Subtle Dashed Guide, Bottom Arc Colored Ribbon */}
                    {isEven ? (
                      <>
                        {/* Subtle Recessed Hairline Track on Top Half */}
                        <path
                          d="M 0,100 A 100,100 0 0,1 200,100"
                          fill="none"
                          stroke="#e2e8f0"
                          strokeWidth="1.5"
                          strokeDasharray="3 3"
                          strokeLinecap="round"
                          opacity="0.8"
                        />

                        {/* Slim Elegant Gradient Ribbon on Bottom Half */}
                        <path
                          d="M 0,100 A 100,100 0 0,0 200,100"
                          fill="none"
                          stroke={`url(#${gradId})`}
                          strokeWidth="4"
                          strokeLinecap="round"
                          filter={`url(#glow-${idx})`}
                          className="cat-glow-line transition-all duration-300 group-hover:stroke-[5px]"
                        />

                        {/* Animated Flowing Light Beam along the Slim Border */}
                        <path
                          d="M 0,100 A 100,100 0 0,0 200,100"
                          fill="none"
                          stroke="#ffffff"
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          className="cat-animated-beam opacity-95 group-hover:opacity-100"
                          style={{
                            animationDelay: `${delaySeconds}s`,
                            filter: "drop-shadow(0 0 3px rgba(255, 255, 255, 0.95)) drop-shadow(0 0 6px rgba(225, 29, 72, 0.6))",
                          }}
                        />
                      </>
                    ) : (
                      /* Odd Nodes: Bottom Arc Subtle Dashed Guide, Top Arc Colored Ribbon */
                      <>
                        {/* Subtle Recessed Hairline Track on Bottom Half */}
                        <path
                          d="M 0,100 A 100,100 0 0,0 200,100"
                          fill="none"
                          stroke="#e2e8f0"
                          strokeWidth="1.5"
                          strokeDasharray="3 3"
                          strokeLinecap="round"
                          opacity="0.8"
                        />

                        {/* Slim Elegant Gradient Ribbon on Top Half */}
                        <path
                          d="M 0,100 A 100,100 0 0,1 200,100"
                          fill="none"
                          stroke={`url(#${gradId})`}
                          strokeWidth="4"
                          strokeLinecap="round"
                          filter={`url(#glow-${idx})`}
                          className="cat-glow-line transition-all duration-300 group-hover:stroke-[5px]"
                        />

                        {/* Animated Flowing Light Beam along the Slim Border */}
                        <path
                          d="M 0,100 A 100,100 0 0,1 200,100"
                          fill="none"
                          stroke="#ffffff"
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          className="cat-animated-beam opacity-95 group-hover:opacity-100"
                          style={{
                            animationDelay: `${delaySeconds}s`,
                            filter: "drop-shadow(0 0 3px rgba(255, 255, 255, 0.95)) drop-shadow(0 0 6px rgba(225, 29, 72, 0.6))",
                          }}
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
