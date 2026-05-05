import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { getCurrencyForCountry } from "./countries";
import { COUNTRY_TO_CURRENCY } from "./country-detection";

const CURRENCY_TO_COUNTRY: Record<string, string> = {
  AED: "AE",
  KWD: "KW",
  BHD: "BH",
  SAR: "SA",
  OMR: "OM",
  QAR: "QA",
  BDT: "KW",
  USD: "US",
};

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
      selectedCountry: "KW",
      selectedCurrency: "KWD",
      detectedCountry: "KW",
      _hasHydrated: false,
      setCountry: (countryCode: string) => {
        const upperCode = countryCode.toUpperCase();
        const currency = COUNTRY_TO_CURRENCY[upperCode] || getCurrencyForCountry(upperCode);
        
        // Sync with store_code cookie for server-side logic
        const countryToStore: Record<string, string> = {
          'AE': 'UAE', 'SA': 'SAUDI', 'KW': 'KUWAIT', 'BH': 'BAHRAIN', 'OM': 'OMAN', 'QA': 'QAR'
        };
        const storeCode = countryToStore[upperCode] || 'UAE';
        if (typeof document !== 'undefined') {
          document.cookie = `store_code=${storeCode}; path=/; max-age=${60 * 60 * 24 * 30}`;
          localStorage.setItem("country-auto-detected", "true");
        }


        set({ 
          selectedCountry: upperCode, 
          selectedCurrency: currency 
        });
      },
      setCurrency: (currencyCode: string) => {
        const upperCurrency = currencyCode.toUpperCase();
        let country = CURRENCY_TO_COUNTRY[upperCurrency] || "KW";
        if (upperCurrency === "BDT") {
          country = "KW";
        }
        
        // Sync with store_code cookie for server-side logic
        const countryToStore: Record<string, string> = {
          'AE': 'UAE', 'SA': 'SAUDI', 'KW': 'KUWAIT', 'BH': 'BAHRAIN', 'OM': 'OMAN', 'QA': 'QAR'
        };
        const storeCode = countryToStore[country] || 'UAE';
        if (typeof document !== 'undefined') {
          document.cookie = `store_code=${storeCode}; path=/; max-age=${60 * 60 * 24 * 30}`;
          localStorage.setItem("country-auto-detected", "true");
        }


        set({ 
          selectedCountry: country, 
          selectedCurrency: upperCurrency 
        });
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
