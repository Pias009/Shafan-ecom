"use client";

import { Gift } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";

interface OfferSection {
  id: string;
  title: string;
  subtitle?: string | null;
  products: any[];
}

interface OfferSectionBlockProps {
  sections: OfferSection[];
  onQuickView: (product: any) => void;
  addToCart: (product: any) => void;
  orderNow?: (product: any) => void;
}

// Renders admin-curated OfferSection rows (title + hand-picked products, in
// admin order) — same visual pattern as the matching block on /offers, so a
// section looks consistent whichever surface it appears on.
export function OfferSectionBlock({ sections, onQuickView, addToCart, orderNow }: OfferSectionBlockProps) {
  if (!sections || sections.length === 0) return null;

  return (
    <section className="w-full max-w-[1536px] mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
      {sections.map((section) => (
        <div key={section.id} className="mb-8 sm:mb-14 last:mb-0">
          <div className="flex items-center justify-between mb-2.5 sm:mb-5">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-11 sm:h-11 bg-pink-100 rounded-xl sm:rounded-2xl flex items-center justify-center text-[#890754] shadow-xs shrink-0">
                <Gift size={18} className="sm:w-5 sm:h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-2xl font-black uppercase tracking-tight text-slate-900">
                  {section.title}
                </h2>
                {section.subtitle && (
                  <p className="text-[9.5px] sm:text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    {section.subtitle}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-6">
            {section.products.map((product: any) => (
              <div key={product.id} className="w-full">
                <ProductCard
                  product={product}
                  onQuickView={(p) => onQuickView(p)}
                  onAddToCart={(p) => addToCart(p)}
                  onOrderNow={orderNow ? (p) => orderNow(p) : undefined}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
