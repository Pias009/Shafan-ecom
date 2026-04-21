"use client";

import Image from "next/image";
import { Star, Package, ShoppingCart, Truck } from "lucide-react";
import { Price } from "./Price";
import { useLanguageStore } from "@/lib/language-store";
import { translations } from "@/lib/translations";
import { getDisplayPrice } from "@/lib/product-utils";
import { useCountryStore, useCountryStoreReady } from "@/lib/country-store";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

function isValidImageUrl(url: any): boolean {
  if (!url || typeof url !== 'string') return false;
  return url.startsWith('/') || url.startsWith('http');
}

interface HomeProductCardProps {
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
    freeDelivery?: boolean;
    countryPrices?: Array<{
      country: string;
      price: number;
      currency: string;
    }>;
  };
  onQuickView: (product: any) => void;
  onAddToCart: (product: any) => void;
  onOrderNow?: (product: any) => void;
  compact?: boolean;
}

export function HomeProductCard({
  product,
  onQuickView,
  onAddToCart,
  onOrderNow,
  compact = false,
}: HomeProductCardProps) {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const { currentLanguage } = useLanguageStore();
  const t = translations[currentLanguage.code as keyof typeof translations];
  const { selectedCountry } = useCountryStore();
  const hasHydrated = useCountryStoreReady();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !hasHydrated) {
    return (
      <div className={`bg-white shadow-lg rounded-2xl overflow-hidden ${compact ? 'w-[140px]' : 'w-[180px] sm:w-[200px] md:w-[220px] lg:w-[240px]'} mx-auto`}>
        <div className="aspect-square bg-[#F9FAFB] p-4 animate-pulse" />
        <div className="p-4 space-y-2">
          <div className="h-4 bg-gray-200 rounded animate-pulse" />
          <div className="h-3 bg-gray-200 rounded w-2/3 animate-pulse" />
          <div className="h-5 bg-gray-200 rounded w-1/2 animate-pulse" />
        </div>
      </div>
    );
  }

  const { price: countryPrice } = getDisplayPrice(product, selectedCountry);
  const basePrice = product.discountPrice ?? product.price;
  const displayPrice = countryPrice > 0 ? countryPrice : basePrice;
  const isNotAvailable = displayPrice <= 0;
  const price = displayPrice;
  const hasDiscount = countryPrice > 0 && product.discountPrice && product.discountPrice < countryPrice;
  
  const discountPercentage = hasDiscount 
    ? Math.round(((countryPrice - product.discountPrice!) / countryPrice) * 100)
    : 0;

  const brandName = typeof product.brand === "string"
    ? product.brand
    : product.brand?.name || "SHANFA GLOBAL";

  const renderStars = (rating: number = 0) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<Star key={i} size={compact ? 10 : 12} className="text-yellow-400 fill-yellow-400" />);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<Star key={i} size={compact ? 10 : 12} className="text-yellow-400 fill-yellow-400 opacity-50" />);
      } else {
        stars.push(<Star key={i} size={compact ? 10 : 12} className="text-gray-300" />);
      }
    }
    return stars;
  };

  const cardWidth = compact ? 'w-[140px] sm:w-[160px] md:w-[180px] lg:w-[220px]' : 'w-[180px] sm:w-[220px] md:w-[260px] lg:w-[300px]';
  const padding = compact ? 'p-2' : 'p-4';
  const fontSize = compact ? {
    badge: 'text-[5px]',
    price: 'text-[10px]',
    oldPrice: 'text-[8px]',
    name: 'text-[8px]',
    brand: 'text-[6px]',
    rating: 'text-[7px]',
    btn: 'text-[7px]',
  } : {
    badge: 'text-[8px]',
    price: 'text-sm sm:text-base',
    oldPrice: 'text-xs',
    name: 'text-xs sm:text-sm',
    brand: 'text-[8px] sm:text-[9px]',
    rating: 'text-[10px]',
    btn: 'text-[9px] sm:text-[10px]',
  };

  return (
    <div 
      onClick={(e) => { e.stopPropagation(); router.push(`/products/${product.id}`); }}
      className={`group bg-white shadow-lg hover:shadow-2xl transition-all duration-300 rounded-2xl overflow-hidden ${cardWidth} mx-auto flex flex-col cursor-pointer`}>
      {/* Image Section */}
      <div className="relative overflow-hidden aspect-square w-full bg-[#F9FAFB] flex-shrink-0 p-4">
        <div
          className="w-full h-full relative block"
        >
          <Image
            src={isValidImageUrl(product.imageUrl) ? product.imageUrl : "/placeholder-product.png"}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-contain transition-all duration-700 ease-out group-hover:blur-[4px] group-hover:opacity-40"
            priority={false}
          />

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1 z-20">
            {product.hot && (
              <span className={`bg-black text-white ${fontSize.badge} px-2 py-1 font-black uppercase tracking-widest rounded-full shadow-lg`}>
                {t.home.trendingNow}
              </span>
            )}
          </div>

          {/* Right Side Badges - Discount */}
          <div className="absolute top-2 right-2 flex flex-col gap-1.5 z-20">
            {hasDiscount && (
              <div className="bg-red-600 text-white rounded-lg px-2.5 py-1.5 shadow-lg flex flex-col items-center justify-center">
                <span className={`${compact ? 'text-[9px]' : 'text-[10px] sm:text-[11px]'} font-black leading-none`}>
                  -{discountPercentage}%
                </span>
                <span className={`${compact ? 'text-[6px]' : 'text-[7px] sm:text-[8px]'} font-semibold leading-tight`}>OFF</span>
              </div>
            )}
            
            {product.freeDelivery && (
              <div className="bg-emerald-600 text-white rounded-lg px-2.5 py-1.5 shadow-lg flex items-center justify-center gap-1 whitespace-nowrap">
                <Truck size={12} />
                <span className={`${compact ? 'text-[6px]' : 'text-[7px] sm:text-[8px]'} font-bold uppercase tracking-tight`}>FREE</span>
              </div>
            )}
          </div>
        </div>

        {/* Hover Background */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-emerald-600/95 to-teal-600/95 backdrop-blur-sm -translate-x-full transition-all duration-700 ease-out group-hover:translate-x-0"></div>

        {/* Cart Overlay - Shows on Hover */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none flex flex-col items-center justify-center">
          <div className={`${compact ? 'mb-2' : 'mb-4'} ${compact ? 'text-sm sm:text-base' : 'text-lg sm:text-xl'} font-black text-white transition-all duration-600 ease-out delay-100 opacity-0 group-hover:opacity-100 ${compact ? 'translate-y-2' : 'translate-y-4'} group-hover:translate-y-0`}>
            <Price amount={price} showSymbolSmall countryPrices={product.countryPrices} />
          </div>
          
          <div className={`flex flex-col ${compact ? 'gap-1.5 sm:gap-2' : 'gap-1.5 sm:gap-2 md:gap-3'} transition-all duration-600 ease-out delay-200 opacity-0 group-hover:opacity-100 active:opacity-100 transform ${compact ? 'translate-y-2' : 'translate-y-4'} group-hover:translate-y-0 active:translate-y-0`}>
            <button
              type="button"
              disabled={isNotAvailable}
              onClick={(e) => {
                e.stopPropagation();
                onOrderNow?.(product);
              }}
              className={`bg-white ${compact ? 'px-2.5 py-1.5' : 'px-3 sm:px-4 py-2'} rounded-full font-black ${fontSize.btn} uppercase tracking-widest transition-all duration-300 hover:scale-105 hover:shadow-xl active:scale-95 pointer-events-auto whitespace-nowrap ${isNotAvailable ? 'text-gray-400 cursor-not-allowed' : 'text-emerald-600 hover:text-emerald-700'}`}
            >
              {isNotAvailable ? "Not Available" : (t.product.orderNow || "Order NOW")}
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/products/${product.id}`);
              }}
              className={`bg-white text-black ${compact ? 'px-2.5 py-1.5' : 'px-3 sm:px-4 py-2'} rounded-full font-black ${fontSize.btn} uppercase tracking-widest transition-all duration-300 hover:scale-105 hover:shadow-xl hover:bg-gray-100 active:scale-95 pointer-events-auto whitespace-nowrap`}
            >
              {t.product.quickView || "Quick View"}
            </button>
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className={`${compact ? 'p-1.5 sm:p-2' : 'p-3 sm:p-4'} bg-white flex flex-col flex-1 min-h-0`}>
        {/* Price and Stock Info Row */}
        <div className={`flex items-center justify-between ${compact ? 'mb-0.5' : 'mb-1.5 sm:mb-2'} flex-shrink-0`}>
          <div className="flex items-baseline gap-1 sm:gap-2">
            <Price amount={price} className={`${fontSize.price} font-black text-black`} countryPrices={product.countryPrices} />
            {hasDiscount && (
              <Price amount={product.discountPrice || countryPrice} className={`${fontSize.oldPrice} text-red-500 line-through font-bold`} countryPrices={product.countryPrices} />
            )}
          </div>
          
          {!compact && product.stockQuantity !== undefined && (
            <div className="flex items-center gap-1 bg-gray-50/50 px-1.5 py-0.5 rounded">
              <Package size={10} className={product.stockQuantity > 0 ? "text-emerald-500" : "text-red-500"} />
              <span className={`${compact ? 'text-[8px]' : 'text-[9px] sm:text-[10px]'} font-semibold ${product.stockQuantity > 0 ? "text-emerald-700" : "text-red-600"}`}>
                {product.stockQuantity > 0 ? `${product.stockQuantity}` : t.product.outOfStock}
              </span>
            </div>
          )}
        </div>

        {/* Product Name */}
        <h3 className={`${fontSize.name} font-semibold text-black leading-tight line-clamp-2 mb-0.5 overflow-hidden`}>
          {product.name}
        </h3>
        
        {/* Brand Name */}
        <p className={`${fontSize.brand} uppercase text-gray-400 tracking-wider mb-1 sm:mb-2 flex-shrink-0`}>
          {brandName}
        </p>

        

        {/* Add to Cart Button */}
        <div className="flex justify-center flex-shrink-0">
          <button
            type="button"
            disabled={isNotAvailable}
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart(product);
            }}
            className={`add-to-cart-btn w-full max-w-full ${isNotAvailable ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={isNotAvailable ? "Not Available" : (t.product.addToCart || "Add to Cart")}
          >
            <span className="text">{isNotAvailable ? "Not Available" : (t.product.addToCart || "Add to Cart")}</span>
            <span className="icon">
              <ShoppingCart size={14} />
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}