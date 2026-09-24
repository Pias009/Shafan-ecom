"use client";

import { useCountryStore, useCountryStoreReady, useCheckoutCountry } from "@/lib/country-store";
import { SUPPORTED_COUNTRIES, CountryConfig } from "@/lib/countries";
import { useState, useEffect, useRef } from "react";
import { Check, ChevronDown, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCartStore } from "@/lib/cart-store";

export function CountrySelector({
  direction = "down",
  align = "right",
  compact = false,
  locked = false,
  variant = "default",
  className = "",
}: {
  direction?: "up" | "down";
  align?: "left" | "right";
  compact?: boolean;
  locked?: boolean;
  variant?: "default" | "white";
  className?: string;
}) {
  const { selectedCountry, setCountry } = useCountryStore();
  const hasHydrated = useCountryStoreReady();
  const refreshPrices = useCartStore((s) => s.refreshPrices);
  const checkoutCountry = useCheckoutCountry();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentCountry =
    SUPPORTED_COUNTRIES.find((c) => c.code === selectedCountry) ||
    SUPPORTED_COUNTRIES[0];

  // On checkout the currency is locked to the user's geo country/currency
  const lockedCountry =
    SUPPORTED_COUNTRIES.find((c) => c.code === checkoutCountry) ||
    SUPPORTED_COUNTRIES[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  if (!hasHydrated) {
    return (
      <div className={`w-16 h-8 rounded-full animate-pulse ${variant === "white" ? "bg-white/15" : "bg-black/5"} ${className}`} />
    );
  }

  if (locked) {
    return (
      <div
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-semibold text-xs cursor-not-allowed select-none transition-all ${
          variant === "white"
            ? "bg-white/10 text-white border border-white/20 shadow-sm"
            : "bg-black/5 text-black"
        } ${className}`}
        title={`Locked to your location: ${lockedCountry.name} (${lockedCountry.currency})`}
      >
        <Lock size={11} className={variant === "white" ? "text-white/70" : "text-black/40"} />
        <span className="text-base">{lockedCountry.flag}</span>
        <span className={`font-bold uppercase tracking-wider ${variant === "white" ? "text-white" : "text-black"}`}>
          {compact ? lockedCountry.currency : `${lockedCountry.code} (${lockedCountry.currency})`}
        </span>
      </div>
    );
  }

  const handleSelect = (country: CountryConfig) => {
    setCountry(country.code);
    setOpen(false);
    // Refresh cart prices for the new country currency
    refreshPrices().catch(() => {});
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all font-semibold text-xs cursor-pointer active:scale-95 ${
          variant === "white"
            ? "bg-white/10 hover:bg-white/20 text-white border border-white/20 shadow-sm"
            : "bg-black/5 hover:bg-black/10 text-black"
        } ${className}`}
        aria-label="Select Country and Currency"
      >
        <span className="text-base">{currentCountry.flag}</span>
        <span className={`font-bold uppercase tracking-wider ${variant === "white" ? "text-white" : "text-black"}`}>
          {compact ? currentCountry.currency : `${currentCountry.code} (${currentCountry.currency})`}
        </span>
        <ChevronDown
          size={12}
          className={`transition-transform duration-200 ${
            variant === "white" ? "text-white/80" : "text-black/50"
          } ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{
              opacity: 0,
              y: direction === "up" ? 10 : -10,
              scale: 0.95,
            }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{
              opacity: 0,
              y: direction === "up" ? 10 : -10,
              scale: 0.95,
            }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className={`absolute ${
              direction === "up" ? "bottom-full mb-2" : "top-full mt-2"
            } ${
              align === "right" ? "right-0" : "left-0"
            } w-56 rounded-2xl p-2 border border-black/10 shadow-[0_20px_50px_rgba(0,0,0,0.2)] z-[999999] bg-white transition-all pointer-events-auto`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-3 py-2 text-[9px] font-black uppercase tracking-widest text-black/40 border-b border-black/5 mb-1 flex justify-between items-center">
              <span>Select Country</span>
              <span className="text-[8px] font-semibold text-emerald-600">Auto Currency</span>
            </div>
            <div className="space-y-1 max-h-60 overflow-y-auto scrollbar-thin">
              {SUPPORTED_COUNTRIES.map((c) => {
                const isSelected = selectedCountry === c.code;
                return (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => handleSelect(c)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      isSelected
                        ? "bg-black text-white border border-black/10 shadow-sm scale-[0.98]"
                        : "text-black/80 hover:bg-black/5 hover:text-black"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-base shrink-0">{c.flag}</span>
                      <span className="truncate">{c.name}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      <span
                        className={`text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md ${
                          isSelected
                            ? "bg-emerald-500 text-white"
                            : "bg-black/5 text-black/60"
                        }`}
                      >
                        {c.currency}
                      </span>
                      {isSelected && (
                        <Check size={14} className="text-white ml-0.5" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
