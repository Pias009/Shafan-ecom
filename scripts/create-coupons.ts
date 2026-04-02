import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createCoupons() {
  console.log('Creating coupons...');
  
  const coupons = [
    {
      code: 'SAVE10',
      name: '10% Off',
      description: 'Get 10% off your order',
      discountType: 'PERCENTAGE' as const,
      value: 10,
      active: true,
      status: 'ACTIVE',
      countries: ['AE', 'KW', 'SA', 'BH', 'OM', 'QA'],
      startDate: new Date(),
      endDate: new Date('2026-12-31'),
      maxUses: 100,
    },
    {
      code: 'SAVE20',
      name: '20% Off',
      description: 'Get 20% off your order',
      discountType: 'PERCENTAGE' as const,
      value: 20,
      active: true,
      status: 'ACTIVE',
      countries: ['AE', 'KW', 'SA', 'BH', 'OM', 'QA'],
      startDate: new Date(),
      endDate: new Date('2026-12-31'),
      maxUses: 50,
    },
  ];

  for (const coupon of coupons) {
    await prisma.discount.upsert({
      where: { code: coupon.code },
      update: coupon,
      create: coupon,
    });
    console.log('Created:', coupon.code);
  }
  console.log('Done!');
  await prisma.$disconnect();
}

createCoupons().catch(console.error);