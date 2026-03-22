import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Currency {
  code: string;
  name: string;
  symbol: string;
  rate: number; // Rate relative to AED (BASE)
}

export const SUPPORTED_CURRENCIES: Currency[] = [
  { code: "AED", name: "UAE (AED)", symbol: "AED", rate: 1.0 },
  { code: "SAR", name: "KSA (SAR)", symbol: "SAR", rate: 1.02 },
  { code: "USD", name: "US Dollar ($)", symbol: "$", rate: 0.272 },
  { code: "EUR", name: "Euro (€)", symbol: "€", rate: 0.25 },
  { code: "GBP", name: "Pound (£)", symbol: "£", rate: 0.21 },
  { code: "BDT", name: "Bangladesh (BDT)", symbol: "৳", rate: 30.0 },
  { code: "KWD", name: "Kuwait (KWD)", symbol: "KWD", rate: 0.083 },
  { code: "BHD", name: "Bahrain (BHD)", symbol: "BHD", rate: 0.103 },
  { code: "QAR", name: "Qatar (QAR)", symbol: "QAR", rate: 0.991 },
  { code: "OMR", name: "Oman (OMR)", symbol: "OMR", rate: 0.105 },
];

interface CurrencyState {
  currentCurrency: Currency;
  setCurrency: (code: string) => void;
  formatPrice: (priceAED: number | string) => string;
}

export const useCurrencyStore = create<CurrencyState>()(
  persist(
    (set, get) => ({
      currentCurrency: SUPPORTED_CURRENCIES[0],
      setCurrency: (code) => {
        const currency = SUPPORTED_CURRENCIES.find((c) => c.code === code);
        if (currency) set({ currentCurrency: currency });
      },
      formatPrice: (priceAED) => {
        const { currentCurrency } = get();
        const numericPrice = typeof priceAED === "string" ? parseFloat(priceAED) : priceAED;
        if (isNaN(numericPrice)) return "0.00";

        const converted = numericPrice * currentCurrency.rate;
        
        // Format with correct decimal places (KWD/BHD/OMR usually have 3 decimals)
        const decimals = ["KWD", "BHD", "OMR"].includes(currentCurrency.code) ? 3 : 2;
        
        return `${currentCurrency.symbol} ${converted.toLocaleString(undefined, {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        })}`;
      },
    }),
    {
      name: "currency-storage",
    }
  )
);
