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
            ? `rotateX(${rotate.x}deg) rotateY(${rotate.y}deg) translateY(-8px)`
            : "rotateX(0deg) rotateY(0deg) translateY(0px)",
          transition: isHovered ? "transform 0.12s ease-out, box-shadow 0.25s ease-out" : "transform 0.45s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.45s cubic-bezier(0.16, 1, 0.3, 1)",
          boxShadow: isHovered
            ? "inset 0 2px 2px 0 rgba(255, 255, 255, 1), inset 0 -2px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 1px 0 rgba(255, 255, 255, 0.9), 0 7px 0 0 #ded4e0, 0 8px 3px 0 rgba(137, 7, 84, 0.12), 0 24px 44px -6px rgba(137, 7, 84, 0.22), 0 40px 70px -14px rgba(30, 5, 20, 0.25)"
            : "inset 0 2px 2px 0 rgba(255, 255, 255, 1), inset 0 -2px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 1px 0 rgba(255, 255, 255, 0.9), 0 4.5px 0 0 #e8dee9, 0 5.5px 2px 0 rgba(137, 7, 84, 0.08), 0 16px 32px -4px rgba(40, 10, 30, 0.14), 0 30px 52px -12px rgba(20, 5, 15, 0.18)",
        }}
        className="group relative bg-gradient-to-b from-white via-[#fcfbfd] to-[#f6eff5] rounded-xl sm:rounded-2xl border border-white/95 ring-1 ring-black/[0.04] w-full h-full flex flex-col cursor-pointer select-none overflow-hidden"
      >
        {/* ── Image Stage (Full Product Fit, Zero Top Crop, 3D Floating Layer) ── */}
        <div
          style={{ transformStyle: "preserve-3d" }}
          className="relative aspect-square w-full bg-gradient-to-b from-white to-pink-50/15 border-b border-gray-100/80 flex items-center justify-center p-2.5 sm:p-3.5 pt-3 sm:pt-4"
        >
          {/* Badge (Top-Left) */}
          <div
            style={{ transform: "translateZ(24px)" }}
            className="absolute top-2 left-2 z-20 pointer-events-none"
          >
            <span
              className={`inline-flex items-center gap-0.5 ${badge.color} text-[7px] xs:text-[8px] sm:text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full shadow-2xs`}
            >
              {"icon" in badge && badge.icon && (
                <Flame size={7} className="fill-amber-400 text-amber-400 shrink-0 sm:w-2.5 sm:h-2.5" />
              )}
              {badge.label}
            </span>
          </div>

          {/* 3D Realistic Grounding Shadow beneath product bottle */}
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

        {/* ── Info Area (Original Clean Layout Restored) ── */}
        <div
          style={{ transform: "translateZ(18px)" }}
          className={`flex flex-col flex-1 justify-between bg-transparent ${
            compact
              ? "p-1.5 sm:p-2 pb-2 sm:pb-2.5 gap-0.5"
              : "p-2 sm:p-2.5 pb-2.5 sm:pb-3 gap-0.5 sm:gap-1"
          }`}
        >
          <div className="flex flex-col gap-0.5">
            {/* Brand */}
            <p className="text-[7.5px] xs:text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-[#890754]/80 leading-none truncate">
              {brandName}
            </p>

            {/* Product Name — Crystal clear readable sans-serif typography */}
            <h3
              className={`font-sans font-semibold text-[11px] xs:text-[12px] sm:text-[13px] md:text-[13.5px] text-gray-900 leading-[1.2] transition-colors group-hover:text-[#890754] ${
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

          {/* Price & Add to Cart Action Row (Original Clean Cart Button Restored) */}
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

            {/* Cart Icon Button (Original Clean Button with No Background) */}
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
