"use client";

import { useMemo, useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ProductsSlider } from "@/components/ProductsSlider";
import { ProductCard } from "@/components/ProductCard";
import { ProductQuickViewModal } from "@/components/ProductQuickViewModal";
import { useCartStore } from "@/lib/cart-store";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { Price } from "@/components/Price";
import { useCurrencyStore } from "@/lib/currency-store";

export default function AllProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [brand, setBrand] = useState("All");
  const [maxPrice, setMaxPrice] = useState(5000);
  const [quickView, setQuickView] = useState<any>(null);

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
              {brands.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>

          <div className="min-w-[200px] flex-grow md:flex-grow-0">
            <div className="flex justify-between items-center mb-2 px-1">
              <label className="text-xs font-bold uppercase tracking-widest text-black">Max Price</label>
              <Price amount={maxPrice} className="text-sm font-bold" />
            </div>
            <input
              type="range"
              min="0"
              max="5000"
              step="10"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full h-2 bg-black/10 rounded-lg appearance-none cursor-pointer accent-black"
            />
          </div>
        </div>

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
