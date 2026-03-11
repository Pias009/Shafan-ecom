"use client";

import type { DemoProduct } from "@/lib/demo-data";
import Image from "next/image";

export function ProductCard({
  product,
  onQuickView,
  onAddToCart,
}: {
  product: DemoProduct;
  onQuickView: (product: DemoProduct) => void;
  onAddToCart: (product: DemoProduct) => void;
}) {
  const price = product.discountPrice ?? product.price;
  const hasDiscount = product.discountPrice && product.discountPrice < product.price;

  return (
    <div className="glass glass-3d ring-icy group overflow-hidden rounded-3xl">
      <button type="button" onClick={() => onQuickView(product)} className="block w-full text-left">
        <div className="relative aspect-[4/3] overflow-hidden bg-white/5">
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 100vw, 420px"
            className="object-cover transition duration-500 group-hover:scale-[1.04]"
          />
          {product.hot ? (
            <div className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-black">
              Hot
            </div>
          ) : null}
        </div>
      </button>

      <div className="p-5">
        <div className="text-xs text-white/65">{product.brand}</div>
        <div className="mt-1 line-clamp-1 text-base font-semibold tracking-tight text-white">
          {product.name}
        </div>

        <div className="mt-3 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm text-white/70">{product.category}</div>
            <div className="mt-1 flex items-end gap-2">
              <div className="text-lg font-semibold text-white">${price}</div>
              {hasDiscount ? (
                <div className="text-xs text-white/55 line-through">${product.price}</div>
              ) : null}
            </div>
          </div>

          <button
            type="button"
            onClick={() => onAddToCart(product)}
            className="glass glass-3d ring-icy inline-flex h-10 items-center rounded-full px-4 text-sm font-semibold text-white/90 transition hover:text-white"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}

