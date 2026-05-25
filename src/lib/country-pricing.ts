import { getCurrencyForCountry, type CountryCode } from './countries';

export interface CountryPrice {
  country: CountryCode;
  price: number;
  currency: string;
  active: boolean;
}

export function autoCompleteCountryPrices(countryPrices: any[]): CountryPrice[] {
  return countryPrices.map((cp) => {
    const countryCode = cp.country;
    const currency = getCurrencyForCountry(countryCode);

    return {
      country: countryCode as CountryCode,
      price: typeof cp.price === 'number' ? cp.price : 0,
      currency,
      active: cp.active !== false,
    };
  });
}
