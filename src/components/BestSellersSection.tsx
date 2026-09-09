"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Trophy } from "lucide-react";

interface BestSellersSectionProps {
  products: any[];
  onQuickView: (p: any) => void;
  addToCart: (p: any) => void;
  orderNow: (p: any) => void;
}

const TILE_LAYOUT = [
  { col: "col-span-2 row-span-2 sm:col-span-2 sm:row-span-2" },
  { col: "col-span-1 row-span-1 sm:col-span-1 sm:row-span-1" },
  { col: "col-span-1 row-span-1 sm:col-span-1 sm:row-span-1" },
  { col: "col-span-1 row-span-1 sm:col-span-2 sm:row-span-2" },
  { col: "col-span-1 row-span-1 sm:col-span-1 sm:row-span-1" },
  { col: "col-span-1 row-span-1 sm:col-span-1 sm:row-span-1" },
];

// GPU-accelerated slide directions
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

function ProductTile({
  product,
  nextProduct,
  animatingState,
  onQuickView,
}: {
  product: any;
  nextProduct: any | null;
  animatingState: TileAnimationState | null;
  onQuickView: (p: any) => void;
}) {
  if (!product) return null;

  const isSliding = animatingState?.phase === "slide";
  const dir = animatingState?.dir || DIRECTIONS[0];

  const imgSrc = product.imageUrl || product.mainImage || "/placeholder-product.png";
  const nextImgSrc = nextProduct ? (nextProduct.imageUrl || nextProduct.mainImage || "/placeholder-product.png") : "";

  const shortName = (p: any) =>
    p?.name?.length > 22 ? p.name.slice(0, 22).trim() + "…" : p?.name;

  return (
    <div
      className="relative w-full h-full overflow-hidden cursor-pointer group bg-black/5"
      onClick={() => onQuickView(product)}
    >
      {/* Current image */}
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
          className="object-cover group-hover:scale-[1.03] transition-transform duration-500"
          sizes="(max-width: 640px) 50vw, 33vw"
        />
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent pt-8 pb-2 px-2 pointer-events-none">
          <p className="text-white text-[10px] sm:text-xs font-bold text-center truncate drop-shadow">
            {shortName(product)}
          </p>
        </div>
      </div>

      {/* Next image sliding in simultaneously */}
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
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent pt-8 pb-2 px-2 pointer-events-none">
            <p className="text-white text-[10px] sm:text-xs font-bold text-center truncate drop-shadow">
              {shortName(nextProduct)}
            </p>
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

        // Randomly choose slide direction (left-to-right, right-to-left, top-to-bottom, bottom-to-top)
        const randomDir = DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)];

        setAnimatingState({
          tileIdx: tileToChange,
          nextProductIdx,
          phase: "slide",
          dir: randomDir,
        });

        // Commit after smooth 0.85s slide finishes
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
    }, 4500); // Changes one tile sequentially every 4.5s

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
              Best Sellers
            </h2>
          </div>
          <Link
            href="/products?sort=best-selling"
            className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-[#890754] hover:text-[#540434] transition-colors border-b border-[#890754]/30 hover:border-[#890754] pb-0.5"
          >
            Shop All <ArrowRight size={12} />
          </Link>
        </div>

        {/* Gallery Grid — rounded corners, crisp borders, zero blank space */}
        <div className="grid grid-cols-3 sm:grid-cols-6 auto-rows-[95px] sm:auto-rows-[150px] md:auto-rows-[170px] gap-2 sm:gap-3">
          {TILE_LAYOUT.map((tile, i) => {
            const productIdx = tileIndices[i] ?? (i % products.length);
            const product = products[productIdx];
            const isThisTileAnimating = animatingState?.tileIdx === i;
            const nextProduct = isThisTileAnimating && animatingState
              ? products[animatingState.nextProductIdx]
              : null;

            return (
              <div key={i} className={`${tile.col} overflow-hidden rounded-xl sm:rounded-2xl border border-gray-100 shadow-2xs`}>
                <ProductTile
                  product={product}
                  nextProduct={nextProduct}
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
