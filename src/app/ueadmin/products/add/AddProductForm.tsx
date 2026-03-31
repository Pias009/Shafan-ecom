"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Save, Loader2, ArrowLeft, Image as ImageIcon, Tag, Hash, Package, TrendingUp, X, Store, Globe, Plus, Trash2, Layers } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { SUPPORTED_COUNTRIES, getCurrencyForCountry, type CountryCode } from '@/lib/countries';
import { autoCompleteCountryPrices } from '@/lib/country-pricing';

interface AddProductFormProps {
  brands: { name: string }[];
  categories: {
    id: string;
    name: string;
    subCategories: { id: string; name: string }[];
  }[];
  subCategories: {
    id: string;
    name: string;
    categoryId: string;
    category: { name: string };
  }[];
  skinTones: {
    id: string;
    name: string;
    hexColor: string | null;
  }[];
  skinConcerns: {
    id: string;
    name: string;
    description: string | null;
  }[];
  adminStoreCode: string | null;
  isSuperAdmin: boolean;
}

export function AddProductForm({
  brands,
  categories,
  subCategories,
  skinTones,
  skinConcerns,
  adminStoreCode,
  isSuperAdmin
}: AddProductFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Determine initial storeId based on admin's access
  // For SUPERADMIN: default to GLOBAL, for regular admin: use their store
  const initialStoreId = isSuperAdmin ? 'GLOBAL' : (adminStoreCode || '');

  const [loading, setLoading] = useState(false);
  
  // Initialize country prices - only Kuwait for Kuwait admins, all countries for super admin
  const initialCountryPrices = adminStoreCode === 'KUW'
    ? [{
        country: 'KUW' as CountryCode,
        priceCents: 0,
        currency: 'KWD',
        active: true
      }]
    : SUPPORTED_COUNTRIES.map(country => ({
        country: country.code as CountryCode,
        priceCents: 0,
        currency: country.currency,
        active: true
      }));

  const [formData, setFormData] = useState({
    name: '',
    brandName: brands[0]?.name || '',
    categoryIds: [] as string[],
    subCategoryId: '',
    skinToneIds: [] as string[],
    skinConcernIds: [] as string[],
    description: '',
    shortDescription: '',
    benefits: '',
    ingredients: '',
    howToUse: '',
    features: [] as string[],
    priceCents: 0, // Base price 0
    discountCents: 0,
    stockQuantity: 0,
    mainImage: '',
    images: [] as string[],
    hot: false,
    trending: false,
    storeId: initialStoreId, // Set based on admin's access
    countryPrices: initialCountryPrices,
    subCategoryIds: [] as string[],
  });

  // Filter sub-categories based on selected categories (first category) - now showing all
  const filteredSubCategories = subCategories;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else if (type === 'number') {
      // Convert to number, but handle empty string as 0
      const numValue = value === '' ? 0 : Number(value);
      setFormData(prev => ({
        ...prev,
        [name]: isNaN(numValue) ? 0 : numValue
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleCategoryToggle = (categoryId: string) => {
    setFormData(prev => {
      const currentIds = prev.categoryIds;
      if (currentIds.includes(categoryId)) {
        return {
          ...prev,
          categoryIds: currentIds.filter(id => id !== categoryId),
          subCategoryId: '' // Reset sub-category when categories change
        };
      } else {
        return {
          ...prev,
          categoryIds: [...currentIds, categoryId],
          subCategoryId: '' // Reset sub-category when categories change
        };
      }
    });
  };

  const handleSkinToneToggle = (skinToneId: string) => {
    setFormData(prev => {
      const currentIds = prev.skinToneIds;
      if (currentIds.includes(skinToneId)) {
        return {
          ...prev,
          skinToneIds: currentIds.filter(id => id !== skinToneId)
        };
      } else {
        return {
          ...prev,
          skinToneIds: [...currentIds, skinToneId]
        };
      }
    });
  };

  const handleSubCategoryToggle = (subCategoryId: string) => {
    setFormData(prev => {
      const currentIds = prev.subCategoryIds;
      if (currentIds.includes(subCategoryId)) {
        return {
          ...prev,
          subCategoryIds: currentIds.filter(id => id !== subCategoryId),
          subCategoryId: currentIds.includes(subCategoryId) && currentIds.length === 1 ? '' : prev.subCategoryId
        };
      } else {
        return {
          ...prev,
          subCategoryIds: [...currentIds, subCategoryId],
          subCategoryId: subCategoryId
        };
      }
    });
  };

  const handleSkinConcernToggle = (concernId: string) => {
    setFormData(prev => {
      const currentIds = prev.skinConcernIds;
      if (currentIds.includes(concernId)) {
        return {
          ...prev,
          skinConcernIds: currentIds.filter(id => id !== concernId)
        };
      } else {
        return {
          ...prev,
          skinConcernIds: [...currentIds, concernId]
        };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Client-side validation - price can be 0 or any positive value
    // Check discount doesn't exceed price
    
    // Check discount doesn't exceed price
    if (formData.discountCents > formData.priceCents) {
      toast.error('Discount cannot exceed product price');
      return;
    }
    
    setLoading(true);

    try {
      // Prepare country prices data with auto-completed currencies
      const countryPrices = formData.countryPrices.map(cp => ({
        country: cp.country,
        priceCents: cp.priceCents,
        currency: cp.currency,
        active: cp.active
      }));

      const payload = {
        name: formData.name,
        description: formData.description,
        shortDescription: formData.shortDescription,
        benefits: formData.benefits,
        ingredients: formData.ingredients,
        howToUse: formData.howToUse,
        priceCents: formData.priceCents,
        discountCents: formData.discountCents,
        stockQuantity: formData.stockQuantity,
        brandName: formData.brandName,
        categoryIds: formData.categoryIds,
        skinToneIds: formData.skinToneIds,
        skinConcernIds: formData.skinConcernIds,
        subCategoryId: formData.subCategoryIds[0] || null,
        hot: formData.hot,
        trending: formData.trending,
        storeId: formData.storeId,
        countryPrices,
        mainImage: formData.mainImage,
        images: formData.images,
        features: formData.features,
      };

      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success('Product created successfully with country pricing!');
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

      <form id="product-form" onSubmit={handleSubmit} className="space-y-8">
        {/* General Information */}
        <section className="glass-panel-heavy p-8 rounded-[2.5rem] border border-black/5 bg-white shadow-sm space-y-6">
          <h3 className="text-sm font-black uppercase tracking-widest text-black/20 flex items-center gap-2">
            <Package size={14} /> General Info
          </h3>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-black/40 px-2">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                placeholder="Tell customers about this product..."
                className="w-full bg-black/5 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-black outline-none transition-all resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-black/40 px-2">Short Description</label>
              <textarea
                name="shortDescription"
                value={formData.shortDescription}
                onChange={handleChange}
                rows={2}
                placeholder="Brief overview of the product..."
                className="w-full bg-black/5 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-black outline-none transition-all resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-black/40 px-2">Benefits</label>
              <textarea
                name="benefits"
                value={formData.benefits}
                onChange={handleChange}
                rows={3}
                placeholder="Key benefits of the product..."
                className="w-full bg-black/5 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-black outline-none transition-all resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-black/40 px-2">Ingredients</label>
              <textarea
                name="ingredients"
                value={formData.ingredients}
                onChange={handleChange}
                rows={3}
                placeholder="List of ingredients..."
                className="w-full bg-black/5 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-black outline-none transition-all resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-black/40 px-2">How to Use</label>
              <textarea
                name="howToUse"
                value={formData.howToUse}
                onChange={handleChange}
                rows={3}
                placeholder="Instructions on how to use the product..."
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
                        formData.categoryIds.includes(cat.id)
                          ? 'bg-black text-white'
                          : 'bg-white hover:bg-black/5'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.categoryIds.includes(cat.id)}
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
                        formData.subCategoryIds.includes(subCat.id)
                          ? 'bg-black text-white'
                          : 'bg-white hover:bg-black/5'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.subCategoryIds.includes(subCat.id)}
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
                        formData.skinToneIds.includes(tone.id)
                          ? 'bg-black text-white'
                          : 'bg-white hover:bg-black/5'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.skinToneIds.includes(tone.id)}
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
                        formData.skinConcernIds.includes(concern.id)
                          ? 'bg-black text-white'
                          : 'bg-white hover:bg-black/5'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.skinConcernIds.includes(concern.id)}
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
            <Globe size={14} /> {adminStoreCode === 'KUW' ? 'Kuwait Pricing' : 'Country-Specific Pricing (All 6 Countries)'}
          </h3>
            
            <div className="space-y-4">
              <div className="mb-4">
                <p className="text-xs font-bold text-black/60">
                  {adminStoreCode === 'KUW'
                    ? 'Set the price for Kuwait market in KWD'
                    : 'Define prices for all supported countries in regular currency'}
                </p>
                <p className="text-[10px] text-black/40 mt-1">Enter whole numbers only (e.g., 10 for 10 KWD)</p>
              </div>

              <div className="space-y-3">
                {formData.countryPrices.map((cp, index) => {
                  const countryConfig = SUPPORTED_COUNTRIES.find(c => c.code === cp.country);
                  return (
                    <div key={cp.country} className="grid grid-cols-12 gap-3 items-center p-4 bg-black/5 rounded-2xl border border-black/10">
                      <div className="col-span-3 space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-black/40 px-2">Country</label>
                        <div className="w-full bg-white border-none rounded-xl px-3 py-2 text-sm font-bold">
                          <div className="flex items-center justify-between">
                            <span className="font-bold">{countryConfig?.name}</span>
                            <span className="text-[10px] bg-black/10 px-2 py-1 rounded-full font-black">
                              {cp.country}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="col-span-6 space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-black/40 px-2">Price (KWD)</label>
                        <input
                          type="number"
                          step="1"
                          value={cp.priceCents === 0 ? '' : (cp.priceCents / 100)}
                          onChange={(e) => {
                            const newPrices = [...formData.countryPrices];
                            const numValue = parseFloat(e.target.value);
                            newPrices[index].priceCents = isNaN(numValue) ? 0 : Math.round(numValue * 100);
                            setFormData(prev => ({ ...prev, countryPrices: newPrices }));
                          }}
                          className="w-full bg-white border-none rounded-xl px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-black outline-none"
                          min="0"
                        />
                        <p className="text-[8px] text-black/20 px-2">Enter whole number price (e.g., 10 for 10 KWD)</p>
                      </div>
                      <div className="col-span-3 space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-black/40 px-2">Currency</label>
                        <div className="w-full bg-white border-none rounded-xl px-3 py-2 text-sm font-bold flex items-center justify-between">
                          <span>{cp.currency}</span>
                          <span className="text-[10px] text-black/40">{countryConfig?.currencySymbol}</span>
                        </div>
                      </div>
                      <div className="col-span-3 flex justify-center items-center">
                        <div className={`w-3 h-3 rounded-full ${cp.priceCents > 0 ? 'bg-green-500' : 'bg-gray-300'}`}
                             title={cp.priceCents > 0 ? 'Price set' : 'No price set'}>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {adminStoreCode === 'KUW' ? (
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <p className="text-xs text-emerald-700">
                    <strong>Kuwait Market:</strong> Products added here will only be visible to Kuwait customers.
                    Set the price in Kuwaiti Dinar (KWD). Other countries cannot access these products.
                  </p>
                </div>
              ) : (
                <>
                  <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                    <p className="text-xs text-blue-700">
                      <strong>System Configuration:</strong> All 6 countries are required. Prices are in whole numbers only (e.g., 10 for $10).
                      Currencies are automatically detected based on country (AED for UAE, SAR for Saudi Arabia, etc.).
                      Products will only be visible to users in countries where a price is set.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="p-3 bg-green-50 rounded-xl border border-green-100">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span className="font-bold text-green-700">Price Set</span>
                      </div>
                      <p className="text-green-600 mt-1">Country has a specific price configured</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                        <span className="font-bold text-gray-700">No Price Set</span>
                      </div>
                      <p className="text-gray-600 mt-1">Product will not be visible in this country</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </section>

          {/* Store Availability */}
          <section className="glass-panel-heavy p-8 rounded-[2.5rem] border border-black/5 bg-white shadow-sm space-y-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-black/20 flex items-center gap-2">
              <Store size={14} /> Store Availability
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-black/40 px-2">Primary Store</label>
                <select
                  name="storeId"
                  value={formData.storeId}
                  onChange={handleChange}
                  className="w-full bg-black/5 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-black outline-none appearance-none cursor-pointer"
                >
                  <option value="GLOBAL">Global Store</option>
                  <option value="KUW">Kuwait Store</option>
                </select>
              </div>
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-3">
                 <div className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">
                    Note: Product will be added to this store&apos;s active inventory immediately.
                  </div>
              </div>
            </div>
          </section>

          {/* Media Assets */}
          <section className="glass-panel-heavy p-8 rounded-[2.5rem] border border-black/5 bg-white shadow-sm space-y-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-black/20 flex items-center gap-2">
              <ImageIcon size={14} /> Media Assets
            </h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Main Image */}
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-black/40 px-2">Main Image</label>
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

              {/* Gallery */}
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-black/40 px-2">Gallery</label>
                <div className="grid grid-cols-3 gap-3">
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
                    <span className="text-[8px] font-black uppercase tracking-widest text-black/40">Add</span>
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
                          toast.error('Gallery upload failed', { id: tid });
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
        </form>
      </div>
    );
  }
