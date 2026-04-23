"use client";

import { useState, useEffect } from 'react';
import { Folder, Eye, EyeOff, AlertTriangle, Loader2 } from 'lucide-react';

interface CategoryStat {
  name: string;
  adminCount: number;
  userCount: number;
  hidden: number;
  productNames: string[];
}

interface HiddenProduct {
  id: string;
  name: string;
  active: boolean;
  price: number;
  hasCountryPrices: boolean;
  countryPricesValid: boolean;
  categories: string[];
}

interface StatsData {
  categories: CategoryStat[];
  totalAdminProducts: number;
  totalUserProducts: number;
  hiddenProducts: HiddenProduct[];
  summary: {
    totalCategories: number;
    categoriesWithHidden: number;
    totalHidden: number;
  };
}

export default function CategoryStatsPage() {
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/admin/categories/stats');
        const json = await res.json();
        setData(json);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-black" />
      </div>
    );
  }

  if (!data) {
    return <div className="p-8">Failed to load data</div>;
  }

  const selectedCat = selectedCategory 
    ? data?.categories?.find(c => c.name === selectedCategory) 
    : null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-black tracking-tight text-black">Category Analytics</h1>
        <p className="text-sm font-medium text-black/60 mt-1 uppercase tracking-[0.2em]">
          Compare admin inventory vs user site visibility
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-panel rounded-2xl p-6 border border-black/5">
          <div className="text-3xl font-black">{data.totalAdminProducts}</div>
          <div className="text-xs font-black uppercase tracking-widest text-black/50 mt-1">Total in Admin</div>
        </div>
        <div className="glass-panel rounded-2xl p-6 border border-black/5">
          <div className="text-3xl font-black text-green-600">{data.totalUserProducts}</div>
          <div className="text-xs font-black uppercase tracking-widest text-black/50 mt-1">Showing on Site</div>
        </div>
        <div className="glass-panel rounded-2xl p-6 border border-black/5">
          <div className="text-3xl font-black text-red-500">{data.summary.totalHidden}</div>
          <div className="text-xs font-black uppercase tracking-widest text-black/50 mt-1">Hidden from Users</div>
        </div>
        <div className="glass-panel rounded-2xl p-6 border border-black/5">
          <div className="text-3xl font-black">{data.summary.totalCategories}</div>
          <div className="text-xs font-black uppercase tracking-widest text-black/50 mt-1">Total Categories</div>
        </div>
      </div>

      {/* Category Table */}
      <div className="glass-panel rounded-2xl border border-black/5 overflow-hidden">
        <table className="w-full">
          <thead className="bg-black text-white">
            <tr>
              <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest">Category</th>
              <th className="px-6 py-4 text-center text-[10px] font-black uppercase tracking-widest">Admin (All)</th>
              <th className="px-6 py-4 text-center text-[10px] font-black uppercase tracking-widest">User Site</th>
              <th className="px-6 py-4 text-center text-[10px] font-black uppercase tracking-widest">Hidden</th>
              <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {data.categories.map((cat) => (
              <tr 
                key={cat.name} 
                className={`hover:bg-black/[0.02] transition-colors ${cat.hidden > 0 ? 'bg-red-50/50' : ''}`}
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Folder size={14} className="text-black/40" />
                    <span className="font-black text-sm">{cat.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="font-black text-lg">{cat.adminCount}</span>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="font-black text-lg text-green-600">{cat.userCount}</span>
                </td>
                <td className="px-6 py-4 text-center">
                  {cat.hidden > 0 ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-600 rounded-full text-xs font-black">
                      <AlertTriangle size={10} /> {cat.hidden}
                    </span>
                  ) : (
                    <span className="text-black/30 text-xs font-black">—</span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => setSelectedCategory(selectedCategory === cat.name ? null : cat.name)}
                    className="text-xs font-black uppercase tracking-widest text-black/50 hover:text-black"
                  >
                    {selectedCategory === cat.name ? 'Hide' : 'View'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Hidden Products List */}
      {data.hiddenProducts.length > 0 && (
        <div className="glass-panel rounded-2xl border border-red-200 overflow-hidden">
          <div className="bg-red-50 px-6 py-4 border-b border-red-200 flex items-center gap-2">
            <AlertTriangle size={16} className="text-red-500" />
            <h2 className="font-black text-sm">Hidden Products (Not visible to users)</h2>
          </div>
          <div className="divide-y divide-red-100 max-h-96 overflow-y-auto">
            {data.hiddenProducts.map((product) => (
              <div key={product.id} className="px-6 py-3 flex items-center justify-between hover:bg-red-50/50">
                <div>
                  <div className="font-black text-sm">{product.name}</div>
                  <div className="text-xs text-black/40 mt-0.5">
                    Categories: {product.categories.join(', ')}
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className={`px-2 py-1 rounded-full ${product.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {product.active ? 'Active' : 'Inactive'}
                  </span>
                  <span className={`px-2 py-1 rounded-full ${product.countryPricesValid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-500'}`}>
                    {product.countryPricesValid ? 'Has Price' : 'No Price'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}