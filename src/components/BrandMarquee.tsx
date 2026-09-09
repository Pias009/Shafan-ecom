"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Sparkles } from "lucide-react";
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
  { col: "col-span-2 row-span-2 md:col-span-2 md:row-span-2", delay: 0, isHero: true, tag: "Top House" },
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
      className="group relative w-full h-full overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-white via-[#fcf6fa] to-[#f7e3f0] hover:from-white hover:via-[#faecf5] hover:to-[#f3d3ea] border border-pink-100/90 hover:border-[#890754]/40 shadow-[0_4px_16px_rgba(20,5,15,0.05)] hover:shadow-[0_12px_28px_rgba(137,7,84,0.12)] transition-all duration-300 flex items-center justify-center p-3 sm:p-4 select-none"
      style={{ perspective: "800px" }}
    >
      {/* Editorial Tag on Hero */}
      {"isHero" in tileConfig && tileConfig.isHero && (
        <div className="absolute top-2.5 left-2.5 sm:top-3 sm:left-3 z-10 pointer-events-none">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/95 text-[#890754] text-[8px] sm:text-[9px] font-black uppercase tracking-wider border border-pink-200/60 shadow-xs">
            <Sparkles size={9} className="text-[#890754] fill-[#890754]" />
            Official Partner
          </span>
        </div>
      )}

      {/* 3D Flip Container */}
      <div
        className="w-full h-full flex flex-col items-center justify-center transition-all duration-400"
        style={{
          transform: flipping ? "rotateY(90deg)" : "rotateY(0deg)",
          opacity: flipping ? 0 : 1,
          transition: "transform 0.4s ease-in-out, opacity 0.4s ease-in-out",
        }}
      >
        {brand.image ? (
          <div className="relative w-full h-full min-h-[44px] flex items-center justify-center p-1 sm:p-2">
            <Image
              src={brand.image}
              alt={brand.name}
              fill
              className="object-contain group-hover:scale-105 transition-transform duration-300 drop-shadow-xs"
              sizes="(max-width: 640px) 50vw, 25vw"
            />
          </div>
        ) : (
          <div className="text-center px-2 flex flex-col items-center justify-center gap-1">
            <span className="font-serif italic font-black text-[#890754] group-hover:text-[#6a0440] transition-colors text-xs sm:text-sm md:text-base leading-tight">
              {brand.name}
            </span>
            <span className="text-[7.5px] sm:text-[8.5px] uppercase font-bold tracking-widest text-[#890754]/60">
              Verified House
            </span>
          </div>
        )}
      </div>

      {/* Ambient Glass Highlight Glare */}
      <div className="absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-br from-[#890754]/0 to-[#890754]/0 group-hover:from-pink-500/5 group-hover:to-[#890754]/5 transition-all duration-300 pointer-events-none rounded-2xl sm:rounded-3xl" />
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

  if (brands.length === 0) return null;

  return (
    <section className="w-full py-8 sm:py-12 px-4 sm:px-6 bg-white rounded-3xl border border-pink-100/80 shadow-xs my-6">
      <div className="max-w-[1440px] mx-auto">
        {/* Header */}
        <div className="flex items-end justify-between mb-5 sm:mb-7">
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.22em] text-[#890754] block mb-1">
              ✨ Official Curation
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
              Shop by Brand
            </h2>
          </div>
          <Link
            href="/brands"
            className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-[#890754] hover:text-[#540434] transition-colors border-b border-[#890754]/30 hover:border-[#890754] pb-0.5"
          >
            All Brands <ArrowRight size={12} />
          </Link>
        </div>

        {/* Brand Photo Collage Grid — Different sizes, 100% covered, 0 blank slots */}
        <div className="grid grid-cols-4 md:grid-cols-6 auto-rows-[90px] sm:auto-rows-[115px] md:auto-rows-[135px] gap-2.5 sm:gap-3.5">
          {TILE_LAYOUT.map((tileConfig, i) => (
            <div key={i} className={`${tileConfig.col} w-full h-full`}>
              <BrandCollageTile
                brands={brands}
                tileIndex={i}
                tileConfig={tileConfig}
              />
            </div>
          ))}
        </div>

        {/* Footer Hint */}
        <div className="flex items-center justify-center gap-1.5 mt-4 text-[10px] sm:text-[11px] font-semibold text-gray-400">
          <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-pulse" />
          <span>Interactive collage — cards flip to reveal all luxury GCC houses</span>
        </div>
      </div>
    </section>
  );
}
