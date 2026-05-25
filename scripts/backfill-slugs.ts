import { prisma } from '../src/lib/prisma';

async function backfillSlugs() {
  const products = await prisma.product.findMany({
    where: { slug: null },
    select: { id: true, name: true },
  });

  console.log(`Found ${products.length} products without slugs.`);

  for (const product of products) {
    const slug = product.name
      .toLowerCase().trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 100);

    await prisma.product.update({
      where: { id: product.id },
      data: { slug },
    });

    console.log(`  ✓ ${product.name} → ${slug}`);
  }

  console.log(`\nDone! ${products.length} products updated.`);
}

backfillSlugs()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
