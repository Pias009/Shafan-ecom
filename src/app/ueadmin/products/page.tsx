import Link from 'next/link';
import { wooApi } from '@/lib/woocommerce';
import { Plus, Package, Tag, Layers } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ProductsPage() {
  const { data: products } = await wooApi.get("products", {
    per_page: 100,
    orderby: "date",
    order: "desc"
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-black">Inventory</h1>
          <p className="text-sm font-medium text-black/30 mt-1 uppercase tracking-[0.2em]">Manage your WooCommerce products</p>
        </div>
        <Link 
          href="/ueadmin/products/add" 
          className="inline-flex items-center gap-2 bg-black text-white text-xs font-black uppercase tracking-widest px-8 py-4 rounded-full hover:scale-105 transition active:scale-95 shadow-2xl shadow-black/20"
        >
          <Plus size={16} /> Add New Product
        </Link>
      </div>

      <div className="glass-panel overflow-hidden rounded-[2.5rem] border border-black/5 shadow-sm bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-black text-white">
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest">Product</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-center">Price</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-center">Stock</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest">Categories</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest">Status</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {products.map((p: any) => (
                <tr key={p.id} className="hover:bg-black/[0.01] transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-black/5 border border-black/5 overflow-hidden flex-shrink-0 relative">
                        {p.images?.[0]?.src ? (
                          <img src={p.images[0].src} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] font-black text-black/10">NO IMG</div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-sm text-black truncate max-w-[200px] leading-tight">{p.name}</div>
                        <div className="text-[10px] font-bold text-black/20 uppercase tracking-tighter mt-1 flex items-center gap-1">
                          <Tag size={10} /> {p.sku || 'No SKU'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-center">
                    <div className="font-black text-sm">${parseFloat(p.price || '0').toFixed(2)}</div>
                    {p.regular_price !== p.price && (
                      <div className="text-[10px] text-black/20 line-through font-bold">${parseFloat(p.regular_price || '0').toFixed(2)}</div>
                    )}
                  </td>
                  <td className="px-8 py-5 text-center">
                    <div className={`text-xs font-black uppercase tracking-widest ${p.stock_quantity > 0 ? 'text-black/60' : 'text-red-500'}`}>
                      {p.manage_stock ? p.stock_quantity || 0 : p.stock_status === 'instock' ? 'In Stock' : 'Out of Stock'}
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                      {p.categories?.map((cat: any) => (
                        <span key={cat.id} className="inline-block px-2 py-0.5 rounded bg-black/5 text-[9px] font-bold text-black/40 uppercase tracking-tighter">
                          {cat.name}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                      p.status === 'publish' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200'
                    }`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <Link 
                      href={`/ueadmin/products/${p.id}`} 
                      className="inline-block text-[10px] font-black uppercase tracking-widest bg-black/5 hover:bg-black hover:text-white px-4 py-2 rounded-full transition-all"
                    >
                      Edit
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
