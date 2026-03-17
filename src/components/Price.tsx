"use client";

import { useCurrencyStore } from "@/lib/currency-store";
import { useEffect, useState } from "react";

interface PriceProps {
  amount: number | string;
  className?: string;
  showSymbolSmall?: boolean;
}

export function Price({ amount, className = "", showSymbolSmall = false }: PriceProps) {
  const { formatPrice, currentCurrency } = useCurrencyStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <span className={className}>...</span>;
  }

  const formatted = formatPrice(amount);
  
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
