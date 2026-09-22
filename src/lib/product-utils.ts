import { getCurrencyForCountry } from './countries';
import { convertCurrency } from './currency-rates';

// Client-safe utility for checking product validity
export function hasValidPrice(product: any, userCountry?: string): boolean {
  if (!product) return false;
  
  const countryCode = (userCountry || '').toUpperCase();
  
  // Check if product has any country prices
  if (product.countryPrices && product.countryPrices.length > 0) {
    // First check user's country
    const countryPrice = product.countryPrices.find((cp: any) =>
      cp.country?.toUpperCase() === countryCode || cp.countryCode?.toUpperCase() === countryCode
    );
    if (countryPrice && (countryPrice.price > 0 || Number(countryPrice.price) > 0)) {
      return true;
    }
    // If no price for user's country, check if ANY country has price - show product anyway
    const anyCountryPrice = product.countryPrices.find((cp: any) => cp.price > 0 || Number(cp.price) > 0);
    if (anyCountryPrice) {
      return true;
    }
  }
  
  // Fallback: check base price
  if (product.price && Number(product.price) > 0) {
    return true;
  }
  
  return false;
}

export function getDisplayPrice(product: any, userCountry?: string): { price: number; currency: string; hasDiscount: boolean; discountPrice: number; originalPrice: number } {
  const countryCode = (userCountry || 'KW').toUpperCase();
  const targetCurrency = getCurrencyForCountry(countryCode);
  
  if (product?.countryPrices && product.countryPrices.length > 0) {
    const countryPrice = product.countryPrices.find((cp: any) =>
      cp.country?.toUpperCase() === countryCode || cp.countryCode?.toUpperCase() === countryCode
    );
    if (countryPrice && Number(countryPrice.price) > 0) {
      const discountPriceVal = countryPrice.discountPrice ?? product.discountPrice;
      const hasDiscount = !!(discountPriceVal && Number(discountPriceVal) > 0 && Number(discountPriceVal) < Number(countryPrice.price));
      
      const effectivePrice = hasDiscount ? Number(discountPriceVal) : Number(countryPrice.price);
      
      return {
        price: effectivePrice || 0,
        originalPrice: Number(countryPrice.price) || 0,
        currency: countryPrice.currency || targetCurrency,
        hasDiscount,
        discountPrice: Number(discountPriceVal) || 0
      };
    }
  }
  
  // Fallback to base price with automatic currency conversion
  if (product?.price && Number(product.price) > 0) {
    const baseCurrency = product.currency || 'AED';
    const discountPriceVal = product.discountPrice;
    const hasDiscount = !!(discountPriceVal && Number(discountPriceVal) > 0 && Number(discountPriceVal) < Number(product.price));
    
    const rawEffectivePrice = hasDiscount ? Number(discountPriceVal) : Number(product.price);
    const rawOriginalPrice = Number(product.price);

    const convertedPrice = convertCurrency(rawEffectivePrice, baseCurrency, targetCurrency);
    const convertedOriginal = convertCurrency(rawOriginalPrice, baseCurrency, targetCurrency);
    const convertedDiscount = hasDiscount ? convertCurrency(Number(discountPriceVal), baseCurrency, targetCurrency) : 0;

    return {
      price: convertedPrice || 0,
      originalPrice: convertedOriginal || 0,
      currency: targetCurrency,
      hasDiscount,
      discountPrice: convertedDiscount || 0
    };
  }
  
  return { price: 0, originalPrice: 0, currency: targetCurrency, hasDiscount: false, discountPrice: 0 };
}

export interface ResolvedPrice {
  displayPrice: number;
  originalPrice: number;
  currency: string;
  hasDiscount: boolean;
  discountPrice: number;
  available: boolean;
}

/**
 * Single source of truth for the price shown on every product surface
 * (cards, quick-view popup, product detail page, sliders).
 *
 * The real price lives in `product.countryPrices` — one entry per serviced
 * country in that country's own currency. The legacy base `price` /
 * `discountPrice` fields are unreliable (currency is a stale value and the
 * price is 0 for almost every product), so they are only used as a final
 * fallback when the user's country has no entry.
 */
export function resolveProductPrice(product: any, userCountry?: string): ResolvedPrice {
  const countryCode = (userCountry || "").toUpperCase();
  const fallbackCurrency = getCurrencyForCountry(countryCode || "AE");

  const cpArray = Array.isArray(product?.countryPrices) ? product.countryPrices : [];

  // 1. Real, per-country price for the user's country
  if (cpArray.length > 0) {
    const cp = cpArray.find(
      (c: any) =>
        String(c.country ?? c.countryCode ?? "").toUpperCase() === countryCode &&
        c.active !== false
    );
    if (cp) {
      const regular = Number(cp.price) || 0;
      if (regular > 0) {
        const cpDiscount = Number(cp.discountPrice ?? cp.salePrice ?? 0) || 0;
        // Base discountPrice is only meaningful when it shares the country's currency
        const sameCurrency =
          String(cp.currency || "").toUpperCase() ===
          String(product?.currency || "").toUpperCase();
        const baseDiscount = sameCurrency ? Number(product?.discountPrice) || 0 : 0;
        const discount = cpDiscount > 0 && cpDiscount < regular
          ? cpDiscount
          : baseDiscount > 0 && baseDiscount < regular
            ? baseDiscount
            : 0;

        return {
          displayPrice: discount > 0 ? discount : regular,
          originalPrice: regular,
          currency: String(cp.currency || fallbackCurrency).toUpperCase(),
          hasDiscount: discount > 0,
          discountPrice: discount,
          available: true,
        };
      }
    }
  }

  // 2. Fallback to the base product price
  if (product?.price && Number(product.price) > 0) {
    const regular = Number(product.price);
    const baseDiscount = Number(product.discountPrice) || 0;
    const hasDiscount = baseDiscount > 0 && baseDiscount < regular;
    return {
      displayPrice: hasDiscount ? baseDiscount : regular,
      originalPrice: regular,
      currency: String(product.currency || "AED").toUpperCase(),
      hasDiscount,
      discountPrice: hasDiscount ? baseDiscount : 0,
      available: true,
    };
  }

  return {
    displayPrice: 0,
    originalPrice: 0,
    currency: fallbackCurrency,
    hasDiscount: false,
    discountPrice: 0,
    available: false,
  };
}

// Helper to get correct divisor for raw price units (cents vs fils)
export function getCurrencyDivisor(currencyCode: string): number {
  const code = currencyCode?.toUpperCase() || 'AED';
  return ["KWD", "BHD", "OMR"].includes(code) ? 1000 : 100;
}

// Format price for display with proper decimal places
export function formatPriceUnits(amount: number, currencyCode: string): string {
  const decimals = ["KWD", "BHD", "OMR"].includes(currencyCode?.toUpperCase()) ? 3 : 2;
  const value = Number(amount);
  
  return value.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}