"use client";

import { useMemo, useState, useEffect } from "react";
import { BrandMarquee } from "@/components/BrandMarquee";
import { CategorySection } from "@/components/CategorySection";
import { Hero } from "@/components/Hero";
import { ProductCard } from "@/components/ProductCard";
import { HomeProductCard } from "@/components/HomeProductCard";
import { ProductQuickViewModal } from "@/components/ProductQuickViewModal";
import { TrendingNowSlider } from "@/components/TrendingNowSlider";
import { useCartStore } from "@/lib/cart-store";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { Loader2, Filter, X, ArrowRight, Flame } from "lucide-react";
import { AuthModal } from "@/components/AuthModal";
import { useSession } from "next-auth/react";
import { Price } from "@/components/Price";
import { AnimatePresence, motion } from "framer-motion";
import { OfferBannersSection } from "@/components/OfferBannersSection";
import { BlogShowcase } from "@/components/BlogShowcase";
import { useLanguageStore } from "@/lib/language-store";
import { translations } from "@/lib/translations";
import { useCurrencyStore } from "@/lib/currency-store";

export default function HomeClient({ initialProducts, newArrivals = [] }: { initialProducts: any[], newArrivals?: any[] }) {
  const [products, setProducts] = useState<any[]>(initialProducts || []);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState<string>("All");
  const [brand, setBrand] = useState<string>("All");
  const [maxPrice, setMaxPrice] = useState<number>(5000);
  const [quickView, setQuickView] = useState<any | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const { status } = useSession();

  const { addItem, hasAddress } = useCartStore();
  const router = useRouter();
  const { setCurrency } = useCurrencyStore();

  useEffect(() => {
    async function detectCountry() {
      try {
        // 1. Check if store_code is already in cookies (set by middleware)
        const getCookie = (name: string) => {
          if (typeof document === 'undefined') return null;
          const value = `; ${document.cookie}`;
          const parts = value.split(`; ${name}=`);
          if (parts.length === 2) return parts.pop()?.split(';').shift();
          return null;
        };

        const storeCode = getCookie('store_code');
        const cached = localStorage.getItem("user_country");

        if (storeCode === "KUW" || cached === "KW") {
          setCurrency("KWD");
          const res = await fetch("/api/products?store=KUW");
          if (res.ok) {
            const data = await res.json();
            if (data.length > 0) setProducts(data);
          }
          if (storeCode === "KUW") localStorage.setItem("user_country", "KW");
          return;
        }

        // 2. If no cookie, try a silent local check or just default to global
        // Avoiding external ipapi.co to prevent "Failed to fetch" errors.
        // The middleware will eventually set the cookie on next refresh.
        
      } catch (err) {
        // Silently fail, defaulting to initialProducts from server
        console.debug("Geo sync skipped", err);
      }
    }
    detectCountry();
  }, [setCurrency]);

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
    if (status !== "authenticated") {
      setAuthOpen(true);
      return;
    }

    if (!hasAddress) {
      toast.error("Please add your shipping address in Dashboard first!", { duration: 3000 });
      router.push(`/account/address?redirect=order&productId=${product.id}`);
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
    <div className="min-h-screen relative z-0 flex flex-col overflow-x-hidden w-full max-w-full">
      {/* NoticeBoard and Navbar handled globally */}
      <Hero />

      <CategorySection
        onPick={(c) => {
          setCategory(c);
          document.getElementById("products")?.scrollIntoView({ behavior: "smooth", block: "start" });
        }}
      />

      {/* Offer Banners Section */}
      <OfferBannersSection />

      <main className="mx-auto max-w-7xl w-full px-4 sm:px-6 pb-20 flex-1 overflow-x-hidden">

            {/* New Arrivals Section */}
            {newArrivals.length > 0 && (
              <section className="py-12 md:py-20 w-full overflow-hidden">
                <div className="text-center mb-8 md:mb-12 px-4 sm:px-6 md:px-0">
                  <div className="relative z-10 w-full">
                    <div className="inline-flex items-center gap-2 glass-panel rounded-full px-3 sm:px-5 py-2 mb-4">
                      <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-black/60">🆕 NEW ARRIVALS</span>
                    </div>
                    <h2 className="font-display text-lg sm:text-xl md:text-4xl lg:text-5xl text-black mt-2 font-black leading-tight break-words">Fresh From The Shelf</h2>
                    <p className="font-body text-black/70 mt-3 text-sm sm:text-base md:text-lg max-w-2xl mx-auto px-4 sm:px-0">Discover our latest additions, just arrived</p>
                  </div>
                </div>

                {/* 4 Products in Column Layout */}
                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5 lg:gap-6 px-4 sm:px-6 md:px-0 w-full">
                  {newArrivals.slice(0, 4).map((product, index) => (
                    <HomeProductCard
                      key={product.id}
                      product={{
                        ...product,
                        price: product.regularPriceCents / 100,
                        discountPrice: product.salePriceCents ? product.salePriceCents / 100 : undefined,
                        imageUrl: product.mainImage,
                        brand: product.brand?.name,
                        averageRating: product.averageRating,
                        ratingCount: product.ratingCount,
                        stockQuantity: product.stockQuantity,
                        totalSales: product.totalSales,
                      }}
                      onQuickView={(pp) => setQuickView(pp)}
                      onAddToCart={(pp) => addToCart(pp)}
                      onOrderNow={(pp) => orderNow(pp)}
                    />
                  ))}
                </div>
              </section>
            )}

            {hot.length > 0 && (
              <TrendingNowSlider
                products={hot}
                onQuickView={(pp) => setQuickView(pp)}
                onAddToCart={(pp) => addToCart(pp)}
                onOrderNow={(pp) => orderNow(pp)}
              />
            )}



            {/* All Products + Filters */}
            <section id="products" className="pt-12 md:pt-24">
              <div className="text-center mb-8 md:mb-12">
                <div className="relative z-10">
                  <div className="inline-flex items-center gap-2 glass-panel rounded-full px-5 py-2 mb-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-black/60">🆕 NEW</span>
                  </div>
                  <h2 className="font-display text-2xl sm:text-4xl md:text-5xl text-black mt-2 font-black">New Arrivals</h2>
                  <p className="font-body text-black/70 mt-3 text-base sm:text-lg max-w-2xl mx-auto px-4">Fresh additions to our collection</p>
                </div>
              </div>

              {/* Filter Row */}
              <div className="flex justify-center mb-8 md:mb-10">
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
                    className="overflow-hidden mb-12"
                  >
                    <div className="glass-panel rounded-[2rem] p-3 md:p-4 grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-6 items-stretch md:items-end shadow-lg border border-black/5">
                      <div className="col-span-2 md:col-span-1">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-black/30 mb-1.5 px-2">
                          Search
                        </label>
                        <input
                          type="text"
                          value={q}
                          onChange={(e) => setQ(e.target.value)}
                          placeholder="Search products…"
                          className="h-10 md:h-12 w-full bg-white/50 border-none rounded-2xl px-5 text-black font-body text-xs md:text-sm focus:ring-2 focus:ring-black outline-none placeholder:text-black/20"
                        />
                      </div>

                      <div className="w-full md:w-[150px]">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-black/30 mb-1.5 px-2">
                          Category
                        </label>
                        <select
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          className="h-10 md:h-12 w-full bg-white/50 border-none rounded-2xl px-5 text-black font-body text-xs md:text-sm focus:ring-2 focus:ring-black outline-none cursor-pointer appearance-none"
                        >
                          <option value="All">All Categories</option>
                          {categories.filter(c => c !== "All").map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>

                      <div className="w-full md:w-[150px]">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-black/30 mb-1.5 px-2">
                          Brand
                        </label>
                        <select
                          value={brand}
                          onChange={(e) => setBrand(e.target.value)}
                          className="h-10 md:h-12 w-full bg-white/50 border-none rounded-2xl px-5 text-black font-body text-xs md:text-sm focus:ring-2 focus:ring-black outline-none cursor-pointer appearance-none"
                        >
                          <option value="All">All Brands</option>
                          {brands.filter(b => b !== "All").map((b) => (
                            <option key={b} value={b}>{b}</option>
                          ))}
                        </select>
                      </div>

                      <div className="w-full md:w-[220px]">
                        <div className="flex justify-between items-center mb-1.5 px-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-black/30">
                            Max Price
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

              <div className="w-full flex justify-center overflow-x-hidden">
                <div className="grid gap-3 sm:gap-4 md:gap-5 lg:gap-6 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 w-full max-w-7xl px-3 sm:px-4">
                  {filtered.slice(0, 10).map((p, idx) => (
                    <HomeProductCard
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
              </div>

              {filtered.length > 10 && (
                <div className="mt-16 flex justify-center">
                  <button
                    onClick={() => router.push("/products")}
                    className="group flex flex-col items-center gap-4 transition-all duration-300 hover:scale-[1.05]"
                  >
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-black/5 border-2 border-black/10 group-hover:bg-black group-hover:text-white group-hover:border-black transition-all duration-300">
                      <ArrowRight className="w-8 h-8" />
                    </div>
                    <span className="font-bold text-sm uppercase tracking-widest text-black/60 group-hover:text-black transition-colors">
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

      {/* Brand Slider Section - Moved above footer */}
      <BrandMarquee />

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
        onMoreDetails={(productId) => router.push(`/products/${productId}`)}
      />

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
}
