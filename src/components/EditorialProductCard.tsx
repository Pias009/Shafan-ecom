"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Heart, ShoppingCart } from "lucide-react";
import { Price } from "./Price";
import { useLanguageStore } from "@/lib/language-store";

interface EditorialProductCardProps {
  product: {
    id: string;
    name: string;
    slug?: string;
    price?: number;
    priceCents?: number;
    discountPrice?: number;
    salePrice?: number;
    salePriceCents?: number;
    imageUrl?: string;
    mainImage?: string;
    brandName?: string;
    brand?: { name: string } | string;
    averageRating?: number;
    ratingCount?: number;
    stockQuantity?: number;
    totalSales?: number;
    countryPrices?: any[];
    hot?: boolean;
    trending?: boolean;
    shortDescription?: string;
    description?: string;
  };
  onQuickView?: (product: any) => void;
  onAddToCart?: (product: any) => void;
  onOrderNow?: (product: any) => void;
  priority?: boolean;
  compact?: boolean;
  showAddButton?: boolean;
  className?: string;
}

export function EditorialProductCard({
  product,
  onQuickView,
  onAddToCart,
  onOrderNow,
  priority = false,
  compact = false,
  showAddButton,
  className = "",
}: EditorialProductCardProps) {
  const router = useRouter();
  const { currentLanguage } = useLanguageStore();
  const isAr = currentLanguage?.code === "ar";
  const [isLiked, setIsLiked] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const rawPrice = product.price || product.priceCents || 0;
  const rawSalePrice = product.discountPrice || product.salePrice || product.salePriceCents;
  const hasDiscount = rawSalePrice && rawSalePrice < rawPrice;
  const displayPrice = hasDiscount ? rawSalePrice : rawPrice;
  const discountPct = hasDiscount && rawPrice > 0 ? Math.round(((rawPrice - rawSalePrice) / rawPrice) * 100) : null;

  const brandName = typeof product.brand === "string" ? product.brand : product.brand?.name || product.brandName || "Shafan";
  const shortDesc = product.shortDescription || `${brandName} clinical formula for radiant glow.`;
  const rating = product.averageRating ? product.averageRating.toFixed(1) : "4.9";
  const reviews = product.ratingCount || 75;
  const imgSrc = product.imageUrl || product.mainImage || "/placeholder-product.png";

  const badgeLabel = discountPct
    ? `${discountPct}% OFF`
    : product.hot || product.trending
    ? isAr ? "الأكثر طلباً" : "BEST SELLER"
    : isAr ? "جديد" : "NEW";

  const handleCardClick = () => {
    if (onQuickView) {
      onQuickView(product);
    } else if (product.slug || product.id) {
      router.push(`/products/${product.slug || product.id}`);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className={`group relative bg-white rounded-[20px] sm:rounded-[24px] p-2.5 sm:p-3.5 border border-[#ede4d8] shadow-[0_8px_20px_-6px_rgba(70,45,25,0.06)] hover:shadow-[0_16px_32px_-8px_rgba(70,45,25,0.12)] hover:border-[#dfd2c2] transition-all duration-300 flex flex-col justify-between cursor-pointer select-none h-full ${className}`}
    >
      {/* Top Bar: Pill Tag + Heart Wishlist */}
      <div className="flex items-center justify-between w-full mb-1">
        <span
          className={`px-2 py-0.5 rounded-full text-[7.5px] sm:text-[8.5px] font-black uppercase tracking-wider border ${
            discountPct
              ? "bg-[#fbf0e8] text-[#b44b20] border-[#f2d8c9]"
              : "bg-[#f5ede2] text-[#8a653e] border-[#ebdccb]"
          }`}
        >
          {badgeLabel}
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsLiked((prev) => !prev);
          }}
          aria-label="Save to wishlist"
          className="no-min-size w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white hover:bg-neutral-50 border border-gray-100 shadow-2xs flex items-center justify-center transition-colors"
          style={{ minWidth: 0, minHeight: 0 }}
        >
          <Heart
            size={12}
            className={isLiked ? "text-rose-500 fill-rose-500" : "text-gray-400 hover:text-rose-500"}
          />
        </button>
      </div>

      {/* Clean Floating Product Image */}
      <div className="relative w-full aspect-square max-h-[115px] sm:max-h-[140px] md:max-h-[155px] flex items-center justify-center my-0.5 pointer-events-none">
        <Image
          src={imgSrc}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 140px, 200px"
          className="object-contain p-1 transition-transform duration-500 group-hover:scale-105"
          priority={priority}
        />
      </div>

      {/* Micro 3-Dots below image (matching reference UI) */}
      <div className="flex items-center justify-center gap-1.5 my-1 pointer-events-none">
        <span className="w-1.5 h-1.5 rounded-full bg-[#a67c52]" />
        <span className="w-1.5 h-1.5 rounded-full bg-[#e3d7cb]" />
        <span className="w-1.5 h-1.5 rounded-full bg-[#e3d7cb]" />
      </div>

      {/* Title & Description */}
      <div className="flex flex-col mt-0.5">
        <h3 className="font-serif font-bold text-[11px] sm:text-xs md:text-[13px] text-gray-900 line-clamp-1 group-hover:text-[#890754] transition-colors leading-snug">
          {product.name}
        </h3>
        <p className="text-[8.5px] sm:text-[9.5px] text-gray-500 font-normal line-clamp-1 sm:line-clamp-2 leading-tight mt-0.5 min-h-[12px] sm:min-h-[22px]">
          {shortDesc}
        </p>

        {/* Star Rating */}
        <div className="flex items-center gap-1 mt-0.5 text-[8.5px] sm:text-[9.5px] font-semibold text-gray-800">
          <span className="text-amber-500 text-[11px] leading-none">★</span>
          <span>{rating}</span>
          <span className="text-gray-400 font-normal">({reviews})</span>
        </div>
      </div>

      {/* Bottom Action Bar: Price + Add to Cart Button */}
      <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-gray-100/80">
        <div className="flex flex-col">
          <Price
            amount={displayPrice}
            countryPrices={product.countryPrices}
            className="font-serif font-bold text-xs sm:text-sm text-gray-900"
          />
          {hasDiscount && (
            <Price
              amount={rawPrice}
              countryPrices={product.countryPrices}
              className="text-[9px] text-gray-400 line-through font-medium -mt-0.5"
            />
          )}
        </div>

        {/* Button: Wide Pill or Quick Cart Icon */}
        {showAddButton ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onAddToCart) onAddToCart(product);
              setJustAdded(true);
              setTimeout(() => setJustAdded(false), 1200);
            }}
            className="no-min-size inline-flex items-center justify-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg sm:rounded-xl bg-[#b0875c] hover:bg-[#99734b] active:scale-95 text-white text-[9.5px] sm:text-[10.5px] font-bold shadow-xs transition-all"
            style={{ minWidth: 0, minHeight: 0 }}
          >
            <ShoppingCart size={11} className="stroke-[2.2]" />
            <span>{justAdded ? "Added!" : "Add to Cart"}</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onAddToCart) onAddToCart(product);
              setJustAdded(true);
              setTimeout(() => setJustAdded(false), 1200);
            }}
            aria-label="Add to cart"
            className="no-min-size w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-[#f5ede2] hover:bg-[#b0875c] text-[#8a653e] hover:text-white active:scale-95 flex items-center justify-center transition-all shadow-2xs"
            style={{ minWidth: 0, minHeight: 0 }}
          >
            {justAdded ? (
              <span className="text-xs font-black text-emerald-600">✓</span>
            ) : (
              <ShoppingCart size={12} className="stroke-[2.2]" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}
