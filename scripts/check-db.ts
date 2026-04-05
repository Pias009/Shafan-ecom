import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const p = await prisma.product.findFirst();
  console.log("Check Product:", p?.name, "PriceCents:", p?.priceCents);
  
  const cp = await prisma.countryPrice.findFirst();
  console.log("Check CountryPrice:", cp?.country, "PriceCents:", cp?.priceCents);

  const o = await prisma.order.findFirst({ orderBy: { createdAt: 'desc' } });
  console.log("Check Recent Order:", o?.id, "TotalCents:", o?.totalCents);
}

main().finally(() => prisma.$disconnect());
