"use client";

import { useCurrencyStore, SUPPORTED_CURRENCIES } from "@/lib/currency-store";
import { useEffect, useState } from "react";
import { useUserCountry } from "@/lib/country-detection";
import { getDisplayPrice } from "@/lib/product-utils";

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

function formatPriceSimple(amount: number, currencyCode: string, isRawPrice: boolean = false): string {
  const code = currencyCode?.toUpperCase() || 'USD';
  // For raw prices from admin, show 0 decimals
  const decimals = isRawPrice ? 0 : (["KWD", "BHD", "OMR"].includes(code) ? 3 : 2);
  const symbol = code;
  return `${symbol} ${amount.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

function PriceContent({ amount, className, showSymbolSmall, countryPrices, currency, isCents = false, userCountry, currentCurrency }: PriceProps & { userCountry: string; currentCurrency: { code: string; rate: number } }) {
  if (amount == null) {
    return <span className={className}>-</span>;
  }
  let displayAmount = typeof amount === 'string' ? parseFloat(amount) : Number(amount);
  if (isNaN(displayAmount)) displayAmount = 0;

  let displayCurrency = currentCurrency.code;
  let isRawPrice = true; // All prices are now raw from admin as per request

  // 1. Check if we have country-specific pricing
  if (countryPrices && countryPrices.length > 0) {
    const { price, currency: priceCurrency } = getDisplayPrice({ countryPrices }, userCountry);
    if (price > 0 || (Number(price) || 0) > 0) {
      displayAmount = Number(price); // No division by 100
      displayCurrency = priceCurrency;
    }
  } else {
    // 2. Fallback to base amount
    if (currency) {
      displayCurrency = currency.toUpperCase();
    }
  }

  const formatted = formatPriceSimple(displayAmount, displayCurrency, isRawPrice);
  
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
  const userCountry = useUserCountry();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <span className={props.className}>...</span>;
  }

  return <PriceContent {...props} userCountry={userCountry} currentCurrency={currentCurrency} />;
}
