import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    const result = await (prisma as any).product.updateMany({
      where: { stockQuantity: { equals: 0 } },
      data: { stockQuantity: 100 },
    });

    return NextResponse.json({
      updated: result.count,
      message: `Set stock to 100 for ${result.count} products`,
    });
  } catch (error) {
    console.error('Fix stock error:', error);
    return NextResponse.json({ error: 'Failed to fix stock' }, { status: 500 });
  }
}
