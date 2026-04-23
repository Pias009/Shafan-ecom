"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { ProductsSlider } from "@/components/ProductsSlider";
import { ProductCard } from "@/components/ProductCard";
import { ProductQuickViewModal } from "@/components/ProductQuickViewModal";
import { useCartStore } from "@/lib/cart-store";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Filter, X, Loader2, Flame } from "lucide-react";
import { Price } from "@/components/Price";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { useLanguageStore } from "@/lib/language-store";
import { translations } from "@/lib/translations";
import { useCountryStore } from "@/lib/country-store";
import { hasValidPrice } from "@/lib/product-utils";
import { useSearchStore } from "@/lib/search-store";

const DUMMY_PRODUCT_NAMES = [
  "Icy Gel Cleanser",
  "Glass Skin Serum",
  "Mint Cloud Mist",
  "Silk Glass Shampoo",
  "Mirror Gloss Conditioner",
  "Violet Night Eau",
  "Vitamin C Brightening Serum",
  "Velvet Matte Lipstick",
  "Glow Foundation SPF 15",
  "Crystal Musk",
  "Amber Glow",
  "Silver Cedar Intense"
];

const DUMMY_BRANDS = [
  "HEALTH",
  "MAKEUP",
  "VIOLET LAB",
  "SKYPEARL"
];

const isDummyProduct = (p: any) => {
  const name = (p.name || "").trim().toLowerCase();
  const brand = (typeof (p.brandName || p.brand) === 'string' ? (p.brandName || p.brand) : p.brand?.name || "").trim().toLowerCase();
  
  return DUMMY_PRODUCT_NAMES.some(dn => name.includes(dn.toLowerCase())) || 
         DUMMY_BRANDS.some(db => brand.includes(db.toLowerCase()));
};

export default function ProductsClient({ 
  initialProducts, 
  category, 
  subcategory,
  brand: initialBrand, 
  sort,
  banners = [],
  totalCount = 0,
  currentPage = 1,
  limit = 20,
  isRoutinesPage = false,
  filterOptions,
  isTrending = false,
}: { 
  initialProducts: any[], 
  category?: string, 
  subcategory?: string,
  brand?: string, 
  sort?: string,
  banners?: any[],
  totalCount?: number,
  currentPage?: number,
  limit?: number,
  isRoutinesPage?: boolean,
  filterOptions?: {
    categories: string[];
    subCategories: string[];
    brands: string[];
    skinTones: string[];
    skinConcerns: string[];
  },
  isTrending?: boolean,
}) {
  const [products, setProducts] = useState<any[]>(initialProducts);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialProducts.length === limit);
  const [page, setPage] = useState(currentPage);
  const [brand, setBrand] = useState(initialBrand || "All");
  const [selectedCategory, setSelectedCategory] = useState(category || "All");
  const [selectedSubCategory, setSelectedSubCategory] = useState(subcategory || "All");
  const [selectedSkinTone, setSelectedSkinTone] = useState("All");
  const [selectedSkinConcern, setSelectedSkinConcern] = useState("All");
  const [maxPrice, setMaxPrice] = useState(100000);
  const [sortOrder, setSortOrder] = useState(sort || "newest");
  const [quickView, setQuickView] = useState<any>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const router = useRouter();
  const searchParams = useSearchParams();
  const { query: q, clearQuery } = useSearchStore();
  const isRoutines = isRoutinesPage;
  const [mounted, setMounted] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const { addItem, hasAddress } = useCartStore();
  const { currentLanguage } = useLanguageStore();
  const t = translations[currentLanguage.code as keyof typeof translations];
  const { selectedCountry } = useCountryStore();

  useEffect(() => {
    if (q) {
      setSearchInput(q);
    }
  }, [q]);

  // Sync products when initialProducts change (from server-side navigation)
  useEffect(() => {
    if (initialProducts) {
      setProducts(initialProducts);
      setPage(currentPage);
      setHasMore(initialProducts.length === limit);
      
      // Update local filter states to match URL params from server
      setSelectedCategory(category || "All");
      setBrand(initialBrand || "All");
      setSortOrder(sort || "newest");
    }
  }, [initialProducts, currentPage, limit, category, initialBrand, sort]);

  // Initialize filters from URL params on mount
  useEffect(() => {
    setMounted(true);
    setHydrated(true);
    const params = new URLSearchParams(window.location.search);
    const urlBrand = params.get("brand");
    const urlCategory = params.get("category");
    const urlSubcategory = params.get("subcategory");
    const urlSkinTone = params.get("skinTone");
    const urlConcern = params.get("concern");
    const urlMaxPrice = params.get("maxPrice");
    const urlSort = params.get("sort");
    
    if (urlBrand) setBrand(urlBrand);
    if (urlCategory) setSelectedCategory(urlCategory);
    if (urlSubcategory) setSelectedSubCategory(urlSubcategory);
    if (urlSkinTone) setSelectedSkinTone(urlSkinTone);
    if (urlConcern) setSelectedSkinConcern(urlConcern);
    if (urlMaxPrice) setMaxPrice(Number(urlMaxPrice));
    if (urlSort) setSortOrder(urlSort);
  }, []);

  // React to URL changes (when clicking navbar links)
  useEffect(() => {
    if (!searchParams) return;
    
    const urlBrand = searchParams.get("brand");
    const urlCategory = searchParams.get("category");
    const urlSubcategory = searchParams.get("subcategory");
    const urlSkinTone = searchParams.get("skinTone");
    const urlConcern = searchParams.get("concern");
    const urlMaxPrice = searchParams.get("maxPrice");
    const urlSort = searchParams.get("sort");
    const urlQ = searchParams.get("q");

    if (urlBrand) setBrand(urlBrand);
    if (urlCategory) setSelectedCategory(urlCategory);
    if (urlSubcategory) setSelectedSubCategory(urlSubcategory);
    if (urlSkinTone) setSelectedSkinTone(urlSkinTone);
    if (urlConcern) setSelectedSkinConcern(urlConcern);
    if (urlMaxPrice) setMaxPrice(Number(urlMaxPrice));
    if (urlSort) setSortOrder(urlSort);
    if (urlQ) setSearchInput(urlQ);
  }, [searchParams]);

  // REMOVED clearQuery on unmount as it causes loops during router.replace remounts

  // Sync immediate filters to URL
  useEffect(() => {
    if (!hydrated) return;
    
    const params = new URLSearchParams(window.location.search);
    let changed = false;

    // Immediate filters
    const syncImmediate = (key: string, value: string, defaultValue: string) => {
      if (value && value !== defaultValue) {
        if (params.get(key) !== value) {
          params.set(key, value);
          changed = true;
        }
      } else if (params.has(key)) {
        params.delete(key);
        changed = true;
      }
    };

    syncImmediate("brand", brand, "All");
    syncImmediate("category", selectedCategory, "All");
    syncImmediate("subcategory", selectedSubCategory, "All");
    syncImmediate("skinTone", selectedSkinTone, "All");
    syncImmediate("concern", selectedSkinConcern, "All");
    syncImmediate("sort", sortOrder, "newest");

    if (changed) {
      router.replace(`?${params.toString()}`, { scroll: false });
    }
  }, [brand, selectedCategory, selectedSubCategory, selectedSkinTone, selectedSkinConcern, sortOrder, router, hydrated]);

  // Sync debounced filters (search, price) to URL
  useEffect(() => {
    if (!hydrated) return;
    
    const timer = setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      let changed = false;

      if (searchInput) {
        if (params.get("q") !== searchInput) {
          params.set("q", searchInput);
          changed = true;
        }
      } else if (params.has("q")) {
        params.delete("q");
        changed = true;
      }

      if (maxPrice < 100000) {
        if (params.get("maxPrice") !== maxPrice.toString()) {
          params.set("maxPrice", maxPrice.toString());
          changed = true;
        }
      } else if (params.has("maxPrice")) {
        params.delete("maxPrice");
        changed = true;
      }

      if (changed) {
        router.replace(`?${params.toString()}`, { scroll: false });
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchInput, maxPrice, router, hydrated]);



  const brands = useMemo(() => {
    if (filterOptions?.brands) {
      return [t.product.all, ...[...filterOptions.brands].sort()];
    }
    const set = new Set(products.map(p => p.brandName).filter(Boolean));
    return [t.product.all, ...Array.from(set).sort()];
  }, [products, t.product.all, filterOptions]);

  const categoriesList = useMemo(() => {
    if (filterOptions?.categories) {
      return [t.product.all, ...[...filterOptions.categories].sort()];
    }
    const set = new Set(products.map(p => p.categoryName).filter(Boolean));
    return [t.product.all, ...Array.from(set).sort()];
  }, [products, t.product.all, filterOptions]);

  const subCategories = useMemo(() => {
    if (filterOptions?.subCategories) {
      return ['All', ...[...filterOptions.subCategories].sort()];
    }
    const filteredProducts = selectedCategory === t.product.all 
      ? products 
      : products.filter(p => p.categoryName === selectedCategory);
    const set = new Set(filteredProducts.map(p => p.subCategoryName).filter(Boolean));
    return ['All', ...Array.from(set).sort()];
  }, [products, selectedCategory, t.product.all, filterOptions]);

  const skinTones = useMemo(() => {
    if (filterOptions?.skinTones) {
      return ['All', ...[...filterOptions.skinTones].sort()];
    }
    const filteredProducts = selectedCategory === t.product.all 
      ? products 
      : products.filter(p => p.categoryName === selectedCategory);
    const skinToneSet = new Set<string>();
    filteredProducts.forEach(p => {
      if (p.skinTones && p.skinTones.length > 0) {
        p.skinTones.forEach((st: any) => {
          if (st.name) skinToneSet.add(st.name);
        });
      }
    });
    return ['All', ...Array.from(skinToneSet).sort()];
  }, [products, selectedCategory, t.product.all, filterOptions]);

  const skinConcernsList = useMemo(() => {
    if (filterOptions?.skinConcerns) {
      return ['All', ...[...filterOptions.skinConcerns].sort()];
    }
    const filteredProducts = selectedCategory === t.product.all 
      ? products 
      : products.filter(p => p.categoryName === selectedCategory);
    const concernSet = new Set<string>();
    filteredProducts.forEach(p => {
      if (p.skinConcerns && p.skinConcerns.length > 0) {
        p.skinConcerns.forEach((sc: any) => {
          if (sc.name) concernSet.add(sc.name);
        });
      }
    });
    return ['All', ...Array.from(concernSet).sort()];
  }, [products, selectedCategory, t.product.all, filterOptions]);

  const filtered = useMemo(() => {
    const filtered = products.filter((p) => {
      if (isDummyProduct(p)) return false;
      if (!hasValidPrice(p, selectedCountry)) return false;
      
      const price = p.discountPrice ?? p.price ?? 0;
      const matchesSearch = !searchInput || 
        p.name.toLowerCase().includes(searchInput.toLowerCase()) ||
        (p.brandName || '').toLowerCase().includes(searchInput.toLowerCase()) ||
        (p.categoryName || '').toLowerCase().includes(searchInput.toLowerCase()) ||
        (p.subCategoryName || '').toLowerCase().includes(searchInput.toLowerCase());
      const matchesBrand = brand === t.product.all || (p.brandName || '').toLowerCase() === brand.toLowerCase();
      const matchesPrice = price <= maxPrice;
      const matchesCategory = selectedCategory === t.product.all || 
        (p.categories && p.categories.includes(selectedCategory)) ||
        p.categoryName === selectedCategory;
      const matchesSubCategory = selectedSubCategory === 'All' || p.subCategoryName === selectedSubCategory;
      const matchesSkinTone = selectedSkinTone === 'All' || 
        (p.skinTones && p.skinTones.some((st: any) => st.name === selectedSkinTone));
      const matchesSkinConcern = selectedSkinConcern === 'All' || 
        (p.skinConcerns && p.skinConcerns.some((sc: any) => sc.name === selectedSkinConcern));
      
      return matchesSearch && matchesBrand && matchesPrice && matchesCategory && matchesSubCategory && matchesSkinTone && matchesSkinConcern;
    });

    const sorted = [...filtered].sort((a, b) => {
      if (sortOrder === 'newest') {
        return (b.createdAt || 0) - (a.createdAt || 0);
      }
      if (sortOrder === 'sale') {
        const aHasSale = a.discountPrice ? 1 : 0;
        const bHasSale = b.discountPrice ? 1 : 0;
        return bHasSale - aHasSale;
      }
      if (sortOrder === 'price-low') {
        return (a.price || 0) - (b.price || 0);
      }
      if (sortOrder === 'price-high') {
        return (b.price || 0) - (a.price || 0);
      }
      if (sortOrder === 'rating') {
        return (b.averageRating || 0) - (a.averageRating || 0);
      }
      return 0;
    });

return sorted;
  }, [searchInput, brand, maxPrice, products, t.product.all, selectedCategory, selectedSubCategory, selectedSkinTone, selectedSkinConcern, selectedCountry, isDummyProduct, sortOrder]);


  function addToCart(product: any) {
    const cartItem = {
      id: product.id,
      name: product.name,
      brand: product.brandName,
      category: product.categoryName,
      price: product.price,
      discountPrice: product.salePrice || undefined,
      imageUrl: product.imageUrl,
      countryPrices: product.countryPrices,
    };
    addItem(cartItem, 1);
    toast.success(`${product.name} added`);
  }

  async function orderNow(product: any) {
    if (!hasAddress) {
      toast.error(t.cart.addressRequired, { duration: 3000 });
      router.push("/account/address?redirect=/products");
      return;
    }

    const tid = toast.loading(t.cart.creatingOrder);
    try {
      const countryPrice = product.countryPrices?.find((cp: any) =>
        cp.country.toUpperCase() === selectedCountry.toUpperCase()
      );
      const unitPrice = countryPrice && Number(countryPrice.price) > 0
        ? Number(countryPrice.price)
        : (product.discountPrice ?? product.price);

      let billing = null;
      let shipping = null;

      try {
        const addressRes = await fetch("/api/account/address");
        if (addressRes.ok) {
          const addressData = await addressRes.json();
          if (addressData) {
            billing = addressData;
            shipping = addressData;
          }
        }
      } catch (e) {}

      if (!billing) {
        const guestStr = localStorage.getItem('guest_address');
        if (guestStr) {
          try {
            const guestData = JSON.parse(guestStr);
            billing = guestData;
            shipping = guestData;
          } catch (e) {}
        }
      }

      if (!billing) {
        toast.error("Please provide your shipping address", { id: tid });
        router.push("/account/address?redirect=/products");
        return;
      }

      const res = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          items: [{ 
            productId: product.id, 
            quantity: 1,
            unitPrice,
            price: unitPrice
          }],
          country: selectedCountry,
          billing,
          shipping
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

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const nextPage = page + 1;
      const res = await fetch(`/api/products?page=${nextPage}&limit=${limit}`);
      const newProducts = await res.json();
      if (newProducts.length > 0) {
        const transformedNew = newProducts.map((p: any) => ({
          ...p,
          brandName: p.brandName || p.brand?.name || "Generic",
          categoryName: p.categoryName || p.category?.name || "General",
          imageUrl: p.imageUrl || p.mainImage,
          images: p.images || []
        }));
        setProducts(prev => [...prev, ...transformedNew]);
        setPage(nextPage);
        setHasMore(newProducts.length === limit);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Failed to load more products:", error);
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, page, limit]);

  // Auto-load more if current filters result in 0 products but more exist on server
  // Only auto-load if NO filters are applied (otherwise it causes infinite loop)
  const hasActiveFilters = searchInput || brand !== t.product.all || selectedCategory !== t.product.all || 
    selectedSubCategory !== 'All' || selectedSkinTone !== 'All' || selectedSkinConcern !== 'All' || maxPrice < 100000;
  
  useEffect(() => {
    if (!hydrated) return;
    // Safety check: only auto-load if filtered is 0 and we haven't already tried too many times
    // or if the page is still reasonably low to avoid infinite scrolls in empty DBs
    if (filtered.length === 0 && hasMore && !loading && !hasActiveFilters && page < 5) {
      const timer = setTimeout(() => {
        loadMore();
      }, 1500); // Increased delay for safety
      return () => clearTimeout(timer);
    }
  }, [filtered.length, hasMore, loading, loadMore, hasActiveFilters, hydrated, page]);

  return (
    <div className="min-h-screen bg-white/40 backdrop-blur-sm text-black">
      <div className="max-w-7xl mx-auto px-6 pt-32 pb-20">
        {isTrending && (
          <div className="mb-8">
            <div className="inline-flex items-center gap-1.5 glass-panel rounded-full px-2.5 py-1 sm:px-3 sm:py-1.5 mb-3 w-fit">
              <Flame className="text-orange-500 fill-orange-400 w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-black/60">Trending Now</span>
              <Flame className="text-red-500 fill-red-400 w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </div>
            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl text-black font-black tracking-tight">Most Loved Products</h1>
            <p className="text-black/60 mt-2 text-sm sm:text-lg max-w-xl">Discover our customers' absolute favorites that everyone's raving about.</p>
          </div>
        )}
        
        <ProductsSlider />

        {/* Product Page Banners */}
        {banners.length > 0 && (
          <div className="mt-8 mb-6 space-y-4">
            {banners.filter(b => b.position === 'TOP' || b.position === 'MIDDLE').map((banner: any) => (
              <a
                key={banner.id}
                href={banner.ctaLink || '#'}
                className="block relative rounded-2xl overflow-hidden min-h-[120px]"
                style={{ backgroundColor: banner.backgroundColor || '#000' }}
              >
                {banner.imageUrl && (
                  <div className="relative w-full h-32 md:h-48">
                    <img
                      src={banner.imageUrl}
                      alt={banner.title}
                      className="absolute inset-0 w-full h-full object-contain"
                    />
                  </div>
                )}
                {(banner.title || banner.description) && (
                  <div className="absolute inset-0 flex items-center justify-center p-6" style={{ color: banner.textColor || '#fff' }}>
                    <div className="text-center">
                      {banner.title && <h3 className="text-xl md:text-2xl font-black">{banner.title}</h3>}
                      {banner.description && <p className="text-sm mt-1 opacity-90">{banner.description}</p>}
                      {banner.ctaText && (
                        <span className="inline-block mt-3 px-4 py-2 bg-white text-black text-xs font-black uppercase tracking-widest rounded-full">
                          {banner.ctaText}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </a>
            ))}
          </div>
        )}

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
              <div className="glass-panel rounded-[2rem] p-3 md:p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-2 md:gap-4 items-stretch shadow-lg border border-black/5">
                <div className="col-span-2 md:col-span-3 lg:col-span-1">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-black/30 mb-1.5 px-2">
                    {t.product.search}
                  </label>
                  <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder={t.product.search + "…"}
                    className="h-10 md:h-12 w-full bg-white/50 border-none rounded-2xl px-5 text-black font-body text-xs md:text-sm focus:ring-2 focus:ring-black outline-none placeholder:text-black/20"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-black/30 mb-1.5 px-2">
                    {t.product.brand}
                  </label>
                  <select
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="h-10 md:h-12 w-full bg-white/50 border-none rounded-2xl px-3 text-black font-body text-xs focus:ring-2 focus:ring-black outline-none cursor-pointer appearance-none"
                  >
                    {brands.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-black/30 mb-1.5 px-2">
                    Category
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => {
                      setSelectedCategory(e.target.value);
                      setSelectedSubCategory('All');
                    }}
                    className="h-10 md:h-12 w-full bg-white/50 border-none rounded-2xl px-3 text-black font-body text-xs focus:ring-2 focus:ring-black outline-none cursor-pointer appearance-none"
                  >
                    {categoriesList.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-black/30 mb-1.5 px-2">
                    Subcategory
                  </label>
                  <select
                    value={selectedSubCategory}
                    onChange={(e) => setSelectedSubCategory(e.target.value)}
                    className="h-10 md:h-12 w-full bg-white/50 border-none rounded-2xl px-3 text-black font-body text-xs focus:ring-2 focus:ring-black outline-none cursor-pointer appearance-none"
                  >
                    {subCategories.map(sc => <option key={sc} value={sc}>{sc}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-black/30 mb-1.5 px-2">
                    Skin Tone
                  </label>
                  <select
                    value={selectedSkinTone}
                    onChange={(e) => setSelectedSkinTone(e.target.value)}
                    className="h-10 md:h-12 w-full bg-white/50 border-none rounded-2xl px-3 text-black font-body text-xs focus:ring-2 focus:ring-black outline-none cursor-pointer appearance-none"
                  >
                    {skinTones.map(st => <option key={st} value={st}>{st}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-black/30 mb-1.5 px-2">
                    Skin Concern
                  </label>
                  <select
                    value={selectedSkinConcern}
                    onChange={(e) => setSelectedSkinConcern(e.target.value)}
                    className="h-10 md:h-12 w-full bg-white/50 border-none rounded-2xl px-3 text-black font-body text-xs focus:ring-2 focus:ring-black outline-none cursor-pointer appearance-none"
                  >
                    {skinConcernsList.map(sc => <option key={sc} value={sc}>{sc}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-black/30 mb-1.5 px-2">
                    Sort By
                  </label>
                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    className="h-10 md:h-12 w-full bg-white/50 border-none rounded-2xl px-3 text-black font-body text-xs focus:ring-2 focus:ring-black outline-none cursor-pointer appearance-none"
                  >
                    <option value="newest">Newest First</option>
                    <option value="sale">On Sale</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="rating">Top Rated</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-black/30 mb-1.5 px-2">
                    Max Price
                  </label>
                  <div className="h-10 md:h-12 flex items-center px-2 bg-white/50 rounded-2xl">
                    <Price amount={maxPrice} className="text-[10px] font-black mr-2" />
                    <input
                      type="range"
                      min="0"
                      max="100000"
                      step="100"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(Number(e.target.value))}
                      className="flex-1 h-1.5 bg-black/10 rounded-lg appearance-none cursor-pointer accent-black"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

          <div className="mt-12 md:mt-20 space-y-12 md:space-y-24">
            {categoriesList.filter(cat => cat !== t.product.all && cat !== 'All').map((cat) => {
              const productsInCat = filtered.filter(p => 
                p.categoryName === cat || (p.categories && p.categories.includes(cat))
              );
              if (productsInCat.length === 0) return null;
              
              const isExpanded = expandedCategories.has(cat);
              const displayProducts = isExpanded ? productsInCat : productsInCat.slice(0, 10);
              const hasMore = productsInCat.length > 10;

              return (
                <section key={cat}>
                  <div className="flex items-center justify-between gap-3 md:gap-6 mb-6 md:mb-10 border-b border-black/5 pb-4 md:pb-6">
                    <div className="flex items-center gap-3 md:gap-6">
                      <h2 className="font-display text-2xl md:text-5xl font-bold text-black">{cat}</h2>
                      <div className="h-[1px] flex-1 bg-black/10 hidden md:block" />
                      <span suppressHydrationWarning className="font-body text-[9px] md:text-sm font-bold text-black/40 tracking-widest uppercase hidden md:inline">
                        {productsInCat.length} {t.product.items}
                      </span>
                    </div>
                    
                    {hasMore && (
                      <button
                        onClick={() => {
                          setExpandedCategories(prev => {
                            const next = new Set(prev);
                            if (next.has(cat)) {
                              next.delete(cat);
                            } else {
                              next.add(cat);
                            }
                            return next;
                          });
                        }}
                        className="text-xs md:text-sm font-bold text-black/60 hover:text-black underline underline-offset-2 transition-colors"
                      >
                        {isExpanded ? 'Show Less' : 'See All'}
                      </button>
                    )}
                  </div>

                  <div className="grid gap-x-3 md:gap-x-8 gap-y-6 md:gap-y-12 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                    {displayProducts.map((product, idx) => (
                      <motion.div
                        key={product.id}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: idx % 4 * 0.1 }}
                        viewport={{ once: true }}
                      >
                        <ProductCard
                          product={product}
                          priority={idx < 8}
                          onQuickView={(p) => {
                            setQuickView(p);
                          }}
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
            {isRoutines ? (
              <>
                <div className="text-6xl mb-6 opacity-30">✨</div>
                <p className="font-display text-3xl text-black">Curated Routines Coming Soon</p>
                <p className="text-black/50 mt-2">We're curating the best skincare routines for you</p>
                <button 
                    onClick={() => window.location.href = '/products'} 
                    className="mt-8 text-black underline font-bold underline-offset-4"
                >
                    Browse all products
                </button>
              </>
            ) : (
              <>
                <div className="text-6xl mb-6 opacity-30">🔍</div>
                <p className="font-display text-3xl text-black">{t.product.noProducts}</p>
                <p className="text-black/50 mt-2">{t.product.tryAdjusting}</p>
                <button 
                    onClick={() => { 
                      setSearchInput(""); 
                      setBrand(t.product.all); 
                      setSelectedCategory(t.product.all);
                      setSelectedSubCategory('All');
                      setSelectedSkinTone('All');
                      setMaxPrice(100000); 
                    }} 
                    className="mt-8 text-black underline font-bold underline-offset-4"
                >
                    {t.product.resetFilters}
                </button>
              </>
            )}
          </div>
        )}

        {filtered.length === 0 && hasMore && (
          <div className="py-20 text-center">
            <p className="text-black/40 italic">Keep loading to see more products matching your filters...</p>
            <button
              onClick={loadMore}
              className="mt-4 px-6 py-2 bg-black/5 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all"
            >
              Load Next Page
            </button>
          </div>
        )}

        {hasMore && (
          <div className="flex justify-center mt-16">
            <button
              onClick={loadMore}
              disabled={loading}
              className="flex items-center gap-2 px-8 py-4 bg-black text-white rounded-full font-black text-sm uppercase tracking-widest hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  Load More
                  <span className="text-xs opacity-70">({totalCount - products.length} remaining)</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      <ProductQuickViewModal
        product={quickView}
        onClose={() => setQuickView(null)}
        onAddToCart={(p) => addToCart(p)}
        onOrderNow={(p) => orderNow(p)}
        onMoreDetails={(productId) => { setQuickView(null); window.location.href = `/products/${productId}`; }}
      />
    </div>
  );
}
