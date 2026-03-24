// Test script to simulate form submission
console.log("Testing form submission payload...\n");

// Simulate form data structure
const formData = {
  name: "Test Product",
  brandName: "Test Brand",
  categoryName: "Test Category",
  description: "Test description",
  features: [],
  priceCents: 1000,
  discountCents: 0,
  stockQuantity: 10,
  mainImage: "",
  images: [],
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

// Check types
console.log("Checking data types:");
console.log(`priceCents type: ${typeof formData.priceCents} (value: ${formData.priceCents})`);
console.log(`discountCents type: ${typeof formData.discountCents} (value: ${formData.discountCents})`);
console.log(`stockQuantity type: ${typeof formData.stockQuantity} (value: ${formData.stockQuantity})`);

console.log("\nChecking country prices types:");
formData.countryPrices.forEach((cp, i) => {
  console.log(`Country ${cp.country}: priceCents type: ${typeof cp.priceCents} (value: ${cp.priceCents})`);
});

// Simulate what the form sends
const countryPrices = formData.countryPrices.map(cp => ({
  country: cp.country,
  priceCents: cp.priceCents,
  currency: cp.currency,
  active: cp.active
}));

const payload = {
  ...formData,
  countryPrices
};

console.log("\nFinal payload to be sent:");
console.log(JSON.stringify(payload, null, 2));

// Check for any string values
console.log("\nChecking for string values in numeric fields:");
const checkNumericFields = (obj, path = '') => {
  for (const key in obj) {
    const currentPath = path ? `${path}.${key}` : key;
    const value = obj[key];
    
    if (key.includes('Cents') || key.includes('Quantity') || key === 'price') {
      if (typeof value === 'string') {
        console.log(`⚠️  ${currentPath} is a string: "${value}"`);
      } else if (typeof value === 'number') {
        console.log(`✓ ${currentPath} is a number: ${value}`);
      }
    }
    
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      checkNumericFields(value, currentPath);
    } else if (Array.isArray(value)) {
      value.forEach((item, index) => {
        if (typeof item === 'object' && item !== null) {
          checkNumericFields(item, `${currentPath}[${index}]`);
        }
      });
    }
  }
};

checkNumericFields(payload);