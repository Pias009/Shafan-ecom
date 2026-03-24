"use client";

import { SUPPORTED_COUNTRIES } from "./countries";

/**
 * Default country fallback (UAE)
 */
export const DEFAULT_COUNTRY = "AE";

/**
 * Detects user's country based on available methods:
 * 1. From localStorage (user selection)
 * 2. From browser language/region
 * 3. From IP geolocation (if implemented)
 * 4. Default fallback (UAE)
 */
export function detectUserCountry(): string {
  if (typeof window === "undefined") {
    return DEFAULT_COUNTRY;
  }

  // 1. Check localStorage for user-selected country
  const storedCountry = localStorage.getItem("user-country");
  if (storedCountry && SUPPORTED_COUNTRIES.some(c => c.code === storedCountry)) {
    return storedCountry;
  }

  // 2. Check browser language/region
  const browserLanguage = navigator.language || "en-US";
  const regionMatch = browserLanguage.match(/-([A-Z]{2})$/);
  if (regionMatch) {
    const regionCode = regionMatch[1].toUpperCase();
    if (SUPPORTED_COUNTRIES.some(c => c.code === regionCode)) {
      return regionCode;
    }
  }

  // 3. Check timezone for region hint
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (timezone.includes("Dubai") || timezone.includes("Abu Dhabi")) {
      return "AE";
    }
    if (timezone.includes("Riyadh") || timezone.includes("Jeddah")) {
      return "SA";
    }
    if (timezone.includes("Kuwait")) {
      return "KW";
    }
    if (timezone.includes("Dhaka")) {
      return "BD";
    }
    if (timezone.includes("Muscat")) {
      return "OM";
    }
    if (timezone.includes("Doha")) {
      return "QA";
    }
  } catch (error) {
    // Timezone detection failed
  }

  // 4. Default fallback
  return DEFAULT_COUNTRY;
}

/**
 * Sets the user's country preference in localStorage
 */
export function setUserCountry(countryCode: string): void {
  if (typeof window === "undefined") return;
  
  if (SUPPORTED_COUNTRIES.some(c => c.code === countryCode)) {
    localStorage.setItem("user-country", countryCode);
  }
}

/**
 * Gets the user's country with fallback logic
 */
export function getUserCountry(): string {
  return detectUserCountry();
}

/**
 * React hook for country detection (to be used in components)
 */
export function useUserCountry(): string {
  if (typeof window === "undefined") {
    return DEFAULT_COUNTRY;
  }
  
  return detectUserCountry();
}