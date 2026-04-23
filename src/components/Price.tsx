"use client";

import { useCurrencyStore, SUPPORTED_CURRENCIES } from "@/lib/currency-store";
import { useEffect, useState } from "react";
import { useCountryStore, useCountryStoreReady } from "@/lib/country-store";
import { getDisplayPrice } from "@/lib/product-utils";
import { convertCurrency, getExchangeRate, EXCHANGE_RATES } from "@/lib/currency-rates";

interface PriceProps {
  amount: number | string;
  className?: string;
  showSymbolSmall?: boolean;
  countryPrices?: Array<{
    country: string;
    price: number;
    currency: string;
  }>;
  currency?: string;
}

const GULF_COUNTRIES = ['AE', 'KW', 'BH', 'SA', 'OM', 'QA'];

const CURRENCY_SYMBOLS_ASCII: Record<string, string> = {
  AED: 'AED',
  KWD: 'KWD',
  BHD: 'BHD',
  SAR: 'SAR',
  OMR: 'OMR',
  QAR: 'QAR',
  BDT: 'BDT',
  USD: '$',
  EUR: '€',
  GBP: '£',
};

function formatPriceWithIntl(amount: number, currencyCode: string): string {
  const code = currencyCode?.toUpperCase() || 'USD';
  
  const symbol = CURRENCY_SYMBOLS_ASCII[code] || code;
  
  const decimals = ["KWD", "BHD", "OMR"].includes(code) ? 3 : 2;
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
  
  return `${symbol}${formatted}`;
}

function PriceContent({ amount, className, showSymbolSmall, countryPrices, currency, userCountry, selectedCurrency }: PriceProps & { userCountry: string; selectedCurrency: string }) {
  if (amount == null) {
    return <span className={className}>-</span>;
  }
  let displayAmount = typeof amount === 'string' ? parseFloat(amount) : Number(amount);
  if (isNaN(displayAmount)) displayAmount = 0;

  // STRICT: Only use direct DB price - no multipliers or conversions
  let displayCurrency = selectedCurrency;
  let hasCountrySpecificPrice = false;

  // Only apply country-specific pricing if countryPrices is provided AND amount is 0
  // For stored orders, amount already has the correct price stored in unitPrice
  if (countryPrices && countryPrices.length > 0 && displayAmount === 0) {
    const countryUpper = userCountry.toUpperCase();
    const isGulfCountry = GULF_COUNTRIES.includes(countryUpper);
    
    if (isGulfCountry) {
      const { price, currency: priceCurrency } = getDisplayPrice({ countryPrices }, userCountry);
      if (Number(price) > 0) {
        displayAmount = Number(price);
        displayCurrency = priceCurrency;
        hasCountrySpecificPrice = true;
      }
    }
  } else if (displayAmount > 0) {
    // Direct price (from stored orders) - use as-is with passed currency
    if (currency) {
      displayCurrency = currency;
    }
    hasCountrySpecificPrice = true;
  }

  const formatted = formatPriceWithIntl(displayAmount, displayCurrency);
  
  // Split the formatted string to color the currency part green
  const currencySymbol = CURRENCY_SYMBOLS_ASCII[displayCurrency] || displayCurrency;
  const amountPart = formatted.replace(currencySymbol, '').trim();
  
  if (showSymbolSmall) {
    return (
      <span className={className}>
        <span className="text-[0.6em] font-bold text-emerald-600">{displayCurrency}</span><span className="text-black">{amountPart}</span>
      </span>
    );
  }
  
  return (
    <span className={className} style={{ unicodeBidi: 'plaintext' }}>
      <span className="text-emerald-600">{currencySymbol}</span><span className="text-black">{amountPart}</span>
    </span>
  );
}

export function Price(props: PriceProps) {
  const { currentCurrency } = useCurrencyStore();
  const [mounted, setMounted] = useState(false);
  const hasHydrated = useCountryStoreReady();
  const { selectedCountry, selectedCurrency } = useCountryStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !hasHydrated) {
    return <span className={props.className}>...</span>;
  }

  const effectiveCurrency = selectedCurrency || currentCurrency.code;

  return <PriceContent {...props} userCountry={selectedCountry} selectedCurrency={effectiveCurrency} />;
}
