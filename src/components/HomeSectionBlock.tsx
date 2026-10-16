"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { FlashSalesSlider } from "@/components/FlashSalesSlider";

interface HomeSection {
  id: string;
  title: string;
  badge?: string | null;
  categoryName?: string | null;
  products: any[];
}

interface HomeSectionBlockProps {
  section: HomeSection;
  isAr?: boolean;
  onQuickView: (product: any) => void;
  addToCart: (product: any) => void;
  orderNow: (product: any) => void;
}

// Admin-built homepage row (/ueadmin/home-sections). Deliberately mirrors the
// Flash Sales header bar + slider so every curated row looks the same.
export function HomeSectionBlock({ section, isAr = false, onQuickView, addToCart, orderNow }: HomeSectionBlockProps) {
  if (section.products.length === 0) return null;

  const seeAllHref = section.categoryName
    ? `/products?category=${encodeURIComponent(section.categoryName)}`
    : "/products";

  return (
    <section className="relative w-full py-4 sm:py-6 md:py-8 select-none">
      {/* Ultra-Slim Section Header Bar */}
      <div className="mb-4 sm:mb-6 md:mb-8 relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-[#3e0325] via-[#540434] to-[#3e0325] backdrop-blur-xl border border-pink-500/20 px-3 py-2 sm:px-5 sm:py-2.5 shadow-[0_8px_32px_rgba(84,4,52,0.2)]">
        {/* Glow accent */}
        <div className="absolute -top-12 -left-12 w-40 h-40 bg-pink-500/15 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-8 right-12 w-36 h-36 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative flex items-center justify-between gap-2 sm:gap-4 flex-nowrap">
          <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0 shrink">
            <h2 className="font-sans text-sm sm:text-base md:text-xl font-black tracking-tight text-white uppercase truncate">
              {section.title}
            </h2>
            {section.badge && (
              <span className="inline-flex items-center bg-[#890754] border border-pink-400/40 text-white text-[7.5px] sm:text-[9.5px] font-bold uppercase tracking-wider px-1.5 sm:px-2 py-0.5 rounded-full shrink-0">
                {section.badge}
              </span>
            )}
          </div>

          <Link
            href={seeAllHref}
            className="inline-flex items-center gap-1 sm:gap-1.5 text-white hover:text-pink-200 transition-colors text-[11px] sm:text-xs font-bold uppercase tracking-wider active:scale-95 shrink-0 whitespace-nowrap"
          >
            <span>{isAr ? "عرض الكل" : "See All"}</span>
            <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </Link>
        </div>
      </div>

      <FlashSalesSlider products={section.products} onQuickView={onQuickView} addToCart={addToCart} orderNow={orderNow} />
    </section>
  );
}
