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
  isCents?: boolean;
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

function PriceContent({ amount, className, showSymbolSmall, countryPrices, currency, isCents, userCountry, currentCurrency }: PriceProps & { userCountry: string; currentCurrency: { code: string } }) {
  let displayAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(displayAmount)) displayAmount = 0;

  if (isCents) {
    displayAmount = displayAmount / 100;
  }

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

export function Price(props: PriceProps) {
  const { currentCurrency } = useCurrencyStore();
  const [mounted, setMounted] = useState(false);
  const userCountry = useUserCountry();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <span className={props.className}>...</span>;
  }

  return <PriceContent {...props} userCountry={userCountry} currentCurrency={currentCurrency} />;
}
