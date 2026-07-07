import { prisma } from "@/lib/prisma";
import { requireAdminSession, getAccessibleStoreIds } from "@/lib/admin-session";
import { OrderStatus } from "@prisma/client";
import { BarChart3, Globe, MousePointerClick, ShoppingCart, TrendingUp, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

const SOURCE_LABELS: Record<string, string> = {
  google: 'Google',
  google_ads: 'Google Ads',
  facebook: 'Facebook',
  instagram: 'Instagram',
  whatsapp: 'WhatsApp',
  tiktok: 'TikTok',
  twitter: 'X (Twitter)',
  x: 'X (Twitter)',
  youtube: 'YouTube',
  pinterest: 'Pinterest',
  linkedin: 'LinkedIn',
  snapchat: 'Snapchat',
  telegram: 'Telegram',
  direct: 'Direct',
  email: 'Email Campaign',
  search_engine: 'Organic Search',
  other: 'Other',
};

const SOURCE_COLORS: Record<string, string> = {
  google: 'bg-white border-gray-200 text-gray-800',
  google_ads: 'bg-white border-gray-200 text-gray-800',
  facebook: 'bg-[#1877F2]/5 border-[#1877F2]/20 text-[#1877F2]',
  instagram: 'bg-gradient-to-r from-[#f09433]/5 via-[#e6683c]/5 to-[#dc2743]/5 border-[#dc2743]/20 text-[#dc2743]',
  whatsapp: 'bg-[#25D366]/5 border-[#25D366]/20 text-[#25D366]',
  tiktok: 'bg-black/5 border-black/10 text-black',
  twitter: 'bg-black/5 border-black/10 text-black',
  x: 'bg-black/5 border-black/10 text-black',
  youtube: 'bg-[#FF0000]/5 border-[#FF0000]/20 text-[#FF0000]',
  pinterest: 'bg-[#E60023]/5 border-[#E60023]/20 text-[#E60023]',
  linkedin: 'bg-[#0A66C2]/5 border-[#0A66C2]/20 text-[#0A66C2]',
  snapchat: 'bg-[#FFFC00]/30 border-[#FFFC00]/40 text-yellow-800',
  telegram: 'bg-[#0088cc]/5 border-[#0088cc]/20 text-[#0088cc]',
  direct: 'bg-gray-100 border-gray-200 text-gray-700',
  email: 'bg-gray-100 border-gray-200 text-gray-700',
  search_engine: 'bg-gray-100 border-gray-200 text-gray-700',
  other: 'bg-gray-100 border-gray-200 text-gray-700',
};

function getSourceLabel(source: string | null): string {
  if (!source) return 'Unknown';
  return SOURCE_LABELS[source] || source;
}

function getSourceColor(source: string | null): string {
  if (!source) return 'bg-gray-100 border-gray-200 text-gray-700';
  return SOURCE_COLORS[source] || 'bg-gray-100 border-gray-200 text-gray-700';
}

export default async function AnalyticsPage() {
  await requireAdminSession();
  const accessibleStoreIds = await getAccessibleStoreIds();

  const where = { storeId: { in: accessibleStoreIds } };

  const [
    totalOrders,
    totalRevenue,
    sourceStats,
  ] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.aggregate({
      _sum: { total: true },
      where: { ...where, NOT: { status: OrderStatus.CANCELLED } },
    }),
    prisma.order.groupBy({
      by: ['referralSource'],
      where,
      _count: { id: true },
      _sum: { total: true },
      orderBy: { _count: { id: 'desc' } },
    }),
  ]);

  const revenue = totalRevenue._sum.total || 0;
  const sourcesWithPercentage = sourceStats.map(s => ({
    source: s.referralSource,
    count: s._count.id,
    total: s._sum.total || 0,
    percentage: totalOrders > 0 ? Math.round((s._count.id / totalOrders) * 100) : 0,
    avgOrder: s._count.id > 0 ? ((s._sum.total || 0) / s._count.id) : 0,
  }));

  return (
    <div className="space-y-10 pb-20 px-6 py-8 md:px-12">
      <div>
        <h1 className="text-4xl font-black tracking-tight text-black">Referral Sources</h1>
        <p className="text-sm font-medium text-black/60 mt-1 uppercase tracking-[0.2em]">
          Track where your orders are coming from
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass-panel-heavy p-8 rounded-[2rem] border border-black/5 bg-white shadow-sm flex items-center gap-6">
          <div className="p-4 bg-black/5 rounded-2xl text-black"><ShoppingCart size={24} /></div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-black/50">Total Orders</div>
            <div className="text-3xl font-black text-black">{totalOrders}</div>
          </div>
        </div>
        <div className="glass-panel-heavy p-8 rounded-[2rem] border border-black/5 bg-white shadow-sm flex items-center gap-6">
          <div className="p-4 bg-black/5 rounded-2xl text-black"><TrendingUp size={24} /></div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-black/50">Total Revenue</div>
            <div className="text-3xl font-black text-black">AED {revenue.toLocaleString()}</div>
          </div>
        </div>
        <div className="glass-panel-heavy p-8 rounded-[2rem] border border-black/5 bg-white shadow-sm flex items-center gap-6">
          <div className="p-4 bg-black/5 rounded-2xl text-black"><Globe size={24} /></div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-black/50">Sources</div>
            <div className="text-3xl font-black text-black">{sourceStats.length}</div>
          </div>
        </div>
        <div className="glass-panel-heavy p-8 rounded-[2rem] border border-black/5 bg-white shadow-sm flex items-center gap-6">
          <div className="p-4 bg-black/5 rounded-2xl text-black"><BarChart3 size={24} /></div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-black/50">Top Source</div>
            <div className="text-3xl font-black text-black capitalize">
              {sourcesWithPercentage[0] ? getSourceLabel(sourcesWithPercentage[0].source) : 'N/A'}
            </div>
          </div>
        </div>
      </div>

      {/* Source Breakdown */}
      <section className="space-y-6">
        <h3 className="text-xl font-bold flex items-center gap-3">
          <MousePointerClick size={20} className="text-black/60" /> Source Breakdown
        </h3>
        <div className="glass-panel-heavy rounded-[2.5rem] border border-black/5 bg-white shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-black text-white">
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest">Source</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest">Orders</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest">Revenue</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest">Avg Order Value</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest">Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {sourcesWithPercentage.map((s) => (
                  <tr key={s.source || 'unknown'} className="hover:bg-black/[0.01] transition-colors">
                    <td className="px-8 py-5">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-bold ${getSourceColor(s.source)}`}>
                        {getSourceLabel(s.source)}
                      </span>
                    </td>
                    <td className="px-8 py-5 font-black text-sm">{s.count}</td>
                    <td className="px-8 py-5 font-black text-sm">AED {s.total.toLocaleString()}</td>
                    <td className="px-8 py-5 font-bold text-sm">AED {s.avgOrder.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-24 md:w-32 h-2 bg-black/5 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-black rounded-full transition-all"
                            style={{ width: `${s.percentage}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-black text-black/60">{s.percentage}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
                {sourcesWithPercentage.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-8 py-12 text-center text-sm text-black/40 font-medium">
                      No order data available yet. Orders will start tracking referral sources once the tracker is active.
                    </td>
                  </tr>
                )}
              </tbody>
              {sourcesWithPercentage.length > 0 && (
                <tfoot>
                  <tr className="bg-black/5 font-black">
                    <td className="px-8 py-5 text-sm">Total</td>
                    <td className="px-8 py-5 text-sm">{totalOrders}</td>
                    <td className="px-8 py-5 text-sm">AED {revenue.toLocaleString()}</td>
                    <td className="px-8 py-5 text-sm">
                      AED {totalOrders > 0 ? (revenue / totalOrders).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                    </td>
                    <td className="px-8 py-5 text-sm">100%</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </section>

      {/* Empty Orders CTA */}
      <div className="text-center">
        <Link
          href="/ueadmin/orders"
          className="inline-flex items-center gap-2 bg-black text-white px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-black/10"
        >
          View All Orders <ExternalLink size={14} />
        </Link>
      </div>
    </div>
  );
}
