"use client";

import { useEffect, useState } from "react";
import { useCurrencyStore } from "@/lib/currency-store";
import { useLanguageStore } from "@/lib/language-store";
import { useCountryStore } from "@/lib/country-store";

const GULF_COUNTRIES = ['AE', 'KW', 'BH', 'SA', 'OM', 'QA'];

const IP_MAP: Record<string, { currency: string; lang: "en" | "ar" }> = {
  AE: { currency: "AED", lang: "en" },
  KW: { currency: "KWD", lang: "ar" },
  SA: { currency: "SAR", lang: "ar" },
  BH: { currency: "BHD", lang: "ar" },
  QA: { currency: "QAR", lang: "ar" },
  OM: { currency: "OMR", lang: "ar" },
};

const DEFAULT_CONFIG = { country: "KW", currency: "KWD", lang: "ar" as const };

export function GlobalInitializer() {
  const { setCurrency: setLegacyCurrency } = useCurrencyStore();
  const { setLanguage } = useLanguageStore();
  const { setCountry, _hasHydrated } = useCountryStore();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!_hasHydrated) return;

    const countryStorage = localStorage.getItem("country-storage");
    const langStorage = localStorage.getItem("language-storage");
    
    // If we already have stored preferences, don't auto-detect
    if (countryStorage && langStorage) {
      setInitialized(true);
      return;
    }
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    
    // Try our internal geo API first (uses Vercel headers)
    fetch("/api/geo", { signal: controller.signal })
      .then(res => res.json())
      .then(data => {
        clearTimeout(timeoutId);
        const countryCode = data?.country?.toUpperCase();
        
        if (countryCode && GULF_COUNTRIES.includes(countryCode)) {
          const config = IP_MAP[countryCode];
          if (config) {
            // Set country (this also sets currency in useCountryStore)
            setCountry(countryCode);
            // Sync with legacy currency store
            setLegacyCurrency(config.currency);
            
            if (!langStorage) {
              setLanguage(config.lang);
            }
            console.log(`[GeoInit] Auto-detected country: ${countryCode}`);
          }
        } else {
          // If not in Gulf countries, use default (Kuwait)
          console.log(`[GeoInit] Country ${countryCode} not in Gulf list, using default: ${DEFAULT_CONFIG.country}`);
          if (!countryStorage) {
            setCountry(DEFAULT_CONFIG.country);
            setLegacyCurrency(DEFAULT_CONFIG.currency);
          }
          if (!langStorage) {
            setLanguage(DEFAULT_CONFIG.lang);
          }
        }
        setInitialized(true);
      })
      .catch((err) => {
        clearTimeout(timeoutId);
        console.warn('[GeoInit] Detection failed or timed out, using defaults', err);
        
        // Fallback to defaults if no storage
        if (!countryStorage) {
          setCountry(DEFAULT_CONFIG.country);
          setLegacyCurrency(DEFAULT_CONFIG.currency);
        }
        if (!langStorage) {
          setLanguage(DEFAULT_CONFIG.lang);
        }
        setInitialized(true);
      });
      
    return () => clearTimeout(timeoutId);
  }, [_hasHydrated, setCountry, setLegacyCurrency, setLanguage]);

  return null;
}
