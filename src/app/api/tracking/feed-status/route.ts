import { NextRequest, NextResponse } from 'next/server';

// Store last sync time (in production, use a proper DB model)
let lastGoogleFeedSync: Date | null = null;
let lastMetaFeedSync: Date | null = null;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const testFeed = searchParams.get('test');

    const status = {
      googleFeed: {
        url: '/api/feed',
        lastSync: lastGoogleFeedSync?.toISOString() || null,
        status: 'unknown',
      },
      metaFeed: {
        url: '/api/feed/meta',
        lastSync: lastMetaFeedSync?.toISOString() || null,
        status: 'unknown',
      },
    };

    if (testFeed === 'google' || testFeed === 'all') {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
        const response = await fetch(`${baseUrl}/api/feed`, { method: 'GET' });
        status.googleFeed.status = response.ok ? 'ok' : 'error';
        if (response.ok) {
          lastGoogleFeedSync = new Date();
          status.googleFeed.lastSync = lastGoogleFeedSync.toISOString();
        }
      } catch {
        status.googleFeed.status = 'error';
      }
    }

    if (testFeed === 'meta' || testFeed === 'all') {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
        const response = await fetch(`${baseUrl}/api/feed/meta`, { method: 'GET' });
        status.metaFeed.status = response.ok ? 'ok' : 'error';
        if (response.ok) {
          lastMetaFeedSync = new Date();
          status.metaFeed.lastSync = lastMetaFeedSync.toISOString();
        }
      } catch {
        status.metaFeed.status = 'error';
      }
    }

    return NextResponse.json(status);
  } catch (error) {
    console.error('Error checking feed status:', error);
    return NextResponse.json(
      { error: 'Failed to check feed status' },
      { status: 500 }
    );
  }
}
