import { NextRequest, NextResponse } from 'next/server';
import { getAdminStoreAccess } from '@/lib/admin-session';
import { getAnalyticsData, TimeRange } from '@/lib/analytics-data';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const storeAccess = await getAdminStoreAccess();
    if (!storeAccess) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const rangeParam = (searchParams.get('range') || 'weekly').toLowerCase();
    const compareParam = searchParams.get('compare') === 'true';

    const validRanges: TimeRange[] = ['daily', 'weekly', 'monthly', 'yearly', 'all'];
    const range: TimeRange = validRanges.includes(rangeParam as TimeRange)
      ? (rangeParam as TimeRange)
      : 'weekly';

    const analytics = await getAnalyticsData({
      range,
      compare: compareParam,
      storeIds: storeAccess.isSuperAdmin ? undefined : storeAccess.storeIds,
    });

    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Error fetching admin analytics:', error);
    return NextResponse.json(
      { error: 'Failed to generate analytics data' },
      { status: 500 }
    );
  }
}
