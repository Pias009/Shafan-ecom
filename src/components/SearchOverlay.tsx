"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, X, Package } from "lucide-react";
import { useSearchStore } from "@/lib/search-store";
import { motion, AnimatePresence } from "framer-motion";

interface SearchOverlayProps {
  onClose: () => void;
}

export function SearchOverlay({ onClose }: SearchOverlayProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { setQuery: setStoreQuery, setIsSearching } = useSearchStore();

  useEffect(() => {
    inputRef.current?.focus();
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  useEffect(() => {
    const searchProducts = async () => {
      if (query.length < 2) {
        setSuggestions([]);
        return;
      }

      setLoading(true);
      try {
        const res = await fetch(`/api/products/search?q=${encodeURIComponent(query)}&limit=5`);
        const data = await res.json();
        setSuggestions(data.products || []);
      } catch (error) {
        console.error("Search error:", error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(searchProducts, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  const handleSelect = (product: any) => {
    setStoreQuery(query);
    setIsSearching(true);
    onClose();
    router.push(`/products?q=${encodeURIComponent(query)}`);
  };

  const handleSearch = () => {
    if (query.trim()) {
      setStoreQuery(query);
      setIsSearching(true);
      onClose();
      router.push(`/products?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Search Modal */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="relative w-full max-w-2xl mx-auto pt-20 px-4"
      >
        <div className="glass-panel-heavy rounded-3xl p-4 shadow-2xl border border-black/5">
          {/* Search Input */}
          <div className="flex items-center gap-3">
            <Search size={20} className="text-black/40" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search products..."
              className="flex-1 bg-transparent text-lg font-medium outline-none placeholder:text-black/30"
            />
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-black/5 transition-all"
            >
              <X size={20} className="text-black/50" />
            </button>
          </div>

          {/* Suggestions Dropdown */}
          <AnimatePresence>
            {query.length >= 2 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-4 border-t border-black/5 pt-4"
              >
                {loading ? (
                  <div className="py-4 text-center text-black/40 text-sm">Searching...</div>
                ) : suggestions.length > 0 ? (
                  <div className="space-y-1">
                    {suggestions.map((product) => (
                      <button
                        key={product.id}
                        onClick={() => handleSelect(product)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-black/5 transition-all text-left"
                      >
                        <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                          {product.mainImage || product.imageUrl ? (
                            <img
                              src={product.mainImage || product.imageUrl}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package size={16} className="text-black/30" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-black truncate">{product.name}</p>
                          <p className="text-xs text-black/50 truncate">{product.brand?.name || product.brand}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="py-4 text-center text-black/40 text-sm">No products found</div>
                )}

                {/* Search All Button */}
                {query.length >= 2 && (
                  <button
                    onClick={handleSearch}
                    className="w-full mt-3 py-3 text-center text-sm font-medium text-black/60 hover:text-black bg-black/5 hover:bg-black/10 rounded-xl transition-all"
                  >
                    Search all results for "{query}"
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
