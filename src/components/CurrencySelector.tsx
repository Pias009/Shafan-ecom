"use client";

import { useCountryStore } from "@/lib/country-store";
import { useState, useEffect } from "react";

import { motion, AnimatePresence } from "framer-motion";

const CURRENCY_LIST = [
  { code: "KWD", name: "Kuwait", flag: "🇰🇼" },
  { code: "AED", name: "UAE", flag: "🇦🇪" },
  { code: "SAR", name: "Saudi Arabia", flag: "🇸🇦" },
  { code: "BHD", name: "Bahrain", flag: "🇧🇭" },
  { code: "QAR", name: "Qatar", flag: "🇶🇦" },
  { code: "OMR", name: "Oman", flag: "🇴🇲" },
];

import { useRef } from "react";

export function CurrencySelector({ direction = "up", align = "right" }: { direction?: "up" | "down", align?: "left" | "right" }) {
  const { selectedCurrency, setCurrency } = useCountryStore();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const current = CURRENCY_LIST.find(c => c.code === selectedCurrency) || CURRENCY_LIST[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
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

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-full bg-black/5 hover:bg-black/10 transition"
      >
        <span className="text-lg">{current.flag}</span>
        <span className="text-sm font-semibold">{current.code}</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: direction === "up" ? 10 : -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: direction === "up" ? 10 : -10, scale: 0.95 }}
            className={`absolute ${direction === "up" ? "bottom-full mb-2" : "top-full mt-2"} ${align === "right" ? "right-0" : "left-0"} w-48 rounded-2xl p-2 border border-black/10 shadow-[0_20px_50px_rgba(0,0,0,0.2)] z-[999999] bg-white transition-all pointer-events-auto`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-3 py-2 text-[9px] font-black uppercase tracking-widest text-black/20 border-b border-black/5 mb-1">
              Select Currency
            </div>
            <div className="max-h-[250px] overflow-y-auto custom-scrollbar">
              {CURRENCY_LIST.map((currency) => (
                <button
                  key={currency.code}
                  onClick={() => {
                    setCurrency(currency.code);
                    setOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${selectedCurrency === currency.code
                      ? "bg-black text-white border border-black/10 shadow-sm scale-[0.98]"
                      : "text-black/80 hover:bg-black/5 hover:text-black"
                    }`}
                >
                  <div className="flex items-center gap-2">
                    <span>{currency.flag}</span>
                    <span>{currency.name}</span>
                  </div>
                  <span className={`text-[10px] ${selectedCurrency === currency.code ? "text-white/70" : "text-black/50"}`}>
                    {currency.code}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}