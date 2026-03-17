"use client";

import { useCurrencyStore, SUPPORTED_CURRENCIES } from "@/lib/currency-store";
import { useState, useEffect, useRef } from "react";
import { Globe, ChevronDown } from "lucide-react";

export function CurrencySelector() {
  const { currentCurrency, setCurrency } = useCurrencyStore();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!mounted) return (
      <div className="glass-panel h-9 w-12 rounded-full animate-pulse bg-black/5" />
  );

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="glass-panel flex h-9 items-center gap-2 rounded-full px-3 text-[10px] font-black uppercase tracking-widest text-black transition hover:bg-black/5 shadow-sm"
      >
        <Globe size={14} className="text-black/40" />
        <span>{currentCurrency.code}</span>
        <ChevronDown size={10} className={`text-black/20 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-48 glass-panel-heavy rounded-2xl p-2 border border-black/5 shadow-2xl z-[60] bg-white/95 backdrop-blur-xl transition-all animate-in fade-in zoom-in duration-200">
          <div className="px-3 py-2 text-[9px] font-black uppercase tracking-widest text-black/20 border-b border-black/5 mb-1">
            Select Currency
          </div>
          <div className="max-h-[250px] overflow-y-auto custom-scrollbar">
            {SUPPORTED_CURRENCIES.map((currency) => (
              <button
                key={currency.code}
                onClick={() => {
                  setCurrency(currency.code);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  currentCurrency.code === currency.code
                    ? "bg-black/5 text-black border border-black/10 shadow-sm scale-[0.98]"
                    : "text-black/60 hover:bg-black/5 hover:text-black"
                }`}
              >
                <span>{currency.name}</span>
                <span className="text-[10px] opacity-40">{currency.symbol}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
