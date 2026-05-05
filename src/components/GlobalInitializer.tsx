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

    const urlParams = new URLSearchParams(window.location.search);
    const testCountry = urlParams.get('test_country');
    const autoDetected = localStorage.getItem("country-auto-detected");
    const langStorage = localStorage.getItem("language-storage");
    
    // Only skip if we've already successfully auto-detected or user has manually set it
    // BUT always proceed if we have a test_country parameter in the URL
    if (autoDetected && langStorage && !testCountry) {
      setInitialized(true);
      return;
    }

    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    
    // Support testing via URL: ?test_country=AE
    const apiUrl = testCountry ? `/api/geo?test_country=${testCountry}` : "/api/geo";


    fetch(apiUrl, { signal: controller.signal })
      .then(res => res.json())
      .then(data => {
        clearTimeout(timeoutId);
        const countryCode = data?.country?.toUpperCase();
        
        if (countryCode && GULF_COUNTRIES.includes(countryCode)) {
          const config = IP_MAP[countryCode];
          if (config) {
            setCountry(countryCode);
            setLegacyCurrency(config.currency);
            
            if (!langStorage) {
              setLanguage(config.lang);
            }
            localStorage.setItem("country-auto-detected", "true");
          }
        } else {
          // If not in Gulf countries, use default (Kuwait)
          setCountry(DEFAULT_CONFIG.country);
          setLegacyCurrency(DEFAULT_CONFIG.currency);
          
          if (!langStorage) {
            setLanguage(DEFAULT_CONFIG.lang);
          }
          localStorage.setItem("country-auto-detected", "true");
        }
        setInitialized(true);
      })
      .catch(() => {
        clearTimeout(timeoutId);
        
        // Fallback to defaults
        setCountry(DEFAULT_CONFIG.country);
        setLegacyCurrency(DEFAULT_CONFIG.currency);
        
        if (!langStorage) {
          setLanguage(DEFAULT_CONFIG.lang);
        }
        localStorage.setItem("country-auto-detected", "true");
        setInitialized(true);
      });
      
    return () => clearTimeout(timeoutId);
  }, [_hasHydrated, setCountry, setLegacyCurrency, setLanguage]);

  return null;
}
