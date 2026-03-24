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
}

export const SUPPORTED_COUNTRIES: readonly CountryConfig[] = [
  {
    code: 'AE',
    name: 'United Arab Emirates',
    currency: 'AED',
    currencySymbol: 'د.إ',
    isActive: true
  },
  {
    code: 'KW',
    name: 'Kuwait',
    currency: 'KWD',
    currencySymbol: 'د.ك',
    isActive: true
  },
  {
    code: 'BD',
    name: 'Bangladesh',
    currency: 'BDT',
    currencySymbol: '৳',
    isActive: true
  },
  {
    code: 'SA',
    name: 'Saudi Arabia',
    currency: 'SAR',
    currencySymbol: 'ر.س',
    isActive: true
  },
  {
    code: 'OM',
    name: 'Oman',
    currency: 'OMR',
    currencySymbol: 'ر.ع.',
    isActive: true
  },
  {
    code: 'QA',
    name: 'Qatar',
    currency: 'QAR',
    currencySymbol: 'ر.ق',
    isActive: true
  }
] as const;

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
    throw new Error(`Invalid country code: ${countryCode}. Supported codes: ${SUPPORTED_COUNTRIES.map(c => c.code).join(', ')}`);
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