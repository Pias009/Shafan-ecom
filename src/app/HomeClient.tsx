"use client";

import { useMemo, useState, useEffect, Suspense, useRef, memo } from "react";
import { CategorySection } from "@/components/CategorySection";
import { HeroSlider } from "@/components/HeroSlider";
import { HeroPromoCardsSection } from "@/components/HeroPromoCardsSection";
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
      const scrollAmount = direction === 'left' ? -320 : 320;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
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
        className="flex overflow-x-auto pb-4 md:pb-6 scrollbar-hide snap-x snap-mandatory px-1 sm:px-2 gap-3 sm:gap-4 md:gap-5"
      >
        {products.map((product, idx) => (
          <div key={product.id} className="flex-shrink-0 snap-start w-[160px] sm:w-[200px] md:w-[240px] lg:w-[270px]">
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
          className="flex items-center gap-2 px-6 py-3 rounded-full bg-[#0c433a] text-white text-xs font-black uppercase tracking-widest shadow-md active:scale-95"
        >
          <span>All Flash Sales</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

function NewArrivalsSlider({ products, onQuickView, addToCart, orderNow }: { products: any[]; onQuickView: (p: any) => void; addToCart: (p: any) => void; orderNow: (p: any) => void }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -320 : 320;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
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
        className="flex overflow-x-auto pb-3 md:pb-5 scrollbar-hide snap-x snap-mandatory px-1 sm:px-2 gap-3 sm:gap-4 md:gap-5"
      >
        {products.map((product, idx) => (
          <div key={product.id} className="flex-shrink-0 snap-start w-[160px] sm:w-[200px] md:w-[240px] lg:w-[270px]">
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
      
      <div className="flex justify-center mt-4 sm:hidden">
        <Link
          href="/products/new-arrivals"
          className="flex items-center gap-2 px-6 py-3 rounded-full bg-[#0c433a] text-white text-xs font-black uppercase tracking-widest shadow-md active:scale-95"
        >
          <span>All New Arrivals</span>
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



export default function HomeClient({ initialProducts, newArrivals = [], flashSales = [], hot: hotProducts = [], routine: routineProducts = [] }: { initialProducts: any[], newArrivals?: any[], flashSales?: any[], hot?: any[], routine?: any[] }) {
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

      <HeroSlider />
      <HeroPromoCardsSection />

      <main className="mx-auto max-w-[1536px] w-full px-2 sm:px-4 lg:px-6 pb-20 flex-1 overflow-x-hidden z-10">

        {/* Categories Section - Shop By Category */}
        <CategorySection
          onPick={(c) => {
            router.push(`/products?category=${encodeURIComponent(c)}`);
          }}
        />

        {/* Featured Products Section matching Reference Screenshot */}
        {filteredNewArrivals.length > 0 && (
          <section className="pt-6 md:pt-10 pb-6 md:pb-10 px-1 sm:px-2">
            <div className="mb-4 md:mb-8 flex items-center justify-between border-b border-white/30 pb-4">
              <div className="inline-flex items-center gap-3">
                <span className="h-px w-6 bg-white/50" />
                <h2 className="font-serif text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white uppercase drop-shadow-md">
                  FEATURED PRODUCTS
                </h2>
                <span className="h-px w-6 bg-white/50 hidden sm:inline-block" />
              </div>
              <Link
                href="/products/new-arrivals"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-white/40 bg-white/15 hover:bg-white hover:text-[#0c433a] transition-all text-xs font-black uppercase tracking-wider text-white shadow-sm"
              >
                <span>VIEW ALL</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <NewArrivalsSlider products={filteredNewArrivals} onQuickView={setQuickView} addToCart={addToCart} orderNow={orderNow} />
          </section>
        )}

        {/* Offer Banners - Special Offer 20% Off */}
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



        {/* Flash Sales Section */}
        <section className="pt-6 md:pt-10 pb-8 md:pb-12 px-1 sm:px-2">
          <div className="mb-4 md:mb-8 flex items-center justify-between border-b border-white/30 pb-4">
            <div className="inline-flex items-center gap-3">
              <span className="h-px w-6 bg-white/50" />
              <h2 className="font-serif text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white uppercase drop-shadow-md">
                FLASH SALES
              </h2>
            </div>
            <Link
              href="/products/flash-sales"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-white/40 bg-white/15 hover:bg-white hover:text-[#0c433a] transition-all text-xs font-black uppercase tracking-wider text-white shadow-sm"
            >
              <span>SEE ALL DEALS</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <FlashSalesSlider products={filteredFlashSales} onQuickView={setQuickView} addToCart={addToCart} orderNow={orderNow} />
        </section>

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

      {/* Brand Slider Section */}
      <Suspense fallback={null}>
        <BrandMarquee />
      </Suspense>

      {/* Google Reviews Section */}
      <Suspense fallback={<div className="h-32" />}>
        <GoogleReviewsSection />
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