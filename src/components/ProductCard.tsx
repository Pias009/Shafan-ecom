"use client";

import type { DemoProduct } from "@/lib/demo-data";
import Image from "next/image";
import { ShoppingBag } from "lucide-react";

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
    <div className="glass-panel rounded-2xl overflow-hidden transition-all duration-500 hover:scale-[1.02] group">
      {/* Image */}
      <button type="button" onClick={() => onQuickView(product)} className="block w-full text-left">
        <div className="relative aspect-[4/3] overflow-hidden bg-cream">
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 100vw, 420px"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
          {product.hot && (
            <span className="absolute top-3 left-3 bg-blush text-forest text-xs font-body font-semibold px-3 py-1 rounded-full">
              HOT
            </span>
          )}
        </div>
      </button>

      {/* Info */}
      <div className="p-4 space-y-2">
        <p className="text-xs font-body text-black uppercase tracking-wider">
          {product.brand}
        </p>
        <button
          type="button"
          onClick={() => onQuickView(product)}
          className="block w-full text-left"
        >
          <h3 className="font-display text-lg text-black leading-tight line-clamp-1">
            {product.name}
          </h3>
        </button>

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-end gap-2">
            <span className="font-body font-bold text-black text-base">${price}</span>
            {hasDiscount && (
              <span className="font-body text-xs text-black/40 line-through">${product.price}</span>
            )}
          </div>
          <button
            type="button"
            onClick={() => onAddToCart(product)}
            className="p-2 rounded-full bg-forest text-cream transition-transform duration-300 hover:scale-110"
            aria-label="Add to cart"
          >
            <ShoppingBag size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
