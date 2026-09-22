import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { getCurrencyForCountry, COUNTRY_TO_CURRENCY } from "./countries";

const CURRENCY_TO_COUNTRY: Record<string, string> = {
  AED: "AE",
  KWD: "KW",
  BHD: "BH",
  SAR: "SA",
  OMR: "OM",
  QAR: "QA",
  BDT: "AE",
  USD: "AE",
};

export const GULF_COUNTRIES: string[] = ["AE", "KW", "BH", "SA", "OM", "QA"];

/**
 * Resolve the checkout country from a raw geo-detected country code.
 * Only the 6 serviced GCC countries keep their own country/currency;
 * everywhere else (and unknown) falls back to the store default -> AED.
 */
export function resolveGeoCountry(rawCountry?: string | null): string {
  const upper = (rawCountry || "AE").toUpperCase();
  return GULF_COUNTRIES.includes(upper) ? upper : "AE";
}

interface CountryState {
  selectedCountry: string;
  selectedCurrency: string;
  detectedCountry: string;
  _hasHydrated: boolean;
  setCountry: (countryCode: string) => void;
  setCurrency: (currencyCode: string) => void;
  setDetectedCountry: (countryCode: string) => void;
  setHasHydrated: (state: boolean) => void;
}

export const useCountryStore = create<CountryState>()(
  persist(
    (set, get) => ({
      selectedCountry: "AE",
      selectedCurrency: "AED",
      detectedCountry: "AE",
      _hasHydrated: false,
      setCountry: (countryCode: string) => {
        const upperCode = countryCode.toUpperCase();
        const currency = COUNTRY_TO_CURRENCY[upperCode] || getCurrencyForCountry(upperCode);
        
        // Sync with store_code cookie for server-side logic
        const countryToStore: Record<string, string> = {
          'AE': 'UAE', 'SA': 'SAUDI', 'KW': 'KUWAIT', 'BH': 'BAHRAIN', 'OM': 'OMAN', 'QA': 'QATAR'
        };
        const storeCode = countryToStore[upperCode] || 'UAE';
        if (typeof document !== 'undefined') {
          document.cookie = `store_code=${storeCode}; path=/; max-age=${60 * 60 * 24 * 30}`;
          localStorage.setItem("country-auto-detected", "true");
          localStorage.setItem("user-country", upperCode);
        }

        set({ 
          selectedCountry: upperCode, 
          selectedCurrency: currency 
        });

        try {
          const { useCurrencyStore } = require("./currency-store");
          const legacyStore = useCurrencyStore.getState();
          if (legacyStore && legacyStore.currentCurrency?.code !== currency) {
            legacyStore.setCurrency(currency);
          }
        } catch {}
      },
      setCurrency: (currencyCode: string) => {
        const upperCurrency = currencyCode.toUpperCase();
        let country = CURRENCY_TO_COUNTRY[upperCurrency] || "AE";
        if (upperCurrency === "BDT") {
          country = "AE";
        }
        
        // Sync with store_code cookie for server-side logic
        const countryToStore: Record<string, string> = {
          'AE': 'UAE', 'SA': 'SAUDI', 'KW': 'KUWAIT', 'BH': 'BAHRAIN', 'OM': 'OMAN', 'QA': 'QATAR'
        };
        const storeCode = countryToStore[country] || 'UAE';
        if (typeof document !== 'undefined') {
          document.cookie = `store_code=${storeCode}; path=/; max-age=${60 * 60 * 24 * 30}`;
          localStorage.setItem("country-auto-detected", "true");
          localStorage.setItem("user-country", country);
        }

        set({ 
          selectedCountry: country, 
          selectedCurrency: upperCurrency 
        });

        try {
          const { useCurrencyStore } = require("./currency-store");
          const legacyStore = useCurrencyStore.getState();
          if (legacyStore && legacyStore.currentCurrency?.code !== upperCurrency) {
            legacyStore.setCurrency(upperCurrency);
          }
        } catch {}
      },
      setDetectedCountry: (countryCode: string) => {
        set({ detectedCountry: countryCode.toUpperCase() });
      },
      setHasHydrated: (state: boolean) => {
        set({ _hasHydrated: state });
      },
    }),
    {
      name: "country-storage",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

export function useCountryStoreReady() {
  return useCountryStore((state) => state._hasHydrated);
}

/**
 * The geo-detected checkout country (always one of the 6 GCC countries, else AED).
 * Checkout / order / payment must always use this, regardless of the currency
 * the user chose for general browsing.
 */
export function useCheckoutCountry(): string {
  const detectedCountry = useCountryStore((state) => state.detectedCountry);
  const selectedCountry = useCountryStore((state) => state.selectedCountry);
  return resolveGeoCountry(detectedCountry || selectedCountry || "AE");
}
