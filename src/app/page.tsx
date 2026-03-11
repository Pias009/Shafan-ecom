"use client";

import { useMemo, useState } from "react";
import { BannerSlider } from "@/components/BannerSlider";
import { BrandMarquee } from "@/components/BrandMarquee";
import { CategorySection } from "@/components/CategorySection";
import { Hero } from "@/components/Hero";
import { Navbar } from "@/components/Navbar";
import { ProductCard } from "@/components/ProductCard";
import { ProductQuickViewModal } from "@/components/ProductQuickViewModal";
import { demoProducts, type DemoProduct } from "@/lib/demo-data";

export default function Home() {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState<string>("All");
  const [brand, setBrand] = useState<string>("All");
  const [maxPrice, setMaxPrice] = useState<number>(999);
  const [quickView, setQuickView] = useState<DemoProduct | null>(null);

  const brands = useMemo(() => {
    const set = new Set(demoProducts.map((p) => p.brand));
    return ["All", ...Array.from(set).sort()];
  }, []);

  const categories = useMemo(() => {
    const set = new Set(demoProducts.map((p) => p.category));
    return ["All", ...Array.from(set).sort()];
  }, []);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return demoProducts.filter((p) => {
      const price = p.discountPrice ?? p.price;
      if (price > maxPrice) return false;
      if (category !== "All" && p.category !== category) return false;
      if (brand !== "All" && p.brand !== brand) return false;
      if (!query) return true;
      return (
        p.name.toLowerCase().includes(query) ||
        p.brand.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query)
      );
    });
  }, [q, category, brand, maxPrice]);

  const hot = useMemo(() => demoProducts.filter((p) => p.hot), []);

  function addToCart(product: DemoProduct) {
    // TODO: replace with real cart store + DB
    alert(`Added to cart: ${product.name}`);
  }

  function orderNow(product: DemoProduct) {
    addToCart(product);
    // TODO: navigate to /cart
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <Hero />
      <BannerSlider />
      <BrandMarquee />

      <CategorySection
        onPick={(c) => {
          setCategory(c);
          document.getElementById("products")?.scrollIntoView({ behavior: "smooth", block: "start" });
        }}
      />

      <main className="mx-auto max-w-6xl px-4 pb-16 pt-10">
        <section id="hot">
          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="text-xs font-medium uppercase tracking-[0.25em] text-white/60">
                Hot products
              </div>
              <div className="mt-2 text-2xl font-semibold tracking-tight text-white">
                Trending right now
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {hot.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                onQuickView={(pp) => setQuickView(pp)}
                onAddToCart={(pp) => addToCart(pp)}
              />
            ))}
          </div>
        </section>

        <section id="products" className="pt-12">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="text-xs font-medium uppercase tracking-[0.25em] text-white/60">
                All products
              </div>
              <div className="mt-2 text-2xl font-semibold tracking-tight text-white">
                Filter live by name, category, price, brands
              </div>
            </div>

            <div className="glass glass-3d ring-icy grid w-full gap-3 rounded-3xl p-4 md:max-w-3xl md:grid-cols-4">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search name / brand…"
                className="h-10 w-full rounded-2xl bg-white/5 px-3 text-sm text-white placeholder:text-white/40 ring-1 ring-white/10 outline-none focus:ring-white/25"
              />

              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="h-10 w-full rounded-2xl bg-white/5 px-3 text-sm text-white ring-1 ring-white/10 outline-none focus:ring-white/25"
              >
                {categories.map((c) => (
                  <option key={c} value={c} className="bg-black">
                    {c}
                  </option>
                ))}
              </select>

              <select
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="h-10 w-full rounded-2xl bg-white/5 px-3 text-sm text-white ring-1 ring-white/10 outline-none focus:ring-white/25"
              >
                {brands.map((b) => (
                  <option key={b} value={b} className="bg-black">
                    {b}
                  </option>
                ))}
              </select>

              <div className="flex items-center gap-3">
                <div className="text-xs text-white/65">${maxPrice}</div>
                <input
                  type="range"
                  min={5}
                  max={150}
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-full accent-white"
                />
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                onQuickView={(pp) => setQuickView(pp)}
                onAddToCart={(pp) => addToCart(pp)}
              />
            ))}
          </div>
        </section>
      </main>

      <ProductQuickViewModal
        product={quickView}
        onClose={() => setQuickView(null)}
        onAddToCart={(p) => addToCart(p)}
        onOrderNow={(p) => orderNow(p)}
      />
    </div>
  );
}
