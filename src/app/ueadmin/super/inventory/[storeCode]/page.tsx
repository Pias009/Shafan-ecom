import { prisma } from "@/lib/prisma";
import SuperGuard from "../../../_components/SuperGuard";
import { Package, Store, ArrowLeft, TrendingDown, TrendingUp, AlertTriangle, RefreshCw, CheckCircle } from "lucide-react";
import Link from "next/link";

export const dynamic = 'force-dynamic';

interface StoreInventoryPageProps {
  params: Promise<{ storeCode: string }>;
}

export default async function StoreInventoryDetailPage({ params }: StoreInventoryPageProps) {
  const { storeCode } = await params;
  
  const [store, inventory, products] = await Promise.all([
    prisma.store.findUnique({
      where: { code: storeCode },
    }),
    prisma.storeInventory.findMany({
      where: { store: { code: storeCode } },
      include: {
        product: true,
      },
      orderBy: { quantity: 'asc' }
    }),
    prisma.product.findMany({
      where: { store: { code: storeCode } },
    }),
  ]);

  if (!store) {
    return (
      <SuperGuard>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-black">Store not found</h1>
            <p className="text-black/30 mt-2">Store with code "{storeCode}" does not exist.</p>
            <Link href="/ueadmin/super/inventory" className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-black hover:underline">
              <ArrowLeft size={16} /> Back to Inventory
            </Link>
          </div>
        </div>
      </SuperGuard>
    );
  }

  const lowStock = inventory.filter(i => i.quantity < 10);
  const outOfStock = inventory.filter(i => i.quantity === 0);
  const totalValue = inventory.reduce((acc, i) => acc + (i.quantity * i.price), 0);

  return (
    <SuperGuard>
      <div className="space-y-10 pb-20 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link href="/ueadmin/super/inventory" className="p-2 hover:bg-black/5 rounded-xl transition-all">
                <ArrowLeft size={16} className="text-black/30" />
              </Link>
              <span className="text-[10px] font-black uppercase tracking-widest text-black/40">Store Inventory Audit</span>
            </div>
            <h1 className="text-4xl font-black text-black">{store.name}</h1>
            <p className="text-sm font-medium text-black/30 mt-2">
              {store.country} — {store.region} • {store.currency.toUpperCase()}
            </p>
          </div>
          
          <div className="flex flex-wrap gap-4">
            {lowStock.length > 0 && (
              <div className="px-5 py-3 bg-orange-50 text-orange-600 rounded-2xl border border-orange-100 flex items-center gap-2">
                <AlertTriangle size={14} />
                <span className="text-[10px] font-black uppercase tracking-widest">{lowStock.length} Low Stock</span>
              </div>
            )}
            {outOfStock.length > 0 && (
              <div className="px-5 py-3 bg-red-50 text-red-600 rounded-2xl border border-red-100 flex items-center gap-2">
                <AlertTriangle size={14} />
                <span className="text-[10px] font-black uppercase tracking-widest">{outOfStock.length} Out of Stock</span>
              </div>
            )}
            <div className="px-5 py-3 bg-black/5 text-black rounded-2xl border border-black/10 flex items-center gap-2">
              <Package size={14} />
              <span className="text-[10px] font-black uppercase tracking-widest">{inventory.length} SKUs</span>
            </div>
          </div>
        </div>

        {/* Store Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="glass-panel-heavy p-6 rounded-[2rem] bg-white border border-black/5 shadow-xl">
            <div className="text-[10px] font-black uppercase tracking-widest text-black/20 mb-2">Total Products</div>
            <div className="text-3xl font-black text-black">{products.length}</div>
          </div>
          
          <div className="glass-panel-heavy p-6 rounded-[2rem] bg-white border border-black/5 shadow-xl">
            <div className="text-[10px] font-black uppercase tracking-widest text-black/20 mb-2">Inventory Items</div>
            <div className="text-3xl font-black text-black">{inventory.length}</div>
          </div>
          
          <div className="glass-panel-heavy p-6 rounded-[2rem] bg-white border border-black/5 shadow-xl">
            <div className="text-[10px] font-black uppercase tracking-widest text-black/20 mb-2">Total Value</div>
            <div className="text-3xl font-black text-black">
              {totalValue.toLocaleString('en-US', { 
                style: 'currency', 
                currency: store.currency.toUpperCase() 
              })}
            </div>
          </div>
          
          <div className="glass-panel-heavy p-6 rounded-[2rem] bg-white border border-black/5 shadow-xl">
            <div className="text-[10px] font-black uppercase tracking-widest text-black/20 mb-2">Stock Health</div>
            <div className="text-3xl font-black text-black">
              {inventory.length > 0 
                ? `${Math.round((inventory.filter(i => i.quantity >= 10).length / inventory.length) * 100)}%`
                : '0%'
              }
            </div>
          </div>
        </div>

        {/* Inventory Table */}
        <section className="space-y-6">
          <div className="flex items-center justify-between px-4">
            <h3 className="text-xl font-bold flex items-center gap-3">
              <Package size={20} className="text-black/30" /> Detailed Inventory
            </h3>
            <button className="text-[10px] font-black uppercase tracking-widest text-black/30 hover:text-black transition flex items-center gap-2">
              <RefreshCw size={12} /> Refresh Data
            </button>
          </div>

          <div className="glass-panel-heavy rounded-[3rem] border border-black/5 bg-white shadow-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-black text-white border-b border-white/10 text-[10px] font-black uppercase tracking-widest">
                    <th className="px-8 py-6">Product</th>
                    <th className="px-8 py-6">SKU</th>
                    <th className="px-8 py-6 text-center">Stock Level</th>
                    <th className="px-8 py-6 text-right">Unit Price</th>
                    <th className="px-8 py-6 text-right">Total Value</th>
                    <th className="px-8 py-6 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5 font-medium">
                  {inventory.map((inv) => {
                    const stockValue = inv.quantity * inv.price;
                    let status = "healthy";
                    let statusColor = "text-emerald-500";
                    
                    if (inv.quantity === 0) {
                      status = "out of stock";
                      statusColor = "text-red-500";
                    } else if (inv.quantity < 5) {
                      status = "critical";
                      statusColor = "text-red-500";
                    } else if (inv.quantity < 10) {
                      status = "low";
                      statusColor = "text-orange-500";
                    }

                    return (
                      <tr key={inv.id} className="hover:bg-black/[0.01] transition-colors group">
                        <td className="px-8 py-5">
                          <div className="font-bold text-sm text-black group-hover:translate-x-1 transition-transform">
                            {inv.product?.name || 'Unknown Product'}
                          </div>
                          <div className="text-[9px] font-black text-black/20 uppercase tracking-widest mt-0.5">
                            ID: {inv.productId.substring(0, 8)}
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <span className="px-3 py-1 bg-black/5 rounded-full text-[9px] font-black uppercase tracking-widest">
                            {inv.product?.sku || 'N/A'}
                          </span>
                        </td>
                        <td className="px-8 py-5 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <div className={`text-sm font-black ${statusColor}`}>
                              {inv.quantity}
                            </div>
                            {inv.quantity < 10 && inv.quantity > 0 ? (
                              <TrendingDown size={14} className="text-orange-500" />
                            ) : inv.quantity >= 20 ? (
                              <TrendingUp size={14} className="text-emerald-500" />
                            ) : null}
                          </div>
                        </td>
                        <td className="px-8 py-5 text-right font-black text-sm">
                          {inv.price.toFixed(2)} <span className="text-[9px] opacity-30">{store.currency.toUpperCase()}</span>
                        </td>
                        <td className="px-8 py-5 text-right font-black text-sm">
                          {stockValue.toLocaleString('en-US', { 
                            style: 'currency', 
                            currency: store.currency.toUpperCase(),
                            minimumFractionDigits: 2 
                          })}
                        </td>
                        <td className="px-8 py-5 text-right">
                          <span className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest ${
                            status === 'healthy' ? 'bg-emerald-100 text-emerald-700' :
                            status === 'low' ? 'bg-orange-100 text-orange-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {inventory.length === 0 && (
            <div className="text-center py-20">
              <Package size={48} className="mx-auto text-black/10 mb-4" />
              <h3 className="text-xl font-bold text-black/30">No inventory found</h3>
              <p className="text-sm text-black/20 mt-2">This store has no inventory records.</p>
            </div>
          )}
        </section>

        {/* Store Information */}
        <div className="grid md:grid-cols-2 gap-10">
          <div className="glass-panel-heavy p-8 rounded-[2.5rem] bg-white border border-black/5 shadow-xl space-y-6">
            <h3 className="text-xl font-bold flex items-center gap-3">
              <Store size={20} className="text-black/30" /> Store Details
            </h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-black/5">
                <span className="text-sm font-bold text-black/40">Store Code</span>
                <span className="font-black text-black">{store.code}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-black/5">
                <span className="text-sm font-bold text-black/40">Country</span>
                <span className="font-black text-black">{store.country}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-black/5">
                <span className="text-sm font-bold text-black/40">Region</span>
                <span className="font-black text-black">{store.region}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-black/5">
                <span className="text-sm font-bold text-black/40">Currency</span>
                <span className="font-black text-black">{store.currency.toUpperCase()}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-black/5">
                <span className="text-sm font-bold text-black/40">Status</span>
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                  store.active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                }`}>
                  {store.active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>

          <div className="glass-panel-heavy p-8 rounded-[2.5rem] bg-black text-white space-y-6">
            <h3 className="text-xl font-bold flex items-center gap-3">
              <AlertTriangle size={20} className="text-white/40" /> Stock Alerts
            </h3>
            
            {lowStock.length > 0 ? (
              <div className="space-y-4">
                <p className="text-sm font-medium text-white/70">
                  {lowStock.length} product{lowStock.length !== 1 ? 's' : ''} require{lowStock.length === 1 ? 's' : ''} immediate attention:
                </p>
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                  {lowStock.map((inv) => (
                    <div key={inv.id} className="p-4 bg-white/10 rounded-2xl border border-white/5">
                      <div className="flex justify-between items-center">
                        <div className="font-bold text-sm truncate max-w-[200px]">
                          {inv.product?.name || 'Unknown'}
                        </div>
                        <div className="text-orange-300 font-black text-sm">
                          {inv.quantity} left
                        </div>
                      </div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-white/40 mt-1">
                        Reorder threshold: 10 units
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-10">
                <CheckCircle size={48} className="mx-auto text-white/20 mb-4" />
                <h3 className="text-lg font-bold text-white/40">All stock levels are healthy</h3>
                <p className="text-sm text-white/30 mt-2">No immediate action required.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </SuperGuard>
  );
}