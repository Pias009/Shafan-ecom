/**
 * Money helpers: amounts are now stored directly as decimal values (e.g., 56.00, 56.50)
 * No more minorInt/cents conversion - prices are stored and used as-is.
 */

/**
 * Get the number of decimal places for a currency
 */
function maxFractionDigitsForCurrency(currency: string): number {
  return ["KWD", "BHD", "OMR"].includes(currency?.toUpperCase() || "AED") ? 3 : 2;
}

/**
 * Admin / row input: "45,54" means 45.54 (not "only cents").
 * Uses the last comma as the separator between whole amount and the fractional part.
 * The fractional part is padded on the right with zeros up to the currency's decimals
 * (e.g. "45,5" with 2 decimals → 45.50). Extra digits after the comma are truncated.
 * If there is no comma, a single dot works the same way (last dot = decimal).
 */
export function parseCommaSeparatedPriceInput(raw: string, currency: string): number | null {
  const trimmed = raw.trim().replace(/\s/g, "");
  if (!trimmed) return null;

  const maxFrac = maxFractionDigitsForCurrency(currency);
  const lastComma = trimmed.lastIndexOf(",");
  const lastDot = trimmed.lastIndexOf(".");

  let wholePart: string;
  let fracPart: string;
  if (lastComma >= 0 && (lastDot < 0 || lastComma > lastDot)) {
    wholePart = trimmed.slice(0, lastComma);
    fracPart = trimmed.slice(lastComma + 1);
  } else if (lastDot >= 0) {
    wholePart = trimmed.slice(0, lastDot);
    fracPart = trimmed.slice(lastDot + 1);
  } else {
    wholePart = trimmed;
    fracPart = "";
  }

  const wholeDigits = wholePart.replace(/[^\d]/g, "");
  const fracDigitsOnly = fracPart.replace(/[^\d]/g, "");

  if (!wholeDigits && !fracDigitsOnly) return null;

  const whole = wholeDigits ? parseInt(wholeDigits, 10) : 0;
  if (!Number.isFinite(whole) || whole < 0) return null;

  if (!fracDigitsOnly) return whole;

  let fd = fracDigitsOnly.slice(0, maxFrac);
  while (fd.length < maxFrac) fd += "0";

  const fracInt = parseInt(fd, 10);
  if (!Number.isFinite(fracInt) || fracInt < 0) return null;

  const denom = 10 ** maxFrac;
  return whole + fracInt / denom;
}

/** Accept "34,45" or "34.45" → major units (dot or comma as decimal). Prefer parseCommaSeparatedPriceInput in admin. */
export function parseLocalizedDecimalInput(raw: string): number | null {
  const s = raw.trim().replace(/\s/g, "").replace(",", ".");
  if (s === "" || s === ".") return null;
  const n = parseFloat(s);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/**
 * Format price for admin display with comma separator
 * e.g., 56.50 → "56,50", 56.00 → "56"
 */
export function formatPriceForAdmin(price: number, currency: string): string {
  if (!price || price <= 0) return "";
  const decimals = maxFractionDigitsForCurrency(currency);
  const fixed = price.toFixed(decimals);
  const [w, frac] = fixed.split(".");
  if (!frac || /^0+$/.test(frac)) return w;
  return `${w},${frac}`;
}

/**
 * Format price for display with proper decimal places
 */
export function formatPriceForDisplay(price: number, currency: string): string {
  const decimals = maxFractionDigitsForCurrency(currency);
  return price.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}
