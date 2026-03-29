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

// Default fallback configuration
const DEFAULT_CONFIG = { currency: "AED", lang: "en" as const };

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
        // Use a timeout to prevent hanging on failed requests
        const timeoutId = setTimeout(() => {
            setInitialized(true);
        }, 3000);

        // Use a more reliable method - try ipapi.co but with better error handling
        fetch("https://ipapi.co/json/", {
            mode: 'cors',
            headers: {
                'Accept': 'application/json',
            },
        })
        .then(res => {
            if (!res.ok) {
                throw new Error(`HTTP ${res.status}`);
            }
            return res.json();
        })
        .then(data => {
            clearTimeout(timeoutId);
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
            setInitialized(true);
        })
        .catch(error => {
            clearTimeout(timeoutId);
            console.warn('Failed to fetch IP location, using defaults:', error.message);
            // Use default configuration as fallback
            if (!storage) {
                setCurrency(DEFAULT_CONFIG.currency);
            }
            if (!langStorage) {
                setLanguage(DEFAULT_CONFIG.lang);
            }
            setInitialized(true);
        });
    } else {
        setInitialized(true);
    }
  }, [setCurrency, setLanguage]);

  return null; // Side effect only
}
