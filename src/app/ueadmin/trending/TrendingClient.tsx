"use client";

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Flame, Search, Loader2, Tag, Zap } from 'lucide-react';
import toast from 'react-hot-toast';

interface Product {
  id: string;
  name: string;
  mainImage: string | null;
  stockQuantity: number;
  active: boolean;
  trending: boolean;
  brand: { name: string } | null;
  productCategories: { category: { id: string; name: string } }[];
  countryPrices: { country: string; price: number; currency: string }[];
}

export default function TrendingClient({ initialProducts }: { initialProducts: Product[] }) {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"trending" | "available">("trending");
  const [updating, setUpdating] = useState<string | null>(null);
  const [productsList, setProductsList] = useState<Product[]>(initialProducts);

  const getDisplayPrice = (p: any) => {
    return (p.countryPrices?.find((cp: any) => cp.country === 'AE')?.price) || p.price || 0;
  };

  const filteredProducts = useMemo(() => {
    if (!search) return productsList;
    const searchLower = search.toLowerCase();
    return productsList.filter((p: Product) => 
      p.name.toLowerCase().includes(searchLower) ||
      p.brand?.name?.toLowerCase().includes(searchLower)
    );
  }, [productsList, search]);

  const trendingProductsList = filteredProducts.filter((p: Product) => p.trending === true);
  const availableProducts = filteredProducts.filter((p: Product) => p.trending !== true);

  const toggleTrending = async (productId: string, currentlyTrending: boolean, product: any) => {
    setUpdating(productId);
    try {
      const res = await fetch(`/api/admin/products/${productId}/trending`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trending: !currentlyTrending })
      });
      
      if (res.ok) {
        setProductsList(prev => prev.map(p => {
          if (p.id === productId) return { ...p, trending: !currentlyTrending };
          return p;
        }));
        toast.success(!currentlyTrending ? 'Added to trending' : 'Removed from trending');
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to update trending status');
      }
    } catch (error: any) {
      toast.error('Error: ' + error.message);
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-black/30" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="w-full h-14 pl-14 pr-4 bg-white border border-black/5 rounded-2xl font-black text-sm focus:ring-2 focus:ring-black focus:outline-none"
          />
        </div>
        
        <div className="flex bg-white border border-black/5 rounded-full p-1">
          <button
            onClick={() => setActiveTab("trending")}
            className={`px-6 py-3 rounded-full font-black text-xs uppercase tracking-widest transition-all ${
              activeTab === "trending" 
                ? "bg-orange-500 text-white" 
                : "text-black/50 hover:text-black"
            }`}
          >
            <Flame className="w-4 h-4 inline mr-1" /> Active ({trendingProductsList.length})
          </button>
          <button
            onClick={() => setActiveTab("available")}
            className={`px-6 py-3 rounded-full font-black text-xs uppercase tracking-widest transition-all ${
              activeTab === "available" 
                ? "bg-black text-white" 
                : "text-black/50 hover:text-black"
            }`}
          >
            Available ({availableProducts.length})
          </button>
        </div>
      </div>

      <div className="bg-white border border-black/5 rounded-3xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-black/[0.02] border-b border-black/5">
            <tr>
              <th className="text-left px-6 py-4 font-black text-xs uppercase tracking-widest text-black/50">Product</th>
              <th className="text-left px-6 py-4 font-black text-xs uppercase tracking-widest text-black/50">Brand</th>
              <th className="text-left px-6 py-4 font-black text-xs uppercase tracking-widest text-black/50">Price</th>
              <th className="text-left px-6 py-4 font-black text-xs uppercase tracking-widest text-black/50">Stock</th>
              <th className="text-left px-6 py-4 font-black text-xs uppercase tracking-widest text-black/50">Status</th>
              <th className="text-right px-6 py-4 font-black text-xs uppercase tracking-widest text-black/50">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {(activeTab === "trending" ? trendingProductsList : availableProducts).map((product) => {
              const isTrending = product.trending === true;
              const isUpdating = updating === product.id;
              
              return (
                <tr key={product.id} className="hover:bg-black/[0.02] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-black/5 relative">
                        {product.mainImage ? (
                          <Image src={product.mainImage} alt={product.name} fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-black/30">No Image</div>
                        )}
                      </div>
                      <div>
                        <Link href={`/ueadmin/products/${product.id}`} className="font-black text-sm hover:underline">
                          {product.name}
                        </Link>
                        <p className="text-xs text-black/50 mt-0.5">
                          {product.productCategories?.[0]?.category?.name || "Uncategorized"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-black text-xs uppercase tracking-wider text-black/60">
                      {product.brand?.name || "—"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-black text-sm">
                      ${getDisplayPrice(product).toFixed(2)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-black uppercase tracking-widest ${product.stockQuantity > 0 ? 'text-black/60' : 'text-red-500'}`}>
                      {product.stockQuantity}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {isTrending ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-100 text-orange-800 text-xs font-black uppercase rounded-full">
                        <Flame className="w-3 h-3" /> Active
                      </span>
                    ) : (
                      <span className="text-black/30 text-xs font-black uppercase">Regular</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => toggleTrending(product.id, isTrending, product)}
                      disabled={isUpdating}
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-black text-xs uppercase tracking-widest transition-all ${
                        isTrending
                          ? "bg-red-100 text-red-700 hover:bg-red-200"
                          : "bg-orange-500 text-white hover:bg-orange-600"
                      }`}
                    >
                      {isUpdating ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : isTrending ? (
                        <>
                          <Flame className="w-4 h-4" /> Remove
                        </>
                      ) : (
                        <>
                          <Flame className="w-4 h-4" /> Add to Trending
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {(activeTab === "trending" ? trendingProductsList : availableProducts).length === 0 && (
          <div className="py-20 text-center">
            <div className="text-6xl mb-4 opacity-30">
              {activeTab === "trending" ? "🔥" : "📦"}
            </div>
            <p className="font-black text-lg text-black/50">
              {activeTab === "trending" 
                ? "No products on trending" 
                : "No available products"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}