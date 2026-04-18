"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { ShoppingBag, Star, Package, ShoppingCart, Truck, Flame } from "lucide-react";
import { Price } from "./Price";
import { useLanguageStore } from "@/lib/language-store";
import { translations } from "@/lib/translations";
import { hasValidPrice, getDisplayPrice } from "@/lib/product-utils";
import { useCountryStore, useCountryStoreReady } from "@/lib/country-store";
import { getOptimizedUrl } from "@/lib/cloudinary-url";
import { useRouter } from "next/navigation";

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
    trending?: boolean;
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

function ProductCard({
  product,
  onQuickView,
  onAddToCart,
  onOrderNow,
  compact = false,
}: ProductCardProps) {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const { currentLanguage } = useLanguageStore();
  const t = translations[currentLanguage.code as keyof typeof translations];
  const { selectedCountry } = useCountryStore();
  const hasHydrated = useCountryStoreReady();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Wait for hydration - return placeholder to match server render
  if (!mounted || !hasHydrated) {
    return (
      <div className="bg-white shadow-lg rounded-2xl overflow-hidden w-full mx-auto">
        <div className="aspect-square bg-[#F9FAFB] p-4 animate-pulse" />
        <div className="p-4 space-y-2">
          <div className="h-4 bg-gray-200 rounded animate-pulse" />
          <div className="h-3 bg-gray-200 rounded w-2/3 animate-pulse" />
          <div className="h-5 bg-gray-200 rounded w-1/2 animate-pulse" />
        </div>
      </div>
    );
  }

  // Safety Guard: Hide products with zero price for selected country
  if (!hasValidPrice(product, selectedCountry)) {
    return null;
  }

  // Safely get the display price using country-specific pricing
  const { price: countryPrice } = getDisplayPrice(product, selectedCountry);
  const basePrice = product.discountPrice ?? product.price;
  const displayPrice = countryPrice > 0 ? countryPrice : basePrice;
  const isNotAvailable = displayPrice <= 0;
  const price = displayPrice;
  const hasDiscount = countryPrice > 0 && product.discountPrice && product.discountPrice < countryPrice;
  
  // Calculate discount percentage
  const discountPercentage = hasDiscount 
    ? Math.round(((countryPrice - product.discountPrice!) / countryPrice) * 100)
    : 0;

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
    <div 
      onClick={(e) => { e.stopPropagation(); router.push(`/products/${product.id}`); }}
      className={`group bg-white shadow-lg hover:shadow-2xl transition-all duration-300 rounded-2xl overflow-hidden w-full h-full flex flex-col cursor-pointer`}
      style={{ willChange: "transform" }}
    >
      {/* Image Section */}
      <div className="relative overflow-hidden aspect-square w-full bg-[#F9FAFB] flex-shrink-0 p-2 sm:p-4">
        <div
          className="w-full h-full relative block"
        >
          <Image
            src={isValidImageUrl(product.imageUrl || (product as any).mainImage) ? getOptimizedUrl(product.imageUrl || (product as any).mainImage, 400) : "/placeholder-product.png"}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-contain transition-all duration-700 ease-out group-hover:blur-[4px] group-hover:opacity-40"
            priority={false}
          />

          {/* Badges */}
          <div className="absolute top-1 left-1 flex flex-col gap-1 z-20">
            {(product.hot || product.trending) && (
              <span className="bg-red-600 text-white text-[7px] px-1.5 py-0.5 font-black uppercase tracking-tight rounded-sm shadow-lg flex items-center gap-0.5 border border-white/10">
                <Flame size={8} className="fill-white" />
                HOT
              </span>
            )}
          </div>

          {/* Right Side Badges - Discount & Free Delivery */}
          <div className="absolute top-2 right-2 flex flex-col gap-1.5 z-20">
            {/* Discount Badge - Red */}
            {hasDiscount && (
              <div className="bg-red-600 text-white rounded-lg px-2.5 py-1.5 shadow-lg flex flex-col items-center justify-center">
                <span className="text-[10px] sm:text-[11px] font-black leading-none">
                  -{discountPercentage}%
                </span>
                <span className="text-[7px] sm:text-[8px] font-semibold leading-tight">OFF</span>
              </div>
            )}
            
            {/* Free Delivery Badge */}
            {product.freeDelivery && (
              <div className="bg-emerald-600 text-white rounded-lg px-2.5 py-1.5 shadow-lg flex items-center justify-center gap-1 whitespace-nowrap">
                <Truck size={12} />
                <span className="text-[7px] sm:text-[8px] font-bold uppercase tracking-tight">FREE</span>
              </div>
            )}
          </div>
        </div>

        {/* Hover Background */}
        <div className="h-bg absolute top-0 left-0 w-full h-full bg-gradient-to-br from-emerald-600/95 to-teal-600/95 backdrop-blur-sm -translate-x-full transition-all duration-700 ease-out group-hover:translate-x-0"></div>

        {/* Cart Overlay - Shows on Hover */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none flex flex-col items-center justify-center">
          {/* Price - Shows on Hover */}
          <div className="mb-4 text-lg sm:text-xl font-black text-white transition-all duration-600 ease-out delay-100 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 text-center">
            <Price amount={price} showSymbolSmall countryPrices={product.countryPrices} />
          </div>
          
          {/* Action Buttons - Vertical View */}
          <div className="flex flex-col gap-2 sm:gap-3 transition-all duration-600 ease-out delay-200 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0">
            <button
              type="button"
              disabled={isNotAvailable}
              onClick={(e) => {
                e.stopPropagation();
                onOrderNow?.(product);
              }}
              className={`bg-white px-3 sm:px-4 py-2 rounded-full font-black text-[9px] sm:text-[10px] uppercase tracking-widest transition-all duration-300 hover:scale-105 hover:shadow-xl active:scale-95 pointer-events-auto whitespace-nowrap ${isNotAvailable ? 'text-gray-400 cursor-not-allowed' : 'text-emerald-600 hover:text-emerald-700'}`}
            >
              {isNotAvailable ? "Not Available" : (t.product.orderNow || "Order NOW")}
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
      <div className="p-2 sm:p-4 bg-white flex flex-col flex-1 min-h-0">
        {/* Price and Stock Info Row */}
        <div className="flex items-center justify-between mb-2 flex-shrink-0">
          <div className="flex items-baseline gap-2">
            <Price amount={price} className="text-sm sm:text-base font-black text-black" countryPrices={product.countryPrices} />
            {hasDiscount && (
              <Price amount={product.discountPrice || countryPrice} className="text-[10px] text-red-500 line-through font-bold" countryPrices={product.countryPrices} />
            )}
          </div>
          
          {/* Stock Status - Moved to top right */}
          {product.stockQuantity !== undefined && (
            <div className="flex items-center gap-1 bg-gray-50/50 px-1.5 py-0.5 rounded-lg">
              <Package size={10} className={product.stockQuantity > 0 ? "text-emerald-500" : "text-red-500"} />
              <span className={`text-[8px] sm:text-[10px] font-semibold ${product.stockQuantity > 0 ? "text-emerald-700" : "text-red-600"}`}>
                {product.stockQuantity > 0 ? `${product.stockQuantity}` : t.product.outOfStock}
              </span>
            </div>
          )}
        </div>

        {/* Product Name */}
        <h3 className="text-xs sm:text-sm font-semibold text-black leading-tight line-clamp-2 mb-1 overflow-hidden break-words">
          {product.name}
        </h3>
        
        {/* Brand Name */}
        <p className="text-[8px] sm:text-[9px] uppercase text-gray-400 tracking-wider mb-2 flex-shrink-0">
          {brandName}
        </p>

        

        {/* Action Buttons - Always Visible (Horizontal Row) */}
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

export { ProductCard };
