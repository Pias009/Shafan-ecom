"use client";

import { useState } from "react";
import { Globe } from "lucide-react";
import { SUPPORTED_COUNTRIES } from "@/lib/countries";
import { setUserCountry } from "@/lib/country-detection";
import { useCurrencyStore } from "@/lib/currency-store";

export function CountrySelector() {
  const [isOpen, setIsOpen] = useState(false);
  const { setCurrency } = useCurrencyStore();
  
  const handleCountrySelect = (countryCode: string, currency: string) => {
    setUserCountry(countryCode);
    setCurrency(currency);
    setIsOpen(false);
    // Reload page to apply changes
    window.location.reload();
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-black text-white px-4 py-2 rounded-full flex items-center gap-2 shadow-lg hover:bg-black/80 transition-all text-sm font-medium"
        >
          <Globe size={16} />
          <span>Dev: Select Country</span>
        </button>
        
        {isOpen && (
          <div className="absolute bottom-full right-0 mb-2 bg-white rounded-2xl shadow-2xl border border-black/10 p-2 min-w-[200px]">
            <div className="text-[10px] font-bold text-black/40 uppercase tracking-widest px-3 py-2">
              Select Country (Dev)
            </div>
            {SUPPORTED_COUNTRIES.map((country) => (
              <button
                key={country.code}
                onClick={() => handleCountrySelect(country.code, country.currency)}
                className="w-full text-left px-3 py-2 rounded-xl hover:bg-black/5 transition-all text-sm font-medium text-black flex items-center gap-2"
              >
                <span>{country.flag}</span>
                <span>{country.name}</span>
                <span className="text-black/40 text-xs ml-auto">{country.currency}</span>
              </button>
            ))}
            <div className="border-t border-black/10 my-2" />
            <button
              onClick={() => handleCountrySelect("BD", "BDT")}
              className="w-full text-left px-3 py-2 rounded-xl hover:bg-black/5 transition-all text-sm font-medium text-black flex items-center gap-2"
            >
              <span>🇧🇩</span>
              <span>Bangladesh</span>
              <span className="text-black/40 text-xs ml-auto">BDT</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
