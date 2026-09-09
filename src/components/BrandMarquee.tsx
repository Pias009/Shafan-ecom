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
      className="group relative w-full h-full overflow-hidden rounded-none bg-transparent transition-all duration-300 flex items-center justify-center p-0 select-none block"
      style={{ perspective: "800px" }}
    >
      {/* Editorial Tag on Hero */}
      {"isHero" in tileConfig && tileConfig.isHero && (
        <div className="absolute top-2.5 left-2.5 sm:top-3 sm:left-3 z-10 pointer-events-none">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-none bg-black/75 text-white text-[8px] sm:text-[9px] font-black uppercase tracking-wider shadow-sm">
            <Sparkles size={9} className="text-amber-400 fill-amber-400" />
            Official Partner
          </span>
        </div>
      )}

      {/* 3D Flip Container */}
      <div
        className="w-full h-full relative transition-all duration-400"
        style={{
          transform: flipping ? "rotateY(90deg)" : "rotateY(0deg)",
          opacity: flipping ? 0 : 1,
          transition: "transform 0.4s ease-in-out, opacity 0.4s ease-in-out",
        }}
      >
        {brand.image ? (
          <div className="relative w-full h-full">
            <Image
              src={brand.image}
              alt={brand.name}
              fill
              className="object-cover w-full h-full rounded-none group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 640px) 50vw, 25vw"
            />
            {/* Subtle Legibility Gradient Overlay on Image Bottom */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent opacity-80 group-hover:opacity-95 transition-opacity flex items-end p-2 sm:p-3">
              <span className="text-white text-[10px] sm:text-xs font-black uppercase tracking-wider line-clamp-1 drop-shadow-md">
                {brand.name}
              </span>
            </div>
          </div>
        ) : (
          <div className="w-full h-full bg-neutral-900 flex flex-col items-center justify-center p-2 text-center">
            <span className="font-serif italic font-black text-white group-hover:text-pink-300 transition-colors text-xs sm:text-sm md:text-base leading-tight">
              {brand.name}
            </span>
            <span className="text-[7.5px] sm:text-[8.5px] uppercase font-bold tracking-widest text-white/60 mt-0.5">
              Verified House
            </span>
          </div>
        )}
      </div>
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
    <section className="w-full py-6 sm:py-10 px-2 sm:px-4 bg-transparent my-4">
      <div className="max-w-[1440px] mx-auto">
        {/* Header */}
        <div className="flex items-end justify-between mb-4 sm:mb-6">
          <div>
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
        <div className="grid grid-cols-4 md:grid-cols-6 auto-rows-[90px] sm:auto-rows-[115px] md:auto-rows-[135px] gap-2 sm:gap-3">
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

        {/* Footer Hint */}
        <div className="flex items-center justify-center gap-1.5 mt-4 text-[10px] sm:text-[11px] font-semibold text-gray-400">
          <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-pulse" />
          <span>Interactive collage — cards flip to reveal all luxury GCC houses</span>
        </div>
      </div>
    </section>
  );
}
