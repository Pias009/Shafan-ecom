/**
 * Country-based pricing utilities
 * Uses the exact 6 countries defined in countries.ts
 */

import { SUPPORTED_COUNTRIES, getCountryByCode, getCurrencyForCountry, isValidCountryCode, type CountryCode } from './countries';

export interface CountryPrice {
  country: CountryCode;
  price: number;
  currency: string;
  active: boolean;
}

export interface ProductWithCountryPrices {
  id: string;
  price: number;
  regularPrice: number;
  salePrice?: number | null;
  currency: string;
  countryPrices: CountryPrice[];
}

/**
 * Get the price for a product based on country
 * @param product Product with country prices
 * @param countryCode Country code (must be one of the 6 supported countries)
 * @returns Object with price and currency
 */
export function getPriceForCountry(
  product: ProductWithCountryPrices,
  countryCode: CountryCode | string
): { price: number; currency: string; isCountrySpecific: boolean } {
  if (!countryCode || !isValidCountryCode(countryCode)) {
    // Return default price if invalid country
    return {
      price: product.salePrice || product.price,
      currency: product.currency,
      isCountrySpecific: false
    };
  }

  const countryPrice = product.countryPrices?.find(
    cp => cp.country === countryCode && cp.active
  );

  if (countryPrice) {
    return {
      price: countryPrice.price,
      currency: countryPrice.currency,
      isCountrySpecific: true
    };
  }

  // Fall back to default price
  return {
    price: product.salePrice || product.price,
    currency: product.currency,
    isCountrySpecific: false
  };
}

/**
 * Format price for display with country context
 */
export function formatCountryPrice(
  product: ProductWithCountryPrices,
  countryCode: CountryCode | string,
  formatFn: (amount: number, currency: string) => string
): string {
  const { price, currency } = getPriceForCountry(product, countryCode);
  return formatFn(price, currency);
}

/**
 * Get all available countries for a product
 */
export function getAvailableCountries(product: ProductWithCountryPrices): CountryCode[] {
  return product.countryPrices
    ?.filter(cp => cp.active && isValidCountryCode(cp.country))
    .map(cp => cp.country as CountryCode) || [];
}

/**
 * Get default country price configuration for all 6 countries
 * Used to initialize country prices in admin forms
 */
export function getDefaultCountryPrices(basePrice: number): Omit<CountryPrice, 'active'>[] {
  return SUPPORTED_COUNTRIES.map(country => ({
    country: country.code as CountryCode,
    price: basePrice,
    currency: country.currency
  }));
}

/**
 * Validate country prices array
 * Ensures only the 6 supported countries are present
 */
export function validateCountryPrices(countryPrices: any[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const seenCountries = new Set<string>();
  
  if (!Array.isArray(countryPrices)) {
    return { valid: false, errors: ['Country prices must be an array'] };
  }
  
  for (const cp of countryPrices) {
    if (!cp.country) {
      errors.push('Country price missing country code');
      continue;
    }
    
    if (!isValidCountryCode(cp.country)) {
      errors.push(`Invalid country code: ${cp.country}. Supported: ${SUPPORTED_COUNTRIES.map(c => c.code).join(', ')}`);
    }
    
    if (seenCountries.has(cp.country)) {
      errors.push(`Duplicate country: ${cp.country}`);
    }
    seenCountries.add(cp.country);
    
    if (typeof cp.price !== 'number' || cp.price < 0) {
      errors.push(`Invalid price for country ${cp.country}: must be non-negative number`);
    }
    
    // Auto-detect and validate currency
    const expectedCurrency = getCurrencyForCountry(cp.country);
    if (cp.currency && cp.currency !== expectedCurrency) {
      errors.push(`Currency mismatch for ${cp.country}: expected ${expectedCurrency}, got ${cp.currency}`);
    }
  }
  
  // Check for missing required countries (optional - depends on business logic)
  // const missingCountries = SUPPORTED_COUNTRIES
  //   .filter(c => !seenCountries.has(c.code))
  //   .map(c => c.code);
  // if (missingCountries.length > 0) {
  //   errors.push(`Missing countries: ${missingCountries.join(', ')}`);
  // }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Auto-complete country price objects with correct currency
 */
export function autoCompleteCountryPrices(countryPrices: any[]): CountryPrice[] {
  return countryPrices.map(cp => {
    const countryCode = cp.country;
    const currency = getCurrencyForCountry(countryCode);
    
    return {
      country: countryCode as CountryCode,
      price: typeof cp.price === 'number' ? cp.price : 0,
      currency,
      active: cp.active !== false // Default to true if not specified
    };
  });
}

/**
 * Validate product data integrity for country pricing
 * Ensures:
 * 1. Default price is valid
 * 2. Country prices are valid and complete
 * 3. No duplicate countries
 * 4. Currency matches country
 */
export function validateProductCountryPricing(
  productData: {
    price: number;
    currency: string;
    countryPrices?: any[];
  }
): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate default price
  if (typeof productData.price !== 'number' || productData.price < 0) {
    errors.push(`Invalid default price: ${productData.price}`);
  }

  // Validate default currency
  if (!productData.currency || typeof productData.currency !== 'string') {
    errors.push('Invalid default currency');
  }

  // Validate country prices if present
  if (productData.countryPrices && Array.isArray(productData.countryPrices)) {
    const countryValidation = validateCountryPrices(productData.countryPrices);
    if (!countryValidation.valid) {
      errors.push(...countryValidation.errors);
    }

    // Check if all 6 countries are present (warning, not error)
    const presentCountries = new Set(
      productData.countryPrices.map((cp: any) => cp.country?.toUpperCase())
    );
    const missingCountries = SUPPORTED_COUNTRIES
      .filter(c => !presentCountries.has(c.code))
      .map(c => c.name);
    
    if (missingCountries.length > 0) {
      warnings.push(`Missing country prices for: ${missingCountries.join(', ')}`);
    }

    // Check for price consistency (warning if country price differs significantly from default)
    const defaultPrice = productData.price;
    productData.countryPrices.forEach((cp: any) => {
      if (cp.price && Math.abs(cp.price - defaultPrice) / defaultPrice > 0.5) {
        warnings.push(`Country price for ${cp.country} differs significantly from default price (${cp.price} vs ${defaultPrice})`);
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Ensure country price data integrity before database operations
 * This should be called before creating/updating product with country prices
 */
export function ensureCountryPriceIntegrity(
  countryPrices: any[],
  basePrice: number
): CountryPrice[] {
  const validated = validateCountryPrices(countryPrices);
  if (!validated.valid) {
    throw new Error(`Country price validation failed: ${validated.errors.join(', ')}`);
  }

  // Auto-complete missing fields
  const completed = autoCompleteCountryPrices(countryPrices);

  // Ensure all 6 countries are present (create defaults for missing ones)
  const presentCountries = new Set(completed.map(cp => cp.country));
  const allCountries = SUPPORTED_COUNTRIES.map(c => c.code as CountryCode);
  
  const missingCountries = allCountries.filter(code => !presentCountries.has(code));
  const defaultPrices = missingCountries.map(countryCode => ({
    country: countryCode,
    price: basePrice,
    currency: getCurrencyForCountry(countryCode) || 'AED',
    active: true
  }));

  return [...completed, ...defaultPrices];
}