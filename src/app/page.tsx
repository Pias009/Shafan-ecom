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
import { Loader2 } from "lucide-react";
import { Price } from "@/components/Price";

export default function Home() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState<string>("All");
  const [brand, setBrand] = useState<string>("All");
  const [maxPrice, setMaxPrice] = useState<number>(5000);
  const [quickView, setQuickView] = useState<any | null>(null);

  const addItem = useCartStore((state) => state.addItem);
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
    // Map internal product structure to what cart store expects if different
    const cartItem = {
      id: product.id,
      name: product.name,
      brand: product.brand?.name || "Generic",
      category: product.category?.name || "General",
      price: product.priceCents / 100,
      imageUrl: product.mainImage || "/placeholder-product.png",
    };
    addItem(cartItem, 1);
    toast.success(`Added ${product.name} to cart`);
  }

  function orderNow(product: any) {
    addToCart(product);
    router.push("/cart");
  }

  return (
    <div className="min-h-screen relative z-0">
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
        {loading ? (
          <div className="flex flex-col items-center justify-center py-40">
            <Loader2 className="w-10 h-10 animate-spin text-black/20" />
            <p className="mt-4 font-body text-xs font-bold uppercase tracking-widest text-black/30">
              Loading Products...
            </p>
          </div>
        ) : (
          <>
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

                <div className="grid gap-6 md:grid-cols-3">
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

              {/* Filter bar */}
              <div className="glass-panel-heavy rounded-3xl p-5 mb-8 grid gap-4 md:grid-cols-4 border border-black/5">
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search name / brand…"
                  className="h-11 w-full rounded-2xl bg-black/5 px-4 text-sm text-black placeholder:text-black/40 ring-1 ring-black/10 outline-none focus:ring-black/25 font-bold"
                />

                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="h-11 w-full rounded-2xl bg-black/5 px-4 text-sm text-black ring-1 ring-black/10 outline-none focus:ring-black/25 font-bold appearance-none cursor-pointer"
                >
                  <option value="All">All Categories</option>
                  {categories.filter(c => c !== "All").map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>

                <select
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="h-11 w-full rounded-2xl bg-black/5 px-4 text-sm text-black ring-1 ring-black/10 outline-none focus:ring-black/25 font-bold appearance-none cursor-pointer"
                >
                  <option value="All">All Brands</option>
                  {brands.filter(b => b !== "All").map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>

                <div className="flex items-center gap-4 px-2">
                  <div className="font-bold text-xs text-black/70 min-w-[70px]">Max <Price amount={maxPrice} /></div>
                  <input
                    type="range"
                    min={0}
                    max={5000}
                    step={10}
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                    className="w-full accent-black cursor-pointer"
                  />
                </div>
              </div>

              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filtered.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={{
                      ...p,
                      price: p.priceCents / 100,
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
          </>
        )}
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
    </div>
  );
}
