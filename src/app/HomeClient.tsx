"use client";

import { useMemo, useState, useEffect, Suspense, useRef, memo } from "react";
import { CategorySection } from "@/components/CategorySection";
import { HeroSlider } from "@/components/HeroSlider";
import { ProductCard } from "@/components/ProductCard";
import { ProductQuickViewModal } from "@/components/ProductQuickViewModal";
import { OfferBannersSection } from "@/components/OfferBannersSection";
import { useCartStore } from "@/lib/cart-store";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { ArrowRight, Sparkles, Zap, ChevronLeft, ChevronRight, ShieldCheck, Flame, Truck, Shield, RefreshCw, Headset } from "lucide-react";
import Link from "next/link";
import { TrendingNowSlider } from "@/components/TrendingNowSlider";
import { RoutineSection } from "@/components/RoutineSection";
import { BestSellersSection } from "@/components/BestSellersSection";
import { useLanguageStore } from "@/lib/language-store";
import { translations } from "@/lib/translations";
import { useCurrencyStore } from "@/lib/currency-store";
import { useCountryStore } from "@/lib/country-store";
import { hasValidPrice } from "@/lib/product-utils";
import { useLoadingStore } from "@/lib/loading-store";
import { trackAddToCart } from "@/lib/datalayer";
import { ShopByConcernSection } from "@/components/ShopByConcernSection";
import { WhatsAppConciergeButton } from "@/components/WhatsAppConciergeButton";

import dynamic from "next/dynamic";
const BlogShowcase = dynamic(() => import("@/components/BlogShowcase").then(m => m.BlogShowcase), { ssr: false });
const GoogleReviewsSection = dynamic(() => import("@/components/GoogleReviewsSection").then(m => m.GoogleReviewsSection), { ssr: false });
const BrandMarquee = dynamic(() => import("@/components/BrandMarquee").then(m => m.BrandMarquee), { ssr: false });

function transformProduct(product: any) {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    price: product.price || product.priceCents || 0,
    discountPrice: product.discountPrice || product.salePrice || product.salePriceCents,
    salePrice: product.discountPrice || product.salePrice || product.salePriceCents,
    salePriceCents: product.salePriceCents,
    imageUrl: product.imageUrl || product.mainImage || "/placeholder-product.png",
    mainImage: product.mainImage || product.imageUrl,
    brand: product.brandName || (typeof product.brand === "string" ? product.brand : product.brand?.name) || "Generic",
    averageRating: product.averageRating,
    ratingCount: product.ratingCount,
    stockQuantity: product.stockQuantity,
    totalSales: product.totalSales,
    countryPrices: product.countryPrices,
    hot: product.hot,
    trending: product.trending,
    freeDelivery: product.freeDelivery,
  };
}

const ProductCardItem = memo(function ProductCardItem({ 
  product, 
  onQuickView, 
  addToCart, 
  orderNow, 
  priority 
}: { 
  product: any; 
  onQuickView: (p: unknown) => void; 
  addToCart: (p: unknown) => void; 
  orderNow: (p: unknown) => void; 
  priority: boolean;
}) {
  const transformed = useMemo(() => transformProduct(product), [product]);
  return (
    <ProductCard
      product={transformed}
      onQuickView={onQuickView}
      onAddToCart={addToCart}
      onOrderNow={orderNow}
      priority={priority}
    />
  );
});

function FlashSalesSlider({ products, onQuickView, addToCart, orderNow }: { products: any[]; onQuickView: (p: any) => void; addToCart: (p: any) => void; orderNow: (p: any) => void }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      const maxScroll = scrollWidth - clientWidth;
      if (maxScroll > 0) {
        setScrollProgress((scrollLeft / maxScroll) * 100);
      }
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const amount = scrollRef.current.clientWidth;
      scrollRef.current.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
    }
  };

  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (scrollRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickRatio = (e.clientX - rect.left) / rect.width;
      const maxScroll = scrollRef.current.scrollWidth - scrollRef.current.clientWidth;
      scrollRef.current.scrollTo({ left: clickRatio * maxScroll, behavior: 'smooth' });
    }
  };

  const thumbWidthPct = Math.max(20, Math.min(60, products.length > 0 ? (4 / products.length) * 100 : 30));

  return (
    <div className="py-2 sm:py-4 relative">
      {/* Left Scroll Button - Desktop Only */}
      <button
        onClick={() => scroll('left')}
        className="hidden md:flex absolute -left-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 items-center justify-center bg-white shadow-xl rounded-full border border-pink-100 text-[#890754] hover:bg-[#890754] hover:text-white transition-all active:scale-95"
        aria-label="Previous flash sale deals"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      {/* Right Scroll Button - Desktop Only */}
      <button
        onClick={() => scroll('right')}
        className="hidden md:flex absolute -right-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 items-center justify-center bg-white shadow-xl rounded-full border border-pink-100 text-[#890754] hover:bg-[#890754] hover:text-white transition-all active:scale-95"
        aria-label="Next flash sale deals"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex overflow-x-auto pb-4 md:pb-6 scrollbar-hide snap-x snap-mandatory px-1.5 sm:px-2 gap-2 sm:gap-3 lg:gap-4"
      >
        {products.map((product, idx) => (
          <div key={product.id} className="flex-shrink-0 snap-start w-[calc(38%-6px)] sm:w-[calc(28%-8px)] md:w-[calc(22%-10px)] lg:w-[calc(19%-12px)]">
            <ProductCardItem
              product={product}
              onQuickView={onQuickView}
              addToCart={addToCart}
              orderNow={orderNow}
              priority={idx < 4}
            />
          </div>
        ))}
      </div>

      {/* Bottom Slide Indicator / Track Line */}
      <div className="mt-2 sm:mt-4 flex flex-col items-center justify-center gap-1.5 select-none">
        <div 
          onClick={handleTrackClick}
          className="w-36 sm:w-56 h-1 sm:h-1.5 bg-pink-100/90 hover:bg-pink-200/90 rounded-full relative overflow-hidden cursor-pointer shadow-inner transition-colors"
          title="Click to navigate deals slider"
        >
          <div
            className="h-full bg-gradient-to-r from-[#540434] via-[#890754] to-pink-500 rounded-full transition-all duration-150 ease-out"
            style={{
              width: `${thumbWidthPct}%`,
              marginLeft: `${(scrollProgress / 100) * (100 - thumbWidthPct)}%`,
            }}
          />
        </div>
        <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-gray-400 tracking-wider uppercase">
          <span className="inline-block animate-pulse text-[#890754]">‹</span>
          <span>Slide or Drag to explore</span>
          <span className="inline-block animate-pulse text-[#890754]">›</span>
        </div>
      </div>
    </div>
  );
}

function FlashSaleCountdown() {
  const [timeLeft, setTimeLeft] = useState({ hours: 4, minutes: 28, seconds: 45 });

  useEffect(() => {
    const calculateTime = () => {
      const now = new Date();
      const totalSecondsToday = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
      const cycleLength = 6 * 3600; // 6-hour deals cycle
      const remainingSeconds = cycleLength - (totalSecondsToday % cycleLength);

      const h = Math.floor(remainingSeconds / 3600);
      const m = Math.floor((remainingSeconds % 3600) / 60);
      const s = remainingSeconds % 60;
      setTimeLeft({ hours: h, minutes: m, seconds: s });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div className="flex items-center gap-1.5 bg-[#400327]/90 backdrop-blur-md px-2.5 sm:px-3 py-1 rounded-full border border-pink-400/30 text-pink-200 text-[10px] sm:text-xs font-black tracking-wider shadow-sm select-none">
      <Zap size={12} className="text-pink-400 fill-pink-400 animate-pulse shrink-0" />
      <span className="hidden xs:inline">DEALS END IN:</span>
      <span className="xs:hidden">ENDS:</span>
      <span className="bg-black/40 px-1 py-0.5 rounded text-white font-mono">{pad(timeLeft.hours)}h</span>
      <span>:</span>
      <span className="bg-black/40 px-1 py-0.5 rounded text-white font-mono">{pad(timeLeft.minutes)}m</span>
      <span>:</span>
      <span className="bg-black/40 px-1 py-0.5 rounded text-pink-300 font-mono">{pad(timeLeft.seconds)}s</span>
    </div>
  );
}

function NewArrivalsSlider({ products, onQuickView, addToCart, orderNow }: { products: any[]; onQuickView: (p: any) => void; addToCart: (p: any) => void; orderNow: (p: any) => void }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const amount = scrollRef.current.clientWidth;
      scrollRef.current.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
    }
  };

  return (
    <div className="py-2 sm:py-3 relative">
      <button
        onClick={() => scroll('left')}
        className="hidden md:flex absolute -left-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 items-center justify-center bg-white shadow-xl rounded-full border border-pink-100 text-[#890754] hover:bg-[#890754] hover:text-white transition-all active:scale-95"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      <button
        onClick={() => scroll('right')}
        className="hidden md:flex absolute -right-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 items-center justify-center bg-white shadow-xl rounded-full border border-pink-100 text-[#890754] hover:bg-[#890754] hover:text-white transition-all active:scale-95"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      <div 
        ref={scrollRef}
        className="flex overflow-x-auto pb-3 md:pb-5 scrollbar-hide snap-x snap-mandatory px-1.5 sm:px-2 gap-2 sm:gap-3 lg:gap-4"
      >
        {products.map((product, idx) => (
          <div key={product.id} className="flex-shrink-0 snap-start w-[calc(38%-6px)] sm:w-[calc(28%-8px)] md:w-[calc(22%-10px)] lg:w-[calc(19%-12px)]">
            <ProductCardItem
              product={product}
              onQuickView={onQuickView}
              addToCart={addToCart}
              orderNow={orderNow}
              priority={idx < 4}
            />
          </div>
        ))}
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



export default function HomeClient({ initialProducts, newArrivals = [], flashSales = [], hot: hotProducts = [], routine: routineProducts = [], bestSellers: bestSellerProducts = [] }: { initialProducts: any[], newArrivals?: any[], flashSales?: any[], hot?: any[], routine?: any[], bestSellers?: any[] }) {
  const [products] = useState<any[]>(initialProducts || []);
  const [quickView, setQuickView] = useState<any | null>(null);
  const [mounted, setMounted] = useState(false);
  const { addItem, hasAddress } = useCartStore();
  const router = useRouter();
  const { selectedCountry, selectedCurrency } = useCountryStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  const hot = useMemo(() => hotProducts.length > 0 ? hotProducts : products.filter((p) => p.hot), [products, hotProducts]);

  const filteredNewArrivals = useMemo(() => {
    return newArrivals.filter((p) => hasValidPrice(p, selectedCountry) && !isDummyProduct(p));
  }, [newArrivals, selectedCountry, selectedCurrency]);

  const filteredFlashSales = useMemo(() => {
    return flashSales.filter((p) => hasValidPrice(p, selectedCountry) && !isDummyProduct(p));
  }, [flashSales, selectedCountry, selectedCurrency]);

  const filteredHot = useMemo(() => {
    return hot.filter((p) => hasValidPrice(p, selectedCountry) && !isDummyProduct(p));
  }, [hot, selectedCountry, selectedCurrency]);

  const filteredRoutine = useMemo(() => {
    return routineProducts.filter((p) => hasValidPrice(p, selectedCountry) && !isDummyProduct(p));
  }, [routineProducts, selectedCountry, selectedCurrency]);

  const filteredBestSellers = useMemo(() => {
    return bestSellerProducts.filter((p) => hasValidPrice(p, selectedCountry) && !isDummyProduct(p));
  }, [bestSellerProducts, selectedCountry, selectedCurrency]);

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
    
    trackAddToCart({
      id: product.id,
      name: product.name,
      price: product.price || product.priceCents || 0,
      currency: selectedCurrency || 'AED',
      category: product.category?.name || product.category || "General",
      brand: product.brand?.name || product.brand || "Generic",
      quantity: 1,
      sku: product.sku || undefined,
    });
    
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
      if (data.pendingCheckoutId) {
        toast.success("Redirecting to payment...", { id: tid });
        useLoadingStore.getState().setRedirecting(true, "Creating your order...");
        router.push(`/checkout/payment/${data.pendingCheckoutId}`);
      } else {
        throw new Error(data.error || "Failed to create order");
      }
    } catch (err: any) {
      toast.error(err.message, { id: tid });
      addToCart(product);
      router.push("/cart");
    }
  }

  const { currentLanguage } = useLanguageStore();
  const t = translations[currentLanguage.code as keyof typeof translations];

  return (
    <div className="min-h-screen relative z-0 flex flex-col overflow-x-hidden w-full max-w-full bg-transparent text-gray-900 selection:bg-[#890754] selection:text-white" suppressHydrationWarning>
      
      {/* Background Soft Illumination */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[550px] bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.9),transparent_70%)]" />
        <div className="absolute bottom-0 right-0 w-[700px] h-[700px] bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.015),transparent_70%)]" />
      </div>

      {/* Hero Section (Original Position at Top) */}
      <HeroSlider />

      <main className="mx-auto max-w-[1536px] w-full px-2 sm:px-4 lg:px-6 pb-20 flex-1 overflow-x-hidden z-10">

        {/* Categories Section - Shop By Category */}
        <CategorySection
          onPick={(c) => {
            router.push(`/products?category=${encodeURIComponent(c)}`);
          }}
        />

        {/* Targeted Results - Shop By Skin Concern */}
        <ShopByConcernSection />

        {/* 1. Flash Sales Section */}
        {filteredFlashSales.length > 0 && (
          <section className="pt-6 md:pt-10 pb-6 md:pb-10 px-1 sm:px-2">
            {/* Section Header Card */}
            <div className="mb-5 md:mb-8 relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#4a032d] via-[#540434] to-[#360220] backdrop-blur-xl border border-pink-500/20 px-4 py-3.5 sm:px-6 sm:py-4 shadow-[0_8px_32px_rgba(84,4,52,0.22)]">
              {/* Glow accent */}
              <div className="absolute -top-8 -left-8 w-40 h-40 bg-pink-500/20 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -bottom-6 right-10 w-32 h-32 bg-amber-400/15 rounded-full blur-2xl pointer-events-none" />

              <div className="relative flex flex-wrap items-center justify-between gap-3">
                {/* Left: Title + Badge + Countdown */}
                <div className="flex flex-wrap items-center gap-2.5 sm:gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xl sm:text-2xl">⚡</span>
                    <h2 className="font-serif text-xl sm:text-3xl md:text-4xl font-black tracking-tight text-white uppercase">
                      Flash Sales
                    </h2>
                    <span className="hidden sm:inline-flex items-center gap-1 bg-[#890754] border border-pink-400/40 text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full animate-pulse">
                      LIVE
                    </span>
                  </div>
                  <FlashSaleCountdown />
                </div>

                {/* Right: Wave CTA */}
                <Link
                  href="/products/flash-sales"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-pink-300/30 bg-white/10 hover:bg-white/20 hover:border-pink-300/60 hover:scale-105 transition-all text-xs font-black uppercase tracking-wider shadow-sm active:scale-95 text-white"
                >
                  <span className="wave-text">See All Deals</span>
                  <ArrowRight className="w-3.5 h-3.5 wave-icon" />
                </Link>
              </div>
            </div>

            <FlashSalesSlider products={filteredFlashSales} onQuickView={setQuickView} addToCart={addToCart} orderNow={orderNow} />
          </section>
        )}

        {/* 2. Banner Section */}
        <OfferBannersSection />

        {/* 3. Routine Section */}
        {filteredRoutine.length > 0 && (
          <RoutineSection
            products={filteredRoutine}
            onQuickView={setQuickView}
            addToCart={addToCart}
            orderNow={orderNow}
          />
        )}
        {/* 4. Best Sellers Section */}
        {filteredBestSellers.length > 0 && (
          <BestSellersSection
            products={filteredBestSellers}
            onQuickView={setQuickView}
            addToCart={addToCart}
            orderNow={orderNow}
          />
        )}

        {/* 5. Trending Section */}
        <div style={{ display: mounted && filteredHot.length === 0 ? 'none' : undefined }}>
          <TrendingNowSlider
            products={filteredHot}
            onQuickView={(pp) => setQuickView(pp)}
            onAddToCart={(pp) => addToCart(pp)}
            onOrderNow={(pp) => orderNow(pp)}
          />
        </div>

        {/* 6. Shop By Brand Section (Immediately After Trending Section) */}
        <Suspense fallback={null}>
          <BrandMarquee />
        </Suspense>

      </main>

      {/* 7. Google Reviews Section */}
      <Suspense fallback={<div className="h-32" />}>
        <GoogleReviewsSection />
      </Suspense>

      {/* Luxury Trust Guarantee Ribbon */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 my-8 sm:my-12">
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-white/90 backdrop-blur-xl border border-pink-200/60 p-5 sm:p-6 lg:p-8 shadow-[0_10px_30px_rgba(137,7,84,0.05)]">
          {/* Subtle brand ambient glow */}
          <div className="absolute -top-16 -right-16 w-48 h-48 bg-[#890754]/5 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-pink-500/5 rounded-full blur-2xl pointer-events-none" />

          <div className="relative grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="group flex items-center gap-3 sm:gap-3.5">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-pink-50 to-[#faedf4] border border-pink-200/60 text-[#890754] flex items-center justify-center shrink-0 shadow-xs group-hover:bg-[#890754] group-hover:text-white group-hover:scale-105 transition-all duration-300">
                <Truck size={20} />
              </div>
              <div className="min-w-0">
                <h5 className="font-bold text-xs sm:text-sm text-gray-900 group-hover:text-[#890754] transition-colors truncate">
                  Complimentary Delivery
                </h5>
                <p className="text-[10px] sm:text-[11px] text-gray-500 font-medium truncate">Across the UAE & GCC</p>
              </div>
            </div>

            <div className="group flex items-center gap-3 sm:gap-3.5">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-pink-50 to-[#faedf4] border border-pink-200/60 text-[#890754] flex items-center justify-center shrink-0 shadow-xs group-hover:bg-[#890754] group-hover:text-white group-hover:scale-105 transition-all duration-300">
                <ShieldCheck size={20} />
              </div>
              <div className="min-w-0">
                <h5 className="font-bold text-xs sm:text-sm text-gray-900 group-hover:text-[#890754] transition-colors truncate">
                  100% Genuine Brands
                </h5>
                <p className="text-[10px] sm:text-[11px] text-gray-500 font-medium truncate">Certified authenticity</p>
              </div>
            </div>

            <div className="group flex items-center gap-3 sm:gap-3.5">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-pink-50 to-[#faedf4] border border-pink-200/60 text-[#890754] flex items-center justify-center shrink-0 shadow-xs group-hover:bg-[#890754] group-hover:text-white group-hover:scale-105 transition-all duration-300">
                <RefreshCw size={20} />
              </div>
              <div className="min-w-0">
                <h5 className="font-bold text-xs sm:text-sm text-gray-900 group-hover:text-[#890754] transition-colors truncate">
                  30-Day Ritual Guarantee
                </h5>
                <p className="text-[10px] sm:text-[11px] text-gray-500 font-medium truncate">Seamless & easy returns</p>
              </div>
            </div>

            <div className="group flex items-center gap-3 sm:gap-3.5">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-pink-50 to-[#faedf4] border border-pink-200/60 text-[#890754] flex items-center justify-center shrink-0 shadow-xs group-hover:bg-[#890754] group-hover:text-white group-hover:scale-105 transition-all duration-300">
                <Headset size={20} />
              </div>
              <div className="min-w-0">
                <h5 className="font-bold text-xs sm:text-sm text-gray-900 group-hover:text-[#890754] transition-colors truncate">
                  Skincare Concierge
                </h5>
                <p className="text-[10px] sm:text-[11px] text-gray-500 font-medium truncate">Personal beauty advisor</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <ProductQuickViewModal
        product={quickView ? {
          ...quickView,
          price: quickView.price || quickView.priceCents || 0,
          imageUrl: quickView.imageUrl || quickView.mainImage,
          brand: quickView.brandName || quickView.brand?.name || "Generic",
          countryPrices: quickView.countryPrices || [],
        } : null}
        onClose={() => setQuickView(null)}
        onAddToCart={addToCart}
        onOrderNow={orderNow}
        onMoreDetails={(productId: string) => router.push(`/products/${productId}`)}
      />

      {/* Floating VIP WhatsApp Skincare Concierge */}
      <WhatsAppConciergeButton />
    </div>
  );
}