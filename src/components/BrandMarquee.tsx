"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { OFFICIAL_BRANDS } from "@/lib/product-taxonomy";

interface Brand {
  id: string;
  name: string;
  image?: string | null;
}

// 8 tiles that mathematically pack 100% of the grid with zero blank slots
// Mobile: 4 columns × 3 rows = 12 slots (4 + 1 + 1 + 1 + 1 + 1 + 1 + 2 = 12)
// Desktop: 6 columns × 2 rows = 12 slots (4 + 1 + 1 + 2 + 1 + 1 + 1 + 1 = 12)
const TILE_LAYOUT = [
  { col: "col-span-2 row-span-2 md:col-span-2 md:row-span-2", delay: 0 },
  { col: "col-span-1 row-span-1 md:col-span-1 md:row-span-1", delay: 1.2 },
  { col: "col-span-1 row-span-1 md:col-span-1 md:row-span-1", delay: 2.4 },
  { col: "col-span-1 row-span-1 md:col-span-2 md:row-span-1", delay: 0.6 },
  { col: "col-span-1 row-span-1 md:col-span-1 md:row-span-1", delay: 1.8 },
  { col: "col-span-1 row-span-1 md:col-span-1 md:row-span-1", delay: 3.0 },
  { col: "col-span-1 row-span-1 md:col-span-1 md:row-span-1", delay: 1.5 },
  { col: "col-span-2 row-span-1 md:col-span-1 md:row-span-1", delay: 2.1 },
];

function BrandTile({ brands, tileIndex, delay }: { brands: Brand[]; tileIndex: number; delay: number }) {
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
    }, 5500 + delay * 1000);

    return () => clearInterval(interval);
  }, [brands.length, delay]);

  const brand = brands[currentIdx];
  if (!brand) return null;

  return (
    <Link
      href={`/products?brand=${encodeURIComponent(brand.name)}`}
      className="group relative w-full h-full overflow-hidden rounded-xl sm:rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-center p-2.5 sm:p-4"
      style={{ perspective: "600px" }}
    >
      <div
        className="w-full h-full flex items-center justify-center transition-all duration-400"
        style={{
          transform: flipping ? "rotateY(90deg)" : "rotateY(0deg)",
          opacity: flipping ? 0 : 1,
          transition: "transform 0.4s ease-in-out, opacity 0.4s ease-in-out",
        }}
      >
        {brand.image ? (
          <div className="relative w-full h-full min-h-[36px] flex items-center justify-center">
            <Image
              src={brand.image}
              alt={brand.name}
              fill
              className="object-contain p-2 group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 640px) 40vw, 20vw"
            />
          </div>
        ) : (
          <span className="font-serif italic font-bold text-[#890754]/80 group-hover:text-[#890754] transition-colors text-center leading-tight text-xs sm:text-sm md:text-base px-2">
            {brand.name}
          </span>
        )}
      </div>

      {/* Hover shimmer overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-pink-500/0 to-[#890754]/0 group-hover:from-pink-500/5 group-hover:to-[#890754]/5 transition-all duration-300 rounded-xl sm:rounded-2xl pointer-events-none" />
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
    <section className="w-full bg-transparent py-10 sm:py-14 px-4 sm:px-6">
      <div className="max-w-[1440px] mx-auto">
        {/* Header */}
        <div className="flex items-end justify-between mb-6 sm:mb-8">
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.22em] text-[#890754]/70 block mb-1">
              Featured Brands
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
              Shop by Brand
            </h2>
          </div>
          <Link
            href="/brands"
            className="text-[11px] font-black uppercase tracking-wider text-[#890754] hover:text-[#540434] transition-colors border-b border-[#890754]/30 hover:border-[#890754] pb-0.5"
          >
            All Brands →
          </Link>
        </div>

        {/* Gallery Grid — 100% covered, 0 blank slots */}
        <div className="grid grid-cols-4 md:grid-cols-6 auto-rows-[75px] sm:auto-rows-[95px] md:auto-rows-[115px] gap-2 sm:gap-3">
          {TILE_LAYOUT.map((tile, i) => (
            <div key={i} className={`${tile.col} w-full h-full`}>
              <BrandTile
                brands={brands}
                tileIndex={i}
                delay={tile.delay}
              />
            </div>
          ))}
        </div>

        {/* Bottom hint */}
        <p className="text-center text-[11px] text-gray-400 mt-4 font-medium">
          Tiles flip to reveal more brands
        </p>
      </div>
    </section>
  );
}
