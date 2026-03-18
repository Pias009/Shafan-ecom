"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Loader2, ArrowLeft, Image as ImageIcon, Tag, Hash, Package, TrendingUp, X } from 'lucide-react';
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
    features: [] as string[],
    priceCents: 0,
    discountCents: 0,
    stockQuantity: 0,
    mainImage: '',
    images: [] as string[],
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
        body: JSON.stringify(formData),
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
            
            <div className="space-y-6">
              {/* Main Image Upload */}
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-black/40 px-2">Main Image (Primary)</label>
                <div className="relative group">
                  {formData.mainImage ? (
                    <div className="aspect-square rounded-2xl bg-black/5 overflow-hidden border border-black/5 relative">
                      <img src={formData.mainImage} alt="Main" className="w-full h-full object-cover" />
                      <button 
                        type="button"
                        onClick={() => setFormData(p => ({ ...p, mainImage: '' }))}
                        className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-black transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <label className="aspect-square rounded-2xl bg-black/5 border-2 border-dashed border-black/10 hover:border-black/20 transition-all flex flex-col items-center justify-center cursor-pointer group">
                      <ImageIcon className="text-black/20 mb-2 group-hover:scale-110 transition-transform" size={24} />
                      <span className="text-[10px] font-black uppercase tracking-widest text-black/40">Upload Main</span>
                      <input 
                        type="file" 
                        className="hidden" 
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const tid = toast.loading('Uploading...');
                          try {
                            const fd = new FormData();
                            fd.append('file', file);
                            const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
                            const data = await res.json();
                            if (data.url) {
                              setFormData(p => ({ ...p, mainImage: data.url }));
                              toast.dismiss(tid);
                            } else {
                              throw new Error(data.error);
                            }
                          } catch (err: any) {
                            toast.error(err.message || 'Upload failed', { id: tid });
                          }
                        }}
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Gallery Upload */}
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-black/40 px-2">Gallery (Min 2 recommended)</label>
                <div className="grid grid-cols-2 gap-3">
                  {formData.images.map((img, idx) => (
                    <div key={idx} className="aspect-square rounded-xl bg-black/5 overflow-hidden border border-black/5 relative group">
                      <img src={img} alt="Gallery" className="w-full h-full object-cover" />
                      <button 
                        type="button"
                        onClick={() => {
                          const imgs = [...formData.images];
                          imgs.splice(idx, 1);
                          setFormData(p => ({ ...p, images: imgs }));
                        }}
                        className="absolute top-1.5 right-1.5 p-1 bg-black/50 text-white rounded-full hover:bg-black transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                  <label className="aspect-square rounded-xl bg-black/5 border-2 border-dashed border-black/10 hover:border-black/20 transition-all flex flex-col items-center justify-center cursor-pointer group">
                    <ImageIcon className="text-black/20 mb-1 group-hover:scale-110 transition-transform" size={16} />
                    <span className="text-[8px] font-black uppercase tracking-widest text-black/40">Add More</span>
                    <input 
                      type="file" 
                      className="hidden" 
                      multiple
                      accept="image/*"
                      onChange={async (e) => {
                        const files = Array.from(e.target.files || []);
                        if (files.length === 0) return;
                        const tid = toast.loading(`Uploading ${files.length} images...`);
                        try {
                          const urls = await Promise.all(files.map(async file => {
                            const fd = new FormData();
                            fd.append('file', file);
                            const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
                            const data = await res.json();
                            return data.url;
                          }));
                          setFormData(p => ({ ...p, images: [...p.images, ...urls] }));
                          toast.success('Gallery updated', { id: tid });
                        } catch (err) {
                          toast.error('Gallery upload partially failed', { id: tid });
                        }
                      }}
                    />
                  </label>
                </div>
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
