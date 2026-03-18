import { prisma } from "@/lib/prisma";
import Link from 'next/link';
import { Package, ShoppingBag, Users, TrendingUp, ArrowRight, Clock } from 'lucide-react';
import { OrderStatus } from "@prisma/client";

export const dynamic = 'force-dynamic';

export default async function Dashboard() {
  const [
    totalOrdersCount,
    totalProductsCount,
    totalUsersCount,
    recentOrders,
    revenueData
  ] = await Promise.all([
    prisma.order.count(),
    prisma.product.count(),
    prisma.user.count(),
    (prisma as any).order.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: { user: true }
    }),
    prisma.order.aggregate({
      _sum: { totalCents: true },
      where: { NOT: { status: OrderStatus.CANCELLED } }
    })
  ]);

  const totalRevenue = (revenueData._sum.totalCents || 0) / 100;
  
  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING_PAYMENT: return 'bg-yellow-100 text-yellow-800';
      case OrderStatus.PAID:
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
          <h1 className="text-4xl font-black tracking-tight text-black">Dashboard</h1>
          <p className="text-sm font-medium text-black/30 mt-1 uppercase tracking-[0.2em]">Real-time store overview (MongoDB)</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass-panel-heavy p-8 rounded-[2rem] border border-black/5 bg-white shadow-sm flex items-center gap-6">
          <div className="p-4 bg-black/5 rounded-2xl text-black"><ShoppingBag size={24} /></div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-black/20">Total Orders</div>
            <div className="text-3xl font-black text-black">{totalOrdersCount}</div>
          </div>
        </div>
        <div className="glass-panel-heavy p-8 rounded-[2rem] border border-black/5 bg-white shadow-sm flex items-center gap-6">
          <div className="p-4 bg-black/5 rounded-2xl text-black"><Package size={24} /></div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-black/20">Products</div>
            <div className="text-3xl font-black text-black">{totalProductsCount}</div>
          </div>
        </div>
        <div className="glass-panel-heavy p-8 rounded-[2rem] border border-black/5 bg-white shadow-sm flex items-center gap-6">
          <div className="p-4 bg-black/5 rounded-2xl text-black"><Users size={24} /></div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-black/20">Users</div>
            <div className="text-3xl font-black text-black">{totalUsersCount}</div>
          </div>
        </div>
        <div className="glass-panel-heavy p-8 rounded-[2rem] border border-black/5 bg-white shadow-sm flex items-center gap-6">
          <div className="p-4 bg-black/5 rounded-2xl text-black"><TrendingUp size={24} /></div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-black/20">Revenue</div>
            <div className="text-3xl font-black text-black">${totalRevenue.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Recent Orders Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
           <h3 className="text-xl font-bold flex items-center gap-3">
              <Clock size={20} className="text-black/30" /> Recent Activity
           </h3>
           <Link href="/ueadmin/orders" className="text-[10px] font-black uppercase tracking-widest text-black/40 hover:text-black transition flex items-center gap-2">
              View All Orders <ArrowRight size={14} />
           </Link>
        </div>

        <div className="glass-panel-heavy rounded-[2.5rem] border border-black/5 bg-white shadow-xl overflow-hidden">
           <table className="w-full text-left">
              <thead>
                <tr className="bg-black text-white">
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest">Order</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest">Customer</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-center">Status</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-right">Amount</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {recentOrders.map((o: any) => {
                  const billing = o.billingAddress as any;
                  const customerName = o.user?.name || (billing ? `${billing.first_name || ''} ${billing.last_name || ''}` : 'Guest');
                  const customerEmail = o.user?.email || billing?.email || 'No Email';
                  
                  return (
                    <tr key={o.id} className="hover:bg-black/[0.01] transition-colors">
                      <td className="px-8 py-5">
                        <div className="font-black">#{o.id.substring(0, 8)}</div>
                        <div className="text-[10px] font-bold text-black/20 uppercase tracking-tighter">{new Date(o.createdAt).toLocaleDateString()}</div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="font-bold text-sm">{customerName}</div>
                        <div className="text-[10px] font-bold text-black/20 uppercase tracking-tighter">{customerEmail}</div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex justify-center">
                          <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${getStatusColor(o.status)}`}>
                            {o.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-right font-black text-sm">
                        ${(o.totalCents / 100).toFixed(2)}
                      </td>
                      <td className="px-8 py-5 text-right">
                        <Link href={`/ueadmin/orders/${o.id}`} className="inline-block p-2 bg-black/5 hover:bg-black hover:text-white rounded-xl transition-all">
                          <ArrowRight size={16} />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
           </table>
        </div>
      </section>
    </div>
  );
}
