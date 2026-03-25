"use client";

import { useMemo, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ProductsSlider } from "@/components/ProductsSlider";
import { ProductCard } from "@/components/ProductCard";
import { ProductQuickViewModal } from "@/components/ProductQuickViewModal";
import { useCartStore } from "@/lib/cart-store";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Filter, X } from "lucide-react";
import { Price } from "@/components/Price";
import { useRouter } from "next/navigation";
import { useLanguageStore } from "@/lib/language-store";
import { translations } from "@/lib/translations";

export default function ProductsClient({ initialProducts, category, brand: initialBrand }: { initialProducts: any[], category?: string, brand?: string }) {
  const [products] = useState<any[]>(initialProducts || []);
  const [q, setQ] = useState("");
  const [brand, setBrand] = useState(initialBrand || "All");
  const [maxPrice, setMaxPrice] = useState(5000);
  const [quickView, setQuickView] = useState<any>(null);
  const [showFilters, setShowFilters] = useState(false);

  const { addItem, hasAddress } = useCartStore();
  const router = useRouter();
  const { currentLanguage } = useLanguageStore();
  const t = translations[currentLanguage.code as keyof typeof translations];

  const brands = useMemo(() => {
    const set = new Set(products.map(p => p.brandName).filter(Boolean));
    return [t.product.all, ...Array.from(set).sort()];
  }, [products, t.product.all]);

  const categories = useMemo(() => {
    const set = new Set(products.map(p => p.categoryName).filter(Boolean));
    const allCategories = Array.from(set).sort();
    
    // If a specific category is provided, filter to only that category
    if (category) {
      // Decode URL-encoded category (e.g., "Skin+Care" -> "Skin Care")
      const decodedCategory = decodeURIComponent(category).replace(/\+/g, ' ');
      return allCategories.filter(cat =>
        cat.toLowerCase() === decodedCategory.toLowerCase()
      );
    }
    
    return allCategories;
  }, [products, category]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const price = p.discountPrice ?? p.price;
      const matchesSearch = p.name.toLowerCase().includes(q.toLowerCase()) ||
        p.brandName.toLowerCase().includes(q.toLowerCase());
      const matchesBrand = brand === t.product.all || p.brandName === brand;
      const matchesPrice = price <= maxPrice;
      return matchesSearch && matchesBrand && matchesPrice;
    });
  }, [q, brand, maxPrice, products, t.product.all]);

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
    toast.success(`${product.name} added`);
  }

  async function orderNow(product: any) {
    if (!hasAddress) {
      toast.error(t.cart.addressRequired, { duration: 3000 });
      router.push("/account/address");
      return;
    }

    const tid = toast.loading(t.cart.creatingOrder);
    try {
      const res = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          items: [{ productId: product.id, quantity: 1 }] 
        }),
      });
      const data = await res.json();
      if (data.orderId) {
        toast.success("Redirecting...", { id: tid });
        router.push(`/checkout/payment/${data.orderId}`);
      } else {
        throw new Error(data.error || "Failed");
      }
    } catch (err: any) {
      toast.error(err.message, { id: tid });
      addToCart(product);
      router.push("/cart");
    }
  }

  return (
    <div className="min-h-screen bg-cream text-black flex flex-col">
      <main className="max-w-7xl mx-auto px-6 pt-32 pb-20 flex-1">
        <ProductsSlider />

        <div className="flex justify-center mt-12 mb-8">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 ${
              showFilters ? "bg-black text-white" : "glass-panel text-black hover:bg-black hover:text-white"
            }`}
          >
            {showFilters ? <X size={14} /> : <Filter size={14} />}
            {showFilters ? t.product.hideFilters : t.product.showFilters}
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
                  <label className="block text-[10px] font-black uppercase tracking-widest text-black/30 mb-1.5 px-2 px-2">
                    {t.product.search}
                  </label>
                  <input
                    type="text"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder={t.product.search + "…"}
                    className="h-10 md:h-12 w-full bg-white/50 border-none rounded-2xl px-5 text-black font-body text-xs md:text-sm focus:ring-2 focus:ring-black outline-none placeholder:text-black/20"
                  />
                </div>

                <div className="w-full md:w-[150px]">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-black/30 mb-1.5 px-2">
                    {t.product.brand}
                  </label>
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
                    <label className="text-[10px] font-black uppercase tracking-widest text-black/30">
                      {t.product.maxPrice}
                    </label>
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

          <div className="mt-12 md:mt-20 space-y-12 md:space-y-24">
            {categories.map((cat) => {
              const productsInCat = filtered.filter(p => p.categoryName === cat);
              if (productsInCat.length === 0) return null;

              return (
                <section key={cat}>
                  <div className="flex items-center gap-3 md:gap-6 mb-6 md:mb-10 border-b border-black/5 pb-4 md:pb-6">
                    <h2 className="font-display text-2xl md:text-5xl font-bold text-black">{cat}</h2>
                    <div className="h-[1px] flex-1 bg-black/10" />
                    <span className="font-body text-[9px] md:text-sm font-bold text-black/40 tracking-widest uppercase">
                      {productsInCat.length} {t.product.items}
                    </span>
                  </div>

                  <div className="grid gap-x-2 md:gap-x-8 gap-y-3 md:gap-y-12 grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 justify-items-center">
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
                          onOrderNow={(p) => orderNow(p)}
                        />
                      </motion.div>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>

        {filtered.length === 0 && (
          <div className="py-32 text-center">
            <div className="text-6xl mb-6 opacity-30">🔍</div>
            <p className="font-display text-3xl text-black">{t.product.noProducts}</p>
            <p className="text-black/50 mt-2">{t.product.tryAdjusting}</p>
            <button 
                onClick={() => { setQ(""); setBrand(t.product.all); setMaxPrice(5000); }} 
                className="mt-8 text-black underline font-bold underline-offset-4"
            >
                {t.product.resetFilters}
            </button>
          </div>
        )}
      </main>

      <ProductQuickViewModal
        product={quickView}
        onClose={() => setQuickView(null)}
        onAddToCart={(p) => addToCart(p)}
        onOrderNow={(p) => orderNow(p)}
        onMoreDetails={(productId) => router.push(`/products/${productId}`)}
      />
    </div>
  );
}
