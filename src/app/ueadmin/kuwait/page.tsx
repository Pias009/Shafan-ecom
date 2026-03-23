import { prisma } from "@/lib/prisma";
import Link from 'next/link';
import { Package, ShoppingBag, Users, TrendingUp, ArrowRight, Clock, Store, Edit2, Plus } from 'lucide-react';
import { OrderStatus } from "@prisma/client";
import { StockUpdateBtn } from "./_components/StockUpdateBtn";
import { requireKuwaitAccess, getAccessibleStore } from "@/lib/admin-store-guard";

export const dynamic = 'force-dynamic';

export default async function KuwaitDashboard() {
  // Enforce strict access control - only Kuwait admins can access this page
  await requireKuwaitAccess();

  const storeCode = 'KUW';

  // Fetch store with access verification
  const store = await getAccessibleStore(storeCode);
  
  if (!store) {
    return (
      <div className="p-10 text-center">
        <h1 className="text-2xl font-bold text-red-500">Store Not Found</h1>
        <p className="text-black/50">Please ensure the store with code '{storeCode}' exists in the database.</p>
      </div>
    );
  }

  const storeId = store.id;
  const currencySymbol = store.currency.toUpperCase();

  const [
    totalOrdersCount,
    totalProductsCount,
    totalUsersCount,
    recentOrders,
    revenueData,
    inventory
  ] = await Promise.all([
    prisma.order.count({ where: { storeId } }),
    prisma.product.count({ where: { storeInventories: { some: { storeId } } } }),
    prisma.user.count({ where: { orders: { some: { storeId } } } }),
    prisma.order.findMany({
      where: { storeId },
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: { user: true }
    }),
    prisma.order.aggregate({
      _sum: { totalCents: true },
      where: { 
        storeId,
        NOT: { status: OrderStatus.CANCELLED } 
      }
    }),
    prisma.storeInventory.findMany({
      where: { storeId },
      include: { product: true },
      take: 20,
      orderBy: { quantity: 'asc' }
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
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-black/5 pb-10">
        <div>
          <div className="flex items-center gap-3 mb-3">
             <div className="p-2 bg-black rounded-xl text-white shadow-xl shadow-black/20"><Store size={20} /></div>
             <span className="text-[10px] font-black uppercase tracking-[0.3em] text-black/40">Marketplace Identity</span>
          </div>
          <h1 className="text-5xl font-black tracking-tight text-black">Kuwait Terminal</h1>
          <p className="text-sm font-medium text-black/30 mt-2 uppercase tracking-[0.2em]">Regional Inventory & Order Infrastructure</p>
        </div>
        
        <div className="flex flex-wrap gap-4">
           <Link href="/ueadmin/products/add?storeId=KUW" className="h-14 px-8 rounded-full bg-black text-white font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-black/20">
              <Plus size={16} /> New Kuwait Product
           </Link>
           <Link href="/ueadmin/kuwait/inventory" className="h-14 px-8 rounded-full bg-black/5 text-black font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-black hover:text-white transition-all border border-black/5">
              <Package size={16} /> Global Catalog
           </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass-panel-heavy p-8 rounded-[2rem] border border-black/5 bg-white shadow-sm flex items-center gap-6">
          <div className="p-4 bg-black/5 rounded-2xl text-black"><ShoppingBag size={24} /></div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-black/20">Kuwait Orders</div>
            <div className="text-3xl font-black text-black">{totalOrdersCount}</div>
          </div>
        </div>
        <div className="glass-panel-heavy p-8 rounded-[2rem] border border-black/5 bg-white shadow-sm flex items-center gap-6">
          <div className="p-4 bg-black/5 rounded-2xl text-black"><Package size={24} /></div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-black/20">Kuwait Products</div>
            <div className="text-3xl font-black text-black">{totalProductsCount}</div>
          </div>
        </div>
        <div className="glass-panel-heavy p-8 rounded-[2rem] border border-black/5 bg-white shadow-sm flex items-center gap-6">
          <div className="p-4 bg-black/5 rounded-2xl text-black"><Users size={24} /></div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-black/20">Kuwait Customers</div>
            <div className="text-3xl font-black text-black">{totalUsersCount}</div>
          </div>
        </div>
        <div className="glass-panel-heavy p-8 rounded-[2rem] border border-black/5 bg-white shadow-sm flex items-center gap-6">
          <div className="p-4 bg-black/5 rounded-2xl text-black"><TrendingUp size={24} /></div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-black/20">Store Revenue</div>
            <div className="text-3xl font-black text-black">{totalRevenue.toLocaleString()} <span className="text-sm">{currencySymbol}</span></div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-10">
        {/* Recent Orders Section */}
        <section className="lg:col-span-3 space-y-6">
          <div className="flex items-center justify-between">
             <h3 className="text-xl font-bold flex items-center gap-3">
                <Clock size={20} className="text-black/30" /> Recent Activity
             </h3>
             <Link href="/ueadmin/kuwait/orders" className="text-[10px] font-black uppercase tracking-widest text-black/40 hover:text-black transition flex items-center gap-2">
                All Kuwait Orders <ArrowRight size={14} />
             </Link>
          </div>

          <div className="glass-panel-heavy rounded-[2.5rem] border border-black/5 bg-white shadow-xl overflow-hidden">
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                   <thead>
                     <tr className="bg-black text-white">
                       <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest">Order</th>
                       <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest">Status</th>
                       <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-right">Amount</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-black/5">
                     {recentOrders.map((o: any) => (
                        <tr key={o.id} className="hover:bg-black/[0.01] transition-colors">
                          <td className="px-6 py-5">
                            <div className="font-black text-sm">#{o.id.substring(0, 8)}</div>
                            <div className="text-[9px] font-bold text-black/20 uppercase">{new Date(o.createdAt).toLocaleDateString()}</div>
                          </td>
                          <td className="px-6 py-5">
                             <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${getStatusColor(o.status)}`}>
                               {o.status}
                             </span>
                          </td>
                          <td className="px-6 py-5 text-right font-black text-sm">
                            {(o.totalCents / 100).toFixed(2)} {currencySymbol}
                          </td>
                        </tr>
                     ))}
                   </tbody>
                </table>
             </div>
          </div>
        </section>

        {/* Kuwait Inventory section */}
        <section className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
             <h3 className="text-xl font-bold flex items-center gap-3">
                <Package size={20} className="text-black/30" /> Kuwait Inventory
             </h3>
             <div className="text-[10px] font-black uppercase tracking-widest text-black/20">Stock Overview</div>
          </div>

          <div className="glass-panel-heavy rounded-[2.5rem] border border-black/5 bg-white shadow-xl overflow-hidden">
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                   <thead>
                     <tr className="bg-[#FAF9F6] text-black/40">
                       <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest">Product</th>
                       <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-center">Stock</th>
                       <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-right">Action</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-black/5">
                     {inventory.map((it: any) => (
                        <tr key={it.id} className="hover:bg-black/[0.01] transition-colors">
                          <td className="px-6 py-5">
                            <div className="font-bold text-sm truncate max-w-[120px]">{it.product?.name || 'Unknown'}</div>
                            <div className="text-[9px] font-bold text-black/20">{it.price.toFixed(2)} {currencySymbol}</div>
                          </td>
                          <td className="px-6 py-5 text-center">
                            <div className={`text-sm font-black ${it.quantity < 10 ? 'text-red-500' : 'text-black'}`}>
                              {it.quantity}
                            </div>
                          </td>
                          <td className="px-6 py-5 text-right">
                             <StockUpdateBtn inventoryId={it.id} currentQty={it.quantity} />
                          </td>
                        </tr>
                     ))}
                   </tbody>
                </table>
             </div>
          </div>
        </section>
      </div>
    </div>
  );
}
