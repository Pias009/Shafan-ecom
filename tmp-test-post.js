import { getAdminApiSession } from './src/lib/admin-session'; // Won't work directly, I need to use supertest or mock

const testData = {
  name: "Test Bug Product 4",
  sku: "BUG-004",
  priceCents: 900,
  stockQuantity: 10,
  countryPrices: [
    { country: "UAE", priceCents: 900, currency: "AED" },
    { country: "SA", priceCents: 900, currency: "SAR" },
    { country: "KW", priceCents: 900, currency: "KWD" },
    { country: "BH", priceCents: 900, currency: "BHD" },
    { country: "QA", priceCents: 900, currency: "QAR" },
    { country: "OM", priceCents: 900, currency: "OMR" }
  ],
  storeId: "GLOBAL"
};
console.log(testData);
