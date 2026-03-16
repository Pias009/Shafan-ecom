"use client";

import Image from "next/image";
import { ShoppingBag } from "lucide-react";
import { Price } from "./Price";

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    brand?: string | { name: string };
    price: number;
    discountPrice?: number;
    imageUrl: string;
    hot?: boolean;
  };
  onQuickView: (product: any) => void;
  onAddToCart: (product: any) => void;
  onOrderNow?: (product: any) => void;
}

export function ProductCard({
  product,
  onQuickView,
  onAddToCart,
  onOrderNow,
}: ProductCardProps) {
  // Safely get the display price
  const price = product.discountPrice ?? product.price;
  const hasDiscount = !!product.discountPrice && product.discountPrice < product.price;

  // Safely get the brand name as a string
  const brandName = typeof product.brand === "string" 
    ? product.brand 
    : product.brand?.name || "Shafan Global";

  return (
    <div className="glass-panel-heavy rounded-[1.5rem] md:rounded-[2rem] overflow-hidden transition-all duration-500 hover:scale-[1.02] group border border-black/5 shadow-sm hover:shadow-xl">
      {/* Image Container */}
      <button 
        type="button" 
        onClick={() => onQuickView(product)} 
        className="block w-full text-left relative aspect-[4/5] overflow-hidden bg-black/[0.02]"
      >
        <Image
          src={product.imageUrl || "/placeholder-product.png"}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 100vw, 400px"
          className="object-cover transition-transform duration-1000 group-hover:scale-110"
          priority={false}
        />
        
        {/* Badges */}
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          {product.hot && (
            <span className="bg-black text-white text-[8px] md:text-[10px] font-black uppercase tracking-widest px-2 md:px-3 py-1 md:py-1.5 rounded-full shadow-lg">
              Trending
            </span>
          )}
          {hasDiscount && (
            <span className="bg-white/90 backdrop-blur-md text-black text-[8px] md:text-[10px] font-black uppercase tracking-widest px-2 md:px-3 py-1 md:py-1.5 rounded-full shadow-lg border border-black/5">
              Sale
            </span>
          )}
        </div>
      </button>

      {/* Product Info */}
      <div className="p-3 md:p-6 space-y-2 md:space-y-3">
        <div className="flex justify-between items-start">
          <div className="space-y-0.5 md:space-y-1">
            <p className="text-[8px] md:text-[10px] font-black font-body text-black/30 uppercase tracking-[0.2em]">
              {brandName}
            </p>
            <h3 className="font-display text-sm md:text-xl font-bold text-black leading-tight line-clamp-1 group-hover:text-black/70 transition-colors">
              {product.name}
            </h3>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1 md:pt-2">
          <div className="flex items-baseline gap-1 md:gap-2">
            <Price amount={price} className="font-body font-black text-black text-sm md:text-xl" />
            {hasDiscount && (
              <Price amount={product.price} className="font-body text-[8px] md:text-xs text-black/20 line-through font-bold" />
            )}
          </div>
          
          <div className="flex gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAddToCart(product);
              }}
              className="p-2 md:p-3 rounded-full bg-white text-black border border-black/10 transition-all duration-300 hover:scale-110 active:scale-90 shadow-lg shadow-black/10"
              aria-label="Add to cart"
            >
              <ShoppingBag size={14} className="md:w-[18px] md:h-[18px]" />
            </button>
            {onOrderNow && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOrderNow(product);
                }}
                className="px-4 md:px-5 py-2 md:py-3 rounded-full bg-black text-white text-[10px] md:text-xs font-black uppercase tracking-widest transition-all duration-300 hover:scale-[1.05] active:scale-95 shadow-lg shadow-black/20"
              >
                Order
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
