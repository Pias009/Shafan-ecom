import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventType, eventData, sessionId } = body;

    if (!eventType) {
      return NextResponse.json(
        { error: 'eventType is required' },
        { status: 400 }
      );
    }

    const trackingLog = await prisma.trackingLog.create({
      data: {
        eventType,
        eventData: eventData || null,
        sessionId: sessionId || null,
      },
    });

    return NextResponse.json({ success: true, id: trackingLog.id });
  } catch (error) {
    console.error('Error logging tracking event:', error);
    return NextResponse.json(
      { error: 'Failed to log tracking event' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const eventType = searchParams.get('eventType');

    const where: { eventType?: string } = {};
    if (eventType) {
      where.eventType = eventType;
    }

    const logs = await prisma.trackingLog.findMany({
      take: Math.min(limit, 100),
      orderBy: { createdAt: 'desc' },
      where,
    });

    return NextResponse.json({ logs });
  } catch (error) {
    console.error('Error fetching tracking logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tracking logs' },
      { status: 500 }
    );
  }
}
