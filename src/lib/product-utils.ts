// Client-safe utility for checking product validity

// Check if a product has a valid price for display
export function hasValidPrice(product: any, userCountry?: string): boolean {
  if (product.countryPrices && product.countryPrices.length > 0) {
    const countryPrice = product.countryPrices.find((cp: any) =>
      cp.country?.toUpperCase() === (userCountry || '').toUpperCase()
    );
    const priceToUse = countryPrice || product.countryPrices.find((cp: any) => cp.price > 0);
    return priceToUse && priceToUse.price > 0;
  }
  return product.price > 0;
}

// Get the display price for a product - returns direct decimal value
export function getDisplayPrice(product: any, userCountry?: string): { price: number; currency: string } {
  if (product?.countryPrices && product.countryPrices.length > 0) {
    const countryPrice = product.countryPrices.find((cp: any) =>
      cp.country?.toUpperCase() === (userCountry || '').toUpperCase()
    );
    const priceToUse = countryPrice || product.countryPrices.find((cp: any) => (Number(cp.price) || 0) > 0);
    if (priceToUse) {
      return {
        price: Number(priceToUse.price) || 0,
        currency: priceToUse.currency || 'USD'
      };
    }
  }
  
  // Final fallback to base price fields
  const basePrice = product?.price ?? product?.discountPrice ?? 0;
  return {
    price: Number(basePrice) || 0,
    currency: product?.currency || 'USD'
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
