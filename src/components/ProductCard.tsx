"use client";

import Image from "next/image";
import { ShoppingBag, Star, Package, ShoppingCart } from "lucide-react";
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
    countryPrices?: Array<{
      country: string;
      priceCents: number;
      currency: string;
    }>;
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

  // Generate star rating display
  const renderStars = (rating: number = 0) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<Star key={i} size={12} className="text-yellow-400 fill-yellow-400" />);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<Star key={i} size={12} className="text-yellow-400 fill-yellow-400 opacity-50" />);
      } else {
        stars.push(<Star key={i} size={12} className="text-gray-300" />);
      }
    }
    return stars;
  };

  return (
    <div className={`group bg-white shadow-lg hover:shadow-2xl transition-all duration-300 rounded-2xl overflow-hidden ${compact ? 'w-[160px]' : 'w-[180px] sm:w-[200px] md:w-[220px] lg:w-[240px]'} mx-auto flex flex-col`}>
      {/* Image Section */}
      <div className="relative overflow-hidden h-[150px] sm:h-[170px] md:h-[190px] w-full bg-gray-50 flex-shrink-0">
        <button
          type="button"
          onClick={() => onQuickView(product)}
          className="w-full h-full relative block"
        >
          <Image
            src={isValidImageUrl(product.imageUrl) ? product.imageUrl : "/placeholder-product.png"}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 200px, (max-width: 768px) 290px, 360px"
            className="object-cover transition-all duration-700 ease-out group-hover:blur-[4px] group-hover:opacity-40"
            priority={false}
          />

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1 z-20">
            {product.hot && (
              <span className="bg-black text-white text-[8px] px-2 py-1 font-black uppercase tracking-widest rounded-full shadow-lg">
                {t.home.trendingNow}
              </span>
            )}
            {hasDiscount && (
              <span className="bg-white/90 backdrop-blur-md text-black text-[8px] px-2 py-1 font-black uppercase tracking-widest rounded-full shadow-lg border border-black/5">
                Sale
              </span>
            )}
          </div>
        </button>

        {/* Hover Background */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-emerald-600/95 to-teal-600/95 backdrop-blur-sm -translate-x-full transition-all duration-700 ease-out group-hover:translate-x-0"></div>

        {/* Cart Overlay - Shows on Hover */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none flex flex-col items-center justify-center">
          {/* Price - Shows on Hover */}
          <div className="mb-4 text-lg sm:text-xl font-black text-white transition-all duration-600 ease-out delay-100 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0">
            <Price amount={price} showSymbolSmall countryPrices={product.countryPrices} />
          </div>
          
          {/* Action Buttons - Vertical View */}
          <div className="flex flex-col gap-2 sm:gap-3 transition-all duration-600 ease-out delay-200 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOrderNow?.(product);
              }}
              className="bg-white text-emerald-600 px-3 sm:px-4 py-2 rounded-full font-black text-[9px] sm:text-[10px] uppercase tracking-widest transition-all duration-300 hover:scale-105 hover:shadow-xl active:scale-95 pointer-events-auto whitespace-nowrap"
            >
              {t.product.orderNow || "Order NOW"}
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onQuickView(product);
              }}
              className="bg-white text-black px-3 sm:px-4 py-2 rounded-full font-black text-[9px] sm:text-[10px] uppercase tracking-widest transition-all duration-300 hover:scale-105 hover:shadow-xl hover:bg-gray-100 active:scale-95 pointer-events-auto whitespace-nowrap"
            >
              {t.product.quickView || "Quick View"}
            </button>
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="p-3 sm:p-4 bg-white flex flex-col flex-1 min-h-0">
        {/* Price and Stock Info Row */}
        <div className="flex items-center justify-between mb-2 flex-shrink-0">
          <div className="flex items-baseline gap-2">
            <Price amount={price} className="text-sm sm:text-base font-black text-black" countryPrices={product.countryPrices} />
            {hasDiscount && (
              <Price amount={product.price} className="text-xs text-red-500 line-through font-bold" countryPrices={product.countryPrices} />
            )}
          </div>
          
          {/* Stock Status - Moved to top right */}
          {product.stockQuantity !== undefined && (
            <div className="flex items-center gap-1.5 bg-gray-50/50 px-2 py-1 rounded-lg">
              <Package size={10} className={product.stockQuantity > 0 ? "text-emerald-500" : "text-red-500"} />
              <span className={`text-[9px] sm:text-[10px] font-semibold ${product.stockQuantity > 0 ? "text-emerald-700" : "text-red-600"}`}>
                {product.stockQuantity > 0 ? `${product.stockQuantity}` : t.product.outOfStock}
              </span>
            </div>
          )}
        </div>

        {/* Product Name */}
        <h3 className="font-display text-xs sm:text-sm font-bold text-black leading-tight line-clamp-2 mb-1 overflow-hidden">
          {product.name}
        </h3>
        
        {/* Brand Name */}
        <p className="font-body text-[8px] sm:text-[9px] uppercase text-gray-500 tracking-wider mb-2 flex-shrink-0">
          {brandName}
        </p>

        {/* Star Rating */}
        <div className="flex items-center gap-1.5 mb-2 flex-shrink-0">
          <div className="flex">
            {renderStars(product.averageRating || 0)}
          </div>
          {product.ratingCount !== undefined && (
            <span className="text-[10px] text-gray-500 font-medium">
              ({product.ratingCount})
            </span>
          )}
        </div>

        {/* Action Buttons - Always Visible (Horizontal Row) */}
        <div className="flex justify-center flex-shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart(product);
            }}
            className="add-to-cart-btn w-full max-w-full"
            title={t.product.addToCart || "Add to Cart"}
          >
            <span className="text">{t.product.addToCart || "Add to Cart"}</span>
            <span className="icon">
              <ShoppingCart size={14} />
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
