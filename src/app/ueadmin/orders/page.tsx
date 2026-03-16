import Link from 'next/link';
import { wooApi } from '@/lib/woocommerce';

export const dynamic = 'force-dynamic';

export default async function OrdersPage() {
  let wooOrders = [];
  try {
    const { data } = await wooApi.get("orders", {
      per_page: 20, // Reduced from 50
      orderby: "date",
      order: "desc"
    });
    wooOrders = data;
  } catch (err) {
    console.error("Admin Orders Fetch Error:", err);
    wooOrders = [];
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'processing': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'on-hold': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
      case 'failed': return 'bg-red-100 text-red-800 border-red-200';
      case 'refunded': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-50 text-gray-600 border-gray-100';
    }
  };

  return (
    <div className="space-y-6 px-2 md:px-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Orders</h1>
        <div className="text-[10px] md:text-sm text-black/40 font-medium uppercase tracking-widest bg-black/5 px-4 py-1.5 rounded-full inline-block">
          {wooOrders.length} Recent Orders
        </div>
      </div>

      <div className="glass-panel overflow-hidden rounded-2xl md:rounded-3xl border border-black/5 shadow-sm bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[800px] md:min-w-0">
            <thead>
              <tr className="bg-black text-white">
                <th className="px-4 md:px-6 py-4 text-[10px] md:text-xs font-black uppercase tracking-widest">Order #</th>
                <th className="px-4 md:px-6 py-4 text-[10px] md:text-xs font-black uppercase tracking-widest">Date</th>
                <th className="px-4 md:px-6 py-4 text-[10px] md:text-xs font-black uppercase tracking-widest">Customer</th>
                <th className="px-4 md:px-6 py-4 text-[10px] md:text-xs font-black uppercase tracking-widest">Total</th>
                <th className="px-4 md:px-6 py-4 text-[10px] md:text-xs font-black uppercase tracking-widest">Status</th>
                <th className="px-4 md:px-6 py-4 text-[10px] md:text-xs font-black uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {wooOrders.map((o: any) => (
                <tr key={o.id} className="hover:bg-black/[0.02] transition-colors group">
                  <td className="px-4 md:px-6 py-4 font-black">#{o.id}</td>
                  <td className="px-4 md:px-6 py-4 text-[10px] md:text-sm font-medium text-black/60">
                    {new Date(o.date_created).toLocaleDateString()}
                  </td>
                  <td className="px-4 md:px-6 py-4">
                    <div className="font-bold text-[11px] md:text-sm">{o.billing?.first_name} {o.billing?.last_name}</div>
                    <div className="text-[9px] md:text-[10px] font-bold text-black/30 truncate max-w-[120px] md:max-w-[150px] uppercase tracking-tighter">
                      {o.billing?.email}
                    </div>
                  </td>
                  <td className="px-4 md:px-6 py-4 font-black text-xs md:text-sm">
                    {o.currency_symbol}{parseFloat(o.total).toFixed(2)}
                  </td>
                  <td className="px-4 md:px-6 py-4">
                    <span className={`px-2 md:px-3 py-1 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-widest border ${getStatusColor(o.status)}`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="px-4 md:px-6 py-4 text-right">
                    <Link 
                      href={`/ueadmin/orders/${o.id}`} 
                      className="inline-flex items-center gap-2 bg-black text-white text-[9px] md:text-[10px] font-black uppercase tracking-widest px-3 md:px-4 py-2 rounded-full hover:scale-105 transition active:scale-95 shadow-lg shadow-black/10"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
