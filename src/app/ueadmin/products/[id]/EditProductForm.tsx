"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Loader2, ArrowLeft, Image as ImageIcon, Tag, Package, X, Store, ShieldCheck } from 'lucide-react';
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
    const { name, value, type } = e.target;
    let finalValue: any = value;
    
    if (type === 'number') {
      // For price fields, we're now entering cents directly
      const numValue = parseFloat(value);
      finalValue = isNaN(numValue) ? 0 : Math.round(numValue);
    } else if (type === 'checkbox') {
      finalValue = (e.target as HTMLInputElement).checked;
    }
    
    setProduct((prev: any) => ({ ...prev, [name]: finalValue }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: product.name,
          description: product.description,
          priceCents: Math.round((product.priceCents || 0)),
          discountCents: Math.round((product.discountCents || 0)),
          stockQuantity: parseInt(product.stockQuantity || 0),
          active: product.active,
          mainImage: product.mainImage || '',
          images: product.images || [],
          brandName: product.brand?.name,
          categoryName: product.category?.name,
          categoryId: product.categoryId || product.category?.id,
          subCategoryId: product.subCategoryId || product.subCategory?.id,
          skinToneId: product.skinToneId || product.skinTone?.id,
          kuwaitPrice: product.kuwaitPrice,
          kuwaitStock: product.kuwaitStock,
        }),
      });

      if (res.ok) {
        toast.success('Product updated successfully!');
        router.refresh();
      } else {
        const errorData = await res.json();
        toast.error(errorData.error || 'Failed to update product');
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
        <p className="text-sm font-medium text-black/30 mt-1 uppercase tracking-[0.2em]">#{product.id}</p>
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
                  <label className="text-[10px] font-black uppercase tracking-widest text-black/30 ml-4">Price (Cents)</label>
                  <input
                    name="priceCents"
                    type="number"
                    value={product.priceCents || 0}
                    onChange={handleChange}
                    className="w-full h-14 px-6 rounded-2xl bg-black/5 border-none font-bold text-black focus:ring-2 focus:ring-black transition"
                  />
                  <p className="text-[8px] text-black/20 ml-4">Enter price in cents (e.g., 1050 for $10.50)</p>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-black/30 ml-4">Discount (Cents)</label>
                  <input
                    name="discountCents"
                    type="number"
                    value={product.discountCents || 0}
                    onChange={handleChange}
                    className="w-full h-14 px-6 rounded-2xl bg-black/5 border-none font-bold text-black focus:ring-2 focus:ring-black transition"
                  />
                  <p className="text-[8px] text-black/20 ml-4">Enter discount in cents</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-black/30 ml-4">Description</label>
                <textarea 
                  name="description"
                  value={product.description || ''} 
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
            <div className="flex items-center gap-3 px-4">
              <input 
                type="checkbox"
                name="active"
                checked={product.active}
                onChange={(e) => setProduct({...product, active: e.target.checked})}
                className="w-5 h-5 rounded border-black/10 text-black focus:ring-black"
              />
              <span className="text-xs font-black uppercase tracking-widest">Active / Visible</span>
            </div>
          </section>

          <section className="glass-panel-heavy p-8 rounded-[2.5rem] border border-black/5 bg-white shadow-sm space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-black/5 rounded-xl"><Package size={16} /></div>
              <h3 className="font-bold">Inventory</h3>
            </div>
            <div className="space-y-4">
               <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-black/20">Global Stock</span>
                  <input 
                    name="stockQuantity"
                    type="number"
                    value={product.stockQuantity || 0}
                    onChange={handleChange}
                    className="w-24 bg-black/5 border-none rounded-lg p-2 text-center font-black"
                  />
               </div>
            </div>
          </section>

          {/* Kuwait Specifics */}
          <section className="glass-panel-heavy p-8 rounded-[2.5rem] border border-black/5 bg-white shadow-sm space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl"><Store size={16} /></div>
              <h3 className="font-bold">Kuwait Specifics</h3>
            </div>
            <div className="space-y-4">
               <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-black/20">Kuwait Price</span>
                  <input 
                    name="kuwaitPrice"
                    type="number"
                    value={product.kuwaitPrice || 0}
                    onChange={handleChange}
                    className="w-24 bg-black/5 border-none rounded-lg p-2 text-center font-black"
                  />
               </div>
               <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-black/20">Kuwait Stock</span>
                  <input 
                    name="kuwaitStock"
                    type="number"
                    value={product.kuwaitStock || 0}
                    onChange={handleChange}
                    className="w-24 bg-black/5 border-none rounded-lg p-2 text-center font-black"
                  />
               </div>
            </div>
          </section>



          <section className="glass-panel-heavy p-8 rounded-[2.5rem] border border-black/5 bg-white shadow-sm space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-black/5 rounded-xl"><ImageIcon size={16} /></div>
              <h3 className="font-bold">Media Assets</h3>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-black/20 ml-2">Main Image</label>
                <div className="relative group aspect-square rounded-2xl bg-black/5 overflow-hidden border border-black/5">
                  {product.mainImage ? (
                    <>
                      <img src={product.mainImage} alt="Product" className="w-full h-full object-cover" />
                      <button 
                        onClick={() => setProduct({...product, mainImage: ''})}
                        className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-black transition-all opacity-0 group-hover:opacity-100"
                      >
                        <X size={14} />
                      </button>
                    </>
                  ) : (
                    <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-black/10 transition-all">
                      <ImageIcon size={24} className="text-black/20 mb-2" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-black/40">Upload Main</span>
                      <input 
                        type="file" 
                        className="hidden" 
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
                              setProduct({...product, mainImage: data.url});
                              toast.success('Uploaded!', { id: tid });
                            }
                          } catch (err) { toast.error('Upload failed', { id: tid }); }
                        }}
                      />
                    </label>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-black/20 ml-2">Gallery</label>
                <div className="grid grid-cols-2 gap-3">
                  {product.images?.map((img: string, idx: number) => (
                    <div key={idx} className="aspect-square rounded-xl bg-black/5 overflow-hidden border border-black/5 relative group">
                      <img src={img} alt="Gallery" className="w-full h-full object-cover" />
                      <button 
                        onClick={() => {
                          const newImgs = [...(product.images || [])];
                          newImgs.splice(idx, 1);
                          setProduct({...product, images: newImgs});
                        }}
                        className="absolute top-1.5 right-1.5 p-1 bg-black/50 text-white rounded-full hover:bg-black transition-all opacity-0 group-hover:opacity-100"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                  <label className="aspect-square rounded-xl bg-black/5 border-2 border-dashed border-black/10 hover:border-black/20 transition-all flex flex-col items-center justify-center cursor-pointer group">
                    <ImageIcon className="text-black/20 mb-1" size={16} />
                    <span className="text-[8px] font-black uppercase tracking-widest text-black/40">Add</span>
                    <input 
                      type="file" 
                      multiple 
                      className="hidden"
                      onChange={async (e) => {
                        const files = Array.from(e.target.files || []);
                        const tid = toast.loading('Uploading...');
                        try {
                          const newUrls = await Promise.all(files.map(async f => {
                            const fd = new FormData();
                            fd.append('file', f);
                            const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
                            const data = await res.json();
                            return data.url;
                          }));
                          setProduct({...product, images: [...(product.images || []), ...newUrls]});
                          toast.success('Gallery updated', { id: tid });
                        } catch (err) { toast.error('Upload failed', { id: tid }); }
                      }}
                    />
                  </label>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
