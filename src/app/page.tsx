"use client";

import { useMemo, useState, useEffect } from "react";
import { BannerSlider } from "@/components/BannerSlider";
import { CategorySection } from "@/components/CategorySection";
import { Hero } from "@/components/Hero";
import { Navbar } from "@/components/Navbar";
import { ProductCard } from "@/components/ProductCard";
import { ProductQuickViewModal } from "@/components/ProductQuickViewModal";
import { Footer } from "@/components/Footer";
import { useCartStore } from "@/lib/cart-store";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { Loader2, Filter, X } from "lucide-react";
import { Price } from "@/components/Price";
import { AnimatePresence, motion } from "framer-motion";

export default function Home() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState<string>("All");
  const [brand, setBrand] = useState<string>("All");
  const [maxPrice, setMaxPrice] = useState<number>(5000);
  const [quickView, setQuickView] = useState<any | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const { addItem, hasAddress } = useCartStore();
  const router = useRouter();

  useEffect(() => {
    async function loadProducts() {
      try {
        const res = await fetch("/api/products");
        const data = await res.json();
        setProducts(data);
      } catch (error) {
        console.error("Failed to load products:", error);
        toast.error("Failed to load products");
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, []);

  const brands = useMemo(() => {
    const set = new Set(products.map((p) => p.brand?.name).filter(Boolean));
    return ["All", ...Array.from(set).sort()];
  }, [products]);

  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category?.name).filter(Boolean));
    return ["All", ...Array.from(set).sort()];
  }, [products]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return products.filter((p) => {
      const price = p.priceCents / 100;
      if (price > maxPrice) return false;
      if (category !== "All" && p.category?.name !== category) return false;
      if (brand !== "All" && p.brand?.name !== brand) return false;
      if (!query) return true;
      return (
        p.name.toLowerCase().includes(query) ||
        p.brand?.name?.toLowerCase().includes(query) ||
        p.category?.name?.toLowerCase().includes(query)
      );
    });
  }, [q, category, brand, maxPrice, products]);

  const hot = useMemo(() => products.filter((p) => p.hot), [products]);

  function addToCart(product: any) {
    const cartItem = {
      id: product.id,
      name: product.name,
      brand: product.brand?.name || product.brand || "Generic",
      category: product.category?.name || product.category || "General",
      price: product.price ?? product.priceCents / 100,
      imageUrl: product.mainImage || product.imageUrl || "/placeholder-product.png",
    };
    addItem(cartItem, 1);
    toast.success(`Added ${product.name} to cart`);
  }

  async function orderNow(product: any) {
    if (!hasAddress) {
      toast.error("Please add your shipping address in Dashboard first!", { duration: 3000 });
      router.push("/account/address");
      return;
    }

    const tid = toast.loading("Preparing your order...");
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
        toast.success("Redirecting to payment...", { id: tid });
        router.push(`/checkout/payment/${data.orderId}`);
      } else {
        throw new Error(data.error || "Failed to create order");
      }
    } catch (err: any) {
      toast.error(err.message, { id: tid });
      // Fallback to cart if something goes wrong
      addToCart(product);
      router.push("/cart");
    }
  }

  return (
    <AnimatePresence mode="wait">
      {loading ? (
        <motion.div
           key="loader"
           initial={{ opacity: 1 }}
           exit={{ opacity: 0 }}
           transition={{ duration: 0.5 }}
           className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#f8f5f0]"
        >
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="flex flex-col items-center"
          >
             <div className="relative w-20 h-20 mb-6">
                <div className="absolute inset-0 border-[3px] border-black/10 rounded-full"></div>
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 border-[3px] border-black rounded-full border-t-transparent"
                ></motion.div>
                <div className="absolute inset-0 flex items-center justify-center text-xl">✨</div>
             </div>
             <h1 className="font-display text-3xl font-black tracking-tighter text-black mb-2 uppercase">
               Shafan Global
             </h1>
             <p className="font-body text-[10px] font-black uppercase tracking-[0.4em] text-black/40">
               Organizing Collection
             </p>
          </motion.div>
        </motion.div>
      ) : (
        <motion.div 
           key="content"
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           transition={{ duration: 0.5 }}
           className="min-h-screen relative z-0"
        >
          <Navbar />

      <Hero />

      <BannerSlider />

      <CategorySection
        onPick={(c) => {
          setCategory(c);
          document.getElementById("products")?.scrollIntoView({ behavior: "smooth", block: "start" });
        }}
      />

      <main className="mx-auto max-w-7xl px-6 pb-20">
            {/* Hot Products */}
            {hot.length > 0 && (
              <section id="hot" className="pt-16">
                <div className="text-center mb-10">
                  <p className="font-body text-xs font-bold uppercase tracking-[0.25em] text-black/60">
                    Hot products
                  </p>
                  <h2 className="font-display text-4xl text-black mt-2 font-bold">Trending Now</h2>
                  <p className="font-body text-black/70 mt-2 font-medium">Our most loved products</p>
                </div>

                <div className="grid gap-3 md:gap-6 grid-cols-2 md:grid-cols-3">
                  {hot.map((p) => (
                    <ProductCard
                      key={p.id}
                      product={{
                        ...p,
                        price: p.priceCents / 100,
                        imageUrl: p.mainImage
                      }}
                      onQuickView={(pp) => setQuickView(pp)}
                      onAddToCart={(pp) => addToCart(pp)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* All Products + Filters */}
            <section id="products" className="pt-20">
              <div className="text-center mb-10">
                <p className="font-body text-xs font-bold uppercase tracking-[0.25em] text-black/60">
                  All products
                </p>
                <h2 className="font-display text-4xl text-black mt-2 font-bold">New Arrivals</h2>
                <p className="font-body text-black/70 mt-2 font-medium">Fresh additions to our collection</p>
              </div>

              {/* Filter Row */}
              <div className="flex justify-center mb-8">
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

              {/* Filter bar */}
              <AnimatePresence>
                {showFilters && (
                  <motion.div
                    initial={{ opacity: 0, y: -20, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{ opacity: 0, y: -20, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="glass-panel-heavy rounded-[2rem] p-3 md:p-5 mb-10 grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 border border-black/5">
                      <input
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Search…"
                        className="col-span-2 md:col-span-1 h-10 md:h-11 w-full rounded-2xl bg-black/5 px-4 text-xs md:text-sm text-black placeholder:text-black/40 ring-1 ring-black/10 outline-none focus:ring-black/25 font-bold"
                      />

                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="h-10 md:h-11 w-full rounded-2xl bg-black/5 px-4 text-xs md:text-sm text-black ring-1 ring-black/10 outline-none focus:ring-black/25 font-bold appearance-none cursor-pointer"
                      >
                        <option value="All">All Categories</option>
                        {categories.filter(c => c !== "All").map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>

                      <select
                        value={brand}
                        onChange={(e) => setBrand(e.target.value)}
                        className="h-10 md:h-11 w-full rounded-2xl bg-black/5 px-4 text-xs md:text-sm text-black ring-1 ring-black/10 outline-none focus:ring-black/25 font-bold appearance-none cursor-pointer"
                      >
                        <option value="All">All Brands</option>
                        {brands.filter(b => b !== "All").map((b) => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                      </select>

                      <div className="flex items-center gap-4 px-2 h-10 md:h-11">
                        <div className="font-bold text-[10px] md:text-xs text-black/70 min-w-[60px] md:min-w-[70px]">Max <Price amount={maxPrice} /></div>
                        <input
                          type="range"
                          min={0}
                          max={5000}
                          step={10}
                          value={maxPrice}
                          onChange={(e) => setMaxPrice(Number(e.target.value))}
                          className="w-full accent-black cursor-pointer h-1.5"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="grid gap-3 md:gap-6 grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filtered.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={{
                      ...p,
                      price: p.regularPriceCents / 100,
                      discountPrice: p.salePriceCents ? p.salePriceCents / 100 : undefined,
                      imageUrl: p.mainImage,
                      brand: p.brand?.name,
                    }}
                    onQuickView={(pp) => setQuickView(pp)}
                    onAddToCart={(pp) => addToCart(pp)}
                  />
                ))}
              </div>

              {filtered.length === 0 && (
                <p className="text-center font-bold text-black/50 mt-12 italic">
                  No products found. Try adjusting your filters.
                </p>
              )}
            </section>
      </main>

      <Footer />

      <ProductQuickViewModal
        product={quickView ? {
          ...quickView,
          price: quickView.priceCents / 100,
          imageUrl: quickView.mainImage,
          brand: quickView.brand?.name
        } : null}
        onClose={() => setQuickView(null)}
        onAddToCart={(p) => addToCart(p)}
        onOrderNow={(p) => orderNow(p)}
      />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
