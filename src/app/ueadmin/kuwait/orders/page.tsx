import { prisma } from "@/lib/prisma";
import Link from 'next/link';
import { Truck, Search, ShoppingBag, ArrowRight, Store, Clock } from 'lucide-react';
import { OrderStatus } from "@prisma/client";
import { requireKuwaitAccess, getAccessibleStore } from "@/lib/admin-store-guard";

export const dynamic = 'force-dynamic';

export default async function KuwaitOrdersPage() {
  // Enforce strict access control - only Kuwait admins can access this page
  await requireKuwaitAccess();

  const storeCode = 'KUW';
  const store = await getAccessibleStore(storeCode);

  if (!store) {
     return <div className="p-20 text-center font-black opacity-20 italic text-3xl">Configuration Missing: KUW</div>;
  }

  const orders = await prisma.order.findMany({
    where: { storeId: store.id },
    include: { user: true },
    orderBy: { createdAt: 'desc' }
  });

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
    <div className="space-y-12 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <div className="flex items-center gap-3 mb-3">
             <div className="p-2 bg-black rounded-xl text-white shadow-xl shadow-black/10"><ShoppingBag size={20} /></div>
             <span className="text-[10px] font-black uppercase tracking-[0.3em] text-black/40">Marketplace Identity: {store.name}</span>
          </div>
          <h1 className="text-5xl font-black text-black">Kuwait Orders</h1>
          <p className="text-sm font-medium text-black/30 mt-2">Active transactional flows for the {store.region} region.</p>
        </div>
      </div>

      {/* Localized Order List */}
      <div className="glass-panel-heavy rounded-[3rem] border border-black/5 bg-white shadow-2xl overflow-hidden">
         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead>
                  <tr className="bg-black text-white text-[10px] font-black uppercase tracking-widest">
                     <th className="px-10 py-7">Order Reference</th>
                     <th className="px-10 py-7">Customer Identity</th>
                     <th className="px-10 py-7">Status Agent</th>
                     <th className="px-10 py-7 text-right">Settled Amount</th>
                     <th className="px-10 py-7 text-right">Actions</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-black/5 font-medium">
                  {orders.map((o) => {
                     const billing = o.billingAddress as any;
                     const customer = o.user?.name || (billing ? `${billing.first_name || ''} ${billing.last_name || ''}`.trim() : 'Guest');
                     const email = o.user?.email || billing?.email || 'No Email';
                     
                     return (
                        <tr key={o.id} className="hover:bg-black/[0.01] transition-colors group">
                           <td className="px-10 py-6">
                              <div className="font-black text-base md:text-lg text-black group-hover:translate-x-1 transition-transform">#{o.id.substring(0, 8)}</div>
                              <div className="text-[10px] font-black text-black/20 uppercase mt-0.5 tracking-tighter">TIMESTAMP: {new Date(o.createdAt).toLocaleString()}</div>
                           </td>
                           <td className="px-10 py-6">
                              <div className="font-bold text-sm text-black">{customer}</div>
                              <div className="text-[9px] font-bold text-black/30 uppercase tracking-widest mt-1">{email}</div>
                           </td>
                           <td className="px-10 py-6">
                              <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-black/5 ${getStatusColor(o.status)}`}>
                                 {o.status.replace(/_/g, ' ')}
                              </span>
                           </td>
                           <td className="px-10 py-6 text-right font-black text-lg">
                              {(o.totalCents / 100).toFixed(2)} <span className="text-[10px] font-bold opacity-30">{store.currency.toUpperCase()}</span>
                           </td>
                           <td className="px-10 py-6 text-right">
                              <Link href={`/ueadmin/orders/${o.id}`} className="p-4 bg-black/5 rounded-2xl text-black/20 hover:bg-black hover:text-white transition-all shadow-sm flex items-center justify-center inline-block">
                                 <ArrowRight size={20} />
                              </Link>
                           </td>
                        </tr>
                     );
                  })}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
}
