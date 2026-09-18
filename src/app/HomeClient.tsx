"use client";

import { useMemo, useState, useEffect, Suspense } from "react";
import { CategorySection } from "@/components/CategorySection";
import { HeroSlider } from "@/components/HeroSlider";
import { ProductQuickViewModal } from "@/components/ProductQuickViewModal";
import { OfferBannersSection } from "@/components/OfferBannersSection";
import { useCartStore } from "@/lib/cart-store";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { ArrowRight, Zap, ShieldCheck, Truck, RefreshCw, Headset } from "lucide-react";
import Link from "next/link";
import { TrendingNowSlider } from "@/components/TrendingNowSlider";
import { FlashSalesSlider } from "@/components/FlashSalesSlider";
import { RoutineSection } from "@/components/RoutineSection";
import RejuvenateBestProductsSection from "@/components/RejuvenateBestProductsSection";
import { BestSellersSection } from "@/components/BestSellersSection";
import HairCareSpotlightSection from "@/components/HairCareSpotlightSection";
import { HexPinwheelShowcase } from "@/components/HexPinwheelShowcase";
import MakeupSpotlightSection from "@/components/MakeupSpotlightSection";
import FragranceSpotlightSection from "@/components/FragranceSpotlightSection";
import { useCountryStore } from "@/lib/country-store";
import { hasValidPrice } from "@/lib/product-utils";
import { useLoadingStore } from "@/lib/loading-store";
import { trackAddToCart } from "@/lib/datalayer";
import { ShopByConcernSection } from "@/components/ShopByConcernSection";
import { WhatsAppConciergeButton } from "@/components/WhatsAppConciergeButton";

import dynamic from "next/dynamic";
const GoogleReviewsSection = dynamic(() => import("@/components/GoogleReviewsSection").then(m => m.GoogleReviewsSection), { ssr: false });
const BrandMarquee = dynamic(() => import("@/components/BrandMarquee").then(m => m.BrandMarquee), { ssr: false });

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
    <div className="flex items-center gap-1.5 sm:gap-2 bg-black/40 backdrop-blur-md px-3 py-1 sm:px-4 sm:py-1.5 rounded-full border border-pink-400/30 text-pink-200 text-[10px] sm:text-xs font-medium tracking-wider shadow-xs select-none shrink-0 whitespace-nowrap">
      <Zap size={13} className="text-amber-400 fill-amber-400 animate-pulse shrink-0" />
      <span className="hidden xs:inline text-[10px] sm:text-xs text-pink-300 font-semibold">ENDS IN:</span>
      <span className="bg-black/50 px-1.5 py-0.5 rounded text-white font-mono font-bold">{pad(timeLeft.hours)}h</span>
      <span>:</span>
      <span className="bg-black/50 px-1.5 py-0.5 rounded text-white font-mono font-bold">{pad(timeLeft.minutes)}m</span>
      <span>:</span>
      <span className="bg-black/50 px-1.5 py-0.5 rounded text-pink-300 font-mono font-bold">{pad(timeLeft.seconds)}s</span>
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

export default function HomeClient({
  initialProducts,
  flashSales = [],
  hot: hotProducts = [],
  routine: routineProducts = [],
  bestSellers: bestSellerProducts = [],
  makeupProducts: initialMakeupProducts = [],
  fragranceProducts: initialFragranceProducts = [],
  banners = [],
  rejuvenateSection = null
}: {
  initialProducts: any[],
  newArrivals?: any[],
  flashSales?: any[],
  hot?: any[],
  routine?: any[],
  bestSellers?: any[],
  makeupProducts?: any[],
  fragranceProducts?: any[],
  banners?: any[],
  rejuvenateSection?: any
}) {
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

  const filteredFlashSales = useMemo(() => {
    return flashSales.filter((p) => hasValidPrice(p, selectedCountry) && !isDummyProduct(p));
  }, [flashSales, selectedCountry]);

  const filteredHot = useMemo(() => {
    return hot.filter((p) => hasValidPrice(p, selectedCountry) && !isDummyProduct(p));
  }, [hot, selectedCountry]);

  const filteredRoutine = useMemo(() => {
    return routineProducts.filter((p) => hasValidPrice(p, selectedCountry) && !isDummyProduct(p));
  }, [routineProducts, selectedCountry]);

  const filteredBestSellers = useMemo(() => {
    return bestSellerProducts.filter((p) => hasValidPrice(p, selectedCountry) && !isDummyProduct(p));
  }, [bestSellerProducts, selectedCountry]);

  const filteredMakeup = useMemo(() => {
    const list = (initialMakeupProducts && initialMakeupProducts.length > 0)
      ? initialMakeupProducts
      : products.filter(p =>
          p.categories?.some((c: string) => c.toLowerCase() === 'makeup') ||
          (p.categoryName || '').toLowerCase() === 'makeup'
        );
    return list.filter((p) => hasValidPrice(p, selectedCountry));
  }, [initialMakeupProducts, products, selectedCountry]);

  const filteredFragrances = useMemo(() => {
    const list = (initialFragranceProducts && initialFragranceProducts.length > 0)
      ? initialFragranceProducts
      : products.filter(p =>
          p.categories?.some((c: string) => c.toLowerCase().includes('fragran')) ||
          (p.categoryName || '').toLowerCase().includes('fragran')
        );
    return list.filter((p) => hasValidPrice(p, selectedCountry));
  }, [initialFragranceProducts, products, selectedCountry]);

  const bestSearchedProducts = useMemo(() => {
    const valid = products.filter((p) => hasValidPrice(p, selectedCountry) && !isDummyProduct(p));
    return [...valid].sort((a, b) => {
      const scoreA = (a.trending ? 100 : 0) + (a.hot ? 50 : 0) + (a.totalSales || 0) * 5 + (a.ratingCount || 0) * 2;
      const scoreB = (b.trending ? 100 : 0) + (b.hot ? 50 : 0) + (b.totalSales || 0) * 5 + (b.ratingCount || 0) * 2;
      return scoreB - scoreA;
    });
  }, [products, selectedCountry]);

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
      } catch {}

      if (!billing) {
        const guestStr = localStorage.getItem('guest_address');
        if (guestStr) {
          try {
            const guestData = JSON.parse(guestStr);
            billing = guestData;
            shipping = guestData;
          } catch {}
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

  return (
    <div className="min-h-screen relative z-0 flex flex-col overflow-x-hidden w-full max-w-full bg-transparent text-gray-900 selection:bg-[#890754] selection:text-white" suppressHydrationWarning>
      
      {/* Background Soft Illumination */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[550px] bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.9),transparent_70%)]" />
        <div className="absolute bottom-0 right-0 w-[700px] h-[700px] bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.015),transparent_70%)]" />
      </div>

      {/* Hero Section (Original Position at Top) */}
      <HeroSlider initialBanners={banners} />

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
          <section className="relative w-full py-4 sm:py-6 md:py-8 select-none">
            {/* Ultra-Slim Section Header Bar */}
            <div className="mb-4 sm:mb-6 md:mb-8 relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-[#3e0325] via-[#540434] to-[#3e0325] backdrop-blur-xl border border-pink-500/20 px-4 py-3 sm:px-6 sm:py-3.5 shadow-[0_8px_32px_rgba(84,4,52,0.2)]">
              {/* Glow accent */}
              <div className="absolute -top-12 -left-12 w-40 h-40 bg-pink-500/15 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -bottom-8 right-12 w-36 h-36 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />

              <div className="relative flex items-center justify-between gap-3 sm:gap-6">
                {/* Left: Title + Mini LIVE Badge */}
                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                  <h2 className="font-sans text-base sm:text-lg md:text-xl font-bold tracking-tight text-white uppercase whitespace-nowrap">
                    Flash Sales
                  </h2>
                  <span className="inline-flex items-center gap-1 bg-[#890754] border border-pink-400/40 text-white text-[8.5px] sm:text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full animate-pulse">
                    LIVE
                  </span>
                </div>

                {/* Center: Slim Countdown Timer */}
                <FlashSaleCountdown />

                {/* Right: Slim See All Deals CTA */}
                <Link
                  href="/products/flash-sales"
                  className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 rounded-full border border-pink-300/30 bg-white/10 hover:bg-white text-white hover:text-[#540434] hover:scale-105 transition-all text-xs font-semibold uppercase tracking-wider shadow-xs active:scale-95 shrink-0 whitespace-nowrap"
                >
                  <span>See All</span>
                  <ArrowRight className="w-3.5 h-3.5" />
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

        {/* 3.5 Rejuvenate & Catch The Best Products Section */}
        <RejuvenateBestProductsSection
          routineProducts={filteredRoutine}
          bestProducts={bestSearchedProducts.length > 0 ? bestSearchedProducts : filteredBestSellers}
          sectionData={rejuvenateSection}
          onQuickView={setQuickView}
          addToCart={addToCart}
          orderNow={orderNow}
        />

        {/* 4. Best Sellers Section */}
        {filteredBestSellers.length > 0 && (
          <BestSellersSection
            products={filteredBestSellers}
            onQuickView={setQuickView}
            addToCart={addToCart}
            orderNow={orderNow}
          />
        )}

        {/* 4.5 The Luxury Makeup Edit Spotlight Section */}
        {filteredMakeup.length > 0 && (
          <MakeupSpotlightSection
            products={filteredMakeup}
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

        {/* 5.2 Herbal Haircare & Scalp Therapy Spotlight (Methi & Rosemary) */}
        <HairCareSpotlightSection
          products={products}
          onQuickView={setQuickView}
          addToCart={addToCart}
          orderNow={orderNow}
        />

        {/* 5.3 Haute Parfumerie / Fragrance Sanctuary Spotlight Section */}
        {filteredFragrances.length > 0 && (
          <FragranceSpotlightSection
            products={filteredFragrances}
            onQuickView={setQuickView}
            addToCart={addToCart}
            orderNow={orderNow}
          />
        )}



        {/* 6. Geometric Hex-Pinwheel Showcase (Best Searched Products Only) */}
        {bestSearchedProducts.length > 0 && (
          <HexPinwheelShowcase
            products={bestSearchedProducts}
            onQuickView={setQuickView}
            onAddToCart={addToCart}
            onOrderNow={orderNow}
          />
        )}

        {/* 7. Shop By Brand Section */}
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