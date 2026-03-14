"use client";

import { useCurrencyStore } from "@/lib/currency-store";
import { useEffect, useState } from "react";

interface PriceProps {
  amount: number | string;
  className?: string;
  originalAmount?: number | string; // For showing discount/strikethrough
}

export function Price({ amount, className = "" }: PriceProps) {
  const { formatPrice, currentCurrency } = useCurrencyStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Return a placeholder or the raw amount to prevent hydration mismatch
    return <span className={className}>...</span>;
  }

  return <span className={className}>{formatPrice(amount)}</span>;
}
