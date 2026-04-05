import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function fixDiscrepancies() {
  console.log("--- REPAIRING PRICE DISCREPANCIES (SAR 664 -> 665, 898 -> 900, etc.) ---");
  
  const products = await (prisma as any).product.findMany({
    include: { countryPrices: true }
  }) as any[];

  let fixedCount = 0;

  for (const p of products) {
    if (!p.countryPrices || p.countryPrices.length === 0) continue;

    // Filter valid prices (exclude zeros/nulls)
    const validPrices = p.countryPrices.filter((cp: any) => cp.priceCents > 0);
    if (validPrices.length < 2) continue;

    const prices = validPrices.map((cp: any) => Number(cp.priceCents));
    
    // Find clusters of prices that are very close (within 2-3 units)
    // For simplicity, we find the "rounded" most common price
    // (e.g. 664 and 665 both round to 670? No, let's just find the max/mode)
    
    const max = Math.max(...prices);
    const min = Math.min(...prices);
    
    // If discrepancy exists but is small (legacy rounding artifacts)
    if (max - min > 0 && max - min <= 5) {
      console.log(`Product "${p.name}" (${p.id}): range ${min} to ${max}. Normalizing to ${max}...`);
      
      for (const cp of p.countryPrices) {
        if (cp.priceCents > 0 && Number(cp.priceCents) < max) {
          console.log(`  Fixing ${cp.country}: ${cp.priceCents} -> ${max}`);
          await (prisma as any).countryPrice.update({
            where: { id: cp.id },
            data: { priceCents: max }
          });
          fixedCount++;
        }
      }
    }
  }

  console.log(`--- REPAIR COMPLETE: Fixed ${fixedCount} entries ---`);
}

fixDiscrepancies().catch(console.error).finally(() => process.exit(0));
