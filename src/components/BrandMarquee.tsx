"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { OFFICIAL_BRANDS } from "@/lib/product-taxonomy";

interface Brand {
  id: string;
  name: string;
  image?: string | null;
}

// Interlocking Brand Photo Collage Layout:
// Mobile: 4 columns × 3 rows = 12 cells (100% mathematically packed, 0 gaps)
// Desktop: 6 columns × 2 rows = 12 cells (100% mathematically packed, 0 gaps)
const TILE_LAYOUT = [
  // 1. Hero 2x2 House Card
  { col: "col-span-2 row-span-2 md:col-span-2 md:row-span-2", delay: 0, isHero: true },
  // 2. Compact 1x1 Card
  { col: "col-span-1 row-span-1 md:col-span-1 md:row-span-1", delay: 1.2 },
  // 3. Compact 1x1 Card
  { col: "col-span-1 row-span-1 md:col-span-1 md:row-span-1", delay: 2.4 },
  // 4. Wide 2x1 Landscape Ribbon Card (Mobile: 1x1, Desktop: 2x1)
  { col: "col-span-1 row-span-1 md:col-span-2 md:row-span-1", delay: 0.6, isWideDesktop: true },
  // 5. Compact 1x1 Card
  { col: "col-span-1 row-span-1 md:col-span-1 md:row-span-1", delay: 1.8 },
  // 6. Compact 1x1 Card
  { col: "col-span-1 row-span-1 md:col-span-1 md:row-span-1", delay: 3.0 },
  // 7. Compact 1x1 Card
  { col: "col-span-1 row-span-1 md:col-span-1 md:row-span-1", delay: 1.5 },
  // 8. Wide 2x1 Landscape Card (Mobile: 2x1, Desktop: 1x1)
  { col: "col-span-2 row-span-1 md:col-span-1 md:row-span-1", delay: 2.1, isWideMobile: true },
];

function BrandCollageTile({
  brands,
  tileIndex,
  tileConfig,
}: {
  brands: Brand[];
  tileIndex: number;
  tileConfig: (typeof TILE_LAYOUT)[number];
}) {
  const [currentIdx, setCurrentIdx] = useState(tileIndex % brands.length);
  const [flipping, setFlipping] = useState(false);

  useEffect(() => {
    if (brands.length <= TILE_LAYOUT.length) return;

    const interval = setInterval(() => {
      setFlipping(true);
      setTimeout(() => {
        setCurrentIdx((prev) => (prev + TILE_LAYOUT.length) % brands.length);
        setFlipping(false);
      }, 400);
    }, 5500 + tileConfig.delay * 1000);

    return () => clearInterval(interval);
  }, [brands.length, tileConfig.delay]);

  const brand = brands[currentIdx];
  if (!brand) return null;

  return (
    <Link
      href={`/products?brand=${encodeURIComponent(brand.name)}`}
      aria-label={`Shop brand ${brand.name}`}
      className="group relative w-full h-full flex flex-col items-center justify-center select-none overflow-hidden rounded-xl sm:rounded-2xl bg-white hover:bg-gradient-to-b hover:from-white hover:to-pink-50/30 border border-pink-100 hover:border-[#890754]/40 shadow-[0_4px_16px_rgba(137,7,84,0.06),0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_28px_rgba(137,7,84,0.16)] transition-all duration-300 hover:-translate-y-0.5 p-2 sm:p-3.5"
    >
      {/* ── Image Area — Pure Image, Zero Text ── */}
      <div
        className="relative w-full h-full flex items-center justify-center transition-all duration-400 overflow-hidden"
        style={{
          transform: flipping ? "scale(0.95) rotateY(20deg)" : "scale(1) rotateY(0deg)",
          opacity: flipping ? 0.3 : 1,
          transition: "transform 0.4s ease-out, opacity 0.4s ease-out",
        }}
      >
        {brand.image ? (
          <div className="relative w-full h-full min-h-[44px] flex items-center justify-center">
            <Image
              src={brand.image}
              alt={brand.name}
              fill
              className="object-contain transition-transform duration-500 ease-out group-hover:scale-108 drop-shadow-xs"
              sizes="(max-width: 640px) 50vw, 25vw"
            />
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="font-serif italic font-black text-[#540434] group-hover:text-[#890754] transition-colors text-sm sm:text-base md:text-lg">
              {brand.name}
            </span>
          </div>
        )}
      </div>

      {/* Subtle Ambient Shimmer on Hover */}
      <div className="absolute inset-0 bg-gradient-to-tr from-pink-500/0 via-transparent to-[#890754]/0 group-hover:to-[#890754]/5 transition-all duration-300 pointer-events-none" />
    </Link>
  );
}

export function BrandMarquee() {
  const [brands, setBrands] = useState<Brand[]>(
    OFFICIAL_BRANDS.map((name, i) => ({ id: `brand-${i}`, name, image: null }))
  );

  useEffect(() => {
    async function fetchBrands() {
      try {
        const res = await fetch("/api/brands");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            const apiMap = new Map(data.map((b: any) => [b.name?.toLowerCase()?.trim(), b]));
            const merged = OFFICIAL_BRANDS.map((name, i) => {
              const fromApi = apiMap.get(name.toLowerCase().trim());
              return { id: fromApi?.id || `brand-${i}`, name, image: fromApi?.image || null };
            });
            setBrands(merged);
          }
        }
      } catch {}
    }
    fetchBrands();
  }, []);

  // Construct comprehensive traveling ticker string of official partner brands
  const travelingBrandString = useMemo(() => {
    const list = brands.filter((b) => b.name && b.name.toLowerCase() !== "generic");
    if (list.length === 0) return "✦ SHAFAN OFFICIAL HOUSES ✦ LUXURY DERMATOLOGY ✦ ";
    return list
      .map((b) => `✦ ${b.name.toUpperCase()} `)
      .join("") + "✦ ";
  }, [brands]);

  if (brands.length === 0) return null;

  return (
    <section className="relative w-full py-6 sm:py-8 px-2 sm:px-4 bg-transparent my-4 sm:my-6">
      {/* Embedded 60FPS Hardware-Accelerated Traveling Border Keyframes */}
      <style jsx global>{`
        @keyframes brand-section-x {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-50%, 0, 0); }
        }
        @keyframes brand-section-x-rev {
          0% { transform: translate3d(-50%, 0, 0); }
          100% { transform: translate3d(0, 0, 0); }
        }
        @keyframes brand-section-y {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(0, -50%, 0); }
        }
        @keyframes brand-section-y-rev {
          0% { transform: translate3d(0, -50%, 0); }
          100% { transform: translate3d(0, 0, 0); }
        }
        .brand-sec-x {
          animation: brand-section-x 85s linear infinite;
          will-change: transform;
        }
        .brand-sec-x-rev {
          animation: brand-section-x-rev 85s linear infinite;
          will-change: transform;
        }
        .brand-sec-y {
          animation: brand-section-y 85s linear infinite;
          will-change: transform;
        }
        .brand-sec-y-rev {
          animation: brand-section-y-rev 85s linear infinite;
          will-change: transform;
        }
        .brand-sec-container:hover .brand-sec-x,
        .brand-sec-container:hover .brand-sec-x-rev,
        .brand-sec-container:hover .brand-sec-y,
        .brand-sec-container:hover .brand-sec-y-rev {
          animation-play-state: paused;
        }
      `}</style>

      {/* Soft Ambient Illumination */}
      <div className="absolute inset-0 pointer-events-none -z-10 flex items-center justify-center">
        <div className="w-[850px] h-[400px] bg-gradient-to-r from-pink-500/5 via-[#890754]/5 to-amber-500/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-[1440px] mx-auto">
        {/* ── Soft Rose-Pearl / Blush Alabaster Luxury Container ── */}
        <div className="brand-sec-container relative w-full bg-gradient-to-br from-[#fdf7fa] via-[#faf0f6] to-[#f5e3ef] rounded-2xl sm:rounded-3xl border border-pink-200/80 shadow-[0_16px_48px_-8px_rgba(137,7,84,0.12),inset_0_1.5px_2px_rgba(255,255,255,0.95)] overflow-hidden">
          <div className="p-4 sm:p-7 md:p-8">
            {/* Header: Pure Heading ("Just the heading text") */}
            <div className="flex items-center justify-between gap-3 mb-4 sm:mb-6">
              <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-[#890754] tracking-tight">
                Shop by Brand
              </h2>
              <Link
                href="/brands"
                className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-[#890754] hover:text-[#540434] transition-colors border-b-2 border-[#890754]/30 hover:border-[#890754] pb-0.5 shrink-0"
              >
                <span>View All Brands</span>
                <ArrowRight size={13} />
              </Link>
            </div>

            {/* ── Content: The ONE Vertical Line + Clean Brand Cards Grid + The ONE Horizontal Line Near Bottom ── */}
            <div className="relative pl-5 sm:pl-6">
              {/* ── 1. The ONE Vertical Animated Border Line (Strictly constrained to Grid + Horizontal Line height) ── */}
              <div className="absolute left-0 top-0 bottom-0 w-[14px] sm:w-[16px] bg-white/95 backdrop-blur-md border border-[#890754]/25 rounded-md sm:rounded-lg overflow-hidden flex items-center justify-center [writing-mode:vertical-rl] select-none shadow-xs z-10 pointer-events-none">
                <div className="brand-sec-y inline-flex whitespace-nowrap text-[7px] sm:text-[8px] font-black uppercase tracking-[0.24em] text-[#890754]">
                  <span className="py-2 shrink-0">{travelingBrandString.repeat(2)}</span>
                  <span className="py-2 shrink-0">{travelingBrandString.repeat(2)}</span>
                </div>
              </div>

              {/* ── 2. Grid & Horizontal Line Container (Defines the true height) ── */}
              <div className="w-full flex flex-col">
                {/* Brand Photo Collage Grid (Clean cards, NO animation borders) */}
                <div className="grid grid-cols-4 md:grid-cols-6 auto-rows-[90px] sm:auto-rows-[115px] md:auto-rows-[140px] gap-2.5 sm:gap-3.5">
                  {TILE_LAYOUT.map((tileConfig, i) => {
                    const validBrands = brands.filter((b) => b.name?.toLowerCase() !== "generic" && b.image);
                    const list = validBrands.length > 0 ? validBrands : brands;
                    return (
                      <div key={i} className={`${tileConfig.col} w-full h-full`}>
                        <BrandCollageTile
                          brands={list}
                          tileIndex={i}
                          tileConfig={tileConfig}
                        />
                      </div>
                    );
                  })}
                </div>

                {/* ── 3. The ONE Horizontal Animated Border Line (Near Bottom) ── */}
                <div className="w-full h-[14px] sm:h-[16px] bg-white/95 backdrop-blur-md border border-[#890754]/25 rounded-md sm:rounded-lg overflow-hidden whitespace-nowrap flex items-center select-none shadow-xs mt-2.5 sm:mt-3.5">
                  <div className="brand-sec-x inline-flex items-center text-[7.5px] sm:text-[8.5px] font-black uppercase tracking-[0.24em] text-[#890754]">
                    <span className="px-2 shrink-0">{travelingBrandString.repeat(2)}</span>
                    <span className="px-2 shrink-0">{travelingBrandString.repeat(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
