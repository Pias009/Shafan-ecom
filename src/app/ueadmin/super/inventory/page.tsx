import { prisma } from "@/lib/prisma";
import SuperGuard from "../../_components/SuperGuard";
import { Package, Store, AlertTriangle, ArrowRight, TrendingDown, TrendingUp } from "lucide-react";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default async function GlobalInventoryPage() {
  const [products, stores, inventory] = await Promise.all([
    prisma.product.count(),
    prisma.store.findMany(),
    prisma.storeInventory.findMany({
      include: {
        product: true,
        store: true
      },
      orderBy: { quantity: 'asc' }
    })
  ]);

  const lowStock = inventory.filter(i => i.quantity < 10);

  return (
    <SuperGuard>
      <div className="space-y-10 pb-20 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2 text-black/40">
              <Package size={16} />
              <span className="text-[10px] font-black uppercase tracking-widest">Supply Chain Intel</span>
            </div>
            <h1 className="text-4xl font-black text-black">Global Inventory Check</h1>
            <p className="text-sm font-medium text-black/30 mt-2">Aggregate stock data across all global fulfillment centers.</p>
          </div>
          
          <div className="flex gap-4">
             <div className="px-5 py-3 bg-red-50 text-red-600 rounded-2xl border border-red-100 flex items-center gap-2">
                <AlertTriangle size={14} />
                <span className="text-[10px] font-black uppercase tracking-widest">{lowStock.length} Low Stock Alerts</span>
             </div>
          </div>
        </div>

        {/* Store Summary Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {stores.map(store => {
             const storeInv = inventory.filter(i => i.storeId === store.id);
             const totalQty = storeInv.reduce((acc, i) => acc + i.quantity, 0);
             const storeLow = storeInv.filter(i => i.quantity < 10).length;

             return (
               <div key={store.id} className="glass-panel-heavy p-8 rounded-[2.5rem] bg-white border border-black/5 shadow-xl space-y-6">
                  <div className="flex justify-between items-start">
                     <div className="p-3 bg-black text-white rounded-2xl shadow-xl shadow-black/10">
                        <Store size={20} />
                     </div>
                     <span className="text-[10px] font-black uppercase tracking-widest text-black/20">{store.code}</span>
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-black text-black">{store.name}</h3>
                    <p className="text-[10px] font-bold text-black/30 uppercase tracking-widest mt-1">{store.country} — {store.region}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 h-24">
                     <div className="bg-black/5 rounded-2xl p-4 flex flex-col justify-center">
                        <div className="text-[8px] font-black text-black/20 uppercase tracking-widest mb-1">Total Items</div>
                        <div className="text-2xl font-black text-black">{totalQty}</div>
                     </div>
                     <div className={`rounded-2xl p-4 flex flex-col justify-center ${storeLow > 0 ? 'bg-orange-50 text-orange-600 border border-orange-100' : 'bg-black/5'}`}>
                        <div className="text-[8px] font-black text-black/20 uppercase tracking-widest mb-1">Low Stock</div>
                        <div className="text-2xl font-black">{storeLow}</div>
                     </div>
                  </div>

                  <Link href={`/ueadmin/super/inventory/${store.code}`} className="w-full h-12 rounded-full border border-black/5 flex items-center justify-center text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all">
                    Detailed Store Audit <ArrowRight className="ml-2" size={14} />
                  </Link>
               </div>
             );
           })}
        </div>

        {/* Global Stock Table */}
        <section className="space-y-6">
           <h3 className="text-xl font-bold flex items-center gap-3 px-4">
              <Package size={20} className="text-black/30" /> Critical Global Inventory
           </h3>

           <div className="glass-panel-heavy rounded-[3rem] border border-black/5 bg-white shadow-2xl overflow-hidden">
              <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead>
                       <tr className="bg-black text-white border-b border-white/10 text-[10px] font-black uppercase tracking-widest">
                          <th className="px-8 py-6">Product</th>
                          <th className="px-8 py-6">Store</th>
                          <th className="px-8 py-6 text-center">Remaining</th>
                          <th className="px-8 py-6 text-right">Unit Price</th>
                          <th className="px-8 py-6 text-right">Actions</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5 font-medium">
                       {inventory.slice(0, 50).map((inv) => (
                          <tr key={inv.id} className="hover:bg-black/[0.01] transition-colors group">
                             <td className="px-8 py-5">
                                <div className="font-bold text-sm text-black group-hover:translate-x-1 transition-transform">{inv.product?.name || 'Unknown'}</div>
                                <div className="text-[9px] font-black text-black/20 uppercase tracking-widest mt-0.5">ID: {inv.productId.substring(0, 8)}</div>
                             </td>
                             <td className="px-8 py-5">
                                <span className="px-3 py-1 bg-black/5 rounded-full text-[9px] font-black uppercase tracking-widest">{inv.store.code}</span>
                             </td>
                             <td className="px-8 py-5 text-center">
                                <div className={`text-sm font-black ${inv.quantity < 10 ? 'text-orange-500' : 'text-black'}`}>
                                   {inv.quantity}
                                </div>
                             </td>
                             <td className="px-8 py-5 text-right font-black text-sm">
                                {inv.price.toFixed(2)} <span className="text-[9px] opacity-30">{inv.store.currency.toUpperCase()}</span>
                             </td>
                             <td className="px-8 py-5 text-right">
                                <Link href={`/ueadmin/products/${inv.productId}`} className="p-2 hover:bg-black rounded-xl text-black/10 hover:text-white transition-all inline-block">
                                   <ArrowRight size={16} />
                                </Link>
                             </td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>
        </section>
      </div>
    </SuperGuard>
  );
}
