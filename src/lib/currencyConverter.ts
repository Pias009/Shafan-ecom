const CURRENCY_SYMBOLS: Record<string, string> = {
  AED: 'AED',
  KWD: 'KWD',
  BHD: 'BHD',
  SAR: 'SAR',
  OMR: 'OMR',
  QAR: 'QAR',
  BDT: 'BDT',
  USD: '$',
  EUR: '€',
  GBP: '£',
};

const THREE_DECIMAL_CURRENCIES = ['KWD', 'BHD', 'OMR'];

export function formatPrice(amount: number | string, currency?: string): string {
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : Number(amount);
  
  if (isNaN(numericAmount)) return '0.00';
  
  const code = currency?.toUpperCase() || 'AED';
  const symbol = CURRENCY_SYMBOLS[code] || code;
  const decimals = THREE_DECIMAL_CURRENCIES.includes(code) ? 3 : 2;
  
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(numericAmount);
  
  return `${symbol} ${formatted}`;
}

export function getCurrencySymbol(currency: string): string {
  return CURRENCY_SYMBOLS[currency?.toUpperCase()] || currency?.toUpperCase() || 'AED';
}

export function getCurrencyDecimals(currency: string): number {
  return THREE_DECIMAL_CURRENCIES.includes(currency?.toUpperCase()) ? 3 : 2;
}