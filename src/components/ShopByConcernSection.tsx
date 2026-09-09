"use client";

import Link from "next/link";
import { ArrowRight, Droplets, Sparkles, ShieldAlert, Sun, Hourglass, SlidersHorizontal } from "lucide-react";

interface ConcernItem {
  id: string;
  name: string;
  tag: string;
  href: string;
  icon: React.ReactNode;
  iconBg: string;
}

const CONCERNS: ConcernItem[] = [
  {
    id: "acne",
    name: "Acne & Blemishes",
    tag: "Purify",
    href: "/products?concern=Acne",
    icon: <ShieldAlert size={18} className="text-[#890754]" />,
    iconBg: "bg-pink-50 border-pink-200/60",
  },
  {
    id: "anti-aging",
    name: "Anti-Aging",
    tag: "Firm & Lift",
    href: "/products?concern=Anti+Aging",
    icon: <Hourglass size={18} className="text-amber-700" />,
    iconBg: "bg-amber-50 border-amber-200/60",
  },
  {
    id: "dark-spots",
    name: "Dark Spots",
    tag: "Brighten",
    href: "/products?concern=Dark+Spot",
    icon: <Sun size={18} className="text-amber-600" />,
    iconBg: "bg-yellow-50 border-yellow-200/60",
  },
  {
    id: "hydration",
    name: "Dryness",
    tag: "Deep Hydrate",
    href: "/products?skinType=Dry+Skin",
    icon: <Droplets size={18} className="text-sky-700" />,
    iconBg: "bg-sky-50 border-sky-200/60",
  },
  {
    id: "redness",
    name: "Redness & Calming",
    tag: "Barrier Care",
    href: "/products?concern=Redness",
    icon: <Sparkles size={18} className="text-emerald-700" />,
    iconBg: "bg-emerald-50 border-emerald-200/60",
  },
  {
    id: "pores",
    name: "Pores & Oil",
    tag: "Balance",
    href: "/products?concern=Anti+Pores",
    icon: <SlidersHorizontal size={18} className="text-purple-700" />,
    iconBg: "bg-purple-50 border-purple-200/60",
  },
];

export function ShopByConcernSection() {
  return (
    <section className="pt-2 sm:pt-4 pb-4 sm:pb-6 px-1 sm:px-2">
      {/* Compact, space-efficient luxury header */}
      <div className="flex items-center justify-between mb-3 sm:mb-4 px-1">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-4 sm:h-5 rounded-full bg-[#890754]" />
          <h2 className="font-serif text-base sm:text-xl md:text-2xl font-bold text-gray-900 tracking-tight">
            Shop by Skin Concern
          </h2>
        </div>
        <Link
          href="/products"
          className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-bold text-[#890754] hover:text-[#540434] transition-colors group"
        >
          <span>All Concerns</span>
          <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* Ultra-compact, non-generic luxury boutique concern tiles */}
      {/* Mobile: smooth horizontal swipe list | Desktop: refined 6-column grid */}
      <div className="flex overflow-x-auto scrollbar-hide gap-2 sm:gap-3 pb-1 -mx-2 px-2 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-3 lg:grid-cols-6">
        {CONCERNS.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className="group flex-shrink-0 min-w-[120px] sm:min-w-0 flex flex-col items-center justify-center p-2.5 sm:p-3.5 rounded-2xl bg-white border border-pink-100/90 hover:border-pink-300 shadow-2xs hover:shadow-md hover:-translate-y-0.5 active:scale-95 transition-all duration-200 select-none text-center"
          >
            {/* Elegant tinted icon chip */}
            <div
              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full ${item.iconBg} border flex items-center justify-center mb-1.5 sm:mb-2 shadow-2xs group-hover:scale-110 transition-transform duration-300`}
            >
              {item.icon}
            </div>

            {/* Concern Name */}
            <h3 className="font-sans font-semibold text-[11px] sm:text-xs text-gray-900 leading-snug group-hover:text-[#890754] transition-colors line-clamp-1">
              {item.name}
            </h3>

            {/* Sub-label / Action benefit */}
            <span className="text-[9px] sm:text-[10px] font-medium text-[#890754]/80 mt-0.5">
              {item.tag}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
