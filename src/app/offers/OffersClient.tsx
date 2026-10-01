"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Ticket,
  Copy,
  Check,
  Sparkles,
  Zap,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Star,
  ShoppingCart,
  LayoutGrid,
  List,
} from "lucide-react";
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
    <div className="relative w-full aspect-[21/9] sm:aspect-[24/9] md:min-h-[260px] rounded-2xl sm:rounded-3xl overflow-hidden shadow-xs border border-slate-100/80">
      <Image
        src={banner.imageUrl}
        alt={banner.title || "offer banner"}
        fill
        className="object-cover sm:object-contain"
        sizes="100vw"
        priority
      />
      {(banner.title || banner.subtitle || banner.offerText) && (
        <div
          className="absolute inset-0 flex flex-col justify-center px-4 sm:px-12 md:px-16 bg-gradient-to-r from-black/40 via-transparent to-transparent sm:bg-none"
          style={{ color: banner.textColor || "#fff" }}
        >
          {banner.offerText && (
            <span className="text-[9px] sm:text-xs font-black uppercase tracking-widest mb-1 sm:mb-2 opacity-90 drop-shadow-xs">
              {banner.offerText}
            </span>
          )}
          {banner.title && (
            <h2 className="font-display text-base sm:text-3xl md:text-5xl font-bold leading-tight max-w-xl drop-shadow-xs">
              {banner.title}
            </h2>
          )}
          {banner.subtitle && (
            <p className="text-[11px] sm:text-base mt-1 sm:mt-2 max-w-lg font-medium opacity-90 drop-shadow-xs line-clamp-2">
              {banner.subtitle}
            </p>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div
      className="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden"
      style={{ backgroundColor: banner.backgroundColor || undefined }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={banner.id}
          initial={{ opacity: 0, scale: 1.03 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
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
            className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 z-10 w-7 h-7 sm:w-10 sm:h-10 rounded-full bg-white/80 hover:bg-white text-slate-800 backdrop-blur-sm flex items-center justify-center transition-all shadow-md active:scale-95"
            aria-label="Previous banner"
          >
            <ChevronLeft size={15} />
          </button>
          <button
            onClick={() => setIndex((i) => (i + 1) % banners.length)}
            className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 z-10 w-7 h-7 sm:w-10 sm:h-10 rounded-full bg-white/80 hover:bg-white text-slate-800 backdrop-blur-sm flex items-center justify-center transition-all shadow-md active:scale-95"
            aria-label="Next banner"
          >
            <ChevronRight size={15} />
          </button>
          <div className="absolute bottom-2 sm:bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === index ? "bg-white w-4" : "bg-white/50 w-1.5"
                }`}
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
  products = [],
  coupons = [],
  flashProducts = [],
  banners = [],
}: {
  products: any[];
  coupons: Coupon[];
  flashProducts?: any[];
  banners?: OfferBanner[];
}) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [quickView, setQuickView] = useState<any>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const { addItem, hasAddress } = useCartStore();
  const { selectedCountry } = useCountryStore();
  const router = useRouter();
  const userCountry = useUserCountry();

  // Deduplicate products between flash sales and special offers
  const flashIds = new Set((flashProducts || []).map((p: any) => p.id));
  const otherOfferProducts = (products || []).filter((p: any) => !flashIds.has(p.id));

  function addToCart(product: any) {
    const cartItem = {
      id: product.id,
      name: product.name,
      brand: product.brandName || (typeof product.brand === "string" ? product.brand : product.brand?.name),
      category: product.categoryName,
      price: product.price,
      discountPrice: product.discountPrice || undefined,
      imageUrl: product.imageUrl || product.mainImage,
      countryPrices: product.countryPrices,
    };
    addItem(cartItem, 1);

    const { price: eventPrice, currency: eventCurrency } = getDisplayPrice(product, userCountry);
    fbEvent("AddToCart", {
      content_ids: [product.id],
      content_type: "product",
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
      const countryPrice = product.countryPrices?.find(
        (cp: any) => cp.country.toUpperCase() === userCountry.toUpperCase()
      );
      const unitPrice =
        countryPrice && Number(countryPrice.price) > 0
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
        const guestStr = localStorage.getItem("guest_address");
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
          items: [
            {
              productId: product.id,
              quantity: 1,
              unitPrice,
              price: unitPrice,
            },
          ],
          country: userCountry,
          billing,
          shipping,
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
      {/* Dynamic Background Pattern */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-0">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "radial-gradient(#000 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      {/* Page Header with Compact Mobile Spacing */}
      <header className="relative pt-2 pb-1.5 sm:pt-6 sm:pb-4 border-b border-black/[0.04]">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-0.5 sm:py-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 sm:gap-4">
              <Link
                href="/"
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white border border-slate-200/80 flex items-center justify-center hover:bg-slate-900 hover:text-white transition-all group shadow-xs shrink-0"
                aria-label="Back to Home"
              >
                <ArrowLeft
                  size={16}
                  className="group-hover:-translate-x-0.5 transition-transform text-slate-700 group-hover:text-white"
                />
              </Link>
              <div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <h1 className="text-base sm:text-2xl font-bold text-slate-900 tracking-tight leading-tight">
                    Exclusive Offers
                  </h1>
                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-[#890754]/10 text-[#890754] border border-[#890754]/20">
                    <Sparkles size={9} /> Hot Deals
                  </span>
                </div>
                <p className="text-[10.5px] sm:text-xs text-slate-500 font-medium">
                  Premium Beauty Deals & Discounts
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-[10px] sm:text-xs text-slate-400 block sm:inline">Active: </span>
                <span className="text-[11px] sm:text-sm font-bold text-slate-800">
                  {coupons.length + (flashProducts?.length || 0) + otherOfferProducts.length} Deals
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Banner Slider with Tight Spacing */}
      {banners.length > 0 && (
        <section className="max-w-7xl mx-auto px-3 sm:px-6 pt-1.5 sm:pt-3 pb-1">
          <OfferBannerSlider banners={banners} />
        </section>
      )}

      {/* Main Content Area - Reduced Top Space for Product Priority */}
      <section className="relative overflow-hidden pt-1.5 sm:pt-4 pb-16 sm:pb-24">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 relative z-10">

          {/* Slim Professional Coupon Card */}
          {coupons.length > 0 && (
            <div className="mb-3.5 sm:mb-6">
              <div className="flex flex-col gap-2.5 max-w-3xl mx-auto">
                {coupons.map((coupon) => (
                  <div
                    key={coupon.id}
                    className="relative bg-gradient-to-r from-pink-50/80 via-white to-amber-50/50 rounded-2xl border border-pink-200/70 p-2.5 sm:p-3.5 shadow-[0_2px_10px_rgba(137,7,84,0.04)] hover:shadow-md transition-all flex items-center justify-between gap-2 sm:gap-4 overflow-hidden group"
                  >
                    {/* Left & Right Ticket Cutouts */}
                    <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-[#fdfaf5] rounded-full border-r border-pink-200/80 pointer-events-none" />
                    <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-[#fdfaf5] rounded-full border-l border-pink-200/80 pointer-events-none" />

                    {/* Left: Icon & Discount Info */}
                    <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 pl-1.5 sm:pl-2">
                      <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-[#890754] to-[#540434] text-white flex items-center justify-center shrink-0 shadow-sm shadow-[#890754]/25">
                        <Ticket size={17} className="text-pink-200 group-hover:rotate-12 transition-transform" />
                      </div>
                      <div className="min-w-0 flex flex-col justify-center">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-sm sm:text-lg font-black text-slate-900 tracking-tight leading-none">
                            {coupon.description}
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[8px] sm:text-[9px] font-black uppercase tracking-wider bg-[#890754]/10 text-[#890754]">
                            PROMO
                          </span>
                        </div>
                        <p className="text-[10px] sm:text-xs text-slate-500 font-medium truncate mt-0.5 sm:mt-1">
                          {coupon.endDate
                            ? `Valid until ${new Date(coupon.endDate).toLocaleDateString()}`
                            : "Use code at checkout for instant savings"}
                        </p>
                      </div>
                    </div>

                    {/* Right: Code Pill & Copy Action */}
                    <div className="flex items-center gap-1.5 shrink-0 pr-1 sm:pr-2">
                      <div
                        onClick={() => handleCopyCode(coupon.code)}
                        className="flex items-center gap-1 sm:gap-1.5 bg-white border border-slate-200/90 hover:border-[#890754]/60 rounded-full pl-2 sm:pl-3.5 pr-1 sm:pr-1.5 py-1 cursor-pointer shadow-xs active:scale-95 transition-all"
                        title="Click to copy code"
                      >
                        <span className="font-mono text-xs sm:text-sm font-bold tracking-wider text-slate-800 select-all">
                          {coupon.code}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyCode(coupon.code);
                          }}
                          className={`px-2.5 sm:px-3.5 py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all duration-200 flex items-center gap-1 shadow-xs ${
                            copiedCode === coupon.code
                              ? "bg-emerald-600 text-white"
                              : "bg-[#890754] text-white hover:bg-[#6c0542] active:scale-95"
                          }`}
                          aria-label={`Copy code ${coupon.code}`}
                        >
                          {copiedCode === coupon.code ? (
                            <>
                              <Check size={11} className="stroke-[3]" />
                              <span className="hidden xs:inline">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy size={11} />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Product Priority: Flash Sales Section */}
          {flashProducts.length > 0 && (
            <div className="mb-8 sm:mb-14">
              {/* Header row */}
              <div className="flex items-center justify-between mb-2.5 sm:mb-5">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-11 sm:h-11 bg-yellow-400 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-sm shadow-yellow-400/25 shrink-0">
                    <Zap size={18} className="text-black fill-black sm:w-5 sm:h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h2 className="text-base sm:text-2xl font-black uppercase tracking-tight text-black">
                        Flash Sales
                      </h2>
                      <span className="animate-pulse w-2 h-2 rounded-full bg-red-500 inline-block" />
                    </div>
                    <p className="text-[9.5px] sm:text-[10px] font-bold uppercase tracking-widest text-black/50">
                      Hot deals — limited time only
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Mobile View Toggle: 2-Column Grid (Product Priority Default) vs List */}
                  <div className="flex sm:hidden items-center bg-white border border-slate-200 rounded-lg p-0.5 shadow-xs">
                    <button
                      type="button"
                      onClick={() => setViewMode("grid")}
                      className={`p-1.5 rounded-md transition-colors ${
                        viewMode === "grid" ? "bg-[#890754] text-white" : "text-slate-400"
                      }`}
                      aria-label="Grid view"
                    >
                      <LayoutGrid size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode("list")}
                      className={`p-1.5 rounded-md transition-colors ${
                        viewMode === "list" ? "bg-[#890754] text-white" : "text-slate-400"
                      }`}
                      aria-label="List view"
                    >
                      <List size={14} />
                    </button>
                  </div>

                  <Link
                    href="/products/flash-sales"
                    className="flex items-center gap-1 px-3 py-1.5 sm:px-5 sm:py-2.5 bg-yellow-400 hover:bg-yellow-300 text-black font-black text-[11px] sm:text-xs uppercase tracking-wider rounded-full transition-all shadow-xs hover:scale-105 active:scale-95 shrink-0"
                  >
                    <span>View All</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </div>

              {/* Products Rendering: 2-Column Grid (Priority) or Compact List */}
              {viewMode === "grid" ? (
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-6">
                  {flashProducts.map((product: any) => (
                    <div key={product.id} className="w-full">
                      <ProductCard
                        product={{
                          ...product,
                          price: product.price,
                          imageUrl: product.imageUrl || product.mainImage,
                        }}
                        onQuickView={(p) => setQuickView(p)}
                        onAddToCart={(p) => addToCart(p)}
                        onOrderNow={(p) => orderNow(p)}
                        priority={true}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-2.5 sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 sm:gap-6">
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
                    const imgSrc = getOptimizedUrl(
                      product.imageUrl || product.mainImage || "/placeholder-product.png",
                      200
                    );

                    return (
                      <div
                        key={product.id}
                        onClick={() => router.push(`/products/${product.slug || product.id}`)}
                        className="flex items-center gap-3 bg-white rounded-2xl border border-slate-100 shadow-xs p-2.5 cursor-pointer active:scale-[0.98] transition-transform"
                      >
                        {/* Thumbnail */}
                        <div className="relative w-[68px] h-[68px] shrink-0 rounded-xl bg-slate-50 overflow-hidden">
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
                                className={
                                  i < Math.round(rowRating)
                                    ? "text-amber-400 fill-amber-400"
                                    : "text-slate-200 fill-slate-200"
                                }
                              />
                            ))}
                            <span className="text-[8px] text-slate-400 font-medium ml-0.5">
                              {rowRating}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-2 mt-0.5">
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
                              onClick={(e) => {
                                e.stopPropagation();
                                addToCart(product);
                              }}
                              className="w-7 h-7 rounded-full bg-[#890754] hover:bg-[#540434] text-white flex items-center justify-center shrink-0 shadow-xs transition-all active:scale-90"
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
              )}
            </div>
          )}

          {/* More Special Offers & Discounts Section (Rendered with Product Priority) */}
          {otherOfferProducts.length > 0 && (
            <div className="mt-6 sm:mt-12">
              <div className="flex items-center justify-between mb-2.5 sm:mb-5">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-11 sm:h-11 bg-pink-100 rounded-xl sm:rounded-2xl flex items-center justify-center text-[#890754] shadow-xs shrink-0">
                    <Sparkles size={18} className="sm:w-5 sm:h-5" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-2xl font-black uppercase tracking-tight text-slate-900">
                      Special Deals & Discounts
                    </h2>
                    <p className="text-[9.5px] sm:text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      Curated promotional savings
                    </p>
                  </div>
                </div>
              </div>

              {/* 2-Column Responsive Product Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-6">
                {otherOfferProducts.map((product: any) => (
                  <div key={product.id} className="w-full">
                    <ProductCard
                      product={{
                        ...product,
                        price: product.price,
                        imageUrl: product.imageUrl || product.mainImage,
                      }}
                      onQuickView={(p) => setQuickView(p)}
                      onAddToCart={(p) => addToCart(p)}
                      onOrderNow={(p) => orderNow(p)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </section>

      {/* Quick View Modal */}
      <ProductQuickViewModal
        product={quickView}
        onClose={() => setQuickView(null)}
        onAddToCart={(p) => addToCart(p)}
        onOrderNow={(p) => orderNow(p)}
        onMoreDetails={(productId) => {
          setQuickView(null);
          router.push(`/products/${productId}`);
        }}
      />
    </main>
  );
}
