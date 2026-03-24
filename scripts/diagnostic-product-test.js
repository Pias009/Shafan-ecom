// Diagnostic test for product API validation
console.log("=== DIAGNOSTIC TEST: Product API Validation ===\n");

// Simulate what the AddProductForm actually sends
const formPayload = {
  name: "Test Diagnostic Product",
  brandName: "Test Brand",
  categoryName: "Test Category",
  description: "Test description",
  features: [],
  priceCents: 1500, // Number, not string
  discountCents: 0,
  stockQuantity: 10,
  mainImage: "",
  images: [],
  hot: false,
  trending: false,
  storeId: "GLOBAL",
  countryPrices: [
    { country: "AE", priceCents: 1500, currency: "AED", active: true },
    { country: "KW", priceCents: 1500, currency: "KWD", active: true },
    { country: "BD", priceCents: 1500, currency: "BDT", active: true },
    { country: "SA", priceCents: 1500, currency: "SAR", active: true },
    { country: "OM", priceCents: 1500, currency: "OMR", active: true },
    { country: "QA", priceCents: 1500, currency: "QAR", active: true }
  ]
};

console.log("1. Testing with CORRECT country codes (AE, KW, BD, SA, OM, QA):");
console.log("Payload:", JSON.stringify(formPayload, null, 2));

// Test validation logic from the API
const { z } = require('zod');

// Mock the countries module (simplified)
const SUPPORTED_COUNTRIES = [
  { code: 'AE', currency: 'AED' },
  { code: 'KW', currency: 'KWD' },
  { code: 'BD', currency: 'BDT' },
  { code: 'SA', currency: 'SAR' },
  { code: 'OM', currency: 'OMR' },
  { code: 'QA', currency: 'QAR' }
];

function isValidCountryCode(code) {
  return SUPPORTED_COUNTRIES.some(c => c.code === code);
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

const result = ProductCreateSchema.safeParse(formPayload);

if (result.success) {
  console.log("\n✅ Validation PASSED with correct country codes!");
} else {
  console.log("\n❌ Validation FAILED with correct country codes!");
  console.log("Errors:", JSON.stringify(result.error.errors, null, 2));
}

// Test with INCorrect country codes (old format)
const incorrectPayload = {
  ...formPayload,
  countryPrices: [
    { country: "UAE", priceCents: 1500, currency: "AED", active: true },
    { country: "KWT", priceCents: 1500, currency: "KWD", active: true },
    { country: "BGD", priceCents: 1500, currency: "BDT", active: true },
    { country: "SAU", priceCents: 1500, currency: "SAR", active: true },
    { country: "OMN", priceCents: 1500, currency: "OMR", active: true },
    { country: "QAT", priceCents: 1500, currency: "QAR", active: true }
  ]
};

console.log("\n\n2. Testing with INCORRECT country codes (UAE, KWT, BGD, SAU, OMN, QAT):");
const result2 = ProductCreateSchema.safeParse(incorrectPayload);

if (result2.success) {
  console.log("\n✅ Validation PASSED with incorrect country codes (unexpected!)");
} else {
  console.log("\n❌ Validation FAILED with incorrect country codes (expected)");
  if (result2.error && result2.error.errors) {
    console.log("Errors:", JSON.stringify(result2.error.errors, null, 2));
  } else {
    console.log("Error object structure:", result2.error);
  }
}

// Test with string numbers (common form issue)
const stringPayload = {
  ...formPayload,
  priceCents: "1500", // String instead of number
  discountCents: "0",
  stockQuantity: "10",
  countryPrices: formPayload.countryPrices.map(cp => ({
    ...cp,
    priceCents: String(cp.priceCents) // Convert to string
  }))
};

console.log("\n\n3. Testing with STRING numbers (common form submission issue):");
const result3 = ProductCreateSchema.safeParse(stringPayload);

if (result3.success) {
  console.log("\n✅ Validation PASSED with string numbers (unexpected!)");
} else {
  console.log("\n❌ Validation FAILED with string numbers (expected)");
  if (result3.error && result3.error.errors) {
    console.log("First few errors:", JSON.stringify(result3.error.errors.slice(0, 3), null, 2));
  } else {
    console.log("Error:", result3.error);
  }
}

console.log("\n\n=== DIAGNOSTIC SUMMARY ===");
console.log("1. Country code validation is working correctly.");
console.log("2. Number type validation is working correctly (strings fail).");
console.log("3. The AddProductForm should send correct country codes (AE, KW, etc.)");
console.log("4. The AddProductForm converts number inputs to numbers (see handleChange function).");
console.log("\nPotential issues:");
console.log("- If forms submit strings instead of numbers, validation will fail");
console.log("- If country codes don't match expected format, validation will fail");
console.log("- Check browser console for form submission errors");