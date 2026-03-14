"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Loader2, ArrowLeft, Image as ImageIcon, Tag, Package, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface EditProductFormProps {
  product: any;
}

export function EditProductForm({ product: initialProduct }: EditProductFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState(initialProduct);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProduct((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // In this setup, we might want a specific PUT route, 
      // but we can reuse the POST route as it uses upsert by name
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: product.name,
          description: product.description?.replace(/<[^>]*>/g, ''),
          priceCents: Math.round(parseFloat(product.regular_price || "0") * 100),
          discountCents: product.sale_price ? Math.round(parseFloat(product.sale_price) * 100) : undefined,
          stockQuantity: product.stock_quantity || 0,
          status: product.status,
          // We can add more fields if we want to sync them
        }),
      });

      if (res.ok) {
        toast.success('Product updated successfully!');
        router.refresh();
      } else {
        toast.error('Failed to update product');
      }
    } catch (error) {
      toast.error('Error saving product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <Link href="/ueadmin/products" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-black/30 hover:text-black transition">
          <ArrowLeft size={14} /> Back to Inventory
        </Link>
        <button
          onClick={handleSave}
          disabled={loading}
          className="bg-black text-white px-8 py-4 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-black/10 disabled:opacity-50"
        >
          {loading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div>
        <h1 className="text-4xl font-black tracking-tight text-black flex items-center gap-3">
           Edit Product
        </h1>
        <p className="text-sm font-medium text-black/30 mt-1 uppercase tracking-[0.2em]">#{product.id} — {product.sku || 'No SKU'}</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="glass-panel-heavy p-8 rounded-[2.5rem] border border-black/5 bg-white shadow-sm space-y-8">
            <div className="grid gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-black/30 ml-4">Product Name</label>
                <input 
                  name="name"
                  value={product.name}
                  onChange={handleChange}
                  className="w-full h-14 px-6 rounded-2xl bg-black/5 border-none font-bold text-black focus:ring-2 focus:ring-black transition"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-black/30 ml-4">Regular Price ($)</label>
                  <input 
                    name="regular_price"
                    type="number"
                    value={product.regular_price}
                    onChange={handleChange}
                    className="w-full h-14 px-6 rounded-2xl bg-black/5 border-none font-bold text-black focus:ring-2 focus:ring-black transition"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-black/30 ml-4">Sale Price ($)</label>
                  <input 
                    name="sale_price"
                    type="number"
                    value={product.sale_price}
                    onChange={handleChange}
                    className="w-full h-14 px-6 rounded-2xl bg-black/5 border-none font-bold text-black focus:ring-2 focus:ring-black transition"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-black/30 ml-4">Description</label>
                <textarea 
                  name="description"
                  value={product.description?.replace(/<[^>]*>/g, '')} 
                  onChange={handleChange}
                  rows={6}
                  className="w-full p-6 rounded-2xl bg-black/5 border-none font-medium text-sm text-black/80 focus:ring-2 focus:ring-black transition resize-none"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <section className="glass-panel-heavy p-8 rounded-[2.5rem] border border-black/5 bg-white shadow-sm space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-black/5 rounded-xl"><Tag size={16} /></div>
              <h3 className="font-bold">Status</h3>
            </div>
            <select 
              name="status"
              value={product.status}
              onChange={handleChange}
              className="w-full h-12 px-4 rounded-xl bg-black/5 border-none font-bold text-xs uppercase tracking-widest outline-none focus:ring-2 focus:ring-black"
            >
              <option value="publish">Published</option>
              <option value="draft">Draft</option>
              <option value="pending">Pending Review</option>
            </select>
          </section>

          <section className="glass-panel-heavy p-8 rounded-[2.5rem] border border-black/5 bg-white shadow-sm space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-black/5 rounded-xl"><Package size={16} /></div>
              <h3 className="font-bold">Inventory</h3>
            </div>
            <div className="space-y-4">
               <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-black/20">Current Stock</span>
                  <input 
                    name="stock_quantity"
                    type="number"
                    value={product.stock_quantity || 0}
                    onChange={handleChange}
                    className="w-20 bg-black/5 border-none rounded-lg p-1 text-center font-black"
                  />
               </div>
            </div>
          </section>

          <section className="glass-panel-heavy p-8 rounded-[2.5rem] border border-black/5 bg-white shadow-sm space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-black/5 rounded-xl"><ImageIcon size={16} /></div>
              <h3 className="font-bold">Primary Asset</h3>
            </div>
            {product.images?.[0]?.src && (
              <div className="aspect-square rounded-2xl bg-black/5 overflow-hidden border border-black/5">
                <img src={product.images[0].src} alt="Product" className="w-full h-full object-cover" />
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
