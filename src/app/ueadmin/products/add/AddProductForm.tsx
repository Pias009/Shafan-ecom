"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Loader2, ArrowLeft, Image as ImageIcon, Tag, Hash, Package, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface AddProductFormProps {
  brands: { name: string }[];
  categories: { name: string }[];
}

export function AddProductForm({ brands, categories }: AddProductFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    brandName: brands[0]?.name || '',
    categoryName: categories[0]?.name || '',
    description: '',
    features: '',
    priceCents: 0,
    discountCents: 0,
    stockQuantity: 0,
    mainImage: '',
    images: '',
    hot: false,
    trending: false
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : val
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          features: formData.features.split(',').map(f => f.trim()).filter(Boolean),
          images: formData.images.split(',').map(f => f.trim()).filter(Boolean),
        }),
      });

      if (res.ok) {
        toast.success('Product created successfully!');
        router.push('/ueadmin/products');
        router.refresh();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Failed to create product');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/ueadmin/products" className="p-2 hover:bg-black/5 rounded-full transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-3xl font-black text-black">New Product</h1>
            <p className="text-xs font-bold text-black/30 uppercase tracking-widest mt-1">Add to store inventory</p>
          </div>
        </div>
        <button
          form="product-form"
          disabled={loading}
          className="bg-black text-white px-8 py-4 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-black/10 disabled:opacity-50 disabled:scale-100"
        >
          {loading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
          {loading ? 'Saving...' : 'Save Product'}
        </button>
      </div>

      <form id="product-form" onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* General Information */}
          <section className="glass-panel-heavy p-8 rounded-[2.5rem] border border-black/5 bg-white shadow-sm space-y-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-black/20 flex items-center gap-2">
              <Package size={14} /> General Info
            </h3>
            
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-black/40 px-2">Product Name</label>
                <input
                  required
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Lavender Dew Serum"
                  className="w-full bg-black/5 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-black outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-black/40 px-2">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={6}
                  placeholder="Tell customers about this product..."
                  className="w-full bg-black/5 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-black outline-none transition-all resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-black/40 px-2">Brand</label>
                  <div className="relative">
                    <select
                      name="brandName"
                      value={formData.brandName}
                      onChange={handleChange}
                      className="w-full bg-black/5 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-black outline-none appearance-none cursor-pointer"
                    >
                      {brands.map(b => (
                        <option key={b.name} value={b.name}>{b.name}</option>
                      ))}
                    </select>
                    <Tag className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-black/20" size={16} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-black/40 px-2">Category</label>
                  <div className="relative">
                    <select
                      name="categoryName"
                      value={formData.categoryName}
                      onChange={handleChange}
                      className="w-full bg-black/5 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-black outline-none appearance-none cursor-pointer"
                    >
                      {categories.map(c => (
                        <option key={c.name} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                    <Hash className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-black/20" size={16} />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Pricing & Stock */}
          <section className="glass-panel-heavy p-8 rounded-[2.5rem] border border-black/5 bg-white shadow-sm space-y-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-black/20 flex items-center gap-2">
              <TrendingUp size={14} /> Pricing & Inventory
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-black/40 px-2">Price (Cents)</label>
                <input
                  type="number"
                  name="priceCents"
                  value={formData.priceCents}
                  onChange={handleChange}
                  className="w-full bg-black/5 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-black outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-black/40 px-2">Sale Price (Cents)</label>
                <input
                  type="number"
                  name="discountCents"
                  value={formData.discountCents}
                  onChange={handleChange}
                  className="w-full bg-black/5 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-black outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-black/40 px-2">Quantity</label>
                <input
                  type="number"
                  name="stockQuantity"
                  value={formData.stockQuantity}
                  onChange={handleChange}
                  className="w-full bg-black/5 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-black outline-none"
                />
              </div>
            </div>
          </section>
        </div>

        {/* Sidebar Controls */}
        <div className="space-y-8">
          {/* Images */}
          <section className="glass-panel-heavy p-8 rounded-[2.5rem] border border-black/5 bg-white shadow-sm space-y-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-black/20 flex items-center gap-2">
              <ImageIcon size={14} /> Media Assets
            </h3>
            
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-black/40 px-2">Main Product Image URL</label>
                <input
                  name="mainImage"
                  value={formData.mainImage}
                  onChange={handleChange}
                  placeholder="https://cloudinary.com/..."
                  className="w-full bg-black/5 border-none rounded-2xl px-5 py-4 text-[10px] font-bold focus:ring-2 focus:ring-black outline-none"
                />
              </div>

              {formData.mainImage && (
                <div className="aspect-square rounded-2xl bg-black/5 overflow-hidden border border-black/5">
                  <img src={formData.mainImage} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-black/40 px-2">Gallery URLs (comma separated)</label>
                <textarea
                  name="images"
                  value={formData.images}
                  onChange={handleChange}
                  rows={4}
                  className="w-full bg-black/5 border-none rounded-2xl px-5 py-4 text-[10px] font-bold focus:ring-2 focus:ring-black outline-none resize-none"
                />
              </div>
            </div>
          </section>

          {/* Visibility */}
          <section className="glass-panel-heavy p-8 rounded-[2.5rem] border border-black/5 bg-white shadow-sm space-y-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-black/20">Status & Vibes</h3>
            
            <div className="space-y-4">
              <label className="flex items-center justify-between p-4 bg-black/5 rounded-2xl cursor-pointer group">
                <span className="text-xs font-bold uppercase tracking-widest text-black/60 group-hover:text-black">Hot Item</span>
                <input
                  type="checkbox"
                  name="hot"
                  checked={formData.hot}
                  onChange={handleChange}
                  className="w-5 h-5 rounded-lg border-none bg-black/10 checked:bg-black text-black focus:ring-0 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-4 bg-black/5 rounded-2xl cursor-pointer group">
                <span className="text-xs font-bold uppercase tracking-widest text-black/60 group-hover:text-black">Trending</span>
                <input
                  type="checkbox"
                  name="trending"
                  checked={formData.trending}
                  onChange={handleChange}
                  className="w-5 h-5 rounded-lg border-none bg-black/10 checked:bg-black text-black focus:ring-0 cursor-pointer"
                />
              </label>
            </div>
          </section>
        </div>
      </form>
    </div>
  );
}
