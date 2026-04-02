import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const banners = await prisma.banner.findMany({
      where: { active: true, status: 'ACTIVE' },
      select: { 
        id: true, 
        imageUrl: true, 
        title: true, 
        description: true,
        ctaLink: true,
        ctaText: true,
        position: true,
        backgroundColor: true,
        textColor: true,
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json(banners);
  } catch (error) {
    console.error('Error fetching banners:', error);
    return NextResponse.json(
      { error: 'Failed to fetch banners' },
      { status: 500 }
    );
  }
}