// Test script to debug product validation
const { z } = require('zod');

// Mock the countries module
const SUPPORTED_COUNTRIES = [
  { code: 'UAE', currency: 'AED', name: 'United Arab Emirates' },
  { code: 'KWT', currency: 'KWD', name: 'Kuwait' },
  { code: 'BGD', currency: 'BDT', name: 'Bangladesh' },
  { code: 'SAU', currency: 'SAR', name: 'Saudi Arabia' },
  { code: 'OMN', currency: 'OMR', name: 'Oman' },
  { code: 'QAT', currency: 'QAR', name: 'Qatar' }
];

function isValidCountryCode(code) {
  return SUPPORTED_COUNTRIES.some(c => c.code === code);
}

function getCurrencyForCountry(countryCode) {
  const country = SUPPORTED_COUNTRIES.find(c => c.code === countryCode);
  return country ? country.currency : 'USD';
}

const CountryPriceSchema = z.object({
  country: z.string().refine(
    (code) => isValidCountryCode(code),
    { message: `Country must be one of: ${SUPPORTED_COUNTRIES.map(c => c.code).join(', ')}` }
  ),
  priceCents: z.number().int().min(0),
  currency: z.string().optional(),
  active: z.boolean().optional().default(true),
});

const ProductCreateSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  features: z.array(z.string()).optional(),
  images: z.array(z.string()).optional(),
  mainImage: z.string().optional(),
  trending: z.boolean().optional(),
  priceCents: z.number().int().min(0),
  discountCents: z.number().int().min(0).optional(),
  stockQuantity: z.number().int().min(0).optional(),
  brandName: z.string().optional(),
  categoryName: z.string().optional(),
  hot: z.boolean().optional(),
  storeId: z.string().optional(),
  countryPrices: z.array(CountryPriceSchema)
    .optional()
    .default([])
    .refine(
      (prices) => {
        const countries = prices.map(p => p.country);
        return new Set(countries).size === countries.length;
      },
      { message: "Duplicate country entries are not allowed" }
    )
    .refine(
      (prices) => {
        return prices.every(p => isValidCountryCode(p.country));
      },
      { message: "Invalid country code detected" }
    ),
});

// Test data similar to what the form might send
const testPayload = {
  name: "Test Product",
  priceCents: 1000, // This should be a number
  discountCents: 0,
  stockQuantity: 10,
  brandName: "Test Brand",
  categoryName: "Test Category",
  hot: false,
  trending: false,
  storeId: "GLOBAL",
  countryPrices: [
    { country: "UAE", priceCents: 1000, currency: "AED", active: true },
    { country: "KWT", priceCents: 1000, currency: "KWD", active: true },
    { country: "BGD", priceCents: 1000, currency: "BDT", active: true },
    { country: "SAU", priceCents: 1000, currency: "SAR", active: true },
    { country: "OMN", priceCents: 1000, currency: "OMR", active: true },
    { country: "QAT", priceCents: 1000, currency: "QAR", active: true }
  ]
};

console.log("Testing validation with payload:");
console.log(JSON.stringify(testPayload, null, 2));

const result = ProductCreateSchema.safeParse(testPayload);

if (result.success) {
  console.log("\n✅ Validation PASSED!");
  console.log("Parsed data:", JSON.stringify(result.data, null, 2));
} else {
  console.log("\n❌ Validation FAILED!");
  console.log("Errors:", JSON.stringify(result.error.errors, null, 2));
  
  // Check for specific issues
  result.error.errors.forEach(err => {
    console.log(`\nError at path ${err.path.join('.')}:`);
    console.log(`  Message: ${err.message}`);
    console.log(`  Code: ${err.code}`);
  });
}

// Test with potential form data issues
console.log("\n\n--- Testing with string numbers (common form issue) ---");
const testPayloadWithStrings = {
  ...testPayload,
  priceCents: "1000", // String instead of number
  discountCents: "0",
  stockQuantity: "10",
  countryPrices: testPayload.countryPrices.map(cp => ({
    ...cp,
    priceCents: String(cp.priceCents) // String instead of number
  }))
};

console.log("Payload with strings:", JSON.stringify(testPayloadWithStrings, null, 2));
const result2 = ProductCreateSchema.safeParse(testPayloadWithStrings);

if (result2.success) {
  console.log("\n✅ Validation PASSED with strings!");
} else {
  console.log("\n❌ Validation FAILED with strings!");
  if (result2.error && result2.error.errors) {
    result2.error.errors.forEach(err => {
      console.log(`Error at ${err.path.join('.')}: ${err.message}`);
    });
  } else {
    console.log("Unknown validation error structure:", result2.error);
  }
}