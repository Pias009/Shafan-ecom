"use client";

import { useMemo, useState, useEffect } from "react";
import { useCartStore } from "@/lib/cart-store";
import { useCountryStore } from "@/lib/country-store";
import { Truck, CheckCircle2, Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";

interface ThresholdConfig {
  amount: number;
  currency: string;
}

const THRESHOLDS: Record<string, ThresholdConfig> = {
  AE: { amount: 200, currency: "AED" },
  SA: { amount: 200, currency: "SAR" },
  KW: { amount: 18, currency: "KWD" },
  QA: { amount: 200, currency: "QAR" },
  OM: { amount: 21, currency: "OMR" },
  BH: { amount: 21, currency: "BHD" },
  US: { amount: 55, currency: "USD" },
};

export function FreeShippingTracker() {
  const { items } = useCartStore();
  const { selectedCountry } = useCountryStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const config = THRESHOLDS[selectedCountry.toUpperCase()] || { amount: 55, currency: "USD" };

  // Calculate cart total in active country currency
  const cartTotal = useMemo(() => {
    return items.reduce((sum, item) => {
      const countryPriceObj = item.countryPrices?.find(
        (cp: any) => cp.country?.toUpperCase() === selectedCountry.toUpperCase()
      );
      const unitPrice =
        countryPriceObj && Number(countryPriceObj.price) > 0
          ? Number(countryPriceObj.price)
          : Number(item.discountPrice ?? item.price ?? 0);
      return sum + unitPrice * (item.quantity || 1);
    }, 0);
  }, [items, selectedCountry]);

  if (!mounted) return null;

  const remaining = Math.max(0, config.amount - cartTotal);
  const percentage = Math.min(100, Math.round((cartTotal / config.amount) * 100));
  const isUnlocked = cartTotal >= config.amount;

  return (
    <div className="w-full my-3">
      <div className="relative overflow-hidden rounded-2xl bg-white/95 backdrop-blur-xl border border-pink-100/90 px-3.5 py-3 sm:px-5 sm:py-3.5 shadow-[0_6px_24px_rgba(137,7,84,0.06)]">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-pink-500/5 to-transparent pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          {/* Status Message */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div
              className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 border transition-all duration-300 ${
                isUnlocked
                  ? "bg-emerald-500 text-white border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.35)]"
                  : "bg-gradient-to-br from-pink-50 to-rose-50 text-[#890754] border-pink-200/70 shadow-2xs"
              }`}
            >
              {isUnlocked ? <CheckCircle2 size={16} /> : <Truck size={16} className="animate-pulse" />}
            </div>

            <div className="text-left leading-tight">
              {isUnlocked ? (
                <div className="flex items-center gap-1.5">
                  <p className="text-xs sm:text-sm font-bold text-emerald-600">
                    🎉 Free Express Delivery Unlocked!
                  </p>
                  <span className="hidden xs:inline-block text-[10px] font-semibold text-gray-500">
                    (Standard GCC Shipping On Us)
                  </span>
                </div>
              ) : items.length === 0 ? (
                <p className="text-xs sm:text-sm font-medium text-gray-700">
                  Enjoy <span className="font-bold text-[#890754]">FREE Express Delivery</span> across the GCC on orders over{" "}
                  <span className="font-bold text-gray-900">
                    {config.amount} {config.currency}
                  </span>
                </p>
              ) : (
                <p className="text-xs sm:text-sm font-medium text-gray-700">
                  Add <span className="font-bold text-[#890754] px-1 py-0.5 bg-pink-50 rounded-md border border-pink-200/50">{remaining.toFixed(0)} {config.currency}</span> more to unlock{" "}
                  <span className="font-bold text-gray-900">FREE Express Delivery</span>
                </p>
              )}
            </div>
          </div>

          {/* Quick CTA or Progress badge */}
          <div className="flex items-center gap-2.5 self-end sm:self-auto">
            <span className="text-[10px] sm:text-xs font-bold text-[#890754] bg-pink-50 px-2.5 py-0.5 rounded-full border border-pink-200/60 shadow-2xs">
              {percentage}% Complete
            </span>
            {items.length > 0 && (
              <Link
                href="/cart"
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#890754] hover:bg-[#540434] text-white transition-all text-[10px] font-black uppercase tracking-wider shadow-xs hover:scale-105 active:scale-95 shrink-0"
              >
                <span>Bag</span>
                <ArrowRight size={11} />
              </Link>
            )}
          </div>
        </div>

        {/* Dynamic Milestone Progress Bar */}
        <div className="relative w-full h-2 bg-pink-100/50 rounded-full overflow-hidden mt-2.5 border border-pink-200/40">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              isUnlocked
                ? "bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_8px_rgba(16,185,129,0.4)]"
                : "bg-gradient-to-r from-[#890754] via-[#d92992] to-[#e84393] shadow-[0_0_8px_rgba(217,41,146,0.35)]"
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}
