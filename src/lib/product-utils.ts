// Client-safe utility for checking product validity

// Check if a product has a valid price for display
export function hasValidPrice(product: any, userCountry?: string): boolean {
  if (product.countryPrices && product.countryPrices.length > 0) {
    const countryPrice = product.countryPrices.find((cp: any) =>
      cp.country?.toUpperCase() === (userCountry || '').toUpperCase()
    );
    const priceToUse = countryPrice || product.countryPrices.find((cp: any) => cp.priceCents > 0);
    return priceToUse && priceToUse.priceCents > 0;
  }
  return product.price > 0 || product.priceCents > 0;
}

// Get the display price for a product - returns raw currency units
export function getDisplayPrice(product: any, userCountry?: string): { price: number; currency: string } {
  if (product?.countryPrices && product.countryPrices.length > 0) {
    const countryPrice = product.countryPrices.find((cp: any) =>
      cp.country?.toUpperCase() === (userCountry || '').toUpperCase()
    );
    const priceToUse = countryPrice || product.countryPrices.find((cp: any) => (Number(cp.priceCents) || 0) > 0);
    if (priceToUse) {
      return {
        price: Number(priceToUse.priceCents) || 0,
        currency: priceToUse.currency || 'USD'
      };
    }
  }
  
  // Final fallback to base price fields
  const basePrice = product?.priceCents ?? product?.price ?? 0;
  return {
    price: Number(basePrice) || 0,
    currency: product?.currency || 'USD'
  };
}
