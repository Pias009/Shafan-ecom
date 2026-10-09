// Countries where the Shanfa Tamara merchant account can take payments.
// Checked against Tamara's live payment-options-pre-check API: AE and SA are
// enabled; QA, BH and OM return "not_supported_country_currency". Add a code
// here once Tamara enables it on the account. (Kuwait is excluded separately
// by the KW = Card + COD only rule.)
export const TAMARA_SUPPORTED_COUNTRIES = ["AE", "SA"];

export function isTamaraAvailable(country?: string | null): boolean {
  return TAMARA_SUPPORTED_COUNTRIES.includes((country || "").toUpperCase());
}
