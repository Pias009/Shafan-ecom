"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingBag, Star, Package, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { Price } from "./Price";
import { useLanguageStore } from "@/lib/language-store";
import { translations } from "@/lib/translations";

function isValidImageUrl(url: any): boolean {
  if (!url || typeof url !== 'string') return false;
  return url.startsWith('/') || url.startsWith('http');
}

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    brand?: string | { name: string };
    price: number;
    discountPrice?: number;
    imageUrl: string;
    hot?: boolean;
    averageRating?: number;
    ratingCount?: number;
    stockQuantity?: number;
    totalSales?: number;
  };
  onQuickView: (product: any) => void;
  onAddToCart: (product: any) => void;
  onOrderNow?: (product: any) => void;
  compact?: boolean;
}

export function ProductCard({
  product,
  onQuickView,
  onAddToCart,
  onOrderNow,
  compact = false,
}: ProductCardProps) {
  const { currentLanguage } = useLanguageStore();
  const t = translations[currentLanguage.code as keyof typeof translations];

  // Safely get the display price
  const price = product.discountPrice ?? product.price;
  const hasDiscount = !!product.discountPrice && product.discountPrice < product.price;

  // Safely get the brand name as a string
  const brandName = typeof product.brand === "string"
    ? product.brand
    : product.brand?.name || "Shafan Global";

  return (
    <div className={`glass-panel-heavy ${compact ? 'rounded-lg md:rounded-xl' : 'rounded-[1.5rem] md:rounded-[2rem]'} overflow-hidden transition-all duration-500 hover:scale-[1.02] group border border-black/5 shadow-sm hover:shadow-xl relative z-10`}>
      {/* Image Container */}
      <button
        type="button"
        onClick={() => onQuickView(product)}
        className="block w-full text-left relative aspect-square overflow-hidden bg-black/[0.02]"
      >
        <Image
          src={isValidImageUrl(product.imageUrl) ? product.imageUrl : "/placeholder-product.png"}
          alt={product.name}
          fill
          sizes={compact ? "(max-width: 768px) 50vw, 200px" : "(max-width: 768px) 100vw, 400px"}
          className="object-cover transition-transform duration-1000 group-hover:scale-110"
          priority={false}
        />

        {/* Badges */}
        <div className={`absolute ${compact ? 'top-1 left-1' : 'top-2 md:top-4 left-2 md:left-4'} flex flex-col gap-1`}>
          {product.hot && (
            <span className={`bg-black text-white ${compact ? 'text-[6px] px-1 py-0.5' : 'text-[7px] md:text-[10px] px-1.5 md:px-3 py-0.5 md:py-1.5'} font-black uppercase tracking-widest rounded-full shadow-lg`}>
              {t.home.trendingNow}
            </span>
          )}
          {hasDiscount && (
            <span className={`bg-white/90 backdrop-blur-md text-black ${compact ? 'text-[6px] px-1 py-0.5' : 'text-[7px] md:text-[10px] px-1.5 md:px-3 py-0.5 md:py-1.5'} font-black uppercase tracking-widest rounded-full shadow-lg border border-black/5`}>
              Sale
            </span>
          )}
        </div>

        {/* Price Tag on Image */}
        <div className={`absolute ${compact ? 'bottom-0.5 right-0.5' : 'bottom-1 md:bottom-2 right-1 md:right-2'}`}>
          <div className={`bg-white/90 backdrop-blur-xl ${compact ? 'px-1.5 py-1 rounded-lg' : 'px-2.5 md:px-4 py-1.5 md:py-2 rounded-xl md:rounded-2xl'} shadow-2xl border border-black/5 flex flex-col items-end`}>
            {hasDiscount && (
              <Price amount={product.price} className={`${compact ? 'text-[6px]' : 'text-[8px] md:text-[10px]'} text-red-500 line-through font-black leading-none mb-0.5`} showSymbolSmall />
            )}
            <Price amount={price} className={`${compact ? 'text-xs' : 'text-base md:text-xl'} font-black text-black leading-none block`} showSymbolSmall />
          </div>
        </div>
      </button>

      {/* Product Info */}
      <div className={`${compact ? 'p-1.5 space-y-0.5' : 'p-2.5 md:p-4 space-y-1 md:space-y-2'}`}>
        <div className="flex justify-between items-start">
          <div className="space-y-0 w-full">
            <Link href={`/products/${product.id}`} className={`${compact ? 'hidden' : 'hidden md:block'} text-[10px] font-black font-body text-black/30 uppercase tracking-[0.2em] hover:text-black transition-colors`}>
              {brandName}
            </Link>
            <Link href={`/products/${product.id}`} className="block">
              <h3 className={`font-display ${compact ? 'text-[10px] font-semibold' : 'text-[13px] md:text-lg font-bold'} text-black leading-tight line-clamp-1 group-hover:text-black/70 transition-colors`}>
                {product.name}
              </h3>
            </Link>

            {/* Rating, Sales & Stock Info - Hidden on mobile to save height */}
            <div className={`${compact ? 'hidden' : 'hidden md:flex'} flex-wrap items-center gap-3 text-xs text-black/60 pt-1`}>
              {product.averageRating !== undefined && product.ratingCount !== undefined && (
                <div className="flex items-center gap-1">
                  <Star size={12} className="text-yellow-400 fill-yellow-400" />
                  <span className="font-bold">{product.averageRating.toFixed(1)}</span>
                  <span className="opacity-50">({product.ratingCount})</span>
                </div>
              )}
              {product.totalSales ? (
                <div className="flex items-center gap-1">
                  <TrendingUp size={12} className="text-blue-500" />
                  <span className="font-medium">{product.totalSales} {t.product.sold}</span>
                </div>
              ) : null}
              {product.stockQuantity !== undefined && (
                <div className="flex items-center gap-1">
                  <Package size={12} className={product.stockQuantity > 0 ? "text-emerald-500" : "text-red-500"} />
                  <span className="font-medium text-xs">
                    {product.stockQuantity > 0 ? `${product.stockQuantity} ${t.product.inStock}` : t.product.outOfStock}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className={`${compact ? 'pt-0.5' : 'pt-1 md:pt-2'}`}>
          <div className="flex gap-1 w-full items-center">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAddToCart(product);
              }}
              className={`${compact ? 'w-7 h-7 rounded-md' : 'w-9 h-9 md:w-10 md:h-10 rounded-lg md:rounded-xl'} bg-white text-black border border-black/10 transition-all duration-300 hover:scale-110 active:scale-90 shadow-lg shadow-black/10 flex items-center justify-center shrink-0`}
              title={t.product.addToCart}
            >
              <ShoppingBag size={compact ? 12 : 16} />
            </button>
            {onOrderNow && (
              <div className={`flex-1 relative ${compact ? 'h-7' : 'h-9 md:h-12'} flex items-center justify-center`}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOrderNow(product);
                  }}
                  className="btn-53 w-full h-full"
                >
                  <span className="original">{t.product.orderNow}</span>
                  <div className="letters">
                    {Array.from("FAST").map((letter, index) => (
                      <span key={index}>{letter}</span>
                    ))}
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
