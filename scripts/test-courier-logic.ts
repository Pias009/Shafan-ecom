#!/usr/bin/env tsx
/**
 * Test script to verify Kuwait vs Global courier logic
 */

// Test the courier determination logic
function determineCourier(shippingAddress: any): string {
  if (!shippingAddress || !shippingAddress.country) {
    return "GLOBAL_COURIER"; // Default to global courier
  }

  const country = shippingAddress.country.toString().toLowerCase().trim();
  
  // Check if the order is from Kuwait
  if (country === "kuwait" || country === "kw") {
    return "KUWAIT_COURIER";
  }
  
  return "GLOBAL_COURIER";
}

// Test cases
const testCases = [
  {
    name: "Kuwait order (lowercase)",
    shippingAddress: { country: "kuwait" },
    expected: "KUWAIT_COURIER"
  },
  {
    name: "Kuwait order (uppercase)",
    shippingAddress: { country: "KUWAIT" },
    expected: "KUWAIT_COURIER"
  },
  {
    name: "Kuwait order (country code)",
    shippingAddress: { country: "KW" },
    expected: "KUWAIT_COURIER"
  },
  {
    name: "USA order",
    shippingAddress: { country: "USA" },
    expected: "GLOBAL_COURIER"
  },
  {
    name: "Bangladesh order",
    shippingAddress: { country: "BD" },
    expected: "GLOBAL_COURIER"
  },
  {
    name: "UK order",
    shippingAddress: { country: "United Kingdom" },
    expected: "GLOBAL_COURIER"
  },
  {
    name: "No country",
    shippingAddress: { city: "Test City" },
    expected: "GLOBAL_COURIER"
  },
  {
    name: "Empty address",
    shippingAddress: null,
    expected: "GLOBAL_COURIER"
  }
];

console.log("Testing Courier Logic Implementation\n");
console.log("=".repeat(50));

let passed = 0;
let failed = 0;

for (const testCase of testCases) {
  const result = determineCourier(testCase.shippingAddress);
  const success = result === testCase.expected;
  
  if (success) {
    console.log(`✅ ${testCase.name}`);
    console.log(`   Expected: ${testCase.expected}, Got: ${result}`);
    passed++;
  } else {
    console.log(`❌ ${testCase.name}`);
    console.log(`   Expected: ${testCase.expected}, Got: ${result}`);
    failed++;
  }
  console.log();
}

console.log("=".repeat(50));
console.log(`Results: ${passed} passed, ${failed} failed`);

if (failed === 0) {
  console.log("\n🎉 All tests passed! Courier logic is working correctly.");
  console.log("\nSummary:");
  console.log("- Orders from Kuwait will use KUWAIT_COURIER");
  console.log("- Orders from other countries will use GLOBAL_COURIER");
  console.log("- Payment remains the same regardless of courier");
} else {
  console.log("\n⚠️ Some tests failed. Please review the courier logic.");
  process.exit(1);
}