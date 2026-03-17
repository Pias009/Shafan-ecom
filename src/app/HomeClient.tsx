"use client";

import { useMemo, useState } from "react";
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
import { Loader2, Filter, X, ArrowRight } from "lucide-react";
import { Price } from "@/components/Price";
import { AnimatePresence, motion } from "framer-motion";
import { OfferBannersSection } from "@/components/OfferBannersSection";
import { BlogShowcase } from "@/components/BlogShowcase";
import { useLanguageStore } from "@/lib/language-store";
import { translations } from "@/lib/translations";

export default function HomeClient({ initialProducts }: { initialProducts: any[] }) {
  const [products] = useState<any[]>(initialProducts || []);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState<string>("All");
  const [brand, setBrand] = useState<string>("All");
  const [maxPrice, setMaxPrice] = useState<number>(5000);
  const [quickView, setQuickView] = useState<any | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const { addItem, hasAddress } = useCartStore();
  const router = useRouter();



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

  const { currentLanguage } = useLanguageStore();
  const t = translations[currentLanguage.code as keyof typeof translations];

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

      {/* Offer Banners Section */}
      <OfferBannersSection />

      <main className="mx-auto max-w-7xl px-6 pb-20">
            {/* Hot Products */}
            {hot.length > 0 && (
              <section id="hot" className="pt-16">
                <div className="text-center mb-10">
                  <p className="font-body text-xs font-bold uppercase tracking-[0.25em] text-black/60">
                    {t.home.hotProducts}
                  </p>
                  <h2 className="font-display text-4xl text-black mt-2 font-bold">{t.home.trendingNow}</h2>
                  <p className="font-body text-black/70 mt-2 font-medium">{t.home.mostLoved}</p>
                </div>

                <div className="grid gap-3 md:gap-6 grid-cols-2 md:grid-cols-3">
                  {hot.map((p) => (
                    <ProductCard
                      key={p.id}
                      product={{
                        ...p,
                        price: p.priceCents / 100,
                        imageUrl: p.mainImage,
                        brand: p.brand?.name,
                        averageRating: p.averageRating,
                        ratingCount: p.ratingCount,
                        stockQuantity: p.stockQuantity,
                        totalSales: p.totalSales,
                      }}
                      onQuickView={(pp) => setQuickView(pp)}
                      onAddToCart={(pp) => addToCart(pp)}
                      onOrderNow={(pp) => orderNow(pp)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* All Products + Filters */}
            <section id="products" className="pt-20">
              <div className="text-center mb-10">
                <div className="relative z-10">
                  <p className="font-body text-xs font-bold uppercase tracking-[0.25em] text-black/60">
                    All products
                  </p>
                  <h2 className="font-display text-4xl text-black mt-2 font-bold">New Arrivals</h2>
                  <p className="font-body text-black/70 mt-2 font-medium">Fresh additions to our collection</p>
                </div>
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
                {filtered.slice(0, 15).map((p) => (
                  <ProductCard
                    key={p.id}
                    product={{
                      ...p,
                      price: p.regularPriceCents / 100,
                      discountPrice: p.salePriceCents ? p.salePriceCents / 100 : undefined,
                      imageUrl: p.mainImage,
                      brand: p.brand?.name,
                      averageRating: p.averageRating,
                      ratingCount: p.ratingCount,
                      stockQuantity: p.stockQuantity,
                      totalSales: p.totalSales,
                    }}
                    onQuickView={(pp) => setQuickView(pp)}
                    onAddToCart={(pp) => addToCart(pp)}
                    onOrderNow={(pp) => orderNow(pp)}
                  />
                ))}
              </div>

              {filtered.length > 15 && (
                <div className="mt-12 flex justify-center">
                  <button
                    onClick={() => router.push("/products")}
                    className="group flex flex-col items-center gap-3 transition-all duration-300 hover:scale-[1.05]"
                  >
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-black/5 border border-black/10 group-hover:bg-black group-hover:text-white transition-colors">
                      <ArrowRight className="w-6 h-6" />
                    </div>
                    <span className="font-bold text-xs uppercase tracking-widest text-black/60 group-hover:text-black">
                      See All Products
                    </span>
                  </button>
                </div>
              )}

              {filtered.length === 0 && (
                <p className="text-center font-bold text-black/50 mt-12 italic">
                  No products found. Try adjusting your filters.
                </p>
              )}
            </section>
      </main>

      {/* Blog Showcase Section */}
      <BlogShowcase />

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
