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
}

export function ProductCard({
  product,
  onQuickView,
  onAddToCart,
  onOrderNow,
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
    <div className="glass-panel-heavy rounded-[1.5rem] md:rounded-[2rem] overflow-hidden transition-all duration-500 hover:scale-[1.02] group border border-black/5 shadow-sm hover:shadow-xl relative z-10">
      {/* Image Container */}
      <button
        type="button"
        onClick={() => onQuickView(product)}
        className="block w-full text-left relative aspect-square md:aspect-[4/3] overflow-hidden bg-black/[0.02]"
      >
        <Image
          src={isValidImageUrl(product.imageUrl) ? product.imageUrl : "/placeholder-product.png"}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 100vw, 400px"
          className="object-cover transition-transform duration-1000 group-hover:scale-110"
          priority={false}
        />

        {/* Badges */}
        <div className="absolute top-2 md:top-4 left-2 md:left-4 flex flex-col gap-1 md:gap-2">
          {product.hot && (
            <span className="bg-black text-white text-[7px] md:text-[10px] font-black uppercase tracking-widest px-1.5 md:px-3 py-0.5 md:py-1.5 rounded-full shadow-lg">
              {t.home.trendingNow}
            </span>
          )}
          {hasDiscount && (
            <span className="bg-white/90 backdrop-blur-md text-black text-[7px] md:text-[10px] font-black uppercase tracking-widest px-1.5 md:px-3 py-0.5 md:py-1.5 rounded-full shadow-lg border border-black/5">
              Sale
            </span>
          )}
        </div>

        {/* Price Tag on Image */}
        <div className="absolute bottom-1 md:bottom-2 right-1 md:right-2">
          <div className="bg-white/90 backdrop-blur-xl px-2.5 md:px-4 py-1.5 md:py-2 rounded-xl md:rounded-2xl shadow-2xl border border-black/5 flex flex-col items-end">
            {hasDiscount && (
              <Price amount={product.price} className="text-[8px] md:text-[10px] text-red-500 line-through font-black leading-none mb-1" showSymbolSmall />
            )}
            <Price amount={price} className="text-base md:text-xl font-black text-black leading-none block" showSymbolSmall />
          </div>
        </div>
      </button>

      {/* Product Info */}
      <div className="p-2.5 md:p-4 space-y-1 md:space-y-2">
        <div className="flex justify-between items-start">
          <div className="space-y-0 md:space-y-1 w-full">
            <Link href={`/products/${product.id}`} className="hidden md:block text-[10px] font-black font-body text-black/30 uppercase tracking-[0.2em] hover:text-black transition-colors">
              {brandName}
            </Link>
            <Link href={`/products/${product.id}`} className="block">
              <h3 className="font-display text-[13px] md:text-lg font-bold text-black leading-tight line-clamp-1 group-hover:text-black/70 transition-colors">
                {product.name}
              </h3>
            </Link>

            {/* Rating, Sales & Stock Info - Hidden on mobile to save height */}
            <div className="hidden md:flex flex-wrap items-center gap-3 text-xs text-black/60 pt-1">
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

        <div className="pt-1 md:pt-2">
          <div className="flex gap-1.5 w-full items-center">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAddToCart(product);
              }}
              className="w-9 h-9 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-white text-black border border-black/10 transition-all duration-300 hover:scale-110 active:scale-90 shadow-lg shadow-black/10 flex items-center justify-center shrink-0"
              title={t.product.addToCart}
            >
              <ShoppingBag size={16} />
            </button>
            {onOrderNow && (
              <div className="flex-1 relative group/btn-container h-9 md:h-12 flex items-center justify-center">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOrderNow(product);
                  }}
                  className="w-full h-full rounded-lg md:rounded-xl relative overflow-hidden transition-all duration-500 hover:scale-[1.08] active:scale-95 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)] border border-white/30 z-10"
                >
                  {/* Ice Mountain Image Cover */}
                  <div className="absolute inset-0">
                    <Image
                      src="/assets/or.jpeg"
                      alt=""
                      fill
                      className="object-cover transition-transform duration-[2000ms] group-hover/btn-container:scale-125 blur-[2px]"
                      priority
                    />
                    <div className="absolute inset-0 bg-white/10 group-hover:bg-transparent transition-colors duration-500" />
                  </div>

                  {/* Glass Shine */}
                  <motion.div
                    className="absolute inset-x-0 top-0 h-full w-1/2 bg-gradient-to-r from-transparent via-white/30 to-transparent blur-md -skew-x-25 pointer-events-none"
                    animate={{ x: ["-100%", "400%"] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                  />

                  <span className="relative z-20 text-white text-[9px] md:text-[13px] font-black uppercase tracking-[0.2em] drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)] flex items-center justify-center h-full">
                    {t.product.orderNow}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
