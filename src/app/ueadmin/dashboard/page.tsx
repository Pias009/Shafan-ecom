import { prisma } from "@/lib/prisma";
import Link from 'next/link';
import { Package, ShoppingBag, Users, TrendingUp, ArrowRight, Clock } from 'lucide-react';
import { OrderStatus } from "@prisma/client";
import { requireAdminSession, getAccessibleStoreIds } from "@/lib/admin-session";

export const dynamic = 'force-dynamic';

export default async function Dashboard() {
  // Check admin session (not user session)
  await requireAdminSession();

  // Get only UAE store IDs for data filtering
  const accessibleStoreIds = await getAccessibleStoreIds();

  const [
    totalOrdersCount,
    totalProductsCount,
    totalUsersCount,
    recentOrders,
    revenueData
  ] = await Promise.all([
    prisma.order.count({
      where: { storeId: { in: accessibleStoreIds } }
    }),
    prisma.product.count({
      where: { storeInventories: { some: { storeId: { in: accessibleStoreIds } } } }
    }),
    prisma.user.count({
      where: { orders: { some: { storeId: { in: accessibleStoreIds } } } }
    }),
    (prisma as any).order.findMany({
      where: { storeId: { in: accessibleStoreIds } },
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: { user: true, store: true }
    }),
    prisma.order.aggregate({
      _sum: { total: true },
      where: { 
        storeId: { in: accessibleStoreIds },
        NOT: { status: OrderStatus.CANCELLED } 
      }
    })
  ]);

  const totalRevenue = revenueData._sum.total || 0;
  const currencySymbol = 'AED';
  
  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.ORDER_RECEIVED: return 'bg-yellow-100 text-yellow-800';
      case OrderStatus.ORDER_CONFIRMED:
      case OrderStatus.PROCESSING: return 'bg-blue-100 text-blue-800';
      case OrderStatus.DELIVERED: return 'bg-green-100 text-green-800';
      case OrderStatus.CANCELLED: return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-black">UAE Dashboard</h1>
          <p className="text-sm font-medium text-black/60 mt-1 uppercase tracking-[0.2em]">Real-time UAE store overview (MongoDB)</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass-panel-heavy p-8 rounded-[2rem] border border-black/5 bg-white shadow-sm flex items-center gap-6">
          <div className="p-4 bg-black/5 rounded-2xl text-black"><ShoppingBag size={24} /></div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-black/50">UAE Orders</div>
            <div className="text-3xl font-black text-black">{totalOrdersCount}</div>
          </div>
        </div>
        <div className="glass-panel-heavy p-8 rounded-[2rem] border border-black/5 bg-white shadow-sm flex items-center gap-6">
          <div className="p-4 bg-black/5 rounded-2xl text-black"><Package size={24} /></div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-black/50">Products</div>
            <div className="text-3xl font-black text-black">{totalProductsCount}</div>
          </div>
        </div>
        <div className="glass-panel-heavy p-8 rounded-[2rem] border border-black/5 bg-white shadow-sm flex items-center gap-6">
          <div className="p-4 bg-black/5 rounded-2xl text-black"><Users size={24} /></div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-black/50">Users</div>
            <div className="text-3xl font-black text-black">{totalUsersCount}</div>
          </div>
        </div>
        <div className="glass-panel-heavy p-8 rounded-[2rem] border border-black/5 bg-white shadow-sm flex items-center gap-6">
          <div className="p-4 bg-black/5 rounded-2xl text-black"><TrendingUp size={24} /></div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-black/50">Revenue</div>
            <div className="text-3xl font-black text-black">{currencySymbol} {totalRevenue.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Recent Orders Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
           <h3 className="text-xl font-bold flex items-center gap-3">
              <Clock size={20} className="text-black/60" /> Recent Activity
           </h3>
           <Link href="/ueadmin/orders" className="text-[10px] font-black uppercase tracking-widest text-black/70 hover:text-black transition flex items-center gap-2">
              View All Orders <ArrowRight size={14} />
           </Link>
        </div>

        <div className="glass-panel-heavy rounded-[2.5rem] border border-black/5 bg-white shadow-xl overflow-hidden">
           <table className="w-full text-left">
              <thead>
                <tr className="bg-black text-white">
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest">Order</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest">Customer</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest">Store</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest">Status</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {recentOrders.map((o: any) => (
                  <tr key={o.id} className="hover:bg-black/[0.01] transition-colors">
                    <td className="px-8 py-5">
                      <div className="font-black text-sm">#{o.id.substring(0, 8)}</div>
                      <div className="text-[9px] font-bold text-black/50 uppercase">{new Date(o.createdAt).toLocaleDateString()}</div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="font-bold text-sm">{o.user?.name || 'Guest'}</div>
                      <div className="text-[9px] font-bold text-black/60">{o.user?.email || 'No email'}</div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="px-2 py-1 rounded-full text-[9px] font-black uppercase bg-black/5 text-black/60">
                        {o.store?.code || 'N/A'}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${getStatusColor(o.status)}`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right font-black text-sm">
                      ${(o.total || 0).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
           </table>
        </div>
      </section>
    </div>
  );
}
