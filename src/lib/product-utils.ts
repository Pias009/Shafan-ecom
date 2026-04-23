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

export function getDisplayPrice(product: any, userCountry?: string): { price: number; currency: string; hasDiscount: boolean; discountPrice: number } {
  const countryCode = (userCountry || '').toUpperCase();
  
  if (product?.countryPrices && product.countryPrices.length > 0) {
    const countryPrice = product.countryPrices.find((cp: any) =>
      cp.country?.toUpperCase() === countryCode || cp.countryCode?.toUpperCase() === countryCode
    );
    if (countryPrice && Number(countryPrice.price) > 0) {
      const discountPriceVal = countryPrice.discountPrice ?? product.discountPrice;
      const hasDiscount = discountPriceVal && Number(discountPriceVal) > 0 && Number(discountPriceVal) < Number(countryPrice.price);
      return {
        price: Number(countryPrice.price) || 0,
        currency: countryPrice.currency || 'USD',
        hasDiscount,
        discountPrice: Number(discountPriceVal) || 0
      };
    }
  }
  
  // Fallback to base price
  if (product?.price && Number(product.price) > 0) {
    const discountPriceVal = product.discountPrice;
    const hasDiscount = discountPriceVal && Number(discountPriceVal) > 0 && Number(discountPriceVal) < Number(product.price);
    return {
      price: Number(product.price) || 0,
      currency: product.currency || 'USD',
      hasDiscount,
      discountPrice: Number(discountPriceVal) || 0
    };
  }
  
  return { price: 0, currency: 'USD', hasDiscount: false, discountPrice: 0 };
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