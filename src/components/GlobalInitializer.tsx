"use client";

import { useEffect } from "react";
import { useCurrencyStore } from "@/lib/currency-store";
import { useLanguageStore } from "@/lib/language-store";
import { useCountryStore, resolveGeoCountry } from "@/lib/country-store";
import { useCartStore } from "@/lib/cart-store";
import { useSession } from "next-auth/react";

const IP_MAP: Record<string, { currency: string; lang: "en" | "ar" }> = {
  AE: { currency: "AED", lang: "en" },
  KW: { currency: "KWD", lang: "en" },
  SA: { currency: "SAR", lang: "en" },
  BH: { currency: "BHD", lang: "en" },
  QA: { currency: "QAR", lang: "en" },
  OM: { currency: "OMR", lang: "en" },
};

const DEFAULT_CONFIG = { country: "AE", currency: "AED", lang: "en" as const };

function defer(fn: () => void) {
  if (typeof requestIdleCallback !== 'undefined') {
    requestIdleCallback(() => fn(), { timeout: 2000 });
  } else {
    setTimeout(fn, 100);
  }
}

export function GlobalInitializer() {
  const { setCurrency: setLegacyCurrency } = useCurrencyStore();
  const { setLanguage } = useLanguageStore();
  const { setCountry, setDetectedCountry, _hasHydrated } = useCountryStore();

  useEffect(() => {
    if (!_hasHydrated) return;

    const urlParams = new URLSearchParams(window.location.search);
    const testCountry = urlParams.get('test_country');
    const autoDetected = localStorage.getItem("country-auto-detected");
    const langStorage = localStorage.getItem("language-storage");

    defer(() => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const apiUrl = testCountry ? `/api/geo?test_country=${testCountry}` : "/api/geo";

      fetch(apiUrl, { signal: controller.signal })
        .then(res => res.json())
        .then(data => {
          clearTimeout(timeoutId);
          const countryCode = data?.country?.toUpperCase();
          const geoCountry = resolveGeoCountry(countryCode);
          const config = IP_MAP[geoCountry];

          // Always refresh the geo-detected checkout country (per browser session).
          // Checkout/orders stick to this; the browsing currency is only
          // auto-switched the very first time, so the user is free to switch
          // and browse in any other currency afterwards.
          setDetectedCountry(geoCountry);

          if (!autoDetected) {
            setCountry(geoCountry);
            setLegacyCurrency(config?.currency || DEFAULT_CONFIG.currency);
            if (!langStorage) setLanguage(config?.lang || DEFAULT_CONFIG.lang);
            localStorage.setItem("country-auto-detected", "true");
          }
        })
        .catch(() => {
          clearTimeout(timeoutId);
          if (!autoDetected) {
            setDetectedCountry(DEFAULT_CONFIG.country);
            setCountry(DEFAULT_CONFIG.country);
            setLegacyCurrency(DEFAULT_CONFIG.currency);
            if (!langStorage) setLanguage(DEFAULT_CONFIG.lang);
            localStorage.setItem("country-auto-detected", "true");
          }
        });
    });

    return () => {};
  }, [_hasHydrated, setCountry, setDetectedCountry, setLegacyCurrency, setLanguage]);

  const setHasAddress = useCartStore(state => state.setHasAddress);
  const { data: session } = useSession();

  useEffect(() => {
    if (!_hasHydrated) return;

    defer(async () => {
      try {
        if (session) {
          const res = await fetch("/api/account/address");
          if (res.ok) {
            const data = await res.json();
            if (data) setHasAddress(true);
          }
        } else {
          const guestStr = localStorage.getItem('guest_address');
          if (guestStr) {
            const data = JSON.parse(guestStr);
            if (data) setHasAddress(true);
          }
        }
      } catch (e) {}
    });
  }, [_hasHydrated, session, setHasAddress]);

  return null;
}
