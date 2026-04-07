"use client";

import Image from "next/image";
import { ShoppingBag, Star, Package, TrendingUp, ShoppingCart } from "lucide-react";
import { Price } from "./Price";
import { useLanguageStore } from "@/lib/language-store";
import { translations } from "@/lib/translations";
import { getDisplayPrice } from "@/lib/product-utils";
import { useCountryStore } from "@/lib/country-store";

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
  const { currentLanguage } = useLanguageStore();
  const t = translations[currentLanguage.code as keyof typeof translations];
  const { selectedCountry } = useCountryStore();

  // Get country-specific price
  const { price: countryPrice } = getDisplayPrice(product, selectedCountry);
  const basePrice = product.discountPrice ?? product.price;
  const price = countryPrice > 0 ? countryPrice : basePrice;
  const hasDiscount = countryPrice > 0 && product.discountPrice && product.discountPrice < countryPrice;

  // Safely get the brand name as a string
  const brandName = typeof product.brand === "string"
    ? product.brand
    : product.brand?.name || "Shafan Global";

  return (
    <div className={`el-wrapper group ${compact ? 'w-[140px]' : 'w-[160px] sm:w-[180px] md:w-[200px] lg:w-[220px]'} mx-auto bg-white shadow-lg hover:shadow-2xl active:shadow-2xl transition-all duration-300 rounded-2xl overflow-hidden flex flex-col h-[280px] sm:h-[300px] md:h-[320px] lg:h-[340px]`}>
      {/* Box Up - Image Section */}
      <div className="box-up relative overflow-hidden h-[140px] sm:h-[160px] md:h-[180px] lg:h-[200px] w-full bg-gray-50 flex-shrink-0">
        <button
          type="button"
          onClick={() => onQuickView(product)}
          className="w-full h-full relative block"
        >
          <Image
            src={isValidImageUrl(product.imageUrl) ? product.imageUrl : "/placeholder-product.png"}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="img object-cover transition-all duration-700 ease-out group-hover:blur-[4px] group-hover:opacity-40 active:blur-[4px] active:opacity-40"
          />

          {/* Badges */}
          <div className="absolute top-1.5 sm:top-2 left-1.5 sm:left-2 flex flex-col gap-0.5 sm:gap-1 z-20">
            {product.hot && (
              <span className="bg-black text-white text-[7px] sm:text-[8px] px-1.5 sm:px-2 py-0.5 sm:py-1 font-black uppercase tracking-widest rounded-full shadow-lg">
                {t.home.trendingNow}
              </span>
            )}
            {hasDiscount && (
              <span className="bg-white/90 backdrop-blur-md text-black text-[7px] sm:text-[8px] px-1.5 sm:px-2 py-0.5 sm:py-1 font-black uppercase tracking-widest rounded-full shadow-lg border border-black/5">
                Sale
              </span>
            )}
          </div>
        </button>

        {/* Hover Background */}
        <div className="h-bg absolute top-0 left-0 w-full h-full bg-gradient-to-br from-emerald-600/95 to-teal-600/95 backdrop-blur-sm -translate-x-full transition-all duration-700 ease-out group-hover:translate-x-0 active:translate-x-0"></div>

        {/* Cart Overlay - Shows on Hover */}
        <div className="cart absolute top-0 left-0 w-full h-full pointer-events-none flex flex-col items-center justify-center">
          {/* Price - Shows on Hover */}
          <div className="price mb-2 sm:mb-3 md:mb-4 text-lg sm:text-xl md:text-2xl font-black text-white transition-all duration-600 ease-out delay-100 opacity-0 group-hover:opacity-100 active:opacity-100 transform translate-y-4 group-hover:translate-y-0 active:translate-y-0" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
            <Price
              amount={price}
              countryPrices={product.countryPrices}
              showSymbolSmall
            />
          </div>
          
          {/* Action Buttons - Vertical View */}
          <div className="flex flex-col gap-1.5 sm:gap-2 md:gap-3 transition-all duration-600 ease-out delay-200 opacity-0 group-hover:opacity-100 active:opacity-100 transform translate-y-4 group-hover:translate-y-0 active:translate-y-0">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOrderNow?.(product);
              }}
              className="bg-white text-emerald-600 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-full font-black text-[8px] sm:text-[9px] md:text-[10px] uppercase tracking-widest transition-all duration-300 hover:scale-105 hover:shadow-xl active:scale-95 pointer-events-auto whitespace-nowrap"
            >
              Order NOW
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onQuickView(product);
              }}
              className="bg-white text-black px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-full font-black text-[8px] sm:text-[9px] md:text-[10px] uppercase tracking-widest transition-all duration-300 hover:scale-105 hover:shadow-xl hover:bg-gray-100 active:scale-95 pointer-events-auto whitespace-nowrap"
            >
              View
            </button>
          </div>
        </div>
      </div>

      {/* Box Down - Info Section */}
      <div className="box-down relative overflow-hidden bg-white p-2 sm:p-3 flex flex-col flex-1 min-h-0">
        {/* Price - Always Visible - Above Title */}
        <div className="flex items-baseline gap-1 sm:gap-2 mb-1.5 sm:mb-2 justify-start flex-shrink-0">
          <Price
            amount={price}
            countryPrices={product.countryPrices}
            className="text-xs sm:text-sm md:text-base font-black text-black"
          />
          {hasDiscount && (
            <Price amount={product.price} className="text-[10px] sm:text-xs text-red-500 line-through font-bold" />
          )}
        </div>

        <div className="info-inner mb-1.5 sm:mb-2 flex-1 min-h-0 overflow-hidden">
          <span className="p-name block font-display text-[10px] sm:text-xs md:text-sm font-bold text-black leading-tight line-clamp-2">
            {product.name}
          </span>
          <span className="p-company block font-body text-[7px] sm:text-[8px] md:text-[9px] uppercase text-gray-500 tracking-wider">
            {brandName}
          </span>
        </div>

        {/* Add to Cart Button - Always Visible */}
        <div className="flex justify-center flex-shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart(product);
            }}
            className="add-to-cart-btn w-full max-w-full"
            data-tooltip="Added!"
          >
            <span className="text">Add to Cart</span>
            <span className="icon">
              <ShoppingCart />
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
