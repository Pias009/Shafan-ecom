"use client";

import { useEffect, useState } from "react";
import { useCurrencyStore, SUPPORTED_CURRENCIES } from "@/lib/currency-store";
import { useLanguageStore } from "@/lib/language-store";

const IP_MAP: Record<string, { currency: string; lang: "en" | "ar" }> = {
  AE: { currency: "AED", lang: "en" },
  KW: { currency: "KWD", lang: "ar" },
  SA: { currency: "SAR", lang: "ar" },
  BH: { currency: "BHD", lang: "ar" },
  QA: { currency: "QAR", lang: "ar" },
  OM: { currency: "OMR", lang: "ar" },
  US: { currency: "USD", lang: "en" },
};

const DEFAULT_CONFIG = { currency: "AED", lang: "en" as const };

export function GlobalInitializer() {
  const { setCurrency } = useCurrencyStore();
  const { setLanguage } = useLanguageStore();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const storage = localStorage.getItem("currency-storage");
    const langStorage = localStorage.getItem("language-storage");
    
    const initDefaults = () => {
      if (!storage) setCurrency(DEFAULT_CONFIG.currency);
      if (!langStorage) setLanguage(DEFAULT_CONFIG.lang);
      setInitialized(true);
    };
    
    if (storage && langStorage) {
      setInitialized(true);
      return;
    }
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    fetch("https://ipapi.co/json/", { signal: controller.signal })
      .then(res => {
        if (!res.ok) throw new Error('API error');
        return res.json();
      })
      .then(data => {
        clearTimeout(timeoutId);
        if (data?.country_code) {
          const config = IP_MAP[data.country_code];
          if (config) {
            if (!storage && SUPPORTED_CURRENCIES.find(c => c.code === config.currency)) {
              setCurrency(config.currency);
            }
            if (!langStorage) {
              setLanguage(config.lang);
            }
          }
        }
        setInitialized(true);
      })
      .catch((err) => {
        clearTimeout(timeoutId);
        if (err.name === 'AbortError') {
          console.log('IP detection timeout, using defaults');
        }
        initDefaults();
      });
      
    return () => clearTimeout(timeoutId);
  }, [setCurrency, setLanguage]);

  return null;
}
