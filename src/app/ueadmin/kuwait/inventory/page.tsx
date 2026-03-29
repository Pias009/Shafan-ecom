import { prisma } from "@/lib/prisma";
import Link from 'next/link';
import { Package, Plus, Search, Filter, ArrowRight, Store } from 'lucide-react';
import { StockUpdateBtn } from "../_components/StockUpdateBtn";
import { requireKuwaitAccess, getAccessibleStore } from "@/lib/admin-store-guard";

export const dynamic = 'force-dynamic';

export default async function KuwaitInventoryPage() {
  // Enforce strict access control - only Kuwait admins can access this page
  await requireKuwaitAccess();

  const storeCode = 'KUW';
  const store = await getAccessibleStore(storeCode);

  if (!store) {
     return <div className="p-20 text-center font-black opacity-20 italic text-3xl">Access Denied or Store Not Found: KUW</div>;
  }

  const inventory = await prisma.storeInventory.findMany({
    where: { storeId: store.id },
    include: { product: true },
    orderBy: { product: { name: 'asc' } }
  });

  return (
    <div className="space-y-12 pb-20">
      {/* Localized Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <div className="flex items-center gap-3 mb-3">
             <div className="p-2 bg-black rounded-xl text-white shadow-xl shadow-black/10"><Package size={20} /></div>
             <span className="text-[10px] font-black uppercase tracking-[0.3em] text-black/40">Fulfillment Hub: {store.name}</span>
          </div>
          <h1 className="text-5xl font-black text-black">Kuwait Catalog</h1>
          <p className="text-sm font-medium text-black/30 mt-2">Managing {inventory.length} localized stock keeping units (SKUs).</p>
        </div>

        <Link href="/ueadmin/products/add?storeId=KUW" className="h-16 px-10 rounded-full bg-black text-white font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-black/20">
           <Plus size={18} /> Add Local Product
        </Link>
      </div>

      {/* Advanced Filter Placeholder */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
         <div className="md:col-span-2 relative">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-black/20" size={20} />
            <input 
              placeholder="Search localized products by name or SKU..." 
              className="w-full h-16 pl-16 pr-8 rounded-3xl bg-black/5 border-none font-bold text-sm focus:ring-2 focus:ring-black transition-all"
            />
         </div>
         <div className="h-16 flex items-center px-8 rounded-3xl bg-black/5 border-none font-black text-[10px] uppercase tracking-widest text-black/40 gap-3 cursor-not-allowed">
            <Filter size={16} /> Advanced Sorting
         </div>
      </div>

      {/* Localized Product List */}
      <div className="glass-panel-heavy rounded-[3rem] border border-black/5 bg-white shadow-2xl overflow-hidden">
         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead>
                  <tr className="bg-black text-white text-[10px] font-black uppercase tracking-widest">
                     <th className="px-10 py-7">Product Details</th>
                     <th className="px-10 py-7">Localized Price</th>
                     <th className="px-10 py-7 text-center">In-Stock</th>
                     <th className="px-10 py-7 text-right">Actions</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-black/5">
                  {inventory.map((it: any) => (
                     <tr key={it.id} className="hover:bg-black/[0.01] transition-colors group">
                        <td className="px-10 py-6">
                           <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-2xl bg-black/5 flex items-center justify-center font-black text-[10px] border border-black/5 group-hover:bg-black group-hover:text-white transition-all">
                                 {it.product?.name?.substring(0, 2).toUpperCase()}
                              </div>
                              <div>
                                 <div className="font-bold text-base text-black">{it.product?.name}</div>
                                 <div className="text-[10px] font-black text-black/20 uppercase tracking-widest">Global ID: {it.productId.substring(0, 8)}</div>
                              </div>
                           </div>
                        </td>
                        <td className="px-10 py-6 font-black text-sm">
                           {it.price.toFixed(2)} <span className="text-[10px] opacity-30">{store.currency.toUpperCase()}</span>
                        </td>
                        <td className="px-10 py-6 text-center">
                           <div className={`text-sm font-black inline-flex items-center gap-2 ${it.quantity < 10 ? 'text-orange-500' : 'text-black'}`}>
                              {it.quantity} {it.quantity < 10 && <Filter size={12} className="opacity-40" />}
                           </div>
                        </td>
                        <td className="px-10 py-6 text-right">
                           <div className="flex items-center justify-end gap-3">
                              <StockUpdateBtn inventoryId={it.id} currentQty={it.quantity} />
                              <Link href={`/ueadmin/products/${it.productId}`} className="p-3 bg-black/5 rounded-2xl text-black/20 hover:bg-black hover:text-white transition-all shadow-sm">
                                 <ArrowRight size={18} />
                              </Link>
                           </div>
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
