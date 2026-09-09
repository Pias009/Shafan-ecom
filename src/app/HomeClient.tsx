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

import dynamic from "next/dynamic";
const BlogShowcase = dynamic(() => import("@/components/BlogShowcase").then(m => m.BlogShowcase), { ssr: false });
const GoogleReviewsSection = dynamic(() => import("@/components/GoogleReviewsSection").then(m => m.GoogleReviewsSection), { ssr: false });
const BrandMarquee = dynamic(() => import("@/components/BrandMarquee").then(m => m.BrandMarquee), { ssr: false });

const ProductCardItem = memo(function ProductCardItem({ 
  product, 
  onQuickView, 
  addToCart, 
  orderNow, 
  priority 
}: { 
  product: { id: string; name: string; price?: number; priceCents?: number; imageUrl?: string; mainImage?: string; brandName?: string; brand?: { name: string }; averageRating?: number; ratingCount?: number; stockQuantity?: number; totalSales?: number; countryPrices?: unknown[] }; 
  onQuickView: (p: unknown) => void; 
  addToCart: (p: unknown) => void; 
  orderNow: (p: unknown) => void; 
  priority: boolean;
}) {
  const transformed = useMemo(() => {
    const basePrice = product.price || product.priceCents || 0;
    return {
      id: product.id,
      name: product.name,
      price: basePrice,
      imageUrl: product.imageUrl || product.mainImage || "/placeholder-product.png",
      brand: product.brandName || product.brand?.name || "Generic",
      averageRating: product.averageRating,
      ratingCount: product.ratingCount,
      stockQuantity: product.stockQuantity,
      totalSales: product.totalSales,
      countryPrices: product.countryPrices,
    };
  }, [product.id, product.name, product.price, product.priceCents, product.imageUrl, product.mainImage, product.brandName, product.brand, product.averageRating, product.ratingCount, product.stockQuantity, product.totalSales, product.countryPrices]);
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

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const amount = scrollRef.current.clientWidth;
      scrollRef.current.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
    }
  };

  return (
    <div className="py-2 sm:py-4 relative">
      {/* Left Scroll Button - Desktop Only */}
      <button
        onClick={() => scroll('left')}
        className="hidden md:flex absolute -left-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 items-center justify-center bg-white shadow-xl rounded-full border border-[#c5e1d7] text-[#0c433a] hover:bg-[#0c433a] hover:text-white transition-all active:scale-95"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      {/* Right Scroll Button - Desktop Only */}
      <button
        onClick={() => scroll('right')}
        className="hidden md:flex absolute -right-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 items-center justify-center bg-white shadow-xl rounded-full border border-[#c5e1d7] text-[#0c433a] hover:bg-[#0c433a] hover:text-white transition-all active:scale-95"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      <div 
        ref={scrollRef}
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
    <div className="flex items-center gap-1.5 bg-[#051f1a]/85 backdrop-blur-md px-2.5 sm:px-3 py-1 rounded-full border border-amber-400/40 text-amber-300 text-[10px] sm:text-xs font-black tracking-wider shadow-sm select-none">
      <Zap size={12} className="text-amber-400 fill-amber-400 animate-pulse shrink-0" />
      <span className="hidden xs:inline">DEALS END IN:</span>
      <span className="xs:hidden">ENDS:</span>
      <span className="bg-black/40 px-1 py-0.5 rounded text-white font-mono">{pad(timeLeft.hours)}h</span>
      <span>:</span>
      <span className="bg-black/40 px-1 py-0.5 rounded text-white font-mono">{pad(timeLeft.minutes)}m</span>
      <span>:</span>
      <span className="bg-black/40 px-1 py-0.5 rounded text-amber-300 font-mono">{pad(timeLeft.seconds)}s</span>
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
        className="hidden md:flex absolute -left-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 items-center justify-center bg-white shadow-xl rounded-full border border-[#c5e1d7] text-[#0c433a] hover:bg-[#0c433a] hover:text-white transition-all active:scale-95"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      <button
        onClick={() => scroll('right')}
        className="hidden md:flex absolute -right-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 items-center justify-center bg-white shadow-xl rounded-full border border-[#c5e1d7] text-[#0c433a] hover:bg-[#0c433a] hover:text-white transition-all active:scale-95"
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
    <div className="min-h-screen relative z-0 flex flex-col overflow-x-hidden w-full max-w-full bg-[#72ccbd] text-white selection:bg-[#0c433a] selection:text-white" suppressHydrationWarning>
      
      {/* Background Soft Illumination */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.2),transparent_70%)]" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.15),transparent_70%)]" />
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

        {/* 1. Flash Sales Section */}
        {filteredFlashSales.length > 0 && (
          <section className="pt-6 md:pt-10 pb-6 md:pb-10 px-1 sm:px-2">
            {/* Section Header Card */}
            <div className="mb-5 md:mb-8 relative overflow-hidden rounded-2xl bg-[#0c433a]/80 backdrop-blur-xl border border-white/10 px-4 py-3.5 sm:px-6 sm:py-4 shadow-[0_8px_32px_rgba(0,0,0,0.18)]">
              {/* Glow accent */}
              <div className="absolute -top-8 -left-8 w-40 h-40 bg-rose-500/20 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -bottom-6 right-10 w-32 h-32 bg-amber-400/15 rounded-full blur-2xl pointer-events-none" />

              <div className="relative flex flex-wrap items-center justify-between gap-3">
                {/* Left: Title + Badge + Countdown */}
                <div className="flex flex-wrap items-center gap-2.5 sm:gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xl sm:text-2xl">⚡</span>
                    <h2 className="font-serif text-xl sm:text-3xl md:text-4xl font-black tracking-tight text-white uppercase">
                      Flash Sales
                    </h2>
                    <span className="hidden sm:inline-flex items-center gap-1 bg-rose-500 text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full animate-pulse">
                      LIVE
                    </span>
                  </div>
                  <FlashSaleCountdown />
                </div>

                {/* Right: Wave CTA */}
                <Link
                  href="/products/flash-sales"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-white/20 bg-transparent hover:border-white/50 hover:scale-105 transition-all text-xs font-black uppercase tracking-wider shadow-sm active:scale-95"
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

      </main>

      {/* 6. Google Reviews Section */}
      <Suspense fallback={<div className="h-32" />}>
        <GoogleReviewsSection />
      </Suspense>

      {/* 7. Brand Section */}
      <Suspense fallback={null}>
        <BrandMarquee />
      </Suspense>

      {/* Footer Trust Features Bar matching bottom row of Screenshot */}
      <section className="bg-[#5ebbaf]/95 backdrop-blur-md border-t border-white/30 py-6 sm:py-8 px-2 sm:px-6 mt-12 text-white">
        <div className="max-w-[1536px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center md:text-left">
          <div className="flex items-center gap-3.5 justify-center md:justify-start">
            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm text-white flex items-center justify-center shrink-0 border border-white/40 shadow-sm">
              <Truck size={20} />
            </div>
            <div>
              <h5 className="font-bold text-xs sm:text-sm text-white uppercase tracking-wider">FREE SHIPPING</h5>
              <p className="text-[11px] text-white/85 font-medium">On orders over $50</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 justify-center md:justify-start">
            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm text-white flex items-center justify-center shrink-0 border border-white/40 shadow-sm">
              <Shield size={20} />
            </div>
            <div>
              <h5 className="font-bold text-xs sm:text-sm text-white uppercase tracking-wider">SECURE PAYMENT</h5>
              <p className="text-[11px] text-white/85 font-medium">100% safe & secure</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 justify-center md:justify-start">
            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm text-white flex items-center justify-center shrink-0 border border-white/40 shadow-sm">
              <RefreshCw size={20} />
            </div>
            <div>
              <h5 className="font-bold text-xs sm:text-sm text-white uppercase tracking-wider">EASY RETURNS</h5>
              <p className="text-[11px] text-white/85 font-medium">30 days return policy</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 justify-center md:justify-start">
            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm text-white flex items-center justify-center shrink-0 border border-white/40 shadow-sm">
              <Headset size={20} />
            </div>
            <div>
              <h5 className="font-bold text-xs sm:text-sm text-white uppercase tracking-wider">CUSTOMER SUPPORT</h5>
              <p className="text-[11px] text-white/85 font-medium">We're here to help</p>
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
    </div>
  );
}