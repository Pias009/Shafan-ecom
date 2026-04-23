"use client";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, X, Zap, ZapOff, Loader2 } from "lucide-react";

interface Product {
  id: string;
  name: string;
  mainImage: string | null;
  price: number;
  displayPrice?: number;
  active: boolean;
  brand: { name: string } | null;
  productCategories: { category: { id: string; name: string } }[];
  countryPrices: { country: string; price: number; currency: string }[];
  hot: boolean;
}

interface FlashSalesTableProps {
  flashSaleProducts: Product[];
  regularProducts: Product[];
}

export function FlashSalesTable({ flashSaleProducts: initialFlashSaleProducts, regularProducts }: FlashSalesTableProps) {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"flash" | "available">("flash");
  const [updating, setUpdating] = useState<string | null>(null);
  const [productsList, setProductsList] = useState<Product[]>([]);

  useEffect(() => {
    setProductsList([...initialFlashSaleProducts, ...regularProducts]);
  }, [initialFlashSaleProducts, regularProducts]);

  const getDisplayPrice = (p: any) => {
    return p.displayPrice || (p.countryPrices?.find((cp: any) => cp.country === 'AE')?.price) || p.price || 0;
  };

  const filteredProducts = useMemo(() => {
    if (!search) return productsList;
    const searchLower = search.toLowerCase();
    return productsList.filter((p: Product) => 
      p.name.toLowerCase().includes(searchLower) ||
      p.brand?.name?.toLowerCase().includes(searchLower)
    );
  }, [productsList, search]);

  const flashSaleProductsList = filteredProducts.filter((p: Product) => p.hot === true);
  const availableProducts = filteredProducts.filter((p: Product) => p.hot !== true);

  async function toggleFlashSale(productId: string, currentlyOnSale: boolean, product: any) {
    const price = getDisplayPrice(product);
    setUpdating(productId);
    try {
      const endpoint = currentlyOnSale ? "DELETE" : "POST";
      const res = await fetch(`/api/admin/flash-sales`, {
        method: endpoint,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, price })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setProductsList(prev => prev.map(p => {
          if (p.id === productId) return { ...p, hot: !currentlyOnSale };
          return p;
        }));
      } else {
        alert(data.error || "Failed");
      }
    } catch (error: any) {
      alert("Error: " + error.message);
    } finally {
      setUpdating(null);
    }
  }

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
            onClick={() => setActiveTab("flash")}
            className={`px-6 py-3 rounded-full font-black text-xs uppercase tracking-widest transition-all ${
              activeTab === "flash" 
                ? "bg-yellow-400 text-black" 
                : "text-black/50 hover:text-black"
            }`}
          >
            On Sale ({flashSaleProductsList.length})
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
              <th className="text-left px-6 py-4 font-black text-xs uppercase tracking-widest text-black/50">Status</th>
              <th className="text-right px-6 py-4 font-black text-xs uppercase tracking-widest text-black/50">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {(activeTab === "flash" ? flashSaleProductsList : availableProducts).map((product) => {
              const isOnSale = product.hot === true;
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
                    {isOnSale ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-black uppercase rounded-full">
                        <Zap className="w-3 h-3" /> On Sale
                      </span>
                    ) : (
                      <span className="text-black/30 text-xs font-black uppercase">Regular</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => toggleFlashSale(product.id, isOnSale, product)}
                      disabled={isUpdating}
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-black text-xs uppercase tracking-widest transition-all ${
                        isOnSale
                          ? "bg-red-100 text-red-700 hover:bg-red-200"
                          : "bg-yellow-400 text-black hover:bg-yellow-500"
                      }`}
                    >
                      {isUpdating ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : isOnSale ? (
                        <>
                          <ZapOff className="w-4 h-4" /> Remove
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4" /> Add to Sale
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {(activeTab === "flash" ? flashSaleProductsList : availableProducts).length === 0 && (
          <div className="py-20 text-center">
            <div className="text-6xl mb-4 opacity-30">
              {activeTab === "flash" ? "⚡" : "📦"}
            </div>
            <p className="font-black text-lg text-black/50">
              {activeTab === "flash" 
                ? "No products on flash sale" 
                : "No available products"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}