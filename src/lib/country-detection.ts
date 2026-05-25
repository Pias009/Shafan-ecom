"use client";

import { useSyncExternalStore } from "react";
import { SUPPORTED_COUNTRIES } from "./countries";

const DEFAULT_COUNTRY = "KW";
const GULF_COUNTRIES = ["AE", "SA", "KW", "QA", "BH", "OM"];

function detectUserCountry(): string {
  if (typeof window === "undefined") {
    return DEFAULT_COUNTRY;
  }

  const storedCountry = localStorage.getItem("user-country");
  if (storedCountry && SUPPORTED_COUNTRIES.some((c) => c.code === storedCountry)) {
    return storedCountry;
  }

  const browserLanguage = navigator.language || "en-US";
  const regionMatch = browserLanguage.match(/-([A-Z]{2})$/);
  if (regionMatch) {
    const regionCode = regionMatch[1].toUpperCase();
    if (GULF_COUNTRIES.includes(regionCode)) {
      return regionCode;
    }
  }

  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (timezone.includes("Dubai") || timezone.includes("Abu Dhabi")) return "AE";
    if (timezone.includes("Riyadh") || timezone.includes("Jeddah")) return "SA";
    if (timezone.includes("Kuwait")) return "KW";
    if (timezone.includes("Muscat")) return "OM";
    if (timezone.includes("Doha")) return "QA";
    if (timezone.includes("Bahrain")) return "BH";
  } catch {
    // Timezone detection failed
  }

  return DEFAULT_COUNTRY;
}

export function useUserCountry(): string {
  return useSyncExternalStore(
    () => () => {},
    detectUserCountry,
    () => DEFAULT_COUNTRY,
  );
}
