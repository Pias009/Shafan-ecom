"use client";

import { memo, useState } from "react";
import Image from "next/image";
import { ShoppingCart, Flame, Star, Package, Check } from "lucide-react";
import { motion } from "framer-motion";
import { Price } from "./Price";
import { hasValidPrice, resolveProductPrice } from "@/lib/product-utils";
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
  onQuickView?: (product: unknown) => void;
  onAddToCart: (product: unknown) => void;
  onOrderNow?: (product: unknown) => void;
  compact?: boolean;
  priority?: boolean;
}

const ProductCardComponent = function ProductCard({
  product,
  onAddToCart,
  compact = false,
  priority = false,
}: ProductCardProps) {
  const router = useRouter();
  const { selectedCountry } = useCountryStore();
  const hasHydrated = useCountryStoreReady();
  const [justAdded, setJustAdded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    e.currentTarget.style.transform = `rotateX(${-y * 10}deg) rotateY(${x * 10}deg) translateY(-8px)`;
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsHovered(true);
    router.prefetch(`/products/${product.slug || product.id}`);
    e.currentTarget.style.transition = "transform 0.1s ease-out, box-shadow 0.25s ease-out";
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsHovered(false);
    e.currentTarget.style.transition = "transform 0.45s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.45s cubic-bezier(0.16, 1, 0.3, 1)";
    e.currentTarget.style.transform = "rotateX(0deg) rotateY(0deg) translateY(0px)";
  };

  if (!hasHydrated) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm w-full animate-pulse overflow-hidden">
        <div className="aspect-square bg-gray-50 w-full mb-3" />
        <div className="space-y-2 px-3 pb-3">
          <div className="h-2.5 bg-gray-100 rounded w-1/3" />
          <div className="h-4 bg-gray-100 rounded" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
        </div>
      </div>
    );
  }

  if (!hasValidPrice(product, selectedCountry)) return null;

  const resolved = resolveProductPrice(product, selectedCountry);
  if (!resolved.available) return null;

  const displayPrice = resolved.displayPrice;
  const originalPrice = resolved.originalPrice;
  const hasDiscount = resolved.hasDiscount;
  const priceCurrency = resolved.currency;

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
    hasDiscount && displayPrice > 0 && originalPrice > displayPrice
      ? Math.round(((originalPrice - displayPrice) / originalPrice) * 100)
      : 0;

  const badge = (() => {
    if (isNotAvailable) return { label: "OUT OF STOCK", color: "bg-black/40 backdrop-blur-sm text-white" };
    if (product.hot || product.trending) return { label: "BEST SELLER", color: "bg-[#890754] text-white shadow-xs", icon: true };
    if (hasDiscount) return { label: `-${discountPct}%`, color: "bg-[#890754] text-white shadow-xs" };
    return { label: "NEW", color: "bg-[#890754] text-white shadow-xs" };
  })();

  const imgSrc = isValidImageUrl(product.imageUrl || product.mainImage)
    ? getOptimizedUrl(product.imageUrl || product.mainImage || "", 400)
    : "/placeholder-product.png";

  return (
    <div style={{ perspective: "1000px" }} className="w-full h-full">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-20px" }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        onMouseEnter={handleMouseEnter}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={(e) => {
          e.stopPropagation();
          router.push(`/products/${product.slug || product.id}`);
        }}
        style={{
          transformStyle: "preserve-3d",
          willChange: "transform",
          boxShadow: isHovered
            ? "0 22px 45px -10px rgba(137, 7, 84, 0.18), 0 12px 24px -6px rgba(0, 0, 0, 0.06), 0 0 0 1.5px rgba(137, 7, 84, 0.2)"
            : "0 6px 24px -4px rgba(0, 0, 0, 0.05), 0 2px 8px -2px rgba(0, 0, 0, 0.03), 0 0 0 1px rgba(0, 0, 0, 0.07)",
        }}
        className="group relative bg-white rounded-xl sm:rounded-2xl w-full h-full flex flex-col cursor-pointer select-none overflow-hidden transition-all duration-300"
      >
        {/* ── Image Stage (Full Product Fit, Pure White Background, 3D Layering) ── */}
        <div
          style={{ transformStyle: "preserve-3d" }}
          className="relative aspect-square w-full bg-white flex items-center justify-center overflow-hidden"
        >
          {/* Badge (Top-Left) */}
          <div
            style={{ transform: "translateZ(28px)" }}
            className="absolute top-2 left-2 z-20 pointer-events-none"
          >
            <span
              className={`inline-flex items-center gap-0.5 ${badge.color} text-[7px] xs:text-[7.5px] sm:text-[8.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-sm`}
            >
              {"icon" in badge && badge.icon && (
                <Flame size={7} className="fill-amber-400 text-amber-400 shrink-0 sm:w-2 sm:h-2" />
              )}
              {badge.label}
            </span>
          </div>

          {/* 3D Realistic Grounding Shadow beneath product bottle */}
          <div
            style={{ transform: "translateZ(8px)" }}
            className="absolute bottom-2 left-1/2 -translate-x-1/2 w-3/4 h-2 bg-[#890754]/20 rounded-[100%] blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none"
          />

          {/* Product Image — Fits card edge-to-edge with 3D pop effect */}
          <div
            style={{
              transform: isHovered
                ? "translateZ(36px) scale(1.07)"
                : "translateZ(12px) scale(1)",
              transition: isHovered
                ? "transform 0.15s ease-out"
                : "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
            className="relative w-full h-full pointer-events-none flex items-center justify-center p-2"
          >
            <Image
              src={imgSrc}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-contain object-center drop-shadow-md group-hover:scale-105 transition-all duration-300"
              priority={priority}
            />
          </div>
        </div>

        {/* ── Info Area (Trimmed Height, No Border) ── */}
        <div
          style={{ transform: "translateZ(18px)" }}
          className={`flex flex-col flex-1 justify-between bg-transparent ${
            compact
              ? "px-2 py-1 pb-0.5 gap-0.5"
              : "px-2 sm:px-2.5 pt-1 sm:pt-1.5 pb-0.5 sm:pb-1 gap-0.5"
          }`}
        >
          <div className="flex flex-col gap-0.5">
            {/* Brand */}
            <p className="text-[7px] xs:text-[7.5px] sm:text-[8px] font-bold uppercase tracking-wider text-[#890754]/80 leading-none truncate">
              {brandName}
            </p>

            {/* Product Name — Crystal clear readable typography */}
            <h3
              className={`font-sans font-semibold text-[11px] xs:text-[11.5px] sm:text-[12.5px] md:text-[13px] text-gray-900 leading-[1.18] transition-colors group-hover:text-[#890754] ${
                compact ? "line-clamp-1 sm:line-clamp-2" : "line-clamp-2"
              }`}
            >
              {product.name}
            </h3>

            {/* Stars */}
            <div className="flex items-center gap-0.5 mt-0">
              <div className="flex shrink-0">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={7}
                    className={i < Math.round(rating) ? "text-amber-400 fill-amber-400 sm:w-2 sm:h-2" : "text-slate-200 fill-slate-200 sm:w-2 sm:h-2"}
                  />
                ))}
              </div>
              <span className="text-[7px] sm:text-[8px] font-bold text-gray-400 truncate">({reviewCount})</span>
            </div>
          </div>

          {/* Price & Add to Cart Action Row (No Border, Tight Spacing) */}
          <div className="pt-0.5 pb-0 flex items-center justify-between gap-1">
            {/* Price */}
            <div className="flex flex-col sm:flex-row sm:items-baseline gap-0.5 sm:gap-1 leading-none min-w-0">
              <Price
                amount={displayPrice}
                className="text-[11.5px] xs:text-[12px] sm:text-[14px] md:text-[15px] font-black text-[#890754] tracking-tight leading-none"
                countryPrices={product.countryPrices as CountryPrice[]}
                currency={priceCurrency}
              />
              {hasDiscount && (
                <span className="text-[8px] sm:text-[9px] text-gray-400 line-through font-bold truncate leading-none">
                  <Price amount={originalPrice} countryPrices={product.countryPrices as CountryPrice[]} currency={priceCurrency} />
                </span>
              )}
            </div>

            {/* Cart Icon Button (Homepage style: solid maroon circle) */}
            <button
              type="button"
              disabled={isNotAvailable}
              onClick={(e) => {
                e.stopPropagation();
                onAddToCart(product);
                setJustAdded(true);
                setTimeout(() => setJustAdded(false), 1400);
              }}
              className={`w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 rounded-full flex items-center justify-center shrink-0 shadow-xs transition-all duration-200 active:scale-90 ${
                isNotAvailable
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                  : justAdded
                  ? "bg-emerald-600 text-white scale-110"
                  : "bg-[#890754] hover:bg-[#540434] text-white"
              }`}
              aria-label="Add to Cart"
              title={isNotAvailable ? "Sold Out" : "Add to Cart"}
            >
              {isNotAvailable ? (
                <Package size={14} className="w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4" strokeWidth={2} />
              ) : justAdded ? (
                <Check size={14} className="w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4" strokeWidth={3} />
              ) : (
                <ShoppingCart className="w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4" />
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
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
