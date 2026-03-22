"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { BrandMarquee } from "@/components/BrandMarquee";
import { CategorySection } from "@/components/CategorySection";
import { Hero } from "@/components/Hero";
import { Navbar } from "@/components/Navbar";
import { NoticeBoard } from "@/components/NoticeBoard";
import { ProductCard } from "@/components/ProductCard";
import { ProductQuickViewModal } from "@/components/ProductQuickViewModal";
import { Footer } from "@/components/Footer";
import { useCartStore } from "@/lib/cart-store";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { Loader2, Filter, X, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { AuthModal } from "@/components/AuthModal";
import { useSession } from "next-auth/react";
import { Price } from "@/components/Price";
import { AnimatePresence, motion } from "framer-motion";
import { OfferBannersSection } from "@/components/OfferBannersSection";
import { BlogShowcase } from "@/components/BlogShowcase";
import { useLanguageStore } from "@/lib/language-store";
import { translations } from "@/lib/translations";
import { useCurrencyStore } from "@/lib/currency-store";

export default function HomeClient({ initialProducts }: { initialProducts: any[] }) {
  const [products, setProducts] = useState<any[]>(initialProducts || []);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState<string>("All");
  const [brand, setBrand] = useState<string>("All");
  const [maxPrice, setMaxPrice] = useState<number>(5000);
  const [quickView, setQuickView] = useState<any | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [hotSliderIndex, setHotSliderIndex] = useState(0);
  const [newArrivalsSliderIndex, setNewArrivalsSliderIndex] = useState(0);
  const hotSliderRef = useRef<HTMLDivElement>(null);
  const newArrivalsSliderRef = useRef<HTMLDivElement>(null);
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
    <div className="min-h-screen relative z-0 flex flex-col overflow-x-hidden">
      <NoticeBoard />
      <Navbar />

      <Hero />

      <CategorySection
        onPick={(c) => {
          setCategory(c);
          document.getElementById("products")?.scrollIntoView({ behavior: "smooth", block: "start" });
        }}
      />

      {/* Offer Banners Section */}
      <OfferBannersSection />

      <main className="mx-auto max-w-7xl px-6 pb-20 flex-1">
            {/* Hot Products Slider */}
            {hot.length > 0 && (
              <section id="hot" className="pt-20">
                <div className="text-center mb-12">
                  <div className="inline-flex items-center gap-2 glass-panel rounded-full px-5 py-2 mb-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-black/60">🔥 HOT</span>
                  </div>
                  <h2 className="font-display text-4xl md:text-5xl text-black mt-2 font-black">{t.home.trendingNow}</h2>
                  <p className="font-body text-black/70 mt-3 text-lg max-w-2xl mx-auto">{t.home.mostLoved}</p>
                </div>

                <div className="relative">
                  <div className="relative overflow-hidden py-8">
                    <motion.div
                      ref={hotSliderRef}
                      className="flex gap-6 md:gap-8"
                      animate={{ x: `-${hotSliderIndex * 100}%` }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    >
                      {hot.map((p, index) => {
                        const isCenter = index === hotSliderIndex;
                        const distance = Math.abs(index - hotSliderIndex);
                        
                        return (
                          <motion.div
                            key={p.id}
                            className="flex-shrink-0 w-[80%] md:w-[45%] lg:w-[30%]"
                            animate={{
                              scale: isCenter ? 1 : 0.9,
                              opacity: isCenter ? 1 : 0.7 - (distance * 0.2),
                              y: isCenter ? 0 : 10,
                            }}
                            transition={{ type: "spring", stiffness: 300 }}
                          >
                            <div className={isCenter ? "ring-2 ring-black/20 shadow-2xl rounded-2xl" : ""}>
                              <ProductCard
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
                            </div>
                          </motion.div>
                        );
                      })}
                    </motion.div>
                  </div>
                  
                  {/* Navigation Buttons */}
                  <div className="flex justify-center items-center gap-6 mt-12">
                    <button
                      onClick={() => {
                        setHotSliderIndex(Math.max(0, hotSliderIndex - 1));
                      }}
                      className="glass-panel p-4 rounded-full hover:bg-black hover:text-white transition-all shadow-lg hover:shadow-xl"
                      aria-label="Previous slide"
                    >
                      <ChevronLeft size={24} />
                    </button>
                    <div className="flex gap-3">
                      {Array.from({ length: Math.min(hot.length, 5) }).map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setHotSliderIndex(i)}
                          className={`w-3 h-3 rounded-full transition-all ${
                            i === hotSliderIndex ? 'bg-black scale-125' : 'bg-black/20 hover:bg-black/40'
                          }`}
                          aria-label={`Go to slide ${i + 1}`}
                        />
                      ))}
                    </div>
                    <button
                      onClick={() => {
                        setHotSliderIndex(Math.min(hot.length - 1, hotSliderIndex + 1));
                      }}
                      className="glass-panel p-4 rounded-full hover:bg-black hover:text-white transition-all shadow-lg hover:shadow-xl"
                      aria-label="Next slide"
                    >
                      <ChevronRight size={24} />
                    </button>
                  </div>
                </div>
              </section>
            )}

            {/* All Products + Filters */}
            <section id="products" className="pt-24">
              <div className="text-center mb-12">
                <div className="relative z-10">
                  <div className="inline-flex items-center gap-2 glass-panel rounded-full px-5 py-2 mb-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-black/60">🆕 NEW</span>
                  </div>
                  <h2 className="font-display text-4xl md:text-5xl text-black mt-2 font-black">New Arrivals</h2>
                  <p className="font-body text-black/70 mt-3 text-lg max-w-2xl mx-auto">Fresh additions to our collection</p>
                </div>
              </div>

              {/* Filter Row */}
              <div className="flex justify-center mb-10">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-3 px-8 py-4 rounded-full text-xs font-black uppercase tracking-widest transition-all duration-300 shadow-xl hover:shadow-2xl active:scale-95 ${
                    showFilters ? "bg-black text-white" : "glass-panel text-black hover:bg-black hover:text-white"
                  }`}
                >
                  {showFilters ? <X size={16} /> : <Filter size={16} />}
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
                    <div className="glass-panel-heavy rounded-3xl p-5 md:p-6 mb-12 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5 border border-black/10 shadow-lg">
                      <input
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Search products…"
                        className="col-span-2 md:col-span-1 h-12 md:h-13 w-full rounded-2xl bg-black/5 px-5 text-sm md:text-base text-black placeholder:text-black/40 ring-1 ring-black/10 outline-none focus:ring-2 focus:ring-black/30 font-bold transition-all"
                      />

                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="h-12 md:h-13 w-full rounded-2xl bg-black/5 px-5 text-sm md:text-base text-black ring-1 ring-black/10 outline-none focus:ring-2 focus:ring-black/30 font-bold appearance-none cursor-pointer transition-all"
                      >
                        <option value="All">All Categories</option>
                        {categories.filter(c => c !== "All").map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>

                      <select
                        value={brand}
                        onChange={(e) => setBrand(e.target.value)}
                        className="h-12 md:h-13 w-full rounded-2xl bg-black/5 px-5 text-sm md:text-base text-black ring-1 ring-black/10 outline-none focus:ring-2 focus:ring-black/30 font-bold appearance-none cursor-pointer transition-all"
                      >
                        <option value="All">All Brands</option>
                        {brands.filter(b => b !== "All").map((b) => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                      </select>

                      <div className="flex items-center gap-5 px-3 h-12 md:h-13">
                        <div className="font-bold text-xs md:text-sm text-black/70 min-w-[70px] md:min-w-[80px]">Max <Price amount={maxPrice} /></div>
                        <input
                          type="range"
                          min={0}
                          max={5000}
                          step={10}
                          value={maxPrice}
                          onChange={(e) => setMaxPrice(Number(e.target.value))}
                          className="w-full accent-black cursor-pointer h-2 rounded-full"
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

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
}
