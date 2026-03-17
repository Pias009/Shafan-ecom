"use client";

import { useEffect, useState } from "react";
import { useCurrencyStore, SUPPORTED_CURRENCIES } from "@/lib/currency-store";
import { useLanguageStore } from "@/lib/language-store";

const IP_MAP: Record<string, { currency: string; lang: "en" | "ar" }> = {
  AE: { currency: "AED", lang: "en" },
  KW: { currency: "KWD", lang: "ar" }, // Auto-set Arabic for Kuwait
  SA: { currency: "SAR", lang: "ar" },
  BH: { currency: "BHD", lang: "ar" },
  QA: { currency: "QAR", lang: "ar" },
  OM: { currency: "OMR", lang: "ar" },
  US: { currency: "USD", lang: "en" },
};

export function GlobalInitializer() {
  const { setCurrency, currentCurrency } = useCurrencyStore();
  const { setLanguage, currentLanguage } = useLanguageStore();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // Only run if not already stored or first load
    const storage = localStorage.getItem("currency-storage");
    const langStorage = localStorage.getItem("language-storage");
    
    // Check if we already have users preference, if yes don't overwrite every time
    if (!storage || !langStorage) {
        fetch("https://ipapi.co/json/")
        .then(res => res.json())
        .then(data => {
            if (data.country_code) {
                const config = IP_MAP[data.country_code];
                if (config) {
                    // Only set if not already manually changed in this session or stored
                    if (!storage && SUPPORTED_CURRENCIES.find(c => c.code === config.currency)) {
                        setCurrency(config.currency);
                    }
                    if (!langStorage) {
                        setLanguage(config.lang);
                    }
                }
            }
        })
        .catch(() => {})
        .finally(() => setInitialized(true));
    } else {
        setInitialized(true);
    }
  }, [setCurrency, setLanguage]);

  return null; // Side effect only
}
