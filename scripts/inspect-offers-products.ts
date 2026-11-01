import { prisma } from '../src/lib/prisma';

async function check() {
  const offerSections = await prisma.offerSection.findMany();
  console.log('=== OFFER SECTIONS ===');
  console.log('Count:', offerSections.length);
  for (const s of offerSections) {
    console.log({
      id: s.id,
      title: s.title,
      subtitle: s.subtitle,
      sortOrder: s.sortOrder,
      active: s.active,
      productCount: s.productIds.length,
      productIds: s.productIds,
      popupEnabled: s.popupEnabled,
      popupImage: s.popupImage,
    });
  }

  const offersBanners = await (prisma as any).enhancedOfferBanner.findMany({
    where: { placement: 'OFFERS' },
  });
  console.log('\n=== OFFERS BANNERS (placement: OFFERS) ===');
  console.log('Count:', offersBanners.length);
  for (const b of offersBanners) {
    console.log({
      id: b.id,
      title: b.title,
      subtitle: b.subtitle,
      offerText: b.offerText,
      imageUrl: b.imageUrl,
      active: b.active,
      placement: b.placement,
    });
  }

  console.log('\n=== TOP SELLING PRODUCTS ===');
  // Order by totalSales desc, then hot, then ratingCount
  const topSelling = await prisma.product.findMany({
    where: { active: true },
    select: {
      id: true,
      name: true,
      slug: true,
      price: true,
      discountPrice: true,
      totalSales: true,
      hot: true,
      trending: true,
      ratingCount: true,
      averageRating: true,
      images: true,
      mainImage: true,
      brand: { select: { id: true, name: true } },
    },
    orderBy: [
      { totalSales: 'desc' },
      { ratingCount: 'desc' },
    ],
    take: 30,
  });

  console.log(`Found ${topSelling.length} top products:`);
  for (const p of topSelling) {
    console.log(`- [${p.id}] ${p.name} | Brand: ${p.brand?.name} | Sales: ${p.totalSales} | Hot: ${p.hot} | Price: ${p.price} | Images: ${p.images?.length || 0}`);
  }
}

check()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
