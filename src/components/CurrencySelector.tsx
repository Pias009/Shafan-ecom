"use client";

import { useCountryStore } from "@/lib/country-store";
import { useState, useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";
import { getFlagForCountry } from "@/lib/currency-rates";

const CURRENCY_LIST = [
  { code: "KWD", name: "Kuwait", flag: "🇰🇼", symbol: "KWD" },
  { code: "AED", name: "UAE", flag: "🇦🇪", symbol: "AED" },
  { code: "SAR", name: "Saudi Arabia", flag: "🇸🇦", symbol: "SAR" },
  { code: "BHD", name: "Bahrain", flag: "🇧🇭", symbol: "BHD" },
  { code: "QAR", name: "Qatar", flag: "🇶🇦", symbol: "QAR" },
  { code: "OMR", name: "Oman", flag: "🇴🇲", symbol: "OMR" },
  { code: "BDT", name: "Bangladesh", flag: "🇧🇩", symbol: "BDT" },
];

export function CurrencySelector() {
  const { selectedCountry, selectedCurrency, setCurrency: setCountryCurrency } = useCountryStore();
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
    <div className="glass-panel h-9 w-24 rounded-full animate-pulse bg-black/5" />
  );

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  const handleCurrencySelect = (currencyCode: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCountryCurrency(currencyCode);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={handleToggle}
        className="glass-panel flex h-9 items-center gap-2 rounded-full px-3 text-[10px] font-black uppercase tracking-widest text-black transition hover:bg-black/5 shadow-sm cursor-pointer"
        aria-label="Select currency"
      >
        <span className="text-sm">{getFlagForCountry(selectedCountry)}</span>
        <span className="font-mono" style={{ unicodeBidi: 'plaintext' }}>{selectedCurrency}</span>
        <ChevronDown size={10} className={`text-black/20 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div 
          className="absolute top-full right-0 mt-2 w-48 glass-panel-heavy rounded-2xl p-2 border border-black/5 shadow-2xl z-[9999] bg-white/95 backdrop-blur-xl transition-all animate-in fade-in zoom-in duration-200"
          style={{ position: 'fixed', bottom: 'auto' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-3 py-2 text-[9px] font-black uppercase tracking-widest text-black/20 border-b border-black/5 mb-1">
            Select Currency
          </div>
          <div className="max-h-[250px] overflow-y-auto custom-scrollbar">
            {CURRENCY_LIST.map((currency) => (
              <button
                key={currency.code}
                onClick={(e) => handleCurrencySelect(currency.code, e)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  selectedCurrency === currency.code
                    ? "bg-black/5 text-black border border-black/10 shadow-sm scale-[0.98]"
                    : "text-black/60 hover:bg-black/5 hover:text-black"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>{currency.flag}</span>
                  <span>{currency.name}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
