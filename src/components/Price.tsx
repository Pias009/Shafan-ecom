"use client";

import { useCurrencyStore, SUPPORTED_CURRENCIES } from "@/lib/currency-store";
import { useEffect, useState } from "react";
import { useUserCountry } from "@/lib/country-detection";

interface PriceProps {
  amount: number | string;
  className?: string;
  showSymbolSmall?: boolean;
  countryPrices?: Array<{
    country: string;
    priceCents: number;
    currency: string;
  }>;
  currency?: string;
  isCents?: boolean; // If true, divide by 100
}

function formatPriceSimple(amount: number, currencyCode: string): string {
  const code = currencyCode?.toUpperCase() || 'USD';
  const decimals = ["KWD", "BHD", "OMR"].includes(code) ? 3 : 2;
  const symbol = code;
  return `${symbol} ${amount.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

export function Price({
  amount,
  className = "",
  showSymbolSmall = false,
  countryPrices = [],
  currency,
  isCents = false
}: PriceProps) {
  const { currentCurrency } = useCurrencyStore();
  const [mounted, setMounted] = useState(false);
  const userCountry = useUserCountry();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <span className={className}>...</span>;
  }

  let displayAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(displayAmount)) displayAmount = 0;

  // If isCents is true, convert cents to actual amount
  if (isCents) {
    displayAmount = displayAmount / 100;
  }

  // If explicit currency is provided (for order display), use it directly
  if (currency) {
    const formatted = formatPriceSimple(displayAmount, currency);
    
    if (showSymbolSmall) {
      const symbol = currency.toUpperCase();
      return (
        <span className={className}>
          <span className="text-[0.6em] mr-0.5 opacity-90 font-bold">{symbol}</span>
          {formatted.replace(symbol, '').trim()}
        </span>
      );
    }
    
    return <span className={className}>{formatted}</span>;
  }

  // For product display with countryPrices
  if (countryPrices && countryPrices.length > 0) {
    const countryPrice = countryPrices.find(cp =>
      cp.country.toUpperCase() === userCountry.toUpperCase()
    );
    
    if (countryPrice && countryPrice.priceCents > 0) {
      displayAmount = countryPrice.priceCents / 100;
      const formatted = formatPriceSimple(displayAmount, countryPrice.currency);
      
      if (showSymbolSmall) {
        const symbol = countryPrice.currency.toUpperCase();
        return (
          <span className={className}>
            <span className="text-[0.6em] mr-0.5 opacity-90 font-bold">{symbol}</span>
            {formatted.replace(symbol, '').trim()}
          </span>
        );
      }
      return <span className={className}>{formatted}</span>;
    }
  }

  // Default: use current currency
  const formatted = formatPriceSimple(displayAmount, currentCurrency.code);
  
  if (showSymbolSmall) {
    const symbol = currentCurrency.code;
    return (
      <span className={className}>
        <span className="text-[0.6em] mr-0.5 opacity-90 font-bold">{symbol}</span>
        {formatted.replace(symbol, '').trim()}
      </span>
    );
  }

  return <span className={className}>{formatted}</span>;
}
