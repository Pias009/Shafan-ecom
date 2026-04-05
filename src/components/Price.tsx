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

const CURRENCY_SYMBOLS: Record<string, string> = {
  AED: 'د.إ',
  KWD: 'د.ك',
  BHD: '.د.ب',
  SAR: 'ر.س',
  OMR: 'ر.ع.',
  QAR: 'ر.ق',
  BDT: '৳',
  USD: '$',
  EUR: '€',
  GBP: '£',
};

function formatPriceWithIntl(amount: number, currencyCode: string): string {
  const code = currencyCode?.toUpperCase() || 'USD';
  
  const symbol = CURRENCY_SYMBOLS[code] || code;
  
  const decimals = ["KWD", "BHD", "OMR"].includes(code) ? 3 : 0;
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
  
  return `${symbol} ${formatted}`;
}

function PriceContent({ amount, className, showSymbolSmall, countryPrices, currency, userCountry, selectedCurrency }: PriceProps & { userCountry: string; selectedCurrency: string }) {
  if (amount == null) {
    return <span className={className}>-</span>;
  }
  let displayAmount = typeof amount === 'string' ? parseFloat(amount) : Number(amount);
  if (isNaN(displayAmount)) displayAmount = 0;

  let displayCurrency = selectedCurrency;
  let hasCountrySpecificPrice = false;

  if (countryPrices && countryPrices.length > 0) {
    const countryUpper = userCountry.toUpperCase();
    const isGulfCountry = GULF_COUNTRIES.includes(countryUpper);
    
    if (isGulfCountry) {
      const { price, currency: priceCurrency } = getDisplayPrice({ countryPrices }, userCountry);
      if (price > 0 || (Number(price) || 0) > 0) {
        displayAmount = Number(price);
        displayCurrency = priceCurrency;
        hasCountrySpecificPrice = true;
      }
    }
  }

  if (!hasCountrySpecificPrice) {
    const baseCurrency = currency?.toUpperCase() || 'USD';
    if (baseCurrency !== displayCurrency) {
      displayAmount = convertCurrency(displayAmount, baseCurrency, displayCurrency);
    }
  }

  const formatted = formatPriceWithIntl(displayAmount, displayCurrency);
  
  if (showSymbolSmall) {
    return (
      <span className={className}>
        <span className="text-[0.6em] mr-0.5 opacity-90 font-bold">{displayCurrency}</span>
        {formatted.replace(displayCurrency, '').trim()}
      </span>
    );
  }
  
  return <span className={className}>{formatted}</span>;
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
