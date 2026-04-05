"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Loader2, ArrowLeft, Image as ImageIcon, Tag, Package, X, Globe, Box, Hash, Search, Store } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { parseCommaSeparatedPriceInput, formatPriceForAdmin } from '@/lib/money';

interface EditProductFormProps {
  product: any;
  categories: { id: string; name: string }[];
  subCategories: { id: string; name: string; categoryId: string; category: { name: string } }[];
  skinTones: { id: string; name: string; hexColor: string | null }[];
  skinConcerns: { id: string; name: string }[];
}

export function EditProductForm({ product: initialProduct, categories, subCategories, skinTones, skinConcerns }: EditProductFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  // Ensure numeric fields are properly converted to numbers
  const normalizedProduct = {
    ...initialProduct,
    price: Number(initialProduct.price) || 0,
    discountPrice: Number(initialProduct.discountPrice) || 0,
    stockQuantity: Number(initialProduct.stockQuantity) || 0,
    categoryIds: initialProduct.categories?.map((c: any) => c.id) || [],
    subCategoryIds: initialProduct.subCategory?.id ? [initialProduct.subCategory.id] : [],
    skinToneIds: initialProduct.skinTones?.map((s: any) => s.id) || [],
    skinConcernIds: initialProduct.skinConcerns?.map((sc: any) => sc.id) || [],
  };
  
  const [product, setProduct] = useState(normalizedProduct);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    let finalValue: any = value;
    
    if (type === 'number') {
      const numValue = parseFloat(value);
      finalValue = isNaN(numValue) ? 0 : Math.round(numValue);
    } else if (type === 'checkbox') {
      finalValue = (e.target as HTMLInputElement).checked;
    }
    
    setProduct((prev: any) => ({ ...prev, [name]: finalValue }));
  };

  const handlePriceInputChange = (countryCode: string, rawValue: string) => {
    const cleanValue = rawValue.replace(/[^\d,.]/g, '');
    const commaCount = (cleanValue.match(/,/g) || []).length;
    const dotCount = (cleanValue.match(/\./g) || []).length;
    
    let allowedValue = cleanValue;
    if (commaCount > 1) {
      const lastComma = cleanValue.lastIndexOf(',');
      allowedValue = cleanValue.substring(0, lastComma) + cleanValue.substring(lastComma + 1).replace(/,/g, '');
    }
    if (dotCount > 1) {
      const lastDot = cleanValue.lastIndexOf('.');
      allowedValue = cleanValue.substring(0, lastDot) + cleanValue.substring(lastDot + 1).replace(/\./g, '');
    }
    if (commaCount === 1 && dotCount === 1) {
      const lastComma = cleanValue.lastIndexOf(',');
      const lastDot = cleanValue.lastIndexOf('.');
      if (lastComma > lastDot) {
        allowedValue = cleanValue.replace(/\./g, '');
      } else {
        allowedValue = cleanValue.replace(/,/g, '');
      }
    }
    
    const newPrices = product.countryPrices?.map((c: any) => {
      if (c.country === countryCode) {
        if (allowedValue === '') {
          return { ...c, price: 0 };
        }
        const parsed = parseCommaSeparatedPriceInput(allowedValue, c.currency || 'AED');
        return { ...c, price: parsed || 0 };
      }
      return c;
    }) || [];
    setProduct({ ...product, countryPrices: newPrices });
  };

  const handlePriceInputBlur = (countryCode: string, currency: string) => {
    const cp = product.countryPrices?.find((c: any) => c.country === countryCode);
    if (cp && cp.price > 0) {
      const formatted = formatPriceForAdmin(cp.price, currency || 'AED');
      const newPrices = product.countryPrices?.map((c: any) => {
        if (c.country === countryCode) {
          return { ...c, _displayValue: formatted };
        }
        return c;
      }) || [];
      setProduct({ ...product, countryPrices: newPrices });
    }
  };

  const handleBasePriceChange = (rawValue: string) => {
    const cleanValue = rawValue.replace(/[^\d,.]/g, '');
    const commaCount = (cleanValue.match(/,/g) || []).length;
    const dotCount = (cleanValue.match(/\./g) || []).length;
    
    let allowedValue = cleanValue;
    if (commaCount > 1) {
      const lastComma = cleanValue.lastIndexOf(',');
      allowedValue = cleanValue.substring(0, lastComma) + cleanValue.substring(lastComma + 1).replace(/,/g, '');
    }
    if (dotCount > 1) {
      const lastDot = cleanValue.lastIndexOf('.');
      allowedValue = cleanValue.substring(0, lastDot) + cleanValue.substring(lastDot + 1).replace(/\./g, '');
    }
    if (commaCount === 1 && dotCount === 1) {
      const lastComma = cleanValue.lastIndexOf(',');
      const lastDot = cleanValue.lastIndexOf('.');
      if (lastComma > lastDot) {
        allowedValue = cleanValue.replace(/\./g, '');
      } else {
        allowedValue = cleanValue.replace(/,/g, '');
      }
    }
    
    if (allowedValue === '') {
      setProduct({ ...product, price: 0 });
      return;
    }
    const parsed = parseCommaSeparatedPriceInput(allowedValue, product.currency || 'USD');
    setProduct({ ...product, price: parsed || 0 });
  };

  const handleBasePriceBlur = () => {
    if (product.price > 0) {
      const formatted = formatPriceForAdmin(product.price, product.currency || 'USD');
      setProduct({ ...product, _basePriceDisplay: formatted });
    }
  };

  const handleDiscountChange = (rawValue: string) => {
    const cleanValue = rawValue.replace(/[^\d,.]/g, '');
    const commaCount = (cleanValue.match(/,/g) || []).length;
    const dotCount = (cleanValue.match(/\./g) || []).length;
    
    let allowedValue = cleanValue;
    if (commaCount > 1) {
      const lastComma = cleanValue.lastIndexOf(',');
      allowedValue = cleanValue.substring(0, lastComma) + cleanValue.substring(lastComma + 1).replace(/,/g, '');
    }
    if (dotCount > 1) {
      const lastDot = cleanValue.lastIndexOf('.');
      allowedValue = cleanValue.substring(0, lastDot) + cleanValue.substring(lastDot + 1).replace(/\./g, '');
    }
    if (commaCount === 1 && dotCount === 1) {
      const lastComma = cleanValue.lastIndexOf(',');
      const lastDot = cleanValue.lastIndexOf('.');
      if (lastComma > lastDot) {
        allowedValue = cleanValue.replace(/\./g, '');
      } else {
        allowedValue = cleanValue.replace(/,/g, '');
      }
    }
    
    if (allowedValue === '') {
      setProduct({ ...product, discountPrice: 0 });
      return;
    }
    const parsed = parseCommaSeparatedPriceInput(allowedValue, product.currency || 'USD');
    setProduct({ ...product, discountPrice: parsed || 0 });
  };

  const handleDiscountBlur = () => {
    if (product.discountPrice > 0) {
      const formatted = formatPriceForAdmin(product.discountPrice, product.currency || 'USD');
      setProduct({ ...product, _discountDisplay: formatted });
    }
  };

  const handleCategoryToggle = (categoryId: string) => {
    setProduct((prev: any) => {
      const currentIds = prev.categoryIds || [];
      if (currentIds.includes(categoryId)) {
        return {
          ...prev,
          categoryIds: currentIds.filter((id: string) => id !== categoryId)
        };
      } else {
        return {
          ...prev,
          categoryIds: [...currentIds, categoryId]
        };
      }
    });
  };

  const handleSkinToneToggle = (skinToneId: string) => {
    setProduct((prev: any) => {
      const currentIds = prev.skinToneIds || [];
      if (currentIds.includes(skinToneId)) {
        return {
          ...prev,
          skinToneIds: currentIds.filter((id: string) => id !== skinToneId)
        };
      } else {
        return {
          ...prev,
          skinToneIds: [...currentIds, skinToneId]
        };
      }
    });
  };

  const handleSkinConcernToggle = (concernId: string) => {
    setProduct((prev: any) => {
      const currentIds = prev.skinConcernIds || [];
      if (currentIds.includes(concernId)) {
        return {
          ...prev,
          skinConcernIds: currentIds.filter((id: string) => id !== concernId)
        };
      } else {
        return {
          ...prev,
          skinConcernIds: [...currentIds, concernId]
        };
      }
    });
  };

  const handleSubCategoryToggle = (subCatId: string) => {
    setProduct((prev: any) => {
      const currentIds = prev.subCategoryIds || [];
      if (currentIds.includes(subCatId)) {
        return {
          ...prev,
          subCategoryIds: currentIds.filter((id: string) => id !== subCatId)
        };
      } else {
        return {
          ...prev,
          subCategoryIds: [...currentIds, subCatId]
        };
      }
    });
  };

  const handleSave = async () => {
    if (product.stockQuantity === 0) {
      toast.error('Stock cannot be 0. Please add stock quantity.');
      return;
    }
    
    const validCountryPrices = (product.countryPrices || []).filter((cp: any) => Number(cp.price) > 0);
    if (validCountryPrices.length === 0) {
      toast.error('At least one country price must be set. Product will not be visible without prices.');
      return;
    }
    
    setLoading(true);
    try {
      // Ensure all numeric values are proper numbers before sending
      const safeCountryPrices = (product.countryPrices || []).map((cp: any) => ({
        ...cp,
        price: typeof cp.price === 'number' ? cp.price : Number(cp.price) || 0,
      }));
      
      const payload = {
        name: product.name,
        sku: product.sku || null,
        description: product.description,
        shortDescription: product.shortDescription,
        benefits: product.benefits,
        ingredients: product.ingredients,
        howToUse: product.howToUse,
        price: typeof product.price === 'number' ? product.price : Number(product.price) || 0,
        discountPrice: typeof product.discountPrice === 'number' ? product.discountPrice : Number(product.discountPrice) || 0,
        stockQuantity: typeof product.stockQuantity === 'number' ? product.stockQuantity : Number(product.stockQuantity) || 0,
        active: product.active,
        mainImage: product.mainImage || '',
        images: product.images || [],
        brandName: product.brand?.name,
        categoryIds: product.categoryIds,
        skinToneIds: product.skinToneIds,
        skinConcernIds: product.skinConcernIds,
        subCategoryIds: product.subCategoryIds,
        subCategoryId: product.subCategoryIds?.[0] || null,
        tags: product.tags || [],
        countryPrices: safeCountryPrices,
      };
      console.log("Edit form payload:", JSON.stringify(payload, null, 2));
      
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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
        <div className="lg:col-span-2 space-y-8">
          {/* General Info */}
          <section className="glass-panel-heavy p-8 rounded-[2.5rem] border border-black/5 bg-white shadow-sm space-y-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-black/20 flex items-center gap-2">
              <Package size={14} /> General Info
            </h3>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-black/40 px-2">Product Name</label>
                  <input 
                    name="name"
                    value={product.name}
                    onChange={handleChange}
                    className="w-full bg-black/5 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-black outline-none transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-black/40 px-2">Brand</label>
                  <div className="w-full bg-black/5 border-none rounded-2xl px-5 py-4 text-sm font-bold">
                    {product.brand?.name || 'N/A'}
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-black/40 px-2">Description</label>
                <textarea 
                  name="description"
                  value={product.description || ''} 
                  onChange={handleChange}
                  rows={3}
                  className="w-full bg-black/5 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-black outline-none transition-all resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-black/40 px-2">Short Description</label>
                <textarea 
                  name="shortDescription"
                  value={product.shortDescription || ''} 
                  onChange={handleChange}
                  rows={2}
                  className="w-full bg-black/5 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-black outline-none transition-all resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-black/40 px-2">Benefits</label>
                <textarea 
                  name="benefits"
                  value={product.benefits || ''} 
                  onChange={handleChange}
                  rows={3}
                  className="w-full bg-black/5 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-black outline-none transition-all resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-black/40 px-2">Ingredients</label>
                <textarea 
                  name="ingredients"
                  value={product.ingredients || ''} 
                  onChange={handleChange}
                  rows={3}
                  className="w-full bg-black/5 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-black outline-none transition-all resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-black/40 px-2">How to Use</label>
                <textarea 
                  name="howToUse"
                  value={product.howToUse || ''} 
                  onChange={handleChange}
                  rows={3}
                  className="w-full bg-black/5 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-black outline-none transition-all resize-none"
                />
              </div>

              {/* Categories */}
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-black/40 px-2 mb-2">Categories</h4>
                <div className="bg-black/5 rounded-2xl p-3 max-h-40 overflow-y-auto">
                  <div className="flex flex-wrap gap-2">
                    {categories.map(cat => (
                      <label
                        key={cat.id}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl cursor-pointer transition-all ${
                          (product.categoryIds || []).includes(cat.id)
                            ? 'bg-black text-white'
                            : 'bg-white hover:bg-black/5'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={(product.categoryIds || []).includes(cat.id)}
                          onChange={() => handleCategoryToggle(cat.id)}
                          className="hidden"
                        />
                        <span className="text-sm font-medium">{cat.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sub-categories */}
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-black/40 px-2 mb-2">Sub-categories</h4>
                <div className="bg-black/5 rounded-2xl p-3 max-h-40 overflow-y-auto">
                  <div className="flex flex-wrap gap-2">
                    {subCategories.map((subCat) => (
                      <label
                        key={subCat.id}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl cursor-pointer transition-all ${
                          (product.subCategoryIds || []).includes(subCat.id)
                            ? 'bg-black text-white'
                            : 'bg-white hover:bg-black/5'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={(product.subCategoryIds || []).includes(subCat.id)}
                          onChange={() => handleSubCategoryToggle(subCat.id)}
                          className="hidden"
                        />
                        <span className="text-sm font-medium">{subCat.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Skin Tones */}
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-black/40 px-2 mb-2">Skin Tones</h4>
                <div className="bg-black/5 rounded-2xl p-3 max-h-40 overflow-y-auto">
                  <div className="flex flex-wrap gap-2">
                    {skinTones.map((tone) => (
                      <label
                        key={tone.id}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl cursor-pointer transition-all ${
                          (product.skinToneIds || []).includes(tone.id)
                            ? 'bg-black text-white'
                            : 'bg-white hover:bg-black/5'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={(product.skinToneIds || []).includes(tone.id)}
                          onChange={() => handleSkinToneToggle(tone.id)}
                          className="hidden"
                        />
                        {tone.hexColor && (
                          <div
                            className="w-4 h-4 rounded-full border border-white/20"
                            style={{ backgroundColor: tone.hexColor }}
                          />
                        )}
                        <span className="text-sm font-medium">{tone.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Skin Concerns */}
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-black/40 px-2 mb-2">Skin Concerns</h4>
                <div className="bg-black/5 rounded-2xl p-3 max-h-40 overflow-y-auto">
                  <div className="flex flex-wrap gap-2">
                    {skinConcerns.map((concern) => (
                      <label
                        key={concern.id}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl cursor-pointer transition-all ${
                          (product.skinConcernIds || []).includes(concern.id)
                            ? 'bg-black text-white'
                            : 'bg-white hover:bg-black/5'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={(product.skinConcernIds || []).includes(concern.id)}
                          onChange={() => handleSkinConcernToggle(concern.id)}
                          className="hidden"
                        />
                        <span className="text-sm font-medium">{concern.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Country-Specific Pricing */}
          <section className="glass-panel-heavy p-8 rounded-[2.5rem] border border-black/5 bg-white shadow-sm space-y-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-black/20 flex items-center gap-2">
              <Globe size={14} /> Country-Specific Pricing
            </h3>
            
            <div className="space-y-4">
              <div className="mb-4 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                <p className="text-xs text-blue-700">
                  <strong>Enter prices as simple numbers:</strong> Just type the price (e.g., 56 for 56 AED, 10 for 10 KWD).
                  That's it - no decimals needed!
                </p>
              </div>

              <div className="space-y-3">
                {['AE', 'SA', 'KW', 'BH', 'OM', 'QA'].map((countryCode) => {
                  const cp = product.countryPrices?.find((c: any) => c.country === countryCode);
                  const displayValue = cp?._displayValue || (cp?.price ? formatPriceForAdmin(cp.price, cp.currency || 'AED') : '');
                  return (
                    <div key={countryCode} className="grid grid-cols-12 gap-3 items-center p-4 bg-black/5 rounded-2xl border border-black/10">
                      <div className="col-span-4 space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-black/40">Country & Currency</label>
                        <div className="text-sm font-bold flex items-center gap-2">
                          {countryCode}
                          <span className="text-xs text-black/40">({cp?.currency || 'AED'})</span>
                        </div>
                      </div>
                      <div className="col-span-5 space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-black/40">Price</label>
                        <input
                          type="text"
                          placeholder="0"
                          value={displayValue}
                          onChange={(e) => handlePriceInputChange(countryCode, e.target.value)}
                          onBlur={() => handlePriceInputBlur(countryCode, cp?.currency || 'AED')}
                          className="w-full bg-white border-none rounded-xl px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-black outline-none"
                        />
                      </div>
                      <div className="col-span-3 flex justify-end">
                        <div className={`w-3 h-3 rounded-full ${cp?.price && Number(cp.price) > 0 ? 'bg-green-500' : 'bg-gray-300'}`}
                             title={cp?.price && Number(cp.price) > 0 ? 'Price set' : 'No price set'}>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Stock & SKU */}
          <section className="glass-panel-heavy p-8 rounded-[2.5rem] border border-black/5 bg-white shadow-sm space-y-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-black/20 flex items-center gap-2">
              <Box size={14} /> Stock & SKU
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-black/40 px-2">Stock Quantity</label>
                <div className="relative">
                  <input
                    name="stockQuantity"
                    type="number"
                    value={product.stockQuantity || 0}
                    onChange={handleChange}
                    className="w-full bg-black/5 border-none rounded-2xl px-5 py-4 text-sm font-bold"
                  />
                  <Package className="absolute right-5 top-1/2 -translate-y-1/2 text-black/20" size={16} />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-black/40 px-2">SKU</label>
                <div className="relative">
                  <input
                    name="sku"
                    value={product.sku || ''}
                    onChange={handleChange}
                    placeholder="e.g. LDS-001-BLK"
                    className="w-full bg-black/5 border-none rounded-2xl px-5 py-4 text-sm font-bold"
                  />
                  <Hash className="absolute right-5 top-1/2 -translate-y-1/2 text-black/20" size={16} />
                </div>
              </div>
            </div>
          </section>

          {/* SEO Tags */}
          <section className="glass-panel-heavy p-8 rounded-[2.5rem] border border-black/5 bg-white shadow-sm space-y-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-black/20 flex items-center gap-2">
              <Search size={14} /> SEO Tags
            </h3>
            
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-black/40 px-2">Tags (Press Enter to add)</label>
                <div className="relative">
                  <input
                    placeholder="Type a tag and press Enter"
                    className="w-full bg-black/5 border-none rounded-2xl px-5 py-4 text-sm font-bold"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const input = e.target as HTMLInputElement;
                        const tag = input.value.trim();
                        if (tag && !(product.tags || []).includes(tag)) {
                          setProduct({ ...product, tags: [...(product.tags || []), tag] });
                          input.value = '';
                        }
                      }
                    }}
                  />
                  <Tag className="absolute right-5 top-1/2 -translate-y-1/2 text-black/20" size={16} />
                </div>
              </div>

              {(product.tags || []).length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {product.tags.map((tag: string, idx: number) => (
                    <span 
                      key={idx} 
                      className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-full text-xs font-bold"
                    >
                      {tag}
                      <button 
                        type="button"
                        onClick={() => setProduct({ ...product, tags: product.tags.filter((_: any, i: number) => i !== idx) })}
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </section>
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
                            fd.append('folder', 'ecommerce/products');
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
                            fd.append('folder', 'ecommerce/products');
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
