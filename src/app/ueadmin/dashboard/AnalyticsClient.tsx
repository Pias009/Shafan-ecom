"use client";
import React, { useEffect, useState, lazy, Suspense } from 'react';
// Lazy load heavy chart components for better performance
const BarChart = lazy(() => import('@/components/BarChart'));
const DataTable = lazy(() => import('@/components/DataTable'));

type TopProduct = { name: string; revenue: number };
type Activity = { id: string; action: string; actor: string; createdAt: string; details?: string };

export default function AnalyticsClient() {
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);

  async function fetchData() {
    setLoading(true);
    try {
      const tRes = await fetch('/api/admin/dashboard/top-products');
      if (tRes.ok) {
        const t = await tRes.json();
        setTopProducts(t);
      }
      const aRes = await fetch('/api/admin/dashboard/recent-activities');
      if (aRes.ok) {
        const a = await aRes.json();
        // Normalize to a DataTable-friendly shape
        const mapped = a.map((x: any) => ({ id: x.id ?? Math.random().toString(), action: x.action, actor: x.actor, createdAt: x.createdAt, details: x.details }));
        setActivities(mapped);
      }
    } catch {
      // ignore errors here; data will be empty on failure
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  const dataForBar = topProducts.map(p => ({ label: p.name, value: p.revenue }));

  const columns = [
    { key: 'id', header: 'ID' },
    { key: 'actor', header: 'Actor' },
    { key: 'action', header: 'Action' },
    { key: 'createdAt', header: 'Created At' },
  ];

  return (
    <div className="space-y-6" aria-label="Analytics">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="p-4 bg-white rounded-xl shadow-sm">
          <div className="text-sm text-black/60 mb-2">Top Products (revenue)</div>
          <Suspense fallback={<div className="h-40 flex items-center justify-center">Loading chart...</div>}>
            <BarChart data={dataForBar} />
          </Suspense>
        </div>
        <div className="p-4 bg-white rounded-xl shadow-sm">
          <div className="text-sm text-black/60 mb-2">Recent Activities</div>
          <Suspense fallback={<div className="h-40 flex items-center justify-center">Loading table...</div>}>
            <DataTable columns={columns} data={activities} pageSize={5} />
          </Suspense>
        </div>
      </div>
      <button onClick={fetchData} className="px-4 py-2 rounded bg-blue-600 text-white" disabled={loading}>
        {loading ? 'Loading…' : 'Refresh Analytics'}
      </button>
    </div>
  );
}
