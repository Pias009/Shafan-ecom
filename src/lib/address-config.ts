/**
 * Address & Delivery Configuration
 * Controls which countries accept orders and their delivery settings
 */

export interface CountryConfig {
  code: string;
  name: string;
  active: boolean;
  currency: string;
  minOrderCents: number;
  deliveryFeeCents: number;
  freeDeliveryCents: number;
  estimatedDays: number;
  regions?: string[];
}

/**
 * Main configuration - which countries can place orders
 * Set active: false to disable orders from that country
 */
export const COUNTRY_CONFIG: Record<string, CountryConfig> = {
  AE: {
    code: 'AE',
    name: 'United Arab Emirates',
    active: true,
    currency: 'AED',
    minOrderCents: 80,
    deliveryFeeCents: 15,
    freeDeliveryCents: 150,
    estimatedDays: 2,
    regions: ['Abu Dhabi', 'Dubai', 'Sharjah', 'Ajman', 'Ras Al Khaimah', 'Fujairah', 'Umm Al Quwain'],
  },
  KW: {
    code: 'KW',
    name: 'Kuwait',
    active: true,
    currency: 'KWD',
    minOrderCents: 12,
    deliveryFeeCents: 1.5,
    freeDeliveryCents: 18,
    estimatedDays: 3,
    regions: ['Kuwait City', 'Farwaniya', 'Hawalli', 'Salwa', 'Jabra', 'Salmiya'],
  },
  BH: {
    code: 'BH',
    name: 'Bahrain',
    active: true,
    currency: 'BHD',
    minOrderCents: 13,
    deliveryFeeCents: 1.99,
    freeDeliveryCents: 18,
    estimatedDays: 2,
    regions: ['Manama', 'Muharraq', 'Riffa', 'Hamad Town', 'Sitra'],
  },
  SA: {
    code: 'SA',
    name: 'Saudi Arabia',
    active: true,
    currency: 'SAR',
    minOrderCents: 159,
    deliveryFeeCents: 19,
    freeDeliveryCents: 359,
    estimatedDays: 4,
    regions: ['Riyadh', 'Jeddah', 'Dammam', 'Medina', 'Mecca', 'Khobar', 'Taif', 'Abha'],
  },
  OM: {
    code: 'OM',
    name: 'Oman',
    active: true,
    currency: 'OMR',
    minOrderCents: 16,
    deliveryFeeCents: 1.9,
    freeDeliveryCents: 22,
    estimatedDays: 3,
    regions: ['Muscat', 'Salalah', 'Nizwa', 'Sohar', 'Barka'],
  },
  QA: {
    code: 'QA',
    name: 'Qatar',
    active: true,
    currency: 'QAR',
    minOrderCents: 129,
    deliveryFeeCents: 19,
    freeDeliveryCents: 299,
    estimatedDays: 2,
    regions: ['Doha', 'Al Rayyan', 'Al Wakrah', 'Al Khor', 'Umm Salal'],
  },
};

/**
 * Get list of active countries that accept orders
 */
export function getActiveCountries(): CountryConfig[] {
  return Object.values(COUNTRY_CONFIG).filter((country) => country.active);
}

/**
 * Check if a country accepts orders
 */
export function isCountryActive(countryCode: string): boolean {
  const country = COUNTRY_CONFIG[countryCode];
  return country?.active ?? false;
}

/**
 * Get regions for a specific country
 */
export function getCountryRegions(countryCode: string): string[] {
  return COUNTRY_CONFIG[countryCode]?.regions ?? [];
}

/**
 * Get all regions for all active countries
 */
export function getAllRegions(): Record<string, string[]> {
  const regions: Record<string, string[]> = {};
  Object.values(COUNTRY_CONFIG).forEach((country) => {
    if (country.active && country.regions) {
      regions[country.code] = country.regions;
    }
  });
  return regions;
}
