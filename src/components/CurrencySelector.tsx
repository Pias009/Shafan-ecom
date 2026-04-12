"use client";

import { useCountryStore } from "@/lib/country-store";
import { useState, useEffect } from "react";

const CURRENCY_LIST = [
  { code: "KWD", name: "Kuwait", flag: "🇰🇼" },
  { code: "AED", name: "UAE", flag: "🇦🇪" },
  { code: "SAR", name: "Saudi Arabia", flag: "🇸🇦" },
  { code: "BHD", name: "Bahrain", flag: "🇧🇭" },
  { code: "QAR", name: "Qatar", flag: "🇶🇦" },
  { code: "OMR", name: "Oman", flag: "🇴🇲" },
];

export function CurrencySelector() {
  const { selectedCurrency, setCurrency } = useCountryStore();
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const current = CURRENCY_LIST.find(c => c.code === selectedCurrency) || CURRENCY_LIST[0];

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-full bg-black/5 hover:bg-black/10 transition"
      >
        <span className="text-lg">{current.flag}</span>
        <span className="text-sm font-semibold">{current.code}</span>
      </button>
      
      {open && (
        <div 
          className="absolute top-full mt-2 w-48 glass-panel-heavy rounded-xl p-2 shadow-xl z-50"
          style={isMobile ? { left: '50%', transform: 'translateX(-50%)' } : { right: 0 }}
        >
          {CURRENCY_LIST.map((currency) => (
            <button
              key={currency.code}
              onClick={() => {
                setCurrency(currency.code);
                setOpen(false);
              }}
              className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg transition ${
                selectedCurrency === currency.code 
                  ? "bg-black text-white" 
                  : "hover:bg-black/5"
              }`}
            >
              <span className="text-lg">{currency.flag}</span>
              <span className="text-sm font-medium">{currency.name}</span>
              <span className={`text-xs ${selectedCurrency === currency.code ? "text-white/70" : "text-black/50"}`}>
                {currency.code}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}