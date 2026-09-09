"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Save, Loader2, ArrowLeft, Image as ImageIcon, Tag, Hash, Package, TrendingUp, X, Store, Globe, Plus, Trash2, Layers, Search, Box, Scale, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { autoCompleteCountryPrices } from '@/lib/country-pricing';
import { parseCommaSeparatedPriceInput, formatPriceForAdmin } from '@/lib/money';
import { RichTextEditor } from '@/components/RichTextEditor';
import {
  OFFICIAL_BRANDS,
  OFFICIAL_CATEGORIES,
  OFFICIAL_SUBCATEGORIES,
  OFFICIAL_SKIN_TYPES,
  OFFICIAL_SKIN_CONCERNS,
} from '@/lib/product-taxonomy';

const SUPPORTED_COUNTRIES = ['AE', 'SA', 'KW', 'QA', 'BH', 'OM'];
const COUNTRY_CODES = SUPPORTED_COUNTRIES;
const CURRENCY_MAP: Record<string, string> = {
  'AE': 'AED',
  'KW': 'KWD',
  'BH': 'BHD',
  'SA': 'SAR',
  'OM': 'OMR',
  'QA': 'QAR'
};
const COUNTRY_NAMES: Record<string, string> = {
  'AE': 'United Arab Emirates',
  'KW': 'Kuwait',
  'BH': 'Bahrain',
  'SA': 'Saudi Arabia',
  'OM': 'Oman',
  'QA': 'Qatar'
};
const COUNTRY_FLAGS: Record<string, string> = {
  'AE': '🇦🇪',
  'KW': '🇰🇼',
  'BH': '🇧🇭',
  'SA': '🇸🇦',
  'OM': '🇴🇲',
  'QA': '🇶🇦'
};

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
  const initialStoreId = isSuperAdmin ? 'GLOBAL' : (adminStoreCode || '');

  const [loading, setLoading] = useState(false);
  const [activeDescTab, setActiveDescTab] = useState<'short' | 'benefits' | 'ingredients' | 'howToUse'>('short');
  
  // Initialize country prices for all supported countries
  const initialCountryPrices = COUNTRY_CODES.map(code => ({
      country: code,
      price: 0,
      currency: CURRENCY_MAP[code] || 'AED',
      active: true,
      _displayValue: ''
    }));

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    sku: '',
    brandName: brands[0]?.name || OFFICIAL_BRANDS[0] || '',
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
    price: 0, // Base price
    discountPrice: 0,
    stockQuantity: 20,
    dubaiStock: 10,
    kuwaitStock: 10,
    mainImage: '',
    images: [] as string[],
    hot: false,
    trending: false,
    clearanceSale: false,
    promotion: false,
    storeId: initialStoreId,
    countryPrices: initialCountryPrices,
    subCategoryIds: [] as string[],
    tags: [] as string[],
    weight: 0,
    weightUnit: 'kg',
  });

  const [showAddBrand, setShowAddBrand] = useState(false);
  const [newBrandName, setNewBrandName] = useState("");
  
  // Merge official brands with props brands, deduplicating
  const mergedBrands = Array.from(
    new Set([...OFFICIAL_BRANDS, ...brands.map(b => b.name)])
  ).map(name => ({ name }));
  
  const [availableBrands, setAvailableBrands] = useState(mergedBrands);

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

  const handleAddBrand = async () => {
    if (!newBrandName.trim()) return;
    
    setLoading(true);
    try {
      const res = await fetch('/api/admin/brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newBrandName.trim() })
      });
      
      if (res.ok) {
        const createdBrand = await res.json();
        toast.success(`Brand "${createdBrand.name}" created!`);
        setAvailableBrands((prev: any[]) => [...prev, createdBrand].sort((a, b) => a.name.localeCompare(b.name)));
        setFormData((prev: any) => ({ ...prev, brandName: createdBrand.name }));
        setNewBrandName("");
        setShowAddBrand(false);
      } else {
        const err = await res.json();
        toast.error(err.error || 'Failed to create brand');
      }
    } catch (error) {
      toast.error('Error creating brand');
    } finally {
      setLoading(false);
    }
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
    
    if (!formData.name.trim()) {
      toast.error('Product name is required');
      return;
    }
    
    if (!formData.sku.trim()) {
      toast.error('SKU is required. Please add a stock keeping unit.');
      return;
    }
    
    const validCountryPrices = formData.countryPrices.filter(cp => cp.price > 0);
    if (validCountryPrices.length === 0) {
      toast.error('At least one country price must be set. Product will not be visible without prices.');
      return;
    }
    
    if (formData.discountPrice > formData.price) {
      toast.error('Discount cannot exceed product price');
      return;
    }
    
    setLoading(true);

    try {
      // Prepare country prices data with auto-completed currencies
      const countryPrices = formData.countryPrices.map(cp => ({
        country: cp.country,
        price: cp.price,
        currency: cp.currency,
        active: cp.active
      }));

      const payload = {
        name: formData.name,
        slug: formData.slug || undefined,
        sku: formData.sku || undefined,
        description: formData.description || undefined,
        shortDescription: formData.shortDescription || formData.description || undefined,
        benefits: formData.benefits,
        ingredients: formData.ingredients,
        howToUse: formData.howToUse,
        price: formData.price,
        discountPrice: formData.discountPrice,
        stockQuantity: (Number(formData.dubaiStock) || 0) + (Number(formData.kuwaitStock) || 0),
        dubaiStock: Number(formData.dubaiStock) || 0,
        kuwaitStock: Number(formData.kuwaitStock) || 0,
        brandName: formData.brandName,
        categoryIds: formData.categoryIds,
        skinToneIds: formData.skinToneIds,
        skinConcernIds: formData.skinConcernIds,
        subCategoryId: formData.subCategoryId || formData.subCategoryIds[0] || null,
        hot: formData.hot,
        trending: formData.trending,
        clearanceSale: formData.clearanceSale,
        promotion: formData.promotion,
        storeId: formData.storeId,
        countryPrices,
        mainImage: formData.mainImage,
        images: formData.images,
        features: formData.features,
        tags: formData.tags,
        weight: formData.weight,
        weightUnit: formData.weightUnit,
      };

      console.log("Submitting payload:", JSON.stringify(payload, null, 2));

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
            <p className="text-xs font-bold text-black/60 uppercase tracking-widest mt-1">Add to store inventory</p>
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
          <h3 className="text-sm font-black uppercase tracking-widest text-black/50 flex items-center gap-2">
            <Package size={14} /> General Info
          </h3>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-black/70 px-2">Product Name</label>
                <input
                  required
                  name="name"
                  value={formData.name}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData(prev => ({
                      ...prev,
                      name: val,
                      slug: prev.slug || val.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').substring(0, 100)
                    }));
                  }}
                  placeholder="e.g. Lavender Dew Serum"
                  className="w-full bg-black/5 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-black outline-none transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-black/70 px-2">URL Slug</label>
                <input
                  name="slug"
                  value={formData.slug}
                  onChange={handleChange}
                  placeholder="auto-generated from name"
                  className="w-full bg-black/5 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-black outline-none transition-all font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-black/70 px-2">Brand</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <select
                      name="brandName"
                      value={formData.brandName}
                      onChange={handleChange}
                      className="w-full bg-black/5 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-black outline-none appearance-none cursor-pointer"
                    >
                      <option value="">Select Brand</option>
                      {availableBrands.map(b => (
                        <option key={b.name} value={b.name}>{b.name}</option>
                      ))}
                    </select>
                    <Tag className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-black/50" size={16} />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddBrand(!showAddBrand)}
                    className="p-4 bg-black/5 rounded-2xl hover:bg-black hover:text-white transition-all text-black/40"
                    title="Add New Brand"
                  >
                    <Plus size={20} />
                  </button>
                </div>

                {showAddBrand && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }} 
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-3 p-4 bg-black/5 rounded-2xl border border-dashed border-black/10 flex gap-2 items-center"
                  >
                    <input
                      type="text"
                      placeholder="New brand name..."
                      value={newBrandName}
                      onChange={(e) => setNewBrandName(e.target.value)}
                      className="flex-1 bg-white border-none rounded-xl px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-black outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAddBrand}
                      className="px-4 py-2 bg-black text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all"
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddBrand(false)}
                      className="p-2 text-black/30 hover:text-red-500 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </motion.div>
                )}
              </div>
            </div>

            {/* 4 Description Tabs (Page 10 Feedback) */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black uppercase tracking-widest text-black/70 px-2">
                  Product Details & Description Tabs
                </label>
                <span className="text-[10px] text-black/40 font-bold uppercase tracking-wider">4 Sections Available</span>
              </div>

              {/* Tab Navigation */}
              <div className="flex p-1 bg-black/5 rounded-2xl gap-1 overflow-x-auto">
                {[
                  { id: 'short', label: 'Short Description', filled: !!formData.description },
                  { id: 'benefits', label: 'Benefits', filled: !!formData.benefits },
                  { id: 'ingredients', label: 'Ingredients', filled: !!formData.ingredients },
                  { id: 'howToUse', label: 'How to Use', filled: !!formData.howToUse },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveDescTab(tab.id as any)}
                    className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap ${
                      activeDescTab === tab.id
                        ? 'bg-black text-white shadow-md'
                        : 'text-black/60 hover:text-black hover:bg-black/5'
                    }`}
                  >
                    <span>{tab.label}</span>
                    {tab.filled && (
                      <span className={`w-1.5 h-1.5 rounded-full ${activeDescTab === tab.id ? 'bg-emerald-400' : 'bg-emerald-600'}`} />
                    )}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              {activeDescTab === 'short' && (
                <div className="space-y-1.5 animate-fadeIn">
                  <RichTextEditor
                    name="description"
                    value={formData.description}
                    onChange={(value) => setFormData({ ...formData, description: value, shortDescription: value })}
                    placeholder="Short product overview and description... (Use toolbar for formatting)"
                    label="Short Description / Overview"
                    rows={6}
                  />
                </div>
              )}

              {activeDescTab === 'benefits' && (
                <div className="space-y-1.5 animate-fadeIn">
                  <RichTextEditor
                    name="benefits"
                    value={formData.benefits}
                    onChange={(value) => setFormData({ ...formData, benefits: value })}
                    placeholder="Key benefits and proven results of the product..."
                    label="Product Benefits"
                    rows={6}
                  />
                </div>
              )}

              {activeDescTab === 'ingredients' && (
                <div className="space-y-1.5 animate-fadeIn">
                  <RichTextEditor
                    name="ingredients"
                    value={formData.ingredients}
                    onChange={(value) => setFormData({ ...formData, ingredients: value })}
                    placeholder="Key ingredients (e.g., Niacinamide, Centella Asiatica, Hyaluronic Acid)..."
                    label="Ingredients & Formulation"
                    rows={6}
                  />
                </div>
              )}

              {activeDescTab === 'howToUse' && (
                <div className="space-y-1.5 animate-fadeIn">
                  <RichTextEditor
                    name="howToUse"
                    value={formData.howToUse}
                    onChange={(value) => setFormData({ ...formData, howToUse: value })}
                    placeholder="Step-by-step application instructions..."
                    label="How to Use"
                    rows={6}
                  />
                </div>
              )}
            </div>

            {/* Taxonomy Dropdowns (Page 10 Feedback: Category, Sub Category, Skin Type, Skin Concern) */}
            <div className="pt-4 border-t border-black/5 space-y-6">
              <h4 className="text-xs font-black uppercase tracking-widest text-black/40">Taxonomy & Categorization</h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Category Dropdown */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-black/70 px-2">Category *</label>
                  <div className="relative">
                    <select
                      value={formData.categoryIds[0] || ''}
                      onChange={(e) => {
                        const selectedId = e.target.value;
                        setFormData(prev => ({
                          ...prev,
                          categoryIds: selectedId ? [selectedId] : []
                        }));
                      }}
                      className="w-full bg-black/5 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-black outline-none appearance-none cursor-pointer"
                    >
                      <option value="">Select Category</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-black/40" size={16} />
                  </div>
                </div>

                {/* Sub-Category Dropdown */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-black/70 px-2">Sub-Category *</label>
                  <div className="relative">
                    <select
                      value={formData.subCategoryId || formData.subCategoryIds[0] || ''}
                      onChange={(e) => {
                        const selectedId = e.target.value;
                        setFormData(prev => ({
                          ...prev,
                          subCategoryId: selectedId,
                          subCategoryIds: selectedId ? [selectedId] : []
                        }));
                      }}
                      className="w-full bg-black/5 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-black outline-none appearance-none cursor-pointer"
                    >
                      <option value="">Select Sub-Category</option>
                      {subCategories.map((subCat) => (
                        <option key={subCat.id} value={subCat.id}>
                          {subCat.name} {subCat.category?.name ? `(${subCat.category.name})` : ''}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-black/40" size={16} />
                  </div>
                </div>

                {/* Skin Type Dropdown */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-black/70 px-2">Skin Type *</label>
                  <div className="relative">
                    <select
                      value={formData.skinToneIds[0] || ''}
                      onChange={(e) => {
                        const selectedId = e.target.value;
                        setFormData(prev => ({
                          ...prev,
                          skinToneIds: selectedId ? [selectedId] : []
                        }));
                      }}
                      className="w-full bg-black/5 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-black outline-none appearance-none cursor-pointer"
                    >
                      <option value="">Select Skin Type</option>
                      {skinTones.map((tone) => (
                        <option key={tone.id} value={tone.id}>{tone.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-black/40" size={16} />
                  </div>
                </div>

                {/* Skin Concern Dropdown */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-black/70 px-2">Skin Concern *</label>
                  <div className="relative">
                    <select
                      value={formData.skinConcernIds[0] || ''}
                      onChange={(e) => {
                        const selectedId = e.target.value;
                        setFormData(prev => ({
                          ...prev,
                          skinConcernIds: selectedId ? [selectedId] : []
                        }));
                      }}
                      className="w-full bg-black/5 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-black outline-none appearance-none cursor-pointer"
                    >
                      <option value="">Select Skin Concern</option>
                      {skinConcerns.map((concern) => (
                        <option key={concern.id} value={concern.id}>{concern.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-black/40" size={16} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Country-Specific Pricing */}
        <section className="glass-panel-heavy p-8 rounded-[2.5rem] border border-black/5 bg-white shadow-sm space-y-6">
          <h3 className="text-sm font-black uppercase tracking-widest text-black/50 flex items-center gap-2">
            <Globe size={14} /> Country-Specific Pricing (All 6 Countries)
          </h3>
            
          <div className="space-y-4">
            <div className="mb-4 p-4 bg-blue-50 rounded-2xl border border-blue-100">
              <p className="text-xs text-blue-700">
                <strong>Enter prices with decimals:</strong> Type "56" → becomes "56,00" on blur.
                Type "56,5" → becomes "56,50". Type "56,25" → stays "56,25".
              </p>
            </div>

            <div className="space-y-3">
                {(formData.countryPrices || []).map((cp: any, index: number) => {
                  const countryName = COUNTRY_NAMES[cp.country] || cp.country;
                  return (
                    <div key={cp.country} className="grid grid-cols-12 gap-3 items-center p-4 bg-black/5 rounded-2xl border border-black/10">
                      <div className="col-span-3 space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-black/70 px-2">Country</label>
                        <div className="w-full bg-white border-none rounded-xl px-3 py-2 text-sm font-bold">
                          <div className="flex items-center justify-between">
                            <span className="font-bold">{countryName}</span>
                            <span className="text-[10px] bg-black/10 px-2 py-1 rounded-full font-black">
                              {cp.country}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="col-span-6 space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-black/70 px-2">Price ({cp.currency})</label>
                        <input
                          type="text"
                          placeholder="0"
                          value={cp._displayValue ?? ''}
                          onChange={(e) => {
                            const rawValue = e.target.value;
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
                              const lastComma = allowedValue.lastIndexOf(',');
                              const lastDot = allowedValue.lastIndexOf('.');
                              if (lastComma > lastDot) {
                                allowedValue = allowedValue.replace(/\./g, '');
                              } else {
                                allowedValue = allowedValue.replace(/,/g, '');
                              }
                            }
                            
                            const newPrices = [...formData.countryPrices];
                            if (allowedValue === '') {
                              newPrices[index].price = 0;
                              newPrices[index]._displayValue = '';
                            } else {
                              const parsed = parseCommaSeparatedPriceInput(allowedValue, cp.currency);
                              newPrices[index].price = parsed || 0;
                              newPrices[index]._displayValue = allowedValue;
                            }
                            setFormData(prev => ({ ...prev, countryPrices: newPrices }));
                          }}
                          onBlur={() => {
                            const cp = formData.countryPrices[index];
                            if (cp && cp.price > 0) {
                              const formatted = formatPriceForAdmin(cp.price, cp.currency);
                              const newPrices = [...formData.countryPrices];
                              newPrices[index]._displayValue = formatted;
                              setFormData(prev => ({ ...prev, countryPrices: newPrices }));
                            } else if (cp && cp.price === 0) {
                              const newPrices = [...formData.countryPrices];
                              newPrices[index]._displayValue = '';
                              setFormData(prev => ({ ...prev, countryPrices: newPrices }));
                            }
                          }}
                          className="w-full bg-white border-none rounded-xl px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-black outline-none"
                        />
                        <p className="text-[8px] text-black/50 px-2">Example: type "56" or "56,5" for 56.50</p>
                      </div>
                      <div className="col-span-3 space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-black/70 px-2">Currency</label>
                        <div className="w-full bg-white border-none rounded-xl px-3 py-2 text-sm font-bold flex items-center justify-between">
                          <span>{cp.currency}</span>
                        </div>
                      </div>
                      <div className="col-span-3 flex justify-center items-center">
                        <div className={`w-3 h-3 rounded-full ${cp.price > 0 ? 'bg-green-500' : 'bg-gray-300'}`}
                             title={cp.price > 0 ? 'Price set' : 'No price set'}>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
            
            <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
              <p className="text-xs text-blue-700">
                <strong>System Configuration:</strong> All 6 countries are required. Prices are decimal numbers (e.g., 10.50 for $10.50).
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
          </div>
        </section>

          {/* Stock & SKU */}
          <section className="glass-panel-heavy p-8 rounded-[2.5rem] border border-black/5 bg-white shadow-sm space-y-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-black/50 flex items-center gap-2">
              <Box size={14} /> Stock & SKU
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Dubai Warehouse Stock */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-black/70 px-2 flex items-center justify-between">
                  <span>Dubai Stock (UAE)</span>
                  <span className="text-xs">🇦🇪</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="dubaiStock"
                    value={formData.dubaiStock}
                    onChange={(e) => {
                      const val = Number(e.target.value) || 0;
                      setFormData(prev => ({
                        ...prev,
                        dubaiStock: val,
                        stockQuantity: val + (Number(prev.kuwaitStock) || 0)
                      }));
                    }}
                    min="0"
                    placeholder="0"
                    className="w-full bg-black/5 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-black outline-none transition-all"
                  />
                  <Package className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-black/50" size={16} />
                </div>
              </div>

              {/* Kuwait Warehouse Stock */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-black/70 px-2 flex items-center justify-between">
                  <span>Kuwait Stock</span>
                  <span className="text-xs">🇰🇼</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="kuwaitStock"
                    value={formData.kuwaitStock}
                    onChange={(e) => {
                      const val = Number(e.target.value) || 0;
                      setFormData(prev => ({
                        ...prev,
                        kuwaitStock: val,
                        stockQuantity: val + (Number(prev.dubaiStock) || 0)
                      }));
                    }}
                    min="0"
                    placeholder="0"
                    className="w-full bg-black/5 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-black outline-none transition-all"
                  />
                  <Package className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-black/50" size={16} />
                </div>
              </div>

              {/* SKU */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-black/70 px-2">SKU (Stock Keeping Unit)</label>
                <div className="relative">
                  <input
                    name="sku"
                    value={formData.sku}
                    onChange={handleChange}
                    placeholder="e.g. LDS-001-BLK"
                    className="w-full bg-black/5 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-black outline-none transition-all"
                  />
                  <Hash className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-black/50" size={16} />
                </div>
              </div>
            </div>

            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-900">Total Combined Inventory:</span>
              <span className="text-sm font-black font-mono text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full">
                {(Number(formData.dubaiStock) || 0) + (Number(formData.kuwaitStock) || 0)} Units
              </span>
            </div>

            <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
              <p className="text-xs text-blue-700">
                <strong>SKU Tip:</strong> Use a consistent format like <code>BRAND-COLOR-SIZE</code> for easy inventory tracking.
              </p>
            </div>
          </section>

          {/* Weight Information */}
          <section className="glass-panel-heavy p-8 rounded-[2.5rem] border border-black/5 bg-white shadow-sm space-y-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-black/50 flex items-center gap-2">
              <Scale size={14} /> Shipping & Weight
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-black/70 px-2">Weight</label>
                <div className="relative">
                  <input
                    type="number"
                    name="weight"
                    step="0.01"
                    value={formData.weight}
                    onChange={handleChange}
                    min="0"
                    placeholder="0.00"
                    className="w-full bg-black/5 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-black outline-none transition-all"
                  />
                  <Scale className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-black/50" size={16} />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-black/70 px-2">Unit</label>
                <div className="flex gap-4 p-4 bg-black/5 rounded-2xl h-[52px] items-center">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="weightUnit"
                      value="g"
                      checked={formData.weightUnit === 'g'}
                      onChange={handleChange}
                      className="w-4 h-4 text-black border-black/10 text-black focus:ring-black"
                    />
                    <span className="text-sm font-bold">Gram (g)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="weightUnit"
                      value="kg"
                      checked={formData.weightUnit === 'kg'}
                      onChange={handleChange}
                      className="w-4 h-4 text-black border-black/10 text-black focus:ring-black"
                    />
                    <span className="text-sm font-bold">Kilogram (kg)</span>
                  </label>
                </div>
              </div>
            </div>
          </section>

          {/* Weight Information */}
          <section className="glass-panel-heavy p-8 rounded-[2.5rem] border border-black/5 bg-white shadow-sm space-y-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-black/50 flex items-center gap-2">
              <Scale size={14} /> Shipping & Weight
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-black/70 px-2">Weight</label>
                <div className="relative">
                  <input
                    type="number"
                    name="weight"
                    step="0.01"
                    value={formData.weight}
                    onChange={handleChange}
                    min="0"
                    placeholder="0.00"
                    className="w-full bg-black/5 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-black outline-none transition-all"
                  />
                  <Scale className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-black/50" size={16} />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-black/70 px-2">Unit</label>
                <div className="flex gap-4 p-4 bg-black/5 rounded-2xl h-[52px] items-center">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="weightUnit"
                      value="g"
                      checked={formData.weightUnit === 'g'}
                      onChange={handleChange}
                      className="w-4 h-4 text-black border-black/20 focus:ring-black"
                    />
                    <span className="text-sm font-bold">Gram (g)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="weightUnit"
                      value="kg"
                      checked={formData.weightUnit === 'kg'}
                      onChange={handleChange}
                      className="w-4 h-4 text-black border-black/20 focus:ring-black"
                    />
                    <span className="text-sm font-bold">Kilogram (kg)</span>
                  </label>
                </div>
              </div>
            </div>
          </section>

          {/* SEO Tags */}
          <section className="glass-panel-heavy p-8 rounded-[2.5rem] border border-black/5 bg-white shadow-sm space-y-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-black/50 flex items-center gap-2">
              <Search size={14} /> SEO Tags
            </h3>
            
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-black/70 px-2">Tags (Press Enter to add)</label>
                <div className="relative">
                  <input
                    placeholder="Type a tag and press Enter"
                    className="w-full bg-black/5 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-black outline-none transition-all"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const input = e.target as HTMLInputElement;
                        const tag = input.value.trim();
                        if (tag && !formData.tags.includes(tag)) {
                          setFormData(prev => ({ ...prev, tags: [...prev.tags, tag] }));
                          input.value = '';
                        }
                      }
                    }}
                  />
                  <Tag className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-black/50" size={16} />
                </div>
              </div>

              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {(formData.tags || []).map((tag, idx) => (
                    <span 
                      key={idx} 
                      className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-full text-xs font-bold"
                    >
                      {tag}
                      <button 
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, tags: prev.tags.filter((_, i) => i !== idx) }))}
                        className="hover:text-red-400 transition-colors"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100">
                <p className="text-xs text-purple-700">
                  <strong>SEO Tip:</strong> Add relevant tags for better search visibility. Examples: <code>anti-aging</code>, <code>moisturizer</code>, <code>vegan</code>, <code>organic</code>
                </p>
              </div>
            </div>
          </section>

          {/* Media Assets */}
          <section className="glass-panel-heavy p-8 rounded-[2.5rem] border border-black/5 bg-white shadow-sm space-y-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-black/50 flex items-center gap-2">
              <ImageIcon size={14} /> Media Assets
            </h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Main Image */}
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-black/70 px-2">Main Image</label>
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
                      <ImageIcon className="text-black/50 mb-2 group-hover:scale-110 transition-transform" size={24} />
                      <span className="text-[10px] font-black uppercase tracking-widest text-black/70">Upload Main</span>
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
                            fd.append('folder', 'ecommerce/products');
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
                <label className="text-[10px] font-black uppercase tracking-widest text-black/70 px-2">Gallery</label>
                <div className="grid grid-cols-3 gap-3">
                    {(formData.images || []).map((img, idx) => (
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
                    <ImageIcon className="text-black/50 mb-1 group-hover:scale-110 transition-transform" size={16} />
                    <span className="text-[8px] font-black uppercase tracking-widest text-black/70">Add</span>
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
                            fd.append('folder', 'ecommerce/products');
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
            <h3 className="text-sm font-black uppercase tracking-widest text-black/50">Status & Vibes</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

              <label className="flex items-center justify-between p-4 bg-black/5 rounded-2xl cursor-pointer group">
                <span className="text-xs font-bold uppercase tracking-widest text-black/60 group-hover:text-black">Clearance Sale</span>
                <input
                  type="checkbox"
                  name="clearanceSale"
                  checked={formData.clearanceSale}
                  onChange={handleChange}
                  className="w-5 h-5 rounded-lg border-none bg-black/10 checked:bg-black text-black focus:ring-0 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-4 bg-black/5 rounded-2xl cursor-pointer group">
                <span className="text-xs font-bold uppercase tracking-widest text-black/60 group-hover:text-black">Promotion</span>
                <input
                  type="checkbox"
                  name="promotion"
                  checked={formData.promotion}
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
