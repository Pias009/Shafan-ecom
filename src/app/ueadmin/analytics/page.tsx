import { requireAdminSession, getAccessibleStoreIds } from '@/lib/admin-session';
import { getAnalyticsData } from '@/lib/analytics-data';
import { AnalyticsClient } from './AnalyticsClient';

export const dynamic = 'force-dynamic';

export default async function AnalyticsPage() {
  await requireAdminSession();
  const accessibleStoreIds = await getAccessibleStoreIds();

  // Load initial weekly data with compare enabled for immediate rich dashboard view
  const initialData = await getAnalyticsData({
    range: 'weekly',
    compare: true,
    storeIds: accessibleStoreIds.length > 0 ? accessibleStoreIds : undefined,
  });

  return <AnalyticsClient initialData={initialData} />;
}
