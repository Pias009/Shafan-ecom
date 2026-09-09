"use client";

import { memo, useState } from "react";
import Image from "next/image";
import { ShoppingCart, Flame, Star, Package } from "lucide-react";
import { motion } from "framer-motion";
import { Price } from "./Price";
import { useLanguageStore } from "@/lib/language-store";
import { translations } from "@/lib/translations";
import { hasValidPrice, getDisplayPrice } from "@/lib/product-utils";
import { useCountryStore, useCountryStoreReady } from "@/lib/country-store";
import { getOptimizedUrl } from "@/lib/cloudinary-url";
import { useRouter } from "next/navigation";

function isValidImageUrl(url: unknown): boolean {
  if (!url || typeof url !== "string") return false;
  return url.startsWith("/") || url.startsWith("http");
}

export interface CountryPrice {
  country: string;
  price: number;
  currency: string;
}

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    slug?: string;
    brand?: string | { name: string };
    price: number;
    discountPrice?: number;
    salePrice?: number;
    salePriceCents?: number;
    imageUrl: string;
    mainImage?: string;
    hot?: boolean;
    trending?: boolean;
    averageRating?: number;
    ratingCount?: number;
    stockQuantity?: number;
    totalSales?: number;
    freeDelivery?: boolean;
    countryPrices?: CountryPrice[] | Record<string, unknown>[] | unknown[];
  };
  onQuickView: (product: unknown) => void;
  onAddToCart: (product: unknown) => void;
  onOrderNow?: (product: unknown) => void;
  compact?: boolean;
  priority?: boolean;
}

const ProductCardComponent = function ProductCard({
  product,
  onQuickView,
  onAddToCart,
  onOrderNow,
  compact = false,
  priority = false,
}: ProductCardProps) {
  const router = useRouter();
  const { currentLanguage } = useLanguageStore();
  const t = translations[currentLanguage.code as keyof typeof translations];
  const { selectedCountry } = useCountryStore();
  const hasHydrated = useCountryStoreReady();
  const [justAdded, setJustAdded] = useState(false);

  if (!hasHydrated) {
    return (
      <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 w-full animate-pulse overflow-hidden">
        <div className="aspect-square bg-white/5 w-full mb-3" />
        <div className="space-y-2 px-3 pb-3">
          <div className="h-2.5 bg-white/20 rounded w-1/3" />
          <div className="h-4 bg-white/20 rounded" />
          <div className="h-4 bg-white/30 rounded w-1/2" />
        </div>
      </div>
    );
  }

  if (!hasValidPrice(product, selectedCountry)) return null;

  const displayPrice = (() => {
    const { price: countryPrice } = getDisplayPrice(product, selectedCountry);
    return countryPrice > 0 ? countryPrice : product.price || 0;
  })();

  const salePrice = product.discountPrice || product.salePrice || product.salePriceCents || 0;
  const hasDiscount = salePrice > 0 && salePrice < displayPrice;

  if (!displayPrice || displayPrice <= 0) return null;

  const isNotAvailable =
    typeof product.stockQuantity === "number" && product.stockQuantity <= 0;

  const brandName =
    typeof product.brand === "string"
      ? product.brand
      : product.brand?.name || "SHANFA";

  const rating = product.averageRating || 4.9;
  const reviewCount = product.ratingCount || 245;
  const discountPct =
    hasDiscount && displayPrice > 0
      ? Math.round(((displayPrice - salePrice) / displayPrice) * 100)
      : 0;

  const badge = (() => {
    if (isNotAvailable) return { label: "OUT OF STOCK", color: "bg-black/40 backdrop-blur-sm text-white" };
    if (product.hot || product.trending) return { label: "BEST SELLER", color: "bg-white text-[#890754] shadow-xs", icon: true };
    if (hasDiscount) return { label: `-${discountPct}%`, color: "bg-[#890754] text-white shadow-xs" };
    return { label: "NEW", color: "bg-white text-[#890754] shadow-xs" };
  })();

  const imgSrc = isValidImageUrl(product.imageUrl || product.mainImage)
    ? getOptimizedUrl(product.imageUrl || product.mainImage || "", 400)
    : "/placeholder-product.png";

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-20px" }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      onMouseEnter={() => router.prefetch(`/products/${product.slug || product.id}`)}
      onClick={(e) => {
        e.stopPropagation();
        router.push(`/products/${product.slug || product.id}`);
      }}
      className="group relative bg-white rounded-xl sm:rounded-2xl border border-gray-100 hover:border-pink-200 shadow-xs hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 overflow-hidden w-full h-full flex flex-col cursor-pointer transform-gpu select-none"
    >
      {/* ── Image Stage (Full Product Fit, Zero Crop) ── */}
      <div className="relative aspect-square w-full bg-white overflow-hidden border-b border-gray-100 p-2 sm:p-2.5 flex items-center justify-center">
        {/* Badge (Top-Left) */}
        <div className="absolute top-1.5 left-1.5 z-20 pointer-events-none">
          <span
            className={`inline-flex items-center gap-0.5 ${badge.color} text-[7px] xs:text-[8px] sm:text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full shadow-2xs`}
          >
            {"icon" in badge && badge.icon && (
              <Flame size={7} className="fill-amber-400 text-amber-400 shrink-0 sm:w-2.5 sm:h-2.5" />
            )}
            {badge.label}
          </span>
        </div>

        {/* Product Image — Fully fitted, zero cropping */}
        <div className="relative w-full h-full">
          <Image
            src={imgSrc}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-contain transition-transform duration-500 ease-out group-hover:scale-105"
            priority={priority}
          />
        </div>
      </div>

      {/* ── Info Area ── */}
      <div className="flex flex-col flex-1 justify-between p-1.5 sm:py-2 sm:px-2.5 bg-white gap-0.5 sm:gap-1">
        <div className="flex flex-col gap-0.5">
          {/* Brand */}
          <p className="text-[7.5px] xs:text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-[#890754]/80 leading-none truncate">
            {brandName}
          </p>

          {/* Product Name — Crystal clear readable sans-serif typography */}
          <h3 className="font-sans font-semibold text-[11px] xs:text-[12px] sm:text-[13px] md:text-[13.5px] text-gray-900 leading-[1.25] line-clamp-2 group-hover:text-[#890754] transition-colors">
            {product.name}
          </h3>

          {/* Stars */}
          <div className="flex items-center gap-0.5 mt-0.5">
            <div className="flex shrink-0">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={7}
                  className={i < Math.round(rating) ? "text-amber-400 fill-amber-400 sm:w-2 sm:h-2" : "text-slate-200 fill-slate-200 sm:w-2 sm:h-2"}
                />
              ))}
            </div>
            <span className="text-[7px] sm:text-[8.5px] font-bold text-gray-400 truncate">({reviewCount})</span>
          </div>
        </div>

        {/* Price & Add to Cart Action Row */}
        <div className="pt-0.5 sm:pt-1 flex items-center justify-between gap-1 border-t border-gray-100">
          {/* Price */}
          <div className="flex flex-col sm:flex-row sm:items-baseline gap-0.5 sm:gap-1 leading-none min-w-0">
            <Price
              amount={hasDiscount ? salePrice : displayPrice}
              className="text-[12px] xs:text-[13px] sm:text-[15px] md:text-base font-black text-[#890754] tracking-tight"
              countryPrices={product.countryPrices as CountryPrice[]}
            />
            {hasDiscount && (
              <span className="text-[8.5px] sm:text-[10px] text-gray-400 line-through font-bold truncate">
                <Price amount={displayPrice} countryPrices={product.countryPrices as CountryPrice[]} />
              </span>
            )}
          </div>

          {/* Cart Icon Button (Bigger, No Background) */}
          <button
            type="button"
            disabled={isNotAvailable}
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart(product);
              setJustAdded(true);
              setTimeout(() => setJustAdded(false), 1400);
            }}
            className={`p-1 bg-transparent flex items-center justify-center shrink-0 transition-all duration-200 active:scale-90 ${
              isNotAvailable
                ? "text-slate-300 cursor-not-allowed"
                : justAdded
                ? "text-[#890754] scale-110"
                : "text-[#890754] hover:text-[#540434] hover:scale-110"
            }`}
            aria-label="Add to Cart"
            title={isNotAvailable ? "Sold Out" : "Add to Cart"}
          >
            {isNotAvailable ? (
              <Package size={17} className="sm:w-5 sm:h-5" strokeWidth={2} />
            ) : justAdded ? (
              <span className="text-xs sm:text-sm font-black text-emerald-600 leading-none">✓</span>
            ) : (
              <ShoppingCart size={17} className="sm:w-5 sm:h-5" strokeWidth={2.2} />
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

const ProductCard = memo(ProductCardComponent, (prevProps, nextProps) => {
  return (
    prevProps.product.id === nextProps.product.id &&
    prevProps.priority === nextProps.priority &&
    prevProps.compact === nextProps.compact
  );
});

ProductCard.displayName = "ProductCard";

export { ProductCard };
