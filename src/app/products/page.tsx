"use client";

import { useMemo, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ProductsSlider } from "@/components/ProductsSlider";
import { ProductCard } from "@/components/ProductCard";
import { demoProducts, demoBrands, demoCategories } from "@/lib/demo-data";
import { ProductQuickViewModal } from "@/components/ProductQuickViewModal";
import { useCartStore } from "@/lib/cart-store";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { useEffect } from "react";

// Server action or API route would be better, but for simplicity I'll fetch in useEffect or use a separate file for initial data.
// Actually, I'll update it to handle "priceCents" which is in DB.

export default function AllProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [brand, setBrand] = useState("All");
  const [maxPrice, setMaxPrice] = useState(150);
  const [quickView, setQuickView] = useState<any>(null);

  const addItem = useCartStore((state) => state.addItem);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch("/api/products");
        const data = await res.json();
        // Transform cents to dollars for the UI compatibility
        const transformed = data.map((p: any) => ({
          ...p,
          price: p.priceCents / 100,
          discountPrice: p.discountCents ? p.discountCents / 100 : undefined,
          brand: p.brand?.name || "Unknown",
          category: p.category?.name || "Unknown",
          imageUrl: p.images?.[0] || ""
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

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const price = p.discountPrice ?? p.price;
      const matchesSearch = p.name.toLowerCase().includes(q.toLowerCase()) ||
        p.brand.toLowerCase().includes(q.toLowerCase());
      const matchesBrand = brand === "All" || p.brand === brand;
      const matchesPrice = price <= maxPrice;
      return matchesSearch && matchesBrand && matchesPrice;
    });
  }, [q, brand, maxPrice, products]);

  const categories = ["Skincare", "Haircare", "Fragrance"];

  function addToCart(product: any) {
    addItem(product, 1);
    toast.success(`Added ${product.name} to cart`);
  }

  return (
    <div className="min-h-screen bg-cream text-black">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 pt-32 pb-20">
        {/* Animated Top Slider */}
        <ProductsSlider />

        {/* Advanced Filters */}
        <div className="mt-12 glass-panel rounded-3xl p-3 flex flex-wrap gap-6 items-end sticky top-24 z-20 shadow-lg">
          <div className="flex-1 min-w-[250px]">
            <label className="block text-xs font-bold uppercase tracking-widest text-black mb-2 px-1">Search</label>
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Find a product..."
              className="w-full bg-white/50 border-none rounded-2xl px-5 py-3 text-black font-body text-sm focus:ring-2 focus:ring-black outline-none placeholder:text-black/30"
            />
          </div>

          <div className="min-w-[150px]">
            <label className="block text-xs font-bold uppercase tracking-widest text-black mb-2 px-1">Brand</label>
            <select
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              className="w-full bg-white/50 border-none rounded-2xl px-5 py-3 text-black font-body text-sm focus:ring-2 focus:ring-black outline-none cursor-pointer"
            >
              <option value="All">All Brands</option>
              {demoBrands.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
            </select>
          </div>

          <div className="min-w-[200px] flex-grow md:flex-grow-0">
            <div className="flex justify-between items-center mb-2 px-1">
              <label className="text-xs font-bold uppercase tracking-widest text-black">Max Price</label>
              <span className="text-sm font-bold">${maxPrice}</span>
            </div>
            <input
              type="range"
              min="10"
              max="150"
              step="5"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full h-2 bg-black/10 rounded-lg appearance-none cursor-pointer accent-black"
            />
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="py-20 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-forest border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
            <p className="mt-4 font-body text-forest/60">Fetching latest products...</p>
          </div>
        )}

        {/* Categorized Sections */}
        {!loading && (
          <div className="mt-20 space-y-24">
            {categories.map((cat) => {
              const productsInCat = filtered.filter(p => p.category === cat);
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

                  <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
            <button onClick={() => { setQ(""); setBrand("All"); setMaxPrice(150); }} className="mt-8 text-black underline font-bold underline-offset-4">Reset all filters</button>
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
