"use client";

import { useState, useEffect } from "react";
import { useCountryStore } from "@/lib/country-store";
import { detectUserCountry } from "@/lib/country-detection";

export function CountrySelector() {
  const { setCountry, setDetectedCountry, _hasHydrated } = useCountryStore();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (_hasHydrated && !initialized) {
      const detected = detectUserCountry();
      setDetectedCountry(detected);
      setCountry(detected);
      setInitialized(true);
    }
  }, [_hasHydrated, initialized, setCountry, setDetectedCountry]);

  return null;
}
