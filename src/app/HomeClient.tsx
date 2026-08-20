"use client";

import { useMemo, useState, useEffect, Suspense, useRef, memo } from "react";
import { CategorySection } from "@/components/CategorySection";
import { Hero } from "@/components/Hero";
import { ProductCard } from "@/components/ProductCard";
import { ProductQuickViewModal } from "@/components/ProductQuickViewModal";
import { OfferBannersSection } from "@/components/OfferBannersSection";
import { useCartStore } from "@/lib/cart-store";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { ArrowRight, Sparkles, Zap, ChevronLeft, ChevronRight } from "lucide-react";
import { AuthModal } from "@/components/AuthModal";
import Link from "next/link";
import { TrendingNowSlider } from "@/components/TrendingNowSlider";
import { RoutineSection } from "@/components/RoutineSection";
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
    // Skip if no valid price - let ProductCard filter it out
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
      
      {/* Mobile See All button */}
      <div className="flex justify-center mt-4 sm:hidden">
        <Link
          href="/products/flash-sales"
          className="flex items-center gap-2 px-6 py-3 rounded-full bg-black text-white text-xs font-black uppercase tracking-widest"
        >
          See All Flash Sales
          <ArrowRight className="w-4 h-4" />
        </Link>
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
      
      {/* Mobile See All button */}
      <div className="flex justify-center mt-4 sm:hidden">
        <Link
          href="/products/new-arrivals"
          className="flex items-center gap-2 px-6 py-3 rounded-full bg-black text-white text-xs font-black uppercase tracking-widest"
        >
          See All New Arrivals
          <ArrowRight className="w-4 h-4" />
        </Link>
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

const DS_BG =
  'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260609_195923_b0ba8ace-1d1d-4f2c-9a28-1ab84b330680.png&w=1280&q=85';

function DoctorSasiSection() {
  return (
    <section className="my-8 md:my-14 px-1 sm:px-4">
      <Link href="/doctor-sasi" className="block group relative overflow-hidden rounded-2xl md:rounded-3xl cursor-pointer">
        {/* Background image */}
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-105"
          style={{ backgroundImage: `url('${DS_BG}')` }}
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/20" />
        {/* Soft bottom vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-end min-h-[260px] sm:min-h-[340px] md:min-h-[420px] p-6 sm:p-10 md:p-14">
          {/* Heading */}
          <h2
            className="text-white font-light text-3xl sm:text-5xl md:text-6xl leading-none mb-2"
            style={{ fontFamily: "'Playfair Display', serif", fontStyle: 'italic', letterSpacing: '-0.02em' }}
          >
            Doctor Sasi
          </h2>
          <p className="text-white/60 text-sm sm:text-base font-light tracking-wide max-w-sm mt-2 mb-6">
            Beneath lies your glow. Discover the clinical shield your skin has been waiting for.
          </p>

          {/* CTA */}
          <div className="inline-flex items-center gap-3 w-fit">
            <span className="text-white text-xs sm:text-sm tracking-[0.2em] uppercase font-medium border-b border-white/40 pb-0.5 group-hover:border-white/90 transition-colors duration-300">
              Enter the experience
            </span>
            <ArrowRight className="w-4 h-4 text-white/60 group-hover:text-white group-hover:translate-x-1 transition-all duration-300" />
          </div>
        </div>
      </Link>
    </section>
  );
}

export default function HomeClient({ initialProducts, newArrivals = [], flashSales = [], hot: hotProducts = [], routine: routineProducts = [] }: { initialProducts: any[], newArrivals?: any[], flashSales?: any[], hot?: any[], routine?: any[] }) {
  const [products, setProducts] = useState<any[]>(initialProducts || []);
  const [quickView, setQuickView] = useState<any | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { addItem, hasAddress } = useCartStore();
  const router = useRouter();
  const { setCurrency } = useCurrencyStore();
  const { selectedCountry, selectedCurrency, setCountry, setDetectedCountry } = useCountryStore();
  const hasHydrated = useCountryStore((state) => state._hasHydrated);

function useDevRenderTracker() {
  const renderCount = useRef(0);
  useEffect(() => {
    renderCount.current += 1;
    if (renderCount.current > 3 && process.env.NODE_ENV === 'development') {
      console.warn('[DevOnly] Excessive re-renders:', renderCount.current);
    }
  }, []);
}

useDevRenderTracker();

  useEffect(() => {
    setMounted(true);
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

  const filteredRoutine = useMemo(() => {
    return routineProducts.filter((p) => hasValidPrice(p, selectedCountry) && !isDummyProduct(p));
  }, [routineProducts, selectedCountry, selectedCurrency]);

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
      if (data.pendingCheckoutId) {
        toast.success("Redirecting to payment...", { id: tid });
        useLoadingStore.getState().setRedirecting(true, "Creating your order...");
        router.push(`/checkout/payment/${data.pendingCheckoutId}`);
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

        {/* Offer Banners */}
        <OfferBannersSection />

        {/* Routine Section */}
        {filteredRoutine.length > 0 && (
          <RoutineSection
            products={filteredRoutine}
            onQuickView={setQuickView}
            addToCart={addToCart}
            orderNow={orderNow}
          />
        )}

        {/* Doctor Sasi Clinical Skincare Section */}
        <DoctorSasiSection />

        {/* New Arrivals Section */}
        {filteredNewArrivals.length > 0 && (
          <section className="pt-6 md:pt-10 pb-4 md:pb-6 px-1 sm:px-4">
            <div className="mb-3 md:mb-5 flex items-center justify-between">
              <div>
                <div className="inline-flex items-center gap-1.5 glass-panel rounded-full px-2.5 py-1 sm:px-3 sm:py-1.5 mb-1.5 sm:mb-2 w-fit">
                  <Sparkles className="text-emerald-500 w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-black/60">New</span>
                  <Sparkles className="text-green-500 w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </div>
                <h2 className="font-display text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight text-emerald-700">Fresh From The Shelf</h2>
                <div className="mt-2 h-[3px] w-full rounded-full bg-emerald-700/10 overflow-hidden">
                  <div className="h-full bg-emerald-700 rounded-full animate-line-grow" />
                </div>
                <p className="font-body text-black/70 mt-1 text-sm sm:text-lg max-w-xl font-medium">Latest additions to our collection</p>
              </div>
              <Link
                href="/products/new-arrivals"
                className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full bg-black text-white text-xs font-black uppercase tracking-widest hover:bg-gray-800 transition-colors"
              >
                See All
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <NewArrivalsSlider products={filteredNewArrivals} onQuickView={setQuickView} addToCart={addToCart} orderNow={orderNow} />
          </section>
        )}

        {/* Flash Sales Section */}
        <section className="pt-2 md:pt-6 pb-6 md:pb-10 px-1 sm:px-4">
          <div className="mb-4 md:mb-8 flex items-center justify-between">
            <div>
              <div className="inline-flex items-center gap-1.5 glass-panel rounded-full px-2.5 py-1 sm:px-3 sm:py-1.5 mb-1.5 sm:mb-2 w-fit">
                <Zap className="text-yellow-500 fill-yellow-400 w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-black/60">Flash</span>
                <Zap className="text-yellow-500 fill-yellow-400 w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </div>
              <h2 className="font-display text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight text-orange-500">Flash Sales</h2>
              <div className="mt-2 h-[3px] w-full rounded-full bg-orange-500/10 overflow-hidden">
                <div className="h-full bg-orange-500 rounded-full animate-line-grow" />
              </div>
            </div>
            <Link
              href="/products/flash-sales"
              className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full bg-black text-white text-xs font-black uppercase tracking-widest hover:bg-gray-800 transition-colors"
            >
              See All
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <FlashSalesSlider products={filteredFlashSales} onQuickView={setQuickView} addToCart={addToCart} orderNow={orderNow} />
        </section>

        {/* Categories */}
        <CategorySection
          onPick={(c) => {
            router.push(`/products?category=${encodeURIComponent(c)}`);
          }}
        />

        <div style={{ display: mounted && filteredHot.length === 0 ? 'none' : undefined }}>
          <TrendingNowSlider
            products={filteredHot}
            onQuickView={(pp) => setQuickView(pp)}
            onAddToCart={(pp) => addToCart(pp)}
            onOrderNow={(pp) => orderNow(pp)}
          />
        </div>

      </main>

      {/* Blog Showcase Section */}
      <Suspense fallback={<div className="h-32" />}>
        <BlogShowcase />
      </Suspense>

      {/* Brand Slider Section - Moved above footer */}
      <Suspense fallback={null}>
        <BrandMarquee />
      </Suspense>

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