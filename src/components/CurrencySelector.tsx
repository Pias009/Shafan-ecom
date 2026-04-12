"use client";

import { useCountryStore } from "@/lib/country-store";
import { getFlagForCountry } from "@/lib/currency-rates";

const CURRENCY_LIST = [
  { code: "KWD", name: "Kuwait", flag: "🇰🇼" },
  { code: "AED", name: "UAE", flag: "🇦🇪" },
  { code: "SAR", name: "Saudi Arabia", flag: "🇸🇦" },
  { code: "BHD", name: "Bahrain", flag: "🇧🇭" },
  { code: "QAR", name: "Qatar", flag: "🇶🇦" },
  { code: "OMR", name: "Oman", flag: "🇴🇲" },
];

export function CurrencySelector() {
  const { selectedCurrency, setCurrency } = useCountryStore();

  return (
    <div className="flex flex-col items-center">
      <span style={{ 
        fontSize: '10px', 
        fontWeight: 900, 
        color: '#000', 
        opacity: 0.5,
        textTransform: 'uppercase', 
        letterSpacing: '0.15em',
        marginBottom: '8px'
      }}>
        Currency
      </span>
      <div className="flex flex-wrap gap-2 justify-center">
        {CURRENCY_LIST.slice(0, 3).map((currency) => (
          <button
            key={currency.code}
            onClick={() => setCurrency(currency.code)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '8px 12px',
              borderRadius: '10px',
              fontSize: '12px',
              fontWeight: 600,
              background: selectedCurrency === currency.code ? '#000' : '#f0f0f0',
              color: selectedCurrency === currency.code ? '#fff' : '#000',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <span>{currency.flag}</span>
            <span>{currency.code}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
