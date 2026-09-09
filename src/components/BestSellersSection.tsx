"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Trophy, Flame } from "lucide-react";
import { Price } from "./Price";
import { CountryPrice } from "./ProductCard";

interface BestSellersSectionProps {
  products: any[];
  onQuickView: (p: any) => void;
  addToCart: (p: any) => void;
  orderNow: (p: any) => void;
}

// Interlocking Photo Collage Layout with 4 different card sizes:
// Mobile: 4 columns × 3 rows = 12 cells (100% mathematically packed, 0 gaps)
// Desktop: 6 columns × 2 rows = 12 cells (100% mathematically packed, 0 gaps)
const TILE_LAYOUT = [
  // 1. Hero 2x2 Card
  {
    col: "col-span-2 row-span-2 md:col-span-2 md:row-span-2",
    badge: "#1 Top Sell",
    rank: 1,
    isHero: true,
  },
  // 2. Wide 2x1 Landscape Card
  {
    col: "col-span-2 row-span-1 md:col-span-2 md:row-span-1",
    badge: "#2 Top Sell",
    rank: 2,
    isWide: true,
  },
  // 3. Tall 1x2 Vertical Portrait Card
  {
    col: "col-span-1 row-span-2 md:col-span-1 md:row-span-2",
    badge: "#3 Top Sell",
    rank: 3,
    isTall: true,
  },
  // 4. Compact 1x1 Square Card
  {
    col: "col-span-1 row-span-1 md:col-span-1 md:row-span-1",
    badge: "#4",
    rank: 4,
  },
  // 5. Wide 2x1 Landscape Card
  {
    col: "col-span-2 row-span-1 md:col-span-2 md:row-span-1",
    badge: "#5",
    rank: 5,
    isWide: true,
  },
  // 6. Compact 1x1 Square Card
  {
    col: "col-span-1 row-span-1 md:col-span-1 md:row-span-1",
    badge: "#6",
    rank: 6,
  },
];

// GPU-accelerated slide directions for seamless collage photo turnover
const DIRECTIONS = [
  { name: "left-to-right", exitAnim: "bs-exit-right", enterAnim: "bs-enter-right" },
  { name: "right-to-left", exitAnim: "bs-exit-left",  enterAnim: "bs-enter-left" },
  { name: "top-to-bottom", exitAnim: "bs-exit-down",  enterAnim: "bs-enter-down" },
  { name: "bottom-to-top", exitAnim: "bs-exit-up",    enterAnim: "bs-enter-up" },
];

interface TileAnimationState {
  tileIdx: number;
  nextProductIdx: number;
  phase: "slide" | "idle";
  dir: (typeof DIRECTIONS)[number];
}

function ProductCollageTile({
  product,
  nextProduct,
  tileConfig,
  animatingState,
  onQuickView,
}: {
  product: any;
  nextProduct: any | null;
  tileConfig: (typeof TILE_LAYOUT)[number];
  animatingState: TileAnimationState | null;
  onQuickView: (p: any) => void;
}) {
  if (!product) return null;

  const isSliding = animatingState?.phase === "slide";
  const dir = animatingState?.dir || DIRECTIONS[0];

  const imgSrc = product.imageUrl || product.mainImage || "/placeholder-product.png";
  const nextImgSrc = nextProduct ? (nextProduct.imageUrl || nextProduct.mainImage || "/placeholder-product.png") : "";

  const brandName = typeof product.brand === "string" ? product.brand : product.brand?.name || "SHANFA";
  const salePrice = product.discountPrice || product.salePrice || product.salePriceCents || 0;
  const regularPrice = product.price || 0;
  const effectivePrice = salePrice > 0 ? salePrice : regularPrice;

  return (
    <div
      className="relative w-full h-full overflow-hidden cursor-pointer group bg-gradient-to-br from-pink-50/40 via-white to-pink-100/30 rounded-2xl sm:rounded-3xl border border-pink-100/80 shadow-[0_4px_16px_rgba(20,5,15,0.06)] hover:shadow-[0_12px_32px_rgba(137,7,84,0.14)] hover:border-[#890754]/40 transition-all duration-300 select-none"
      onClick={() => onQuickView(product)}
    >
      {/* Current Photo Tile */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          animation: isSliding
            ? `${dir.exitAnim} 0.85s cubic-bezier(0.25, 1, 0.5, 1) forwards`
            : "none",
          willChange: isSliding ? "transform" : "auto",
        }}
      >
        <Image
          src={imgSrc}
          alt={product.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
          sizes="(max-width: 640px) 50vw, 33vw"
        />

        {/* Top Floating Ranking Badge */}
        <div className="absolute top-2 left-2 sm:top-2.5 sm:left-2.5 z-10 pointer-events-none">
          <span className="px-2 py-0.5 rounded-full text-[8px] sm:text-[9px] font-black uppercase tracking-wider bg-white/95 text-[#890754] backdrop-blur-md shadow-sm border border-white/70 flex items-center gap-1">
            {tileConfig.rank <= 3 ? (
              <Flame size={10} className="fill-amber-400 text-amber-400 shrink-0" />
            ) : (
              <span className="w-1.5 h-1.5 rounded-full bg-[#890754] shrink-0" />
            )}
            {tileConfig.badge}
          </span>
        </div>

        {/* Vignette Bottom Gradient Overlay with Luxury Typography */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent pt-12 pb-2.5 px-2.5 sm:px-3.5 flex flex-col justify-end pointer-events-none">
          <span className="text-[7.5px] sm:text-[8.5px] font-black uppercase tracking-[0.16em] text-pink-200 drop-shadow truncate">
            {brandName}
          </span>
          <h3 className="text-white text-[10.5px] sm:text-xs md:text-sm font-bold truncate leading-tight drop-shadow-sm mt-0.5">
            {product.name}
          </h3>

          <div className="flex items-center justify-between mt-1 pt-1 border-t border-white/20">
            <Price
              amount={effectivePrice}
              className="text-[10px] sm:text-xs font-black text-white tracking-tight"
              countryPrices={product.countryPrices as CountryPrice[]}
            />
            <span className="text-[8.5px] sm:text-[9.5px] font-bold text-white/80 group-hover:text-white flex items-center gap-0.5 transition-colors">
              Quick View →
            </span>
          </div>
        </div>
      </div>

      {/* Next sliding photo tile (Smooth turnover) */}
      {isSliding && nextProduct && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            animation: `${dir.enterAnim} 0.85s cubic-bezier(0.25, 1, 0.5, 1) forwards`,
            willChange: "transform",
          }}
        >
          <Image
            src={nextImgSrc}
            alt={nextProduct.name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 50vw, 33vw"
          />

          {/* Badge */}
          <div className="absolute top-2 left-2 sm:top-2.5 sm:left-2.5 z-10 pointer-events-none">
            <span className="px-2 py-0.5 rounded-full text-[8px] sm:text-[9px] font-black uppercase tracking-wider bg-white/95 text-[#890754] backdrop-blur-md shadow-sm border border-white/70 flex items-center gap-1">
              {tileConfig.rank <= 3 ? (
                <Flame size={10} className="fill-amber-400 text-amber-400 shrink-0" />
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-[#890754] shrink-0" />
              )}
              {tileConfig.badge}
            </span>
          </div>

          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent pt-12 pb-2.5 px-2.5 sm:px-3.5 flex flex-col justify-end pointer-events-none">
            <span className="text-[7.5px] sm:text-[8.5px] font-black uppercase tracking-[0.16em] text-pink-200 drop-shadow truncate">
              {typeof nextProduct.brand === "string" ? nextProduct.brand : nextProduct.brand?.name || "SHANFA"}
            </span>
            <h3 className="text-white text-[10.5px] sm:text-xs md:text-sm font-bold truncate leading-tight drop-shadow-sm mt-0.5">
              {nextProduct.name}
            </h3>

            <div className="flex items-center justify-between mt-1 pt-1 border-t border-white/20">
              <Price
                amount={nextProduct.discountPrice || nextProduct.salePrice || nextProduct.price || 0}
                className="text-[10px] sm:text-xs font-black text-white tracking-tight"
                countryPrices={nextProduct.countryPrices as CountryPrice[]}
              />
              <span className="text-[8.5px] sm:text-[9.5px] font-bold text-white/80 flex items-center gap-0.5">
                Quick View →
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function BestSellersSection({ products, onQuickView, addToCart, orderNow }: BestSellersSectionProps) {
  if (products.length === 0) return null;

  const [tileIndices, setTileIndices] = useState<number[]>(() =>
    TILE_LAYOUT.map((_, i) => i % products.length)
  );
  const [animatingState, setAnimatingState] = useState<TileAnimationState | null>(null);

  useEffect(() => {
    if (products.length <= TILE_LAYOUT.length) return;

    let currentTilePointer = 0;

    const interval = setInterval(() => {
      const tileToChange = currentTilePointer;
      currentTilePointer = (currentTilePointer + 1) % TILE_LAYOUT.length;

      setTileIndices((currentTiles) => {
        const used = new Set(currentTiles);
        let nextProductIdx = (currentTiles[tileToChange] + TILE_LAYOUT.length) % products.length;
        for (let step = 0; step < products.length; step++) {
          const candidate = (nextProductIdx + step) % products.length;
          if (!used.has(candidate)) {
            nextProductIdx = candidate;
            break;
          }
        }

        const randomDir = DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)];

        setAnimatingState({
          tileIdx: tileToChange,
          nextProductIdx,
          phase: "slide",
          dir: randomDir,
        });

        setTimeout(() => {
          setTileIndices((prev) => {
            const next = [...prev];
            next[tileToChange] = nextProductIdx;
            return next;
          });
          setAnimatingState(null);
        }, 850);

        return currentTiles;
      });
    }, 4500);

    return () => clearInterval(interval);
  }, [products.length]);

  return (
    <section className="w-full py-8 sm:py-12 px-4 sm:px-6 bg-white rounded-3xl border border-pink-100/80 shadow-xs my-6">
      <div className="max-w-[1440px] mx-auto">
        {/* Header */}
        <div className="flex items-end justify-between mb-5 sm:mb-7">
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.22em] text-[#890754] block mb-1">
              🔥 On-Going
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <Trophy size={22} className="text-[#890754] fill-pink-100" />
              Top Sell
            </h2>
          </div>
          <Link
            href="/products?sort=best-selling"
            className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-[#890754] hover:text-[#540434] transition-colors border-b border-[#890754]/30 hover:border-[#890754] pb-0.5"
          >
            Shop All <ArrowRight size={12} />
          </Link>
        </div>

        {/* Photo Collage Grid — Different image card sizes, mathematically 100% packed with zero blank space */}
        <div className="grid grid-cols-4 md:grid-cols-6 auto-rows-[115px] sm:auto-rows-[140px] md:auto-rows-[170px] gap-2.5 sm:gap-3.5">
          {TILE_LAYOUT.map((tileConfig, i) => {
            const productIdx = tileIndices[i] ?? (i % products.length);
            const product = products[productIdx];
            const isThisTileAnimating = animatingState?.tileIdx === i;
            const nextProduct = isThisTileAnimating && animatingState
              ? products[animatingState.nextProductIdx]
              : null;

            return (
              <div key={i} className={`${tileConfig.col} w-full h-full`}>
                <ProductCollageTile
                  product={product}
                  nextProduct={nextProduct}
                  tileConfig={tileConfig}
                  animatingState={isThisTileAnimating ? animatingState : null}
                  onQuickView={onQuickView}
                />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
