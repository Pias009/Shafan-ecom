import Link from 'next/link';
import { wooApi } from '@/lib/woocommerce';
import { ArrowLeft, Edit3, Tag, Package, Image as ImageIcon, CheckCircle2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ProductEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data: product } = await wooApi.get(`products/${id}`);

  if (!product) {
    return (
      <div className="pt-20 text-center">
        <p className="text-xl font-bold">Product not found</p>
        <Link href="/ueadmin/products" className="text-black underline mt-4 inline-block font-bold">Back to Inventory</Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      <Link
        href="/ueadmin/products"
        className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-black/30 hover:text-black transition"
      >
        <ArrowLeft size={14} /> Back to Inventory
      </Link>

      <div>
        <h1 className="text-4xl font-black tracking-tight text-black flex items-center gap-3">
          <Edit3 size={32} /> Edit Product
        </h1>
        <p className="text-sm font-medium text-black/30 mt-1 uppercase tracking-[0.2em]">#{product.id} — {product.sku || 'No SKU'}</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="glass-panel-heavy p-8 rounded-[2.5rem] border border-black/5 bg-white shadow-sm space-y-8">
            {/* Main Info */}
            <div className="grid gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-black/30 ml-4">Product Name</label>
                <input 
                  type="text" 
                  defaultValue={product.name} 
                  className="w-full h-14 px-6 rounded-2xl bg-black/5 border-none font-bold text-black focus:ring-2 focus:ring-black transition"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-black/30 ml-4">Regular Price ($)</label>
                  <input 
                    type="number" 
                    defaultValue={product.regular_price} 
                    className="w-full h-14 px-6 rounded-2xl bg-black/5 border-none font-bold text-black focus:ring-2 focus:ring-black transition"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-black/30 ml-4">Sale Price ($)</label>
                  <input 
                    type="number" 
                    defaultValue={product.sale_price} 
                    className="w-full h-14 px-6 rounded-2xl bg-black/5 border-none font-bold text-black focus:ring-2 focus:ring-black transition"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-black/30 ml-4">Description</label>
                <textarea 
                  defaultValue={product.description?.replace(/<[^>]*>/g, '')} 
                  rows={6}
                  className="w-full p-6 rounded-2xl bg-black/5 border-none font-medium text-sm text-black/80 focus:ring-2 focus:ring-black transition"
                />
              </div>
            </div>

            <button className="w-full h-16 rounded-full bg-black text-white font-black text-xs uppercase tracking-[0.2em] transition-all hover:scale-[1.02] shadow-2xl shadow-black/20 flex items-center justify-center gap-3">
              <CheckCircle2 size={18} /> Update From WooCommerce
            </button>
            <p className="text-[10px] text-center font-bold text-black/20 uppercase tracking-widest">Note: Advanced editing should be done in WordPress Dashboard</p>
          </div>
        </div>

        <div className="space-y-8">
          {/* Status & Category */}
          <section className="glass-panel-heavy p-8 rounded-[2.5rem] border border-black/5 bg-white shadow-sm space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-black/5 rounded-xl"><Tag size={16} /></div>
              <h3 className="font-bold">Classification</h3>
            </div>
            
            <div className="space-y-4">
               <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-black/20 mb-1">Status</div>
                  <select className="w-full h-12 px-4 rounded-xl bg-black/5 border-none font-bold text-xs uppercase tracking-widest">
                    <option value="publish" selected={product.status === 'publish'}>Published</option>
                    <option value="draft" selected={product.status === 'draft'}>Draft</option>
                    <option value="pending" selected={product.status === 'pending'}>Pending Review</option>
                  </select>
               </div>
               <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-black/20 mb-1">Categories</div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {product.categories?.map((cat: any) => (
                      <span key={cat.id} className="px-3 py-1 bg-black/5 rounded-full text-[9px] font-black uppercase tracking-widest border border-black/5 text-black/40">
                        {cat.name}
                      </span>
                    ))}
                  </div>
               </div>
            </div>
          </section>

          {/* Inventory */}
          <section className="glass-panel-heavy p-8 rounded-[2.5rem] border border-black/5 bg-white shadow-sm space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-black/5 rounded-xl"><Package size={16} /></div>
              <h3 className="font-bold">Inventory</h3>
            </div>
            <div className="space-y-4">
               <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-black/20">Manage Stock</span>
                  <span className="text-xs font-black uppercase tracking-widest">{product.manage_stock ? 'Yes' : 'No'}</span>
               </div>
               <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-black/20">Current Stock</span>
                  <span className="text-lg font-black">{product.stock_quantity || 0}</span>
               </div>
            </div>
          </section>

          {/* Media */}
          <section className="glass-panel-heavy p-8 rounded-[2.5rem] border border-black/5 bg-white shadow-sm space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-black/5 rounded-xl"><ImageIcon size={16} /></div>
              <h3 className="font-bold">Media</h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
               {product.images?.map((img: any) => (
                 <div key={img.id} className="aspect-square rounded-2xl bg-black/5 overflow-hidden border border-black/5">
                    <img src={img.src} alt="Product" className="w-full h-full object-cover" />
                 </div>
               ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
