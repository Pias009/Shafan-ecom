"use client";

import Link from 'next/link';
import { Plus, Tag, Trash2, Check, Square, Filter, X } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface Product {
  id: string;
  name: string;
  mainImage: string | null;
  stockQuantity: number;
  active: boolean;
  brand: { name: string } | null;
  productCategories: { category: { id: string; name: string } }[];
  countryPrices: { country: string; price: number; currency: string }[];
}

export function ProductsTable({ initialProducts }: { initialProducts: Product[] }) {
  const [showFilters, setShowFilters] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("All");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [maxPrice, setMaxPrice] = useState(100000);
  
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  // Derive unique brands and categories for filters
  const brands = useMemo(() => {
    const set = new Set(initialProducts.map(p => p.brand?.name).filter(Boolean));
    return ["All", ...Array.from(set).sort()];
  }, [initialProducts]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    initialProducts.forEach(p => {
      p.productCategories?.forEach(pc => {
        if (pc.category?.name) set.add(pc.category.name);
      });
    });
    return ["All", ...Array.from(set).sort()];
  }, [initialProducts]);

  const filteredProducts = useMemo(() => {
    return initialProducts.filter(p => {
      const matchesSearch = !searchInput || p.name.toLowerCase().includes(searchInput.toLowerCase()) || 
                           p.id.toLowerCase().includes(searchInput.toLowerCase());
      const matchesBrand = selectedBrand === "All" || p.brand?.name === selectedBrand;
      const matchesCategory = selectedCategory === "All" || 
                             p.productCategories?.some(pc => pc.category.name === selectedCategory);
      
      const price = p.countryPrices?.[0]?.price || 0;
      const matchesPrice = price <= maxPrice || maxPrice === 100000;

      return matchesSearch && matchesBrand && matchesCategory && matchesPrice;
    });
  }, [initialProducts, searchInput, selectedBrand, selectedCategory, maxPrice]);

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
    setSelectAll(newSelected.size === filteredProducts.length);
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredProducts.map(p => p.id)));
    }
    setSelectAll(!selectAll);
  };

  const deleteSelected = async () => {
    if (selectedIds.size === 0) return;
    
    if (!confirm(`Delete ${selectedIds.size} product(s)?`)) return;
    
    try {
      const res = await fetch('/api/admin/products/bulk', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds) })
      });
      
      if (res.ok) {
        toast.success('Selected products deleted');
        window.location.reload(); // Refresh to get updated list
      } else {
        toast.error('Failed to delete products');
      }
    } catch (error) {
      toast.error('Failed to delete products');
    }
  };

  const deleteProduct = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;
    
    try {
      const res = await fetch('/api/admin/products/bulk', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [id] })
      });
      
      if (res.ok) {
        toast.success('Product deleted');
        window.location.reload();
      } else {
        toast.error('Failed to delete product');
      }
    } catch (error) {
      toast.error('Failed to delete product');
    }
  };

  return (
    <>
      <div className="flex justify-start mb-6">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 ${
            showFilters ? "bg-black text-white" : "glass-panel text-black hover:bg-black hover:text-white"
          }`}
        >
          {showFilters ? <X size={14} /> : <Filter size={14} />}
          {showFilters ? "Hide Filters" : "Show Filters"}
        </button>
      </div>

      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, y: -20, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -20, height: 0 }}
            className="overflow-hidden mb-8"
          >
            <div className="glass-panel rounded-[2rem] p-4 grid grid-cols-1 md:grid-cols-4 gap-4 items-stretch shadow-lg border border-black/5 bg-white/50">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-black/30 mb-1.5 px-2">
                  Search
                </label>
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Name or ID..."
                  className="h-12 w-full bg-white border border-black/5 rounded-2xl px-5 text-black font-body text-xs focus:ring-2 focus:ring-black outline-none placeholder:text-black/20"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-black/30 mb-1.5 px-2">
                  Brand
                </label>
                <select
                  value={selectedBrand}
                  onChange={(e) => setSelectedBrand(e.target.value)}
                  className="h-12 w-full bg-white border border-black/5 rounded-2xl px-3 text-black font-body text-xs focus:ring-2 focus:ring-black outline-none cursor-pointer appearance-none"
                >
                  {brands.map(b => <option key={b || 'unknown'} value={b || 'All'}>{b || 'All'}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-black/30 mb-1.5 px-2">
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="h-12 w-full bg-white border border-black/5 rounded-2xl px-3 text-black font-body text-xs focus:ring-2 focus:ring-black outline-none cursor-pointer appearance-none"
                >
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-black/30 mb-1.5 px-2">
                  Max Price: {maxPrice === 100000 ? 'All' : maxPrice}
                </label>
                <div className="h-12 flex items-center px-4 bg-white border border-black/5 rounded-2xl">
                  <input
                    type="range"
                    min="0"
                    max="100000"
                    step="1000"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                    className="flex-1 h-1.5 bg-black/10 rounded-lg appearance-none cursor-pointer accent-black"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>



      {selectedIds.size > 0 && (
        <div className="flex items-center gap-4 p-4 bg-red-50 rounded-2xl border border-red-200">
          <span className="text-sm font-bold text-red-700">
            {selectedIds.size} product(s) selected
          </span>
          <button
            onClick={deleteSelected}
            className="inline-flex items-center gap-2 bg-red-500 text-white text-xs font-black uppercase tracking-widest px-6 py-3 rounded-full hover:bg-red-600 transition"
          >
            <Trash2 size={14} /> Delete Selected
          </button>
        </div>
      )}

      <div className="glass-panel overflow-hidden rounded-[2.5rem] border border-black/5 shadow-sm bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-black text-white">
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest w-12">
                  <button
                    onClick={toggleSelectAll}
                    className={`hover:text-green-400 transition-colors ${selectAll ? 'text-green-400' : ''}`}
                    title={selectAll ? 'Deselect all' : 'Select all'}
                  >
                    {selectAll ? <Check size={16} /> : <Square size={16} />}
                  </button>
                </th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest">Product</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-center">Price</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-center">Stock</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest">Category</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest">Status</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {filteredProducts.map((p) => (
                <tr 
                  key={p.id} 
                  className={`hover:bg-black/[0.01] transition-colors ${selectedIds.has(p.id) ? 'bg-green-50' : ''}`}
                >
                  <td className="px-6 py-5">
                    <button
                      onClick={() => toggleSelect(p.id)}
                      className={`transition-colors ${selectedIds.has(p.id) ? 'text-green-600' : 'text-black/30 hover:text-black'}`}
                    >
                      {selectedIds.has(p.id) ? <Check size={16} /> : <Square size={16} />}
                    </button>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-black/5 border border-black/5 overflow-hidden flex-shrink-0 relative">
                        {p.mainImage ? (
                          <img src={p.mainImage} alt={p.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] font-black text-black/10">NO IMG</div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-sm text-black truncate max-w-[200px] leading-tight">{p.name}</div>
                        <div className="text-[10px] font-bold text-black/20 uppercase tracking-tighter mt-1 flex items-center gap-1">
                          <Tag size={10} /> {p.id.substring(0, 8)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center">
                    {p.countryPrices && p.countryPrices.length > 0 ? (
                      <div className="font-black text-sm">
                        {p.countryPrices.map((cp, idx) => (
                          <div key={cp.country} className={idx > 0 ? 'text-[10px] text-black/40' : ''}>
                            {cp.currency} {cp.price > 0 ? Number(cp.price).toLocaleString(undefined, { 
                              minimumFractionDigits: ["KWD", "BHD", "OMR"].includes(cp.currency) ? 3 : 2,
                              maximumFractionDigits: ["KWD", "BHD", "OMR"].includes(cp.currency) ? 3 : 2
                            }) : '—'}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-[10px] text-black/30">No prices</div>
                    )}
                  </td>
                  <td className="px-6 py-5 text-center">
                    <div className={`text-xs font-black uppercase tracking-widest ${p.stockQuantity > 0 ? 'text-black/60' : 'text-red-500'}`}>
                      {p.stockQuantity}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                      {p.productCategories?.map((pc) => (
                        <span key={pc.category.id} className="inline-block px-2 py-0.5 rounded bg-black/5 text-[9px] font-bold text-black/40 uppercase tracking-tighter">
                          {pc.category.name}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                      p.active ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200'
                    }`}>
                      {p.active ? 'PUBLISHED' : 'DRAFT'}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/ueadmin/products/${p.id}`}
                        className="inline-block text-[10px] font-black uppercase tracking-widest bg-black/5 hover:bg-black hover:text-white px-4 py-2 rounded-full transition-all"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => deleteProduct(p.id, p.name)}
                        className="inline-block text-[10px] font-black uppercase tracking-widest bg-red-50 hover:bg-red-500 hover:text-white text-red-500 px-4 py-2 rounded-full transition-all"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
