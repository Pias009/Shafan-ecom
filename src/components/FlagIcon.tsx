"use client";

import React, { useState } from "react";

export interface FlagIconProps {
  code?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  alt?: string;
  rounded?: "none" | "sm" | "md" | "full";
}

const COUNTRY_CODE_MAP: Record<string, string> = {
  ae: "ae",
  are: "ae",
  "united arab emirates": "ae",
  uae: "ae",
  sa: "sa",
  sau: "sa",
  "saudi arabia": "sa",
  ksa: "sa",
  qa: "qa",
  qat: "qa",
  qatar: "qa",
  kw: "kw",
  kwt: "kw",
  kuwait: "kw",
  bh: "bh",
  bhr: "bh",
  bahrain: "bh",
  om: "om",
  omn: "om",
  oman: "om",
  us: "us",
  usa: "us",
  "united states": "us",
  eu: "eu",
  eur: "eu",
  europe: "eu",
  "european union": "eu",
  gb: "gb",
  gbr: "gb",
  uk: "gb",
  "united kingdom": "gb",
  en: "gb",
  ar: "sa",
  bd: "bd",
  bgd: "bd",
  bangladesh: "bd",
};

const SIZE_MAP = {
  xs: "w-3.5 h-2.5 min-w-[14px]",
  sm: "w-5 h-3.5 min-w-[20px]",
  md: "w-6 h-4 min-w-[24px]",
  lg: "w-8 h-5.5 min-w-[32px]",
  xl: "w-10 h-7 min-w-[40px]",
};

const ROUNDED_MAP = {
  none: "rounded-none",
  sm: "rounded-[2px]",
  md: "rounded-[4px]",
  full: "rounded-full aspect-square object-cover",
};

export function FlagIcon({
  code = "ae",
  size = "sm",
  className = "",
  alt,
  rounded = "sm",
}: FlagIconProps) {
  const [hasError, setHasError] = useState(false);
  const [triedCdn, setTriedCdn] = useState(false);

  const cleanKey = (code || "").trim().toLowerCase();
  const isoCode = COUNTRY_CODE_MAP[cleanKey] || cleanKey.slice(0, 2);

  // If local SVG fails, try flagcdn once, then fallback to text badge
  const src = !triedCdn ? `/flags/${isoCode}.svg` : `https://flagcdn.com/${isoCode}.svg`;

  const sizeClass = SIZE_MAP[size] || SIZE_MAP.sm;
  const roundedClass = ROUNDED_MAP[rounded] || ROUNDED_MAP.sm;
  const label = alt || `${(code || "Country").toUpperCase()} flag`;

  if (hasError) {
    return (
      <span
        className={`inline-flex items-center justify-center font-bold text-[9px] uppercase tracking-tighter bg-black/5 text-black/60 border border-black/10 ${sizeClass} ${roundedClass} ${className}`}
        title={label}
        aria-label={label}
      >
        {isoCode.toUpperCase()}
      </span>
    );
  }

  return (
    <img
      src={src}
      alt={label}
      title={label}
      loading="eager"
      decoding="async"
      className={`inline-block object-cover ring-1 ring-black/10 shadow-[0_1px_2px_rgba(0,0,0,0.06)] shrink-0 ${sizeClass} ${roundedClass} ${className}`}
      onError={() => {
        if (!triedCdn) {
          setTriedCdn(true);
        } else {
          setHasError(true);
        }
      }}
    />
  );
}

export default FlagIcon;
