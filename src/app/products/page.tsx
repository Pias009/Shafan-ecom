"use client";

import { useMemo, useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ProductsSlider } from "@/components/ProductsSlider";
import { ProductCard } from "@/components/ProductCard";
import { ProductQuickViewModal } from "@/components/ProductQuickViewModal";
import { useCartStore } from "@/lib/cart-store";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Filter, X } from "lucide-react";
import { Price } from "@/components/Price";
import { useCurrencyStore } from "@/lib/currency-store";

export default function AllProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [brand, setBrand] = useState("All");
  const [maxPrice, setMaxPrice] = useState(5000);
  const [quickView, setQuickView] = useState<any>(null);
  const [showFilters, setShowFilters] = useState(false);

  const addItem = useCartStore((state) => state.addItem);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch("/api/products");
        const data = await res.json();
        // Transform data for UI compatibility
        const transformed = data.map((p: any) => ({
          ...p,
          price: p.priceCents / 100,
          discountPrice: p.discountCents ? p.discountCents / 100 : undefined,
          brandName: p.brand?.name || "Generic",
          categoryName: p.category?.name || "General",
          imageUrl: p.mainImage || "/placeholder-product.png"
        }));
        setProducts(transformed);
      } catch (err) {
        console.error("Failed to fetch products:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  const brands = useMemo(() => {
    const set = new Set(products.map(p => p.brandName).filter(Boolean));
    return ["All", ...Array.from(set).sort()];
  }, [products]);

  const categories = useMemo(() => {
    const set = new Set(products.map(p => p.categoryName).filter(Boolean));
    return Array.from(set).sort();
  }, [products]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const price = p.discountPrice ?? p.price;
      const matchesSearch = p.name.toLowerCase().includes(q.toLowerCase()) ||
        p.brandName.toLowerCase().includes(q.toLowerCase());
      const matchesBrand = brand === "All" || p.brandName === brand;
      const matchesPrice = price <= maxPrice;
      return matchesSearch && matchesBrand && matchesPrice;
    });
  }, [q, brand, maxPrice, products]);

  function addToCart(product: any) {
    const cartItem = {
      id: product.id,
      name: product.name,
      brand: product.brandName,
      category: product.categoryName,
      price: product.price,
      imageUrl: product.imageUrl,
    };
    addItem(cartItem, 1);
    toast.success(`Added ${product.name} to cart`);
  }

  return (
    <div className="min-h-screen bg-cream text-black">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 pt-32 pb-20">
        <ProductsSlider />

        <div className="flex justify-center mt-12 mb-8">
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
              className="overflow-hidden mb-12"
            >
              <div className="glass-panel rounded-[2rem] p-3 md:p-4 grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-6 items-stretch md:items-end shadow-lg border border-black/5">
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-black/30 mb-1.5 px-2">Search</label>
                  <input
                    type="text"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search…"
                    className="h-10 md:h-12 w-full bg-white/50 border-none rounded-2xl px-5 text-black font-body text-xs md:text-sm focus:ring-2 focus:ring-black outline-none placeholder:text-black/20"
                  />
                </div>

                <div className="w-full md:w-[150px]">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-black/30 mb-1.5 px-2">Brand</label>
                  <select
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="h-10 md:h-12 w-full bg-white/50 border-none rounded-2xl px-5 text-black font-body text-xs md:text-sm focus:ring-2 focus:ring-black outline-none cursor-pointer appearance-none"
                  >
                    {brands.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>

                <div className="w-full md:w-[220px]">
                  <div className="flex justify-between items-center mb-1.5 px-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-black/30">Max Price</label>
                    <Price amount={maxPrice} className="text-[10px] font-black" />
                  </div>
                  <div className="px-2 h-10 md:h-12 flex items-center">
                    <input
                      type="range"
                      min="0"
                      max="5000"
                      step="10"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(Number(e.target.value))}
                      className="w-full h-1.5 bg-black/10 rounded-lg appearance-none cursor-pointer accent-black"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {loading && (
          <div className="py-20 text-center flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-black/20" />
            <p className="mt-4 font-body text-black/60">Fetching latest products...</p>
          </div>
        )}

        {!loading && (
          <div className="mt-20 space-y-24">
            {categories.map((cat) => {
              const productsInCat = filtered.filter(p => p.categoryName === cat);
              if (productsInCat.length === 0) return null;

              return (
                <section key={cat}>
                  <div className="flex items-center gap-6 mb-10 border-b border-black/5 pb-6">
                    <h2 className="font-display text-5xl font-bold text-black">{cat}</h2>
                    <div className="h-[1px] flex-1 bg-black/10" />
                    <span className="font-body text-sm font-bold text-black/40 tracking-widest uppercase">
                      {productsInCat.length} Items
                    </span>
                  </div>

                  <div className="grid gap-x-3 md:gap-x-8 gap-y-6 md:gap-y-12 grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {productsInCat.map((product, idx) => (
                      <motion.div
                        key={product.id}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: idx % 4 * 0.1 }}
                        viewport={{ once: true }}
                      >
                        <ProductCard
                          product={product}
                          onQuickView={(p) => setQuickView(p)}
                          onAddToCart={(p) => addToCart(p)}
                        />
                      </motion.div>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="py-32 text-center">
            <div className="text-6xl mb-6 opacity-30">🔍</div>
            <p className="font-display text-3xl text-black">No products found</p>
            <p className="text-black/50 mt-2">Try adjusting your filters or search term</p>
            <button onClick={() => { setQ(""); setBrand("All"); setMaxPrice(5000); }} className="mt-8 text-black underline font-bold underline-offset-4">Reset all filters</button>
          </div>
        )}
      </main>

      <Footer />

      <ProductQuickViewModal
        product={quickView}
        onClose={() => setQuickView(null)}
        onAddToCart={(p) => addToCart(p)}
        onOrderNow={(p) => { addToCart(p); }}
      />
    </div>
  );
}
