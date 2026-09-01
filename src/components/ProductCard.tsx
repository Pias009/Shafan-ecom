"use client";

import { memo, useState } from "react";
import Image from "next/image";
import { ShoppingCart, Flame, Star, Eye, Heart, Package } from "lucide-react";
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
  const [isLiked, setIsLiked] = useState(false);

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
    if (product.hot || product.trending) return { label: "BEST SELLER", color: "bg-white text-[#0c433a]", icon: true };
    if (hasDiscount) return { label: `-${discountPct}%`, color: "bg-rose-500 text-white" };
    return { label: "NEW", color: "bg-white text-[#0c433a]" };
  })();

  const imgSrc = isValidImageUrl(product.imageUrl || product.mainImage)
    ? getOptimizedUrl(product.imageUrl || product.mainImage || "", 400)
    : "/placeholder-product.png";

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.42, ease: "easeOut" }}
      onMouseEnter={() => router.prefetch(`/products/${product.slug || product.id}`)}
      onClick={(e) => {
        e.stopPropagation();
        router.push(`/products/${product.slug || product.id}`);
      }}
      className="group relative bg-white/70 backdrop-blur-2xl rounded-2xl border border-white/60 hover:border-white shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden w-full h-full flex flex-col cursor-pointer transform-gpu"
    >
      {/* ── Image Stage (Solid White so White-BG photos blend 100% seamlessly) ── */}
      <div className="relative aspect-square w-full bg-white flex items-center justify-center p-2 sm:p-4 overflow-hidden border-b border-black/5">

        {/* Badge (Top-Left) */}
        <div className="absolute top-2.5 left-2.5 z-20">
          <span
            className={`inline-flex items-center gap-1 ${badge.color} text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-sm`}
          >
            {"icon" in badge && badge.icon && (
              <Flame size={9} className="fill-amber-400 text-amber-400" />
            )}
            {badge.label}
          </span>
        </div>

        {/* Wishlist Heart (Top-Right) */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setIsLiked((v) => !v); }}
          className={`absolute top-2.5 right-2.5 z-20 w-7 h-7 sm:w-8 sm:h-8 rounded-full border flex items-center justify-center transition-all duration-300 shrink-0 active:scale-90 transform-gpu shadow-sm ${
            isLiked
              ? "bg-rose-500 border-rose-500 text-white"
              : "bg-white/80 backdrop-blur-md border-black/5 text-[#042b24]/60 hover:text-rose-500 hover:bg-white"
          }`}
        >
          <Heart size={13} className={isLiked ? "fill-white" : ""} />
        </button>

        {/* Product Image */}
        <div className="relative w-full h-full overflow-hidden flex items-center justify-center">
          <Image
            src={imgSrc}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 45vw, (max-width: 1024px) 28vw, 20vw"
            className="object-contain p-1 sm:p-2 transition-transform duration-500 ease-out group-hover:scale-105"
            priority={priority}
          />
        </div>
      </div>

      {/* ── Info Area ── */}
      <div className="flex flex-col flex-1 justify-between p-2.5 sm:p-3.5 bg-white/30">
        <div>
          {/* Brand */}
          <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-[#042b24]/50 mb-0.5 leading-none truncate">
            {brandName}
          </p>

          {/* Product Name */}
          <h3 className="font-serif font-bold text-xs sm:text-sm md:text-base text-[#042b24] leading-snug line-clamp-2 min-h-[2rem] sm:min-h-[2.4rem] group-hover:text-black transition-colors mb-1">
            {product.name}
          </h3>

          {/* Stars */}
          <div className="flex items-center gap-1 mb-1.5">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={9}
                  className={i < Math.round(rating) ? "text-amber-400 fill-amber-400" : "text-slate-200 fill-slate-200"}
                />
              ))}
            </div>
            <span className="text-[9px] font-bold text-[#52736b]">({reviewCount})</span>
          </div>
        </div>

        <div>
          {/* Price */}
          <div className="flex items-baseline gap-1.5 mb-2">
            <Price
              amount={hasDiscount ? salePrice : displayPrice}
              className="text-xs sm:text-base font-black text-[#042b24]"
              countryPrices={product.countryPrices as CountryPrice[]}
            />
            {hasDiscount && (
              <span className="text-[10px] text-[#72ccbd] line-through font-bold">
                <Price amount={displayPrice} countryPrices={product.countryPrices as CountryPrice[]} />
              </span>
            )}
          </div>

          {/* Full-width Add to Cart Button */}
          <button
            type="button"
            disabled={isNotAvailable}
            onClick={(e) => { e.stopPropagation(); onAddToCart(product); }}
            className={`w-full py-1.5 sm:py-2 px-2 sm:px-3 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all duration-300 shadow-sm active:scale-[0.98] ${
              isNotAvailable
                ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                : "bg-[#0c433a] hover:bg-[#072a24] text-white shadow-[#0c433a]/20"
            }`}
          >
            {isNotAvailable ? (
              <>
                <Package size={12} />
                <span>Out of Stock</span>
              </>
            ) : (
              <>
                <ShoppingCart size={12} />
                <span>Add to Cart</span>
              </>
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
