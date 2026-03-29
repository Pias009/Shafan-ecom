#!/usr/bin/env node

const { z } = require('zod');

const CountryPriceSchema = z.object({
  country: z.string(),
  priceCents: z.number().int().min(1, { message: "Country price must be at least 1 cent" }),
  currency: z.string().optional(),
  active: z.boolean().optional().default(true),
});

const ProductCreateSchema = z.object({
  name: z.string().min(1, { message: "Product name is required" }),
  description: z.string().optional(),
  features: z.array(z.string()).optional(),
  images: z.array(z.string()).optional(),
  mainImage: z.string().optional(),
  trending: z.boolean().optional(),
  priceCents: z.number().int().min(1, { message: "Product price must be at least 1 cent" }),
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
    ),
}).refine(
  (data) => {
    if (data.discountCents && data.discountCents > data.priceCents) {
      return false;
    }
    return true;
  },
  {
    message: "Discount cannot exceed product price",
    path: ["discountCents"],
  }
);

// Test the exact payload that caused the error
const invalidPayload = {
  brandName: "AquaGlass",
  categoryName: "Fragrance",
  countryPrices: [
    { active: true, country: "AE", currency: "AED", priceCents: 60 },
    { active: true, country: "KW", currency: "KWD", priceCents: 0 },
    { active: true, country: "BH", currency: "BHD", priceCents: 0 },
    { active: true, country: "SA", currency: "SAR", priceCents: 0 },
    { active: true, country: "OM", currency: "OMR", priceCents: 0 },
    { active: true, country: "QA", currency: "QAR", priceCents: 0 }
  ],
  description: "rrrrrrrrrrrrr",
  discountCents: 0,
  features: [],
  hot: false,
  images: [],
  mainImage: "",
  name: "rrrrrrrrrrrr",
  priceCents: 0,
  stockQuantity: 0,
  storeId: "GLOBAL",
  trending: false
};

console.log('Testing validation with priceCents: 0 and country prices with priceCents: 0\n');

const result = ProductCreateSchema.safeParse(invalidPayload);

if (!result.success) {
  console.log('✅ Validation failed as expected');
  console.log('Errors:');
  result.error.issues.forEach((issue, i) => {
    console.log(`  ${i + 1}. ${issue.path.join('.')}: ${issue.message}`);
  });
} else {
  console.log('❌ Validation passed unexpectedly!');
  console.log('Parsed data:', result.data);
}

// Test with valid payload
console.log('\n\nTesting with valid payload (priceCents: 1000):');
const validPayload = { ...invalidPayload, priceCents: 1000 };
const validResult = ProductCreateSchema.safeParse(validPayload);

if (!validResult.success) {
  console.log('❌ Valid payload failed validation:');
  validResult.error.issues.forEach((issue, i) => {
    console.log(`  ${i + 1}. ${issue.path.join('.')}: ${issue.message}`);
  });
} else {
  console.log('✅ Valid payload passed validation');
}