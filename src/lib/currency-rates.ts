const USD_TO_BDT = 120;

export const EXCHANGE_RATES: Record<string, number> = {
  USD: 1,
  AED: 3.67,
  SAR: 3.75,
  KWD: 0.30,
  BHD: 0.37,
  QAR: 3.64,
  OMR: 0.38,
  BDT: USD_TO_BDT,
  EUR: 0.92,
  GBP: 0.79,
};

export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): number {
  if (fromCurrency === toCurrency) return amount;
  
  const fromRate = EXCHANGE_RATES[fromCurrency.toUpperCase()] || 1;
  const toRate = EXCHANGE_RATES[toCurrency.toUpperCase()] || 1;
  
  const amountInUSD = amount / fromRate;
  return amountInUSD * toRate;
}

export function getExchangeRate(fromCurrency: string, toCurrency: string): number {
  if (fromCurrency === toCurrency) return 1;
  
  const fromRate = EXCHANGE_RATES[fromCurrency.toUpperCase()] || 1;
  const toRate = EXCHANGE_RATES[toCurrency.toUpperCase()] || 1;
  
  return toRate / fromRate;
}

export const COUNTRY_FLAGS: Record<string, string> = {
  AE: '🇦🇪',
  KW: '🇰🇼',
  BH: '🇧🇭',
  SA: '🇸🇦',
  OM: '🇴🇲',
  QA: '🇶🇦',
  BD: '🇧🇩',
  US: '🇺🇸',
  GB: '🇬🇧',
  DE: '🇩🇪',
  FR: '🇫🇷',
};

export function getFlagForCountry(countryCode: string): string {
  return COUNTRY_FLAGS[countryCode.toUpperCase()] || '🌍';
}
