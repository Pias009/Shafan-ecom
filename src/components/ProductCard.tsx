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
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setRotate({ x: -y * 10, y: x * 10 });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    router.prefetch(`/products/${product.slug || product.id}`);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotate({ x: 0, y: 0 });
  };

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
    <div style={{ perspective: "1000px" }} className="w-full h-full">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
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
          transform: isHovered
            ? `rotateX(${rotate.x}deg) rotateY(${rotate.y}deg) translateY(-6px)`
            : "rotateX(0deg) rotateY(0deg) translateY(0px)",
          transition: isHovered ? "transform 0.1s ease-out" : "transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
        className="group relative bg-gradient-to-b from-white via-[#fcfbfd] to-[#f6f2f5] rounded-2xl sm:rounded-3xl border border-white/95 ring-1 ring-black/[0.04] shadow-[0_16px_36px_-8px_rgba(20,5,15,0.07),0_4px_12px_-2px_rgba(0,0,0,0.03),inset_0_1.5px_2px_0_rgba(255,255,255,1),inset_0_-2px_4px_0_rgba(137,7,84,0.03)] hover:shadow-[0_26px_52px_-10px_rgba(137,7,84,0.18),0_8px_20px_-4px_rgba(0,0,0,0.06),inset_0_1.5px_2px_0_rgba(255,255,255,1),inset_0_-2px_4px_0_rgba(137,7,84,0.04)] transition-shadow duration-300 w-full h-full p-2 sm:p-2.5 flex flex-col cursor-pointer select-none"
      >
        {/* ── 3D Inset Product Stage (Spatial Pod, Full Image Fit, No Top Cutout) ── */}
        <div
          style={{ transformStyle: "preserve-3d" }}
          className="relative aspect-square w-full bg-gradient-to-b from-white to-[#faf6f9]/80 border border-white/90 rounded-xl sm:rounded-2xl shadow-[inset_0_2px_5px_rgba(0,0,0,0.03),0_2px_8px_rgba(137,7,84,0.03)] flex items-center justify-center p-2.5 sm:p-3.5 pt-3 sm:pt-4 overflow-hidden"
        >
          {/* 3D Tactile Capsule Badge */}
          <div
            style={{ transform: "translateZ(24px)" }}
            className="absolute top-2 left-2 z-20 pointer-events-none"
          >
            <span
              className={`inline-flex items-center gap-0.5 ${badge.color} text-[7.5px] xs:text-[8px] sm:text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border border-white/80 shadow-[0_2px_6px_rgba(0,0,0,0.07),inset_0_1px_1px_rgba(255,255,255,0.8)]`}
            >
              {"icon" in badge && badge.icon && (
                <Flame size={7} className="fill-amber-400 text-amber-400 shrink-0 sm:w-2.5 sm:h-2.5" />
              )}
              {badge.label}
            </span>
          </div>

          {/* 3D Grounding Contact Shadow beneath product bottle */}
          <div
            style={{ transform: "translateZ(6px)" }}
            className="absolute bottom-2 left-1/2 -translate-x-1/2 w-3/4 h-2 bg-[#890754]/15 rounded-[100%] blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none"
          />

          {/* Product Image — Full fit, zero crop, perfectly centered with no top cutoff */}
          <div
            style={{
              transform: isHovered
                ? "translateZ(26px) scale(1.03)"
                : "translateZ(10px) scale(1)",
              transition: isHovered
                ? "transform 0.15s ease-out"
                : "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
            className="relative w-full h-full pointer-events-none flex items-center justify-center"
          >
            <Image
              src={imgSrc}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-contain object-center drop-shadow-sm group-hover:drop-shadow-xl transition-all duration-300"
              priority={priority}
            />
          </div>
        </div>

        {/* ── Info Area ── */}
        <div
          style={{ transform: "translateZ(18px)" }}
          className="flex flex-col flex-1 justify-between p-1.5 sm:p-2 pt-2 gap-1"
        >
          <div className="flex flex-col gap-0.5">
            {/* Brand */}
            <p className="text-[7.5px] xs:text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-[#890754]/80 leading-none truncate">
              {brandName}
            </p>

            {/* Product Name */}
            <h3
              className={`font-sans font-bold text-[11px] xs:text-[12px] sm:text-[13px] md:text-[13.5px] text-gray-900 leading-[1.2] transition-colors group-hover:text-[#890754] ${
                compact ? "line-clamp-1 sm:line-clamp-2" : "line-clamp-2"
              }`}
            >
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

          {/* Price & 3D Tactile Capsule Pill Action Row */}
          <div className="pt-1 flex items-center justify-between gap-1 border-t border-black/[0.04]">
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

            {/* 3D Tactile Capsule Pill Button (Vision Pro Style) */}
            <button
              type="button"
              disabled={isNotAvailable}
              onClick={(e) => {
                e.stopPropagation();
                onAddToCart(product);
                setJustAdded(true);
                setTimeout(() => setJustAdded(false), 1400);
              }}
              className={`px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-full text-[10px] sm:text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-1 transition-all duration-200 active:scale-95 active:translate-y-0.5 shrink-0 ${
                isNotAvailable
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed shadow-inner"
                  : justAdded
                  ? "bg-emerald-600 text-white shadow-[0_4px_12px_rgba(5,150,105,0.4),inset_0_1px_1px_rgba(255,255,255,0.4)]"
                  : "bg-gradient-to-r from-[#890754] to-[#a30b65] text-white shadow-[0_4px_14px_rgba(137,7,84,0.38),inset_0_1.5px_2px_rgba(255,255,255,0.4)] hover:shadow-[0_6px_18px_rgba(137,7,84,0.5)] hover:brightness-105"
              }`}
              aria-label="Add to Cart"
              title={isNotAvailable ? "Sold Out" : "Add to Cart"}
            >
              {isNotAvailable ? (
                <span className="text-[9px]">Out</span>
              ) : justAdded ? (
                <>
                  <span className="text-xs font-black">✓</span>
                  <span className="text-[9px] hidden xs:inline">Added</span>
                </>
              ) : (
                <>
                  <ShoppingCart size={12} className="shrink-0" strokeWidth={2.5} />
                  <span className="text-[9.5px]">Add</span>
                </>
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
