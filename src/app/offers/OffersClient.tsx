"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Ticket, Copy, CheckCircle, Calendar, Sparkles, ShoppingBag, Zap, ArrowRight, ChevronLeft, ChevronRight, Star, ShoppingCart, Check } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { ProductQuickViewModal } from "@/components/ProductQuickViewModal";
import { useCartStore } from "@/lib/cart-store";
import { useUserCountry } from "@/lib/country-detection";
import { getDisplayPrice, resolveProductPrice } from "@/lib/product-utils";
import { fbEvent } from "@/lib/fpixel";
import { Price } from "@/components/Price";
import { getOptimizedUrl } from "@/lib/cloudinary-url";
import { useCountryStore } from "@/lib/country-store";
import toast from "react-hot-toast";

interface Coupon {
  id: string;
  code: string;
  description: string;
  discountType: string;
  value: number;
  endDate?: Date;
}

interface OfferBanner {
  id: string;
  imageUrl: string;
  title: string | null;
  subtitle: string | null;
  offerText: string | null;
  ctaText: string | null;
  backgroundColor: string | null;
  textColor: string | null;
  link: string | null;
  priority: number;
  clicks: number;
}

function OfferBannerSlider({ banners }: { banners: OfferBanner[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  if (banners.length === 0) return null;
  const banner = banners[index];

  const Slide = (
    <div className="relative w-full min-h-[180px] sm:min-h-[280px] md:min-h-[360px] rounded-3xl overflow-hidden">
      <Image
        src={banner.imageUrl}
        alt={banner.title || "offer banner"}
        fill
        className="object-contain"
        sizes="100vw"
        priority
      />
      {(banner.title || banner.subtitle || banner.offerText || banner.ctaText) && (
        <div
          className="absolute inset-0 flex flex-col justify-center px-6 sm:px-12 md:px-16"
          style={{ color: banner.textColor || "#000" }}
        >
          {banner.offerText && (
            <span className="text-xs sm:text-sm font-black uppercase tracking-widest mb-2 opacity-80">{banner.offerText}</span>
          )}
          {banner.title && (
            <h2 className="font-display text-2xl sm:text-4xl md:text-6xl font-bold leading-tight max-w-xl">{banner.title}</h2>
          )}
          {banner.subtitle && (
            <p className="text-sm sm:text-lg mt-2 sm:mt-4 max-w-lg font-medium opacity-80">{banner.subtitle}</p>
          )}
          {banner.ctaText && (
            <span className="inline-flex items-center gap-2 mt-6 w-fit px-6 py-3 bg-black text-white rounded-full font-black text-xs uppercase tracking-widest">
              {banner.ctaText} <ArrowRight size={14} />
            </span>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="relative w-full rounded-3xl overflow-hidden" style={{ backgroundColor: banner.backgroundColor || undefined }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={banner.id}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        >
          {banner.link ? (
            <Link href={banner.link} aria-label={banner.title || "offer banner"} className="block">
              {Slide}
            </Link>
          ) : (
            Slide
          )}
        </motion.div>
      </AnimatePresence>

      {banners.length > 1 && (
        <>
          <button
            onClick={() => setIndex((i) => (i - 1 + banners.length) % banners.length)}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-all shadow-lg"
            aria-label="Previous banner"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => setIndex((i) => (i + 1) % banners.length)}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-all shadow-lg"
            aria-label="Next banner"
          >
            <ChevronRight size={18} />
          </button>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                className={`h-1.5 rounded-full transition-all ${i === index ? "bg-white w-4" : "bg-white/50 w-1.5"}`}
                aria-label={`Go to banner ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function OffersClient({
  products,
  coupons,
  flashProducts = [],
  banners = [],
}: {
  products: any[];
  coupons: Coupon[];
  flashProducts?: any[];
  banners?: OfferBanner[];
}) {
  const [quickView, setQuickView] = useState<any>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const sliderRef = useRef<HTMLDivElement>(null);
  const { addItem, hasAddress } = useCartStore();
  const { selectedCountry } = useCountryStore();

  function scrollSlider(dir: "left" | "right") {
    const el = sliderRef.current;
    if (!el) return;
    const cardWidth = el.firstElementChild
      ? (el.firstElementChild as HTMLElement).offsetWidth + 24
      : 280;
    el.scrollBy({ left: dir === "right" ? cardWidth * 2 : -cardWidth * 2, behavior: "smooth" });
  }
  const router = useRouter();
  const userCountry = useUserCountry();

  function addToCart(product: any) {
    const cartItem = {
      id: product.id,
      name: product.name,
      brand: product.brandName,
      category: product.categoryName,
      price: product.price,
      discountPrice: product.discountPrice || undefined,
      imageUrl: product.imageUrl,
      countryPrices: product.countryPrices,
    };
    addItem(cartItem, 1);

    const { price: eventPrice, currency: eventCurrency } = getDisplayPrice(product, userCountry);
    fbEvent('AddToCart', {
      content_ids: [product.id],
      content_type: 'product',
      content_name: product.name,
      value: eventPrice || product.price || 0,
      currency: eventCurrency,
    });

    toast.success(`${product.name} added to cart`);
  }

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success("Promo code copied!");
    setTimeout(() => setCopiedCode(null), 3000);
  };

  async function orderNow(product: any) {
    if (!hasAddress) {
      toast.error("Please add a delivery address first", { duration: 3000 });
      router.push("/account/address");
      return;
    }

    const tid = toast.loading("Preparing your order...");
    try {
      const countryPrice = product.countryPrices?.find((cp: any) =>
        cp.country.toUpperCase() === userCountry.toUpperCase()
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
      } catch { }

      if (!billing) {
        const guestStr = localStorage.getItem('guest_address');
        if (guestStr) {
          try {
            const guestData = JSON.parse(guestStr);
            billing = guestData;
            shipping = guestData;
          } catch { }
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
          country: userCountry,
          billing,
          shipping
        }),
      });
      const data = await res.json();
      if (data.pendingCheckoutId) {
        toast.success("Order initiated!", { id: tid });
        router.push(`/checkout/payment/${data.pendingCheckoutId}`);
      } else {
        throw new Error(data.error || "Order creation failed");
      }
    } catch (err: any) {
      toast.error(err.message, { id: tid });
      addToCart(product);
      router.push("/cart");
    }
  }


  return (
    <main className="min-h-screen bg-[#fdfaf5]">
      <style>{`
        .glitch-code {
          position: relative;
          display: inline-block;
        }
        .glitch-code::before,
        .glitch-code::after {
          content: attr(data-text);
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
        }
        .glitch-code::before {
          color: #ff2770;
          z-index: -1;
          animation: glitch-shift 2.5s infinite linear alternate-reverse;
        }
        .glitch-code::after {
          color: #00e5ff;
          z-index: -2;
          animation: glitch-shift 2.5s infinite linear alternate-reverse 0.3s;
        }
        @keyframes glitch-shift {
          0% { transform: translate(0); }
          10% { transform: translate(-1.5px, 1px); }
          20% { transform: translate(1.5px, -1px); }
          30% { transform: translate(-1px, -0.5px); }
          40% { transform: translate(1px, 0.5px); }
          50% { transform: translate(-0.5px, 1px); }
          60% { transform: translate(0); }
          100% { transform: translate(0); }
        }
        .group:hover .glitch-code::before {
          animation-duration: 0.6s;
        }
        .group:hover .glitch-code::after {
          animation-duration: 0.6s;
        }
      `}</style>
      {/* Dynamic Background Pattern */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-0">
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
      </div>

      {/* Page Header with Top Spacing (Not Sticky) */}
      <header className="relative pt-6 pb-4">
        <div className="max-w-7xl mx-auto px-6 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-900 hover:text-white transition-all group shadow-xs"
              >
                <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
              </Link>
              <div>
                <h1 className="text-xl md:text-2xl font-sans font-medium text-slate-800 tracking-normal">
                  Exclusive Offers
                </h1>
                <p className="text-xs font-sans text-slate-400 tracking-normal">Premium Beauty Deals</p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <div className="flex flex-col items-end">
                <span className="text-xs font-sans text-slate-400">Active Deals</span>
                <span className="text-sm font-sans font-semibold text-slate-800">{coupons.length} Active Codes</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {banners.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 pt-8 pb-2">
          <OfferBannerSlider banners={banners} />
        </section>
      )}

      {/* Hero Content */}
      <section className="relative overflow-hidden pt-12 pb-20">
        <div className="max-w-7xl mx-auto px-6 relative z-10">

          {/* Coupons Section */}
          {coupons.length > 0 && (
            <div className="mb-16">
              <div className="flex flex-col gap-6 max-w-2xl mx-auto">
                {coupons.map((coupon) => (
                  <div
                    key={coupon.id}
                    className="relative bg-white rounded-2xl border border-slate-200/80 p-8 sm:p-10 text-center flex flex-col items-center justify-center shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] transition-all duration-300"
                  >
                    <span className="text-xs font-sans font-medium tracking-wider text-slate-400 uppercase mb-2">
                      Promo Code
                    </span>

                    {/* Clean modern sans-serif title matching screenshot */}
                    <h3 className="font-sans text-2xl sm:text-3xl md:text-4xl text-slate-800 font-normal tracking-normal mb-2">
                      {coupon.description}
                    </h3>

                    {coupon.endDate && (
                      <p className="text-xs font-sans text-slate-400 tracking-normal mb-6">
                        Valid until {new Date(coupon.endDate).toLocaleDateString()}
                      </p>
                    )}

                    <div className="mt-2 inline-flex items-center gap-2 bg-slate-50 border border-slate-200/80 rounded-full p-1.5 pl-5 shadow-xs">
                      <span className="font-mono text-sm sm:text-base font-medium tracking-[0.2em] text-slate-800 select-all">
                        {coupon.code}
                      </span>
                      <button
                        onClick={() => handleCopyCode(coupon.code)}
                        className={`px-5 py-2 rounded-full text-xs font-sans font-medium uppercase tracking-wider transition-all duration-200 ${
                          copiedCode === coupon.code
                            ? "bg-emerald-600 text-white"
                            : "bg-[#890754] text-white hover:bg-[#6c0542] active:scale-95"
                        }`}
                      >
                        {copiedCode === coupon.code ? "Copied" : "Copy"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Flash Sales Section — horizontal slider */}
          {flashProducts.length > 0 && (
            <div className="mb-20">
              {/* Header row */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-yellow-400 rounded-2xl flex items-center justify-center shadow-lg shadow-yellow-400/30">
                    <Zap size={24} className="text-black fill-black" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black uppercase tracking-tighter text-black">
                      Flash Sales
                    </h2>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-black/40">Hot deals — limited time only</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {/* Prev / Next arrows — hidden on mobile */}
                  <button
                    onClick={() => scrollSlider("left")}
                    className="hidden sm:flex w-10 h-10 rounded-full bg-black/5 hover:bg-black hover:text-white items-center justify-center transition-all active:scale-90"
                    aria-label="Previous"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    onClick={() => scrollSlider("right")}
                    className="hidden sm:flex w-10 h-10 rounded-full bg-black/5 hover:bg-black hover:text-white items-center justify-center transition-all active:scale-90"
                    aria-label="Next"
                  >
                    <ChevronRight size={18} />
                  </button>
                  <Link
                    href="/products/flash-sales"
                    className="flex items-center gap-2 px-6 py-3 bg-yellow-400 text-black font-black text-xs uppercase tracking-widest rounded-full hover:bg-yellow-300 transition-all shadow-md hover:scale-105 active:scale-95"
                  >
                    View All <ArrowRight size={14} />
                  </Link>
                </div>
              </div>

              {/* Scroll-snap slider (desktop) / Vertical list (mobile) */}
              <div className="relative">
                  {/* Mobile: compact horizontal row list */}
                  <div className="flex flex-col gap-3 sm:hidden">
                    {flashProducts.map((product: any) => {
                      const resolved = resolveProductPrice(product, selectedCountry);
                      const rowPrice = resolved.displayPrice;
                      const rowOriginal = resolved.originalPrice;
                      const rowHasDiscount = resolved.hasDiscount && rowOriginal > rowPrice;
                      const rowCurrency = resolved.currency;
                      const rowRating = product.averageRating || 4.9;
                      const brandName =
                        product.brandName ||
                        (typeof product.brand === "string" ? product.brand : product.brand?.name) ||
                        "SHAFAN";
                      const imgSrc = getOptimizedUrl(product.imageUrl || product.mainImage || "/placeholder-product.png", 200);
                      return (
                        <div
                          key={product.id}
                          onClick={() => router.push(`/products/${product.slug || product.id}`)}
                          className="flex items-center gap-3 bg-white rounded-2xl border border-slate-100 shadow-sm p-3 cursor-pointer active:scale-[0.98] transition-transform"
                        >
                          {/* Thumbnail */}
                          <div className="relative w-[72px] h-[72px] shrink-0 rounded-xl bg-slate-50 overflow-hidden">
                            <Image
                              src={imgSrc}
                              alt={product.name}
                              fill
                              className="object-contain p-1"
                              sizes="80px"
                            />
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                            <p className="text-[9px] font-bold uppercase tracking-wider text-[#890754]/80 truncate leading-none">
                              {brandName}
                            </p>
                            <p className="text-[12px] font-semibold text-slate-900 leading-snug line-clamp-2">
                              {product.name}
                            </p>
                            <div className="flex items-center gap-0.5">
                              {[...Array(5)].map((_: any, i: number) => (
                                <Star
                                  key={i}
                                  size={8}
                                  className={i < Math.round(rowRating) ? "text-amber-400 fill-amber-400" : "text-slate-200 fill-slate-200"}
                                />
                              ))}
                              <span className="text-[8px] text-slate-400 font-medium ml-0.5">{rowRating}</span>
                            </div>
                            <div className="flex items-center justify-between gap-2 mt-1">
                              <div className="flex items-baseline gap-1">
                                <Price
                                  amount={rowPrice}
                                  className="text-[13px] font-black text-[#890754] leading-none"
                                  countryPrices={product.countryPrices}
                                  currency={rowCurrency}
                                />
                                {rowHasDiscount && (
                                  <Price
                                    amount={rowOriginal}
                                    className="text-[9px] text-slate-400 line-through font-semibold leading-none"
                                    countryPrices={product.countryPrices}
                                    currency={rowCurrency}
                                  />
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); addToCart(product); }}
                                className="w-7 h-7 rounded-full bg-[#890754] hover:bg-[#540434] text-white flex items-center justify-center shrink-0 shadow-sm transition-all active:scale-90"
                                aria-label="Add to Cart"
                              >
                                <ShoppingCart className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Desktop: horizontal scroll slider */}
                  <div
                    ref={sliderRef}
                    className="hidden sm:flex flex-row gap-6 overflow-x-auto scroll-smooth pb-4 [&::-webkit-scrollbar]:hidden"
                    style={{ scrollSnapType: "x mandatory", scrollbarWidth: "none" }}
                  >
                    {flashProducts.map((product: any) => (
                      <div
                        key={product.id}
                        className="flex-none w-[240px] lg:w-[260px]"
                        style={{ scrollSnapAlign: "start" }}
                      >
                        <ProductCard
                          product={{
                            ...product,
                            price: product.price,
                            imageUrl: product.imageUrl,
                          }}
                          onQuickView={(p) => setQuickView(p)}
                          onAddToCart={(p) => addToCart(p)}
                          onOrderNow={(p) => orderNow(p)}
                        />
                      </div>
                    ))}
                  </div>
              </div>
            </div>
          )}


        </div>
      </section>

      <ProductQuickViewModal
        product={quickView}
        onClose={() => setQuickView(null)}
        onAddToCart={(p) => addToCart(p)}
        onOrderNow={(p) => orderNow(p)}
        onMoreDetails={(productId) => { setQuickView(null); router.push(`/products/${productId}`); }}
      />
    </main>
  );
}
