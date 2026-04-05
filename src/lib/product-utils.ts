// Client-safe utility for checking product validity

export function hasValidPrice(product: any, userCountry?: string): boolean {
  if (!product) return false;
  
  const countryCode = (userCountry || '').toUpperCase();
  
  // Check country-specific prices first
  if (product.countryPrices && product.countryPrices.length > 0) {
    const countryPrice = product.countryPrices.find((cp: any) =>
      cp.country?.toUpperCase() === countryCode || cp.countryCode?.toUpperCase() === countryCode
    );
    if (countryPrice && (countryPrice.price > 0 || Number(countryPrice.price) > 0)) {
      return true;
    }
  }
  
  // Fallback: check base price
  if (product.price && Number(product.price) > 0) {
    return true;
  }
  
  return false;
}

export function getDisplayPrice(product: any, userCountry?: string): { price: number; currency: string } {
  const countryCode = (userCountry || '').toUpperCase();
  
  if (product?.countryPrices && product.countryPrices.length > 0) {
    const countryPrice = product.countryPrices.find((cp: any) =>
      cp.country?.toUpperCase() === countryCode || cp.countryCode?.toUpperCase() === countryCode
    );
    if (countryPrice && Number(countryPrice.price) > 0) {
      return {
        price: Number(countryPrice.price) || 0,
        currency: countryPrice.currency || 'USD'
      };
    }
  }
  
  // Fallback to base price
  if (product?.price && Number(product.price) > 0) {
    return {
      price: Number(product.price) || 0,
      currency: product.currency || 'USD'
    };
  }
  
  return { price: 0, currency: 'USD' };
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
