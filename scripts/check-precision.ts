import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- CHECKING FOR PRICE PRECISION ISSUES (FLOATS VS INTS) ---');

  const products = await prisma.product.findMany({
    include: { countryPrices: true }
  });

  let issuesFound = 0;

  for (const p of products) {
    if (p.priceCents % 1 !== 0) {
      console.warn(`[ISSUE] Product "${p.name}" (${p.id}) has FLOAT base price: ${p.priceCents}`);
      issuesFound++;
    }

    if (p.countryPrices) {
      for (const cp of p.countryPrices) {
        if (Number(cp.priceCents) % 1 !== 0) {
          console.warn(`[ISSUE] Product "${p.name}" (${p.id}) has FLOAT country price for ${cp.country}: ${cp.priceCents}`);
          issuesFound++;
        }
      }
    }
  }

  console.log(`--- CHECK COMPLETED: Found ${issuesFound} precision issues ---`);
  
  if (issuesFound > 0) {
    console.log('Suggestion: Run a script to Math.round() all prices in the database.');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
