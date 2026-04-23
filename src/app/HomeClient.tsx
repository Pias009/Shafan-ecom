"use client";

import { useMemo, useState, useEffect, lazy, Suspense, useRef } from "react";
import { CategorySection } from "@/components/CategorySection";
import { Hero } from "@/components/Hero";
import { ProductCard } from "@/components/ProductCard";
import { HomeProductCard } from "@/components/HomeProductCard";
import { ProductQuickViewModal } from "@/components/ProductQuickViewModal";
import { TrendingNowSlider } from "@/components/TrendingNowSlider";
import { useCartStore } from "@/lib/cart-store";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { Loader2, Filter, X, ArrowRight, Flame, Sparkles, Zap, ChevronLeft, ChevronRight } from "lucide-react";
import { AuthModal } from "@/components/AuthModal";
import { useSession } from "next-auth/react";
import { Price } from "@/components/Price";
import { AnimatePresence, motion } from "framer-motion";
import { OfferBannersSection } from "@/components/OfferBannersSection";
import { useLanguageStore } from "@/lib/language-store";
import { translations } from "@/lib/translations";
import { useCurrencyStore } from "@/lib/currency-store";
import { useCountryStore } from "@/lib/country-store";
import { SUPPORTED_COUNTRIES } from "@/lib/countries";
import HomeBannerSlider from "@/components/HomeBannerSlider";
import { hasValidPrice } from "@/lib/product-utils";

import dynamic from "next/dynamic";
const BlogShowcase = dynamic(() => import("@/components/BlogShowcase").then(m => m.BlogShowcase), { ssr: false });
const GoogleReviewsSection = dynamic(() => import("@/components/GoogleReviewsSection").then(m => m.GoogleReviewsSection), { ssr: false });
const BrandMarquee = dynamic(() => import("@/components/BrandMarquee").then(m => m.BrandMarquee), { ssr: false });

function FlashSalesSlider({ products, onQuickView, addToCart, orderNow }: { products: any[]; onQuickView: (p: any) => void; addToCart: (p: any) => void; orderNow: (p: any) => void }) {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      setTimeout(checkScroll, 300);
    }
  };

  return (
    <div className="py-2 sm:py-4 relative">
      {/* Left Scroll Button - Desktop Only */}
      <button
        onClick={() => scroll('left')}
        className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 sm:w-12 sm:h-12 items-center justify-center bg-white/90 backdrop-blur-sm rounded-full shadow-lg border border-black/10 hover:bg-white transition-all active:scale-95"
      >
        <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 text-black" />
      </button>

      {/* Right Scroll Button - Desktop Only */}
      <button
        onClick={() => scroll('right')}
        className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 sm:w-12 sm:h-12 items-center justify-center bg-white/90 backdrop-blur-sm rounded-full shadow-lg border border-black/10 hover:bg-white transition-all active:scale-95"
      >
        <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-black" />
      </button>

      <div 
        ref={scrollRef}
        onScroll={checkScroll}
        className="flex overflow-x-auto pb-4 md:pb-6 scrollbar-hide snap-x snap-mandatory px-2 sm:px-4 gap-2 sm:gap-3 md:gap-4"
      >
        {products.map((product, idx) => (
          <div key={product.id} className="flex-shrink-0 snap-start w-[150px] sm:w-[180px] md:w-[220px] lg:w-[260px]">
            <ProductCard
              product={{
                ...product,
                price: product.price || product.priceCents || 0,
                imageUrl: product.imageUrl || product.mainImage,
                brand: product.brandName || product.brand?.name || "Generic",
                averageRating: product.averageRating,
                ratingCount: product.ratingCount,
                stockQuantity: product.stockQuantity,
                totalSales: product.totalSales,
                countryPrices: product.countryPrices,
              }}
              onQuickView={onQuickView}
              onAddToCart={addToCart}
              onOrderNow={orderNow}
              priority={idx < 4}
            />
          </div>
        ))}
      </div>
      
      {/* Mobile See All button */}
      <div className="flex justify-center mt-4 sm:hidden">
        <button
          onClick={() => router.push("/products/flash-sales")}
          className="flex items-center gap-2 px-6 py-3 rounded-full bg-black text-white text-xs font-black uppercase tracking-widest"
        >
          See All Flash Sales
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function NewArrivalsSlider({ products, onQuickView, addToCart, orderNow }: { products: any[]; onQuickView: (p: any) => void; addToCart: (p: any) => void; orderNow: (p: any) => void }) {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      setTimeout(checkScroll, 300);
    }
  };

  return (
    <div className="py-2 sm:py-3 relative">
      {/* Left Scroll Button - Desktop Only */}
      <button
        onClick={() => scroll('left')}
        className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 sm:w-12 sm:h-12 items-center justify-center bg-white/90 backdrop-blur-sm rounded-full shadow-lg border border-black/10 hover:bg-white transition-all active:scale-95"
      >
        <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 text-black" />
      </button>

      {/* Right Scroll Button - Desktop Only */}
      <button
        onClick={() => scroll('right')}
        className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 sm:w-12 sm:h-12 items-center justify-center bg-white/90 backdrop-blur-sm rounded-full shadow-lg border border-black/10 hover:bg-white transition-all active:scale-95"
      >
        <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-black" />
      </button>

      <div 
        ref={scrollRef}
        onScroll={checkScroll}
        className="flex overflow-x-auto pb-3 md:pb-4 scrollbar-hide snap-x snap-mandatory px-2 sm:px-4 gap-2 sm:gap-3 md:gap-4"
      >
        {products.map((product, idx) => (
          <div key={product.id} className="flex-shrink-0 snap-start w-[150px] sm:w-[180px] md:w-[220px] lg:w-[260px]">
            <ProductCard
              product={{
                ...product,
                price: product.regularPrice || product.regularPriceCents || product.price || product.priceCents || 0,
                imageUrl: product.imageUrl || product.mainImage,
                brand: product.brandName || product.brand?.name || "Generic",
                averageRating: product.averageRating,
                ratingCount: product.ratingCount,
                stockQuantity: product.stockQuantity,
                totalSales: product.totalSales,
                countryPrices: product.countryPrices,
              }}
              onQuickView={onQuickView}
              onAddToCart={addToCart}
              onOrderNow={orderNow}
              priority={idx < 4}
            />
          </div>
        ))}
      </div>
      
      {/* Mobile See All button */}
      <div className="flex justify-center mt-4 sm:hidden">
        <button
          onClick={() => router.push("/products/new-arrivals")}
          className="flex items-center gap-2 px-6 py-3 rounded-full bg-black text-white text-xs font-black uppercase tracking-widest"
        >
          See All New Arrivals
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

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
  const brand = (typeof p.brand === 'string' ? p.brand : p.brand?.name || "").trim().toLowerCase();
  
  return DUMMY_PRODUCT_NAMES.some(dn => name.includes(dn.toLowerCase())) || 
         DUMMY_BRANDS.some(db => brand.includes(db.toLowerCase()));
};

export default function HomeClient({ initialProducts, newArrivals = [], flashSales = [], hot: hotProducts = [] }: { initialProducts: any[], newArrivals?: any[], flashSales?: any[], hot?: any[] }) {
  const [products, setProducts] = useState<any[]>(initialProducts || []);
  const [quickView, setQuickView] = useState<any | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [banners, setBanners] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);
  const { addItem, hasAddress } = useCartStore();
  const router = useRouter();
  const { setCurrency } = useCurrencyStore();
  const { selectedCountry, selectedCurrency, setCountry, setDetectedCountry } = useCountryStore();
  const hasHydrated = useCountryStore((state) => state._hasHydrated);

  const { status } = useSession();

  useEffect(() => {
    setMounted(true);

    async function detectCountry() {
      try {
        const getCookie = (name: string) => {
          if (typeof document === 'undefined') return null;
          const value = `; ${document.cookie}`;
          const parts = value.split(`; ${name}=`);
          if (parts.length === 2) return parts.pop()?.split(';').shift();
          return null;
        };

        const storeCode = getCookie('store_code');
        const cached = localStorage.getItem("user-country");

        const countryToStore: Record<string, string> = {
          'AE': 'UAE',
        };

        const countryToCurrency: Record<string, string> = {
          'AE': 'AED',
          'KW': 'KWD',
          'SA': 'SAR',
          'BH': 'BHD',
          'OM': 'OMR',
          'QA': 'QAR',
        };

        let country = cached;
        if (storeCode) {
          const storeToCountry: Record<string, string> = {
            'UAE': 'AE',
          };
          country = storeToCountry[storeCode] || country;
        }

        if (country && countryToCurrency[country]) {
          setCountry(country);
          setCurrency(countryToCurrency[country]);
          localStorage.setItem("user-country", country);
          return;
        }

        setCountry("KW");
        setCurrency("KWD");

      } catch (err) {
        console.debug("Geo sync skipped", err);
      }
    }
    detectCountry();
  }, [setCurrency, setCountry]);

  // Fetch active banners
  useEffect(() => {
    async function fetchBanners() {
      try {
        const response = await fetch('/api/banners');
        if (!response.ok) throw new Error('Failed to fetch banners');
        const data = await response.json();
        setBanners(data);
      } catch (error) {
        console.error('Error fetching banners:', error);
      }
    }

    fetchBanners();
  }, []);




  const brands = useMemo(() => {
    const set = new Set(products.map((p) => p.brand?.name).filter(Boolean));
    return ["All", ...Array.from(set).sort()];
  }, [products]);

  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category?.name).filter(Boolean));
    return ["All", ...Array.from(set).sort()];
  }, [products]);


  const hot = useMemo(() => hotProducts.length > 0 ? hotProducts : products.filter((p) => p.hot), [products, hotProducts]);

  // Filter newArrivals based on country support and remove dummy products
  const filteredNewArrivals = useMemo(() => {
    return newArrivals.filter((p) => hasValidPrice(p, selectedCountry) && !isDummyProduct(p));
  }, [newArrivals, selectedCountry, selectedCurrency]);

  // Filter flash sales based on country support and remove dummy products
  const filteredFlashSales = useMemo(() => {
    return flashSales.filter((p) => hasValidPrice(p, selectedCountry) && !isDummyProduct(p));
  }, [flashSales, selectedCountry, selectedCurrency]);

  // Filter hot products based on country support and remove dummy products
  const filteredHot = useMemo(() => {
    return hot.filter((p) => hasValidPrice(p, selectedCountry) && !isDummyProduct(p));
  }, [hot, selectedCountry, selectedCurrency]);

  // Category-specific products
  const skinCareProducts = useMemo(() => {
    return products.filter((p) => 
      hasValidPrice(p, selectedCountry) && 
      !isDummyProduct(p) && 
      p.categoryName === "Skin Care"
    ).slice(0, 10);
  }, [products, selectedCountry, selectedCurrency]);

  const hairCareProducts = useMemo(() => {
    return products.filter((p) => 
      hasValidPrice(p, selectedCountry) && 
      !isDummyProduct(p) && 
      p.categoryName === "Hair Care"
    ).slice(0, 10);
  }, [products, selectedCountry, selectedCurrency]);

  const bodyCareProducts = useMemo(() => {
    return products.filter((p) => 
      hasValidPrice(p, selectedCountry) && 
      !isDummyProduct(p) && 
      p.categoryName === "Body Care"
    ).slice(0, 10);
  }, [products, selectedCountry, selectedCurrency]);

  function addToCart(product: any) {
    const cartItem = {
      id: product.id,
      name: product.name,
      brand: product.brand?.name || product.brand || "Generic",
      category: product.category?.name || product.category || "General",
      price: product.price || product.priceCents || 0,
      discountPrice: product.salePrice || product.salePriceCents || undefined,
      imageUrl: product.mainImage || product.imageUrl || "/placeholder-product.png",
      countryPrices: product.countryPrices,
    };
    addItem(cartItem, 1);
    toast.success(`Added ${product.name} to cart`);
  }

  async function orderNow(product: any) {
    if (!hasAddress) {
      toast.error("Please add your shipping address first!", { duration: 3000 });
      router.push(`/account/address?redirect=order&productId=${product.id}`);
      return;
    }

    const tid = toast.loading("Preparing your order...");
    try {
      // Calculate unit price matching cart calculation
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
        router.push("/account/address");
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
    <div className="min-h-screen relative z-0 flex flex-col overflow-x-hidden w-full max-w-full bg-white/40 backdrop-blur-sm">
      {/* NoticeBoard and Navbar handled globally */}
      <Hero />

      <main className="mx-auto max-w-7xl w-full px-4 sm:px-6 pb-20 flex-1 overflow-x-hidden">
        

        {/* Flash Sales Section - Priority #2 */}
        <section className="pt-2 md:pt-6 pb-6 md:pb-10 px-1 sm:px-4">
          <div className="mb-4 md:mb-8 flex items-center justify-between">
            <div>
              <div className="inline-flex items-center gap-1.5 glass-panel rounded-full px-2.5 py-1 sm:px-3 sm:py-1.5 mb-1.5 sm:mb-2 w-fit">
                <Zap className="text-yellow-500 fill-yellow-400 w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-black/60">Flash</span>
                <Zap className="text-yellow-500 fill-yellow-400 w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </div>
              <h2 className="font-display text-2xl sm:text-4xl md:text-5xl text-black font-black tracking-tight">Flash Sales</h2>
            </div>
            <button
              onClick={() => router.push("/products/flash-sales")}
              className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full bg-black text-white text-xs font-black uppercase tracking-widest hover:bg-gray-800 transition-colors"
            >
              See All
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <FlashSalesSlider products={filteredFlashSales} onQuickView={setQuickView} addToCart={addToCart} orderNow={orderNow} />
        </section>

        {/* Categories - Priority #3 */}
        <CategorySection
          onPick={(c) => {
            router.push(`/products?category=${encodeURIComponent(c)}`);
          }}
        />


        {/* Offer Banners - After Flash Sales */}
        <div className="hidden sm:block">
          <OfferBannersSection />
        </div>

        {filteredHot.length > 0 && (
          <TrendingNowSlider
            products={filteredHot}
            onQuickView={(pp) => setQuickView(pp)}
            onAddToCart={(pp) => addToCart(pp)}
            onOrderNow={(pp) => orderNow(pp)}
          />
        )}

        {/* New Arrivals Section - Now after Trending Now */}
        {filteredNewArrivals.length > 0 && (
          <section className="pt-6 md:pt-10 pb-4 md:pb-6 px-1 sm:px-4">
            <div className="mb-3 md:mb-5 flex items-center justify-between">
              <div>
                <div className="inline-flex items-center gap-1.5 glass-panel rounded-full px-2.5 py-1 sm:px-3 sm:py-1.5 mb-1.5 sm:mb-2 w-fit">
                  <Sparkles className="text-emerald-500 w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-black/60">New</span>
                  <Sparkles className="text-green-500 w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </div>
                <h2 className="font-display text-2xl sm:text-4xl md:text-5xl text-black font-black tracking-tight">Fresh From The Shelf</h2>
                <p className="font-body text-black/70 mt-1 text-sm sm:text-lg max-w-xl font-medium">Latest additions to our collection</p>
              </div>
              <button
                onClick={() => router.push("/products/new-arrivals")}
                className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full bg-black text-white text-xs font-black uppercase tracking-widest hover:bg-gray-800 transition-colors"
              >
                See All
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            
            <NewArrivalsSlider products={filteredNewArrivals} onQuickView={setQuickView} addToCart={addToCart} orderNow={orderNow} />
          </section>
        )}

      </main>

      {/* Blog Showcase Section */}
      <Suspense fallback={<div className="h-32" />}>
        <BlogShowcase />
      </Suspense>

      {/* Brand Slider Section - Moved above footer */}
      <BrandMarquee />

      {/* Google Reviews Section */}
      <Suspense fallback={<div className="h-32" />}>
        <GoogleReviewsSection />
      </Suspense>

      <ProductQuickViewModal
        product={quickView ? {
          ...quickView,
          price: quickView.price || quickView.priceCents || 0,
          imageUrl: quickView.imageUrl || quickView.mainImage,
          brand: quickView.brandName || quickView.brand?.name || "Generic",
          countryPrices: quickView.countryPrices || [],
          hot: quickView.hot,
          trending: quickView.trending
        } : null}
        onClose={() => setQuickView(null)}
        onAddToCart={(p) => addToCart(p)}
        onOrderNow={(p) => orderNow(p)}
        onMoreDetails={(productId) => { setQuickView(null); window.location.href = `/products/${productId}`; }}
      />

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
}