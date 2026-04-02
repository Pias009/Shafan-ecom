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

function PriceContent({ amount, className, showSymbolSmall, countryPrices, currency, isCents, userCountry, currentCurrency }: PriceProps & { userCountry: string; currentCurrency: { code: string; rate: number } }) {
  if (amount == null) {
    return <span className={className}>-</span>;
  }
  let displayAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(displayAmount)) displayAmount = 0;

  if (isCents) {
    displayAmount = displayAmount / 100;
  }

  if (currency) {
    const currencyCode = currency.toUpperCase();
    const productCurrency = SUPPORTED_CURRENCIES.find(c => c.code === currencyCode);
    const targetCurrency = currentCurrency;
    
    let finalAmount = displayAmount;
    let finalCurrency = currencyCode;
    
    if (productCurrency && targetCurrency) {
      const amountInAED = displayAmount / productCurrency.rate;
      finalAmount = amountInAED * targetCurrency.rate;
      finalCurrency = targetCurrency.code;
    }
    
    const formatted = formatPriceSimple(finalAmount, finalCurrency);
    
    if (showSymbolSmall) {
      const symbol = finalCurrency;
      return (
        <span className={className}>
          <span className="text-[0.6em] mr-0.5 opacity-90 font-bold">{symbol}</span>
          {formatted.replace(symbol, '').trim()}
        </span>
      );
    }
    
    return <span className={className}>{formatted}</span>;
  }

  let displayCurrency = currentCurrency.code;
  let convertedAmount = displayAmount;

  if (countryPrices && countryPrices.length > 0) {
    const countryPrice = countryPrices.find(cp =>
      cp.country.toUpperCase() === userCountry.toUpperCase()
    );
    
    if (countryPrice && countryPrice.priceCents > 0) {
      const countryCurrency = countryPrice.currency.toUpperCase();
      const productAmount = countryPrice.priceCents / 100;
      
      const productCurrency = SUPPORTED_CURRENCIES.find(c => c.code === countryCurrency);
      const targetCurrency = currentCurrency;
      
      if (productCurrency && targetCurrency) {
        const amountInAED = productAmount / productCurrency.rate;
        convertedAmount = amountInAED * targetCurrency.rate;
        displayCurrency = targetCurrency.code;
      } else {
        convertedAmount = productAmount;
        displayCurrency = countryCurrency;
      }
    } else {
      const productCurrency = SUPPORTED_CURRENCIES.find(c => c.code === currentCurrency.code);
      if (productCurrency) {
        const amountInAED = displayAmount / productCurrency.rate;
        convertedAmount = amountInAED * productCurrency.rate;
      }
    }
  } else {
    const productCurrency = SUPPORTED_CURRENCIES.find(c => c.code === currentCurrency.code);
    if (productCurrency) {
      const amountInAED = displayAmount / productCurrency.rate;
      convertedAmount = amountInAED * productCurrency.rate;
    }
  }

  const formatted = formatPriceSimple(convertedAmount, displayCurrency);
  
  if (showSymbolSmall) {
    const symbol = displayCurrency;
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
