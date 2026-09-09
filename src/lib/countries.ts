/**
 * Exact 6 countries supported by the system
 * IMMUTABLE CONFIGURATION - DO NOT MODIFY WITHOUT SYSTEM ADMIN APPROVAL
 */

export interface CountryConfig {
  code: string;
  name: string;
  currency: string;
  currencySymbol: string;
  isActive: boolean;
  flag: string;
}

export const SUPPORTED_COUNTRIES: readonly CountryConfig[] = [
  {
    code: 'AE',
    name: 'UAE (AED)',
    currency: 'AED',
    currencySymbol: 'AED',
    isActive: true,
    flag: '🇦🇪'
  },
  {
    code: 'SA',
    name: 'Saudi Arabia (SAR)',
    currency: 'SAR',
    currencySymbol: 'SAR',
    isActive: true,
    flag: '🇸🇦'
  },
  {
    code: 'QA',
    name: 'Qatar (QAR)',
    currency: 'QAR',
    currencySymbol: 'QAR',
    isActive: true,
    flag: '🇶🇦'
  },
  {
    code: 'KW',
    name: 'Kuwait (KWD)',
    currency: 'KWD',
    currencySymbol: 'KWD',
    isActive: true,
    flag: '🇰🇼'
  },
  {
    code: 'BH',
    name: 'Bahrain (BHD)',
    currency: 'BHD',
    currencySymbol: 'BHD',
    isActive: true,
    flag: '🇧🇭'
  },
  {
    code: 'OM',
    name: 'Oman (OMR)',
    currency: 'OMR',
    currencySymbol: 'OMR',
    isActive: true,
    flag: '🇴🇲'
  },
  {
    code: 'US',
    name: 'USD ($)',
    currency: 'USD',
    currencySymbol: '$',
    isActive: true,
    flag: '🇺🇸'
  },
  {
    code: 'EU',
    name: 'EURO (EUR)',
    currency: 'EUR',
    currencySymbol: '€',
    isActive: true,
    flag: '🇪🇺'
  },
  {
    code: 'GB',
    name: 'Pound (GBP)',
    currency: 'GBP',
    currencySymbol: '£',
    isActive: true,
    flag: '🇬🇧'
  },
  {
    code: 'BD',
    name: 'BDT (৳)',
    currency: 'BDT',
    currencySymbol: '৳',
    isActive: true,
    flag: '🇧🇩'
  }
] as const;

export const COUNTRY_TO_CURRENCY: Record<string, string> = {
  AE: "AED",
  KW: "KWD",
  BH: "BHD",
  SA: "SAR",
  OM: "OMR",
  QA: "QAR",
};

// Type-safe country codes
export type CountryCode = typeof SUPPORTED_COUNTRIES[number]['code'];

// Type-safe currency codes
export type CurrencyCode = typeof SUPPORTED_COUNTRIES[number]['currency'];

// Validation functions
export function isValidCountryCode(code: string): code is CountryCode {
  const normalizedCode = code.toUpperCase();
  return SUPPORTED_COUNTRIES.some(country => country.code === normalizedCode);
}

export function getCountryByCode(code: string): CountryConfig | undefined {
  const normalizedCode = code.toUpperCase();
  return SUPPORTED_COUNTRIES.find(country => country.code === normalizedCode);
}

export function getCurrencyForCountry(countryCode: string): string {
  const country = getCountryByCode(countryCode);
  if (!country) {
    console.warn(`Invalid country code: ${countryCode}. Supported codes: ${SUPPORTED_COUNTRIES.map(c => c.code).join(', ')}`);
    return 'USD'; // Default fallback
  }
  return country.currency;
}

export function getCountryName(countryCode: string): string {
  const country = getCountryByCode(countryCode);
  return country?.name || 'Unknown Country';
}

// Get all active country codes
export function getActiveCountryCodes(): CountryCode[] {
  return SUPPORTED_COUNTRIES
    .filter(country => country.isActive)
    .map(country => country.code as CountryCode);
}

// Immutable check - prevent runtime modifications
Object.freeze(SUPPORTED_COUNTRIES);
SUPPORTED_COUNTRIES.forEach(country => Object.freeze(country));