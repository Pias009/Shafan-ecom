"use client";

import { useCurrencyStore, SUPPORTED_CURRENCIES } from "@/lib/currency-store";
import { useEffect, useState } from "react";
import { useUserCountry } from "@/lib/country-detection";
import { getCurrencyForCountry } from "@/lib/countries";

interface PriceProps {
  amount: number | string;
  className?: string;
  showSymbolSmall?: boolean;
  countryPrices?: Array<{
    country: string;
    priceCents: number;
    currency: string;
  }>;
}

export function Price({
  amount,
  className = "",
  showSymbolSmall = false,
  countryPrices = []
}: PriceProps) {
  const { formatPrice, currentCurrency } = useCurrencyStore();
  const [mounted, setMounted] = useState(false);
  const userCountry = useUserCountry();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <span className={className}>...</span>;
  }

  // Find country-specific price for user's country
  let displayAmount = amount;
  let displayCurrency = currentCurrency.code;
  let sourceCurrency = "AED"; // Default source currency
  
  if (countryPrices && countryPrices.length > 0) {
    const countryPrice = countryPrices.find(cp =>
      cp.country.toUpperCase() === userCountry.toUpperCase()
    );
    
    if (countryPrice) {
      // Use country-specific price in cents
      displayAmount = countryPrice.priceCents / 100;
      displayCurrency = countryPrice.currency || getCurrencyForCountry(userCountry) || "AED";
      sourceCurrency = displayCurrency;
    }
  }

  // Convert amount to AED for formatting (since formatPrice expects AED)
  // First, we need to convert from source currency to AED if needed
  let amountInAED = typeof displayAmount === 'string' ? parseFloat(displayAmount) : displayAmount;
  
  if (sourceCurrency !== "AED") {
    // Find the source currency rate
    const sourceCurrencyObj = SUPPORTED_CURRENCIES.find(c => c.code === sourceCurrency);
    if (sourceCurrencyObj && sourceCurrencyObj.rate > 0) {
      // Convert from source currency to AED
      // rate is "relative to AED", so to convert to AED: amount / rate
      amountInAED = amountInAED / sourceCurrencyObj.rate;
    }
  }
  
  const formatted = formatPrice(amountInAED);
  
  if (showSymbolSmall) {
    // formatPrice returns "Symbol Value", we split them
    const symbol = currentCurrency.symbol;
    const value = formatted.replace(symbol, "").trim();
    
    return (
      <span className={className}>
        <span className="text-[0.6em] mr-0.5 opacity-90 font-bold">{symbol}</span>
        {value}
      </span>
    );
  }

  return <span className={className}>{formatted}</span>;
}
