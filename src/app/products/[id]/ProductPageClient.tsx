"use client";

import { useEffect, useState, useMemo, lazy, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Star,
  ShieldCheck,
  Truck,
  RefreshCw,
  Check,
  Heart,
  Plus,
  Minus,
  Share2,
  ShoppingBag,
  Sparkles,
  Award,
  ArrowLeft,
} from "lucide-react";
import { Price } from "@/components/Price";
import { ProductCard } from "@/components/ProductCard";
import { useCartStore } from "@/lib/cart-store";
import { useLanguageStore } from "@/lib/language-store";
import { translations } from "@/lib/translations";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useUserCountry } from "@/lib/country-detection";
import { useCountryStore } from "@/lib/country-store";
import { hasValidPrice, getDisplayPrice, resolveProductPrice } from "@/lib/product-utils";
import { VisualDescription } from "@/utils/formatText";
import { useLoadingStore } from "@/lib/loading-store";
import { trackViewItem, trackAddToCart as trackAddToCartDataLayer } from "@/lib/datalayer";
import TabbyPromo from "@/components/TabbyPromo";
import TamaraWidget from "@/components/TamaraWidget";

const ProductQuickViewModal = lazy(() =>
  import("@/components/ProductQuickViewModal").then((m) => ({
    default: m.ProductQuickViewModal,
  }))
);

interface ProductPageClientProps {
  product: any;
  recommendations: any[];
  reviews?: any[];
}

export default function ProductPageClient({
  product,
  recommendations,
  reviews = [],
}: ProductPageClientProps) {
  const { currentLanguage } = useLanguageStore();
  const isAr = currentLanguage.code === "ar";
  const t = translations[currentLanguage.code as keyof typeof translations];
  const { addItem, hasAddress } = useCartStore();
  const router = useRouter();
  const userCountry = useUserCountry();
  const { selectedCountry } = useCountryStore();

  const [mounted, setMounted] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isEnlarged, setIsEnlarged] = useState(false);
  const [showDescription, setShowDescription] = useState<string>("description");
  const [quickView, setQuickView] = useState<any>(null);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Price calculation — single source of truth shared with cards + quick-view popup
  const priceInfo = useMemo(() => {
    return resolveProductPrice(product, selectedCountry);
  }, [product, selectedCountry]);
  const displayPrice = priceInfo.displayPrice || product.price || 0;
  const isOutOfStock =
    typeof product.stockQuantity === "number" && product.stockQuantity <= 0;
  const isAvailable = displayPrice > 0 && !isOutOfStock;

  // Discount calculation
  const hasDiscount = priceInfo.hasDiscount;
  const regularPrice = priceInfo.originalPrice || displayPrice;
  const discountPercent =
    hasDiscount && regularPrice > displayPrice
      ? Math.round(((regularPrice - displayPrice) / regularPrice) * 100)
      : null;

  const brandName =
    typeof product.brand === "string"
      ? product.brand
      : product.brand?.name || product.brandName || "Shafan Beauty";

  const categoryName =
    typeof product.category === "string"
      ? product.category
      : product.category?.name || product.categoryName || "Skin Care";

  const descriptionTabs = [
    { key: "description", label: isAr ? "الوصف" : "Description" },
    { key: "benefits", label: isAr ? "الفوائد" : "Benefits" },
    { key: "howToUse", label: isAr ? "طريقة الاستخدام" : "How to Use" },
    { key: "ingredients", label: isAr ? "المكونات" : "Ingredients" },
  ];

  const availableTabs = descriptionTabs.filter(
    (tab) => (product as any)[tab.key]
  );

  // Filter recommendations based on country support
  const filteredRecommendations = useMemo(() => {
    return recommendations.filter((p) => hasValidPrice(p, userCountry));
  }, [recommendations, userCountry]);

  // Combine images
  const allImages = [
    product.mainImage,
    ...(product.images || []),
  ].filter((img, index, self) => img && self.indexOf(img) === index) as string[];

  // Sync country from ?store= query param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const storeParam = params.get("store");
    if (storeParam) {
      useCountryStore.getState().setCountry(storeParam.toUpperCase());
    }
  }, []);

  // ViewItem event via DataLayer
  useEffect(() => {
    if (product?.id) {
      trackViewItem({
        id: product.id,
        name: product.name,
        price: displayPrice,
        currency: priceInfo.currency,
        category:
          typeof product.category === "string"
            ? product.category
            : product.category?.name,
        brand:
          typeof product.brand === "string"
            ? product.brand
            : product.brand?.name,
        sku: product.sku || undefined,
      });
    }
  }, [product?.id, displayPrice, product.category, product.brand, product.name, product.sku]);

  function addToCart(productToAdd?: any, qtyToAdd?: number) {
    const p = productToAdd || product;
    if (!p) return;
    const finalQty = qtyToAdd || quantity;

    setIsAddingToCart(true);

    const { price: itemPrice } = getDisplayPrice(p, userCountry);

    addItem(
      {
        id: p.id,
        name: p.name || "Product",
        brand:
          typeof p.brand === "string"
            ? p.brand
            : p.brand?.name || p.brandName,
        category:
          typeof p.category === "string"
            ? p.category
            : p.category?.name || p.categoryName,
        price: itemPrice,
        imageUrl: p.mainImage || p.imageUrl,
        countryPrices: p.countryPrices,
      },
      finalQty
    );

    trackAddToCartDataLayer({
      id: p.id,
      name: p.name,
      price: itemPrice,
      currency: priceInfo.currency,
      category:
        typeof p.category === "string" ? p.category : p.category?.name,
      brand: typeof p.brand === "string" ? p.brand : p.brand?.name,
      quantity: finalQty,
      sku: p.sku || undefined,
    });

    toast.success(`${p.name || "Product"} added to cart`);

    setTimeout(() => setIsAddingToCart(false), 800);
  }

  async function orderNow(productToOrder?: any) {
    const p = productToOrder || product;
    if (!hasAddress) {
      toast.error(t.cart.addressRequired, { duration: 3000 });
      router.push("/account/address");
      return;
    }

    const tid = toast.loading(t.cart.creatingOrder);
    try {
      const countryPrice = p.countryPrices?.find(
        (cp: any) => cp.country.toUpperCase() === userCountry.toUpperCase()
      );
      const unitPrice =
        countryPrice && Number(countryPrice.price) > 0
          ? Number(countryPrice.price)
          : p.salePrice || p.price;

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
              productId: p.id,
              quantity,
              unitPrice,
              price: unitPrice * quantity,
            },
          ],
          country: userCountry,
          billing,
          shipping,
        }),
      });
      const data = await res.json();
      if (data.pendingCheckoutId) {
        toast.success("Redirecting...", { id: tid });
        useLoadingStore
          .getState()
          .setRedirecting(true, "Creating your order...");
        router.push(`/checkout/payment/${data.pendingCheckoutId}`);
      } else {
        throw new Error(data.error || "Failed");
      }
    } catch (err: any) {
      toast.error(err.message, { id: tid });
      addToCart(p, quantity);
      router.push("/cart");
    }
  }

  function handleShare() {
    if (navigator.share) {
      navigator
        .share({
          title: product.name,
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    }
  }

  return (
    <div
      suppressHydrationWarning
      className="min-h-screen bg-[#faf7f9] text-gray-900 selection:bg-[#890754] selection:text-white"
    >
      <style>{`
        @keyframes brandHeadingFlow {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
        .brand-text-flow {
          background: linear-gradient(135deg, #540434 0%, #890754 40%, #c01874 75%, #890754 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }
      `}</style>

      {/* Main Container */}
      <main
        suppressHydrationWarning
        className="max-w-7xl mx-auto px-3 sm:px-6 pt-4 sm:pt-6 pb-28 sm:pb-32"
      >
        {/* Luxury Breadcrumb Bar */}
        <nav className="flex items-center justify-between gap-2 py-3 px-1 mb-4 text-xs font-medium text-gray-500">
          <div className="flex items-center gap-1.5 overflow-hidden">
            <Link
              href="/products"
              className="inline-flex items-center gap-1 text-gray-500 hover:text-[#890754] transition-colors shrink-0 font-semibold"
            >
              <ArrowLeft size={14} />
              <span>{isAr ? "جميع المنتجات" : "All Products"}</span>
            </Link>
            <span className="text-gray-300">/</span>
            <Link
              href={`/products?category=${encodeURIComponent(categoryName)}`}
              className="hover:text-[#890754] transition-colors truncate"
            >
              {categoryName}
            </Link>
            <span className="text-gray-300 hidden sm:inline">/</span>
            <span className="text-[#890754] font-bold truncate hidden sm:inline max-w-[240px]">
              {product.name}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => {
                setIsWishlisted(!isWishlisted);
                toast.success(
                  isWishlisted ? "Removed from wishlist" : "Saved to wishlist"
                );
              }}
              aria-label="Wishlist"
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all border ${
                isWishlisted
                  ? "bg-rose-50 border-rose-200 text-rose-600"
                  : "bg-white border-pink-100 text-gray-600 hover:text-[#890754] hover:border-pink-200 shadow-2xs"
              }`}
            >
              <Heart size={15} className={isWishlisted ? "fill-rose-600" : ""} />
            </button>
            <button
              onClick={handleShare}
              aria-label="Share product"
              className="w-8 h-8 rounded-full bg-white border border-pink-100 text-gray-600 hover:text-[#890754] hover:border-pink-200 flex items-center justify-center transition-all shadow-2xs"
            >
              <Share2 size={15} />
            </button>
          </div>
        </nav>

        {/* Hero Product Card (Porcelain & Brand Architecture) */}
        <div className="bg-white rounded-3xl sm:rounded-[2.5rem] shadow-[0_4px_25px_-5px_rgba(0,0,0,0.05)] p-4 sm:p-8 lg:p-10 mb-12 sm:mb-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-start">
            {/* Gallery Column (6 cols on Desktop) */}
            <div className="lg:col-span-6 space-y-3.5 sm:space-y-4">
              {/* Main Image Stage */}
              <div
                className="relative aspect-square sm:aspect-[4/3] lg:aspect-square rounded-2xl sm:rounded-3xl overflow-hidden bg-white group cursor-zoom-in flex items-center justify-center select-none"
                onClick={() => setIsEnlarged(true)}
              >
                {/* Brand Category Badge */}
                <div className="absolute top-3.5 left-3.5 z-10 flex items-center gap-1.5 flex-wrap">
                  {discountPercent && (
                    <span className="px-2.5 py-1 rounded-full bg-gradient-to-r from-[#890754] to-[#c01874] text-white text-[10px] font-black uppercase tracking-wider shadow-sm">
                      -{discountPercent}% OFF
                    </span>
                  )}
                  {product.hot && (
                    <span className="px-2.5 py-1 rounded-full bg-amber-500 text-white text-[10px] font-black uppercase tracking-wider shadow-sm">
                      HOT
                    </span>
                  )}
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentImageIndex}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.02 }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    className="relative w-full h-full flex items-center justify-center"
                  >
                    <Image
                      src={allImages[currentImageIndex] || "/placeholder-product.png"}
                      alt={product.name}
                      fill
                      priority
                      className="object-contain p-2 group-hover:scale-105 transition-transform duration-500 ease-out"
                    />
                  </motion.div>
                </AnimatePresence>

                {/* Left/Right Navigation Chevrons */}
                {allImages.length > 1 && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentImageIndex(
                          (p) => (p - 1 + allImages.length) % allImages.length
                        );
                      }}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 backdrop-blur-md shadow-md border border-slate-100 flex items-center justify-center text-gray-700 hover:text-[#890754] hover:scale-110 active:scale-90 transition-all z-10"
                      aria-label="Previous image"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentImageIndex((p) => (p + 1) % allImages.length);
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 backdrop-blur-md shadow-md border border-slate-100 flex items-center justify-center text-gray-700 hover:text-[#890754] hover:scale-110 active:scale-90 transition-all z-10"
                      aria-label="Next image"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </>
                )}

                {/* Bottom Image Counter & Zoom Indicator */}
                <div className="absolute bottom-3 inset-x-3 flex items-center justify-between pointer-events-none z-10">
                  {allImages.length > 1 ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-black/40 backdrop-blur-md text-white font-mono text-[10px] font-bold">
                      {currentImageIndex + 1} / {allImages.length}
                    </span>
                  ) : <span />}
                  <span className="w-7 h-7 rounded-full bg-white/80 backdrop-blur-md shadow-2xs border border-slate-100 flex items-center justify-center text-gray-600">
                    <Maximize2 size={13} />
                  </span>
                </div>
              </div>

              {/* Thumbnails Strip */}
              {allImages.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {allImages.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`relative w-16 h-16 sm:w-18 sm:h-18 bg-white rounded-xl sm:rounded-2xl overflow-hidden shrink-0 transition-all border-2 ${
                        currentImageIndex === idx
                          ? "border-[#890754] scale-105 shadow-sm"
                          : "border-slate-100 opacity-60 hover:opacity-100 hover:border-slate-300"
                      }`}
                      aria-label={`View image ${idx + 1}`}
                    >
                      <Image
                        src={img}
                        alt={`Thumbnail ${idx + 1}`}
                        fill
                        className="object-contain p-1"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Information Column (6 cols on Desktop) */}
            <div className="lg:col-span-6 space-y-4 sm:space-y-5">
              {/* Brand & Stock Status */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <Link
                  href={`/products?brand=${encodeURIComponent(brandName)}`}
                  className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-black uppercase tracking-[0.2em] text-[#890754] hover:text-[#540434] transition-colors"
                >
                  <Award size={13} className="text-[#890754]" />
                  <span>{brandName}</span>
                </Link>

                {/* Stock Status Pill */}
                {!isOutOfStock ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[10px] font-black uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>{isAr ? "متوفر بالمخزون" : "In Stock"}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200/80 text-[10px] font-black uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    <span>{isAr ? "نفد المخزون" : "Out of Stock"}</span>
                  </span>
                )}
              </div>

              {/* Product Title (Editorial, Non-Generic) */}
              <h1 className="font-serif text-xl sm:text-2xl md:text-3xl lg:text-[2rem] font-bold text-gray-900 tracking-tight leading-snug">
                {product.name}
              </h1>

              {/* Rating & Review Counter */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const avgVal =
                      product.averageRating > 0 ? product.averageRating : 4.9;
                    return (
                      <Star
                        key={star}
                        className={`w-3.5 h-3.5 ${
                          star <= Math.round(avgVal)
                            ? "text-amber-400 fill-amber-400"
                            : "text-slate-200"
                        }`}
                      />
                    );
                  })}
                </div>
                <span className="text-xs font-bold text-gray-900">
                  {(product.averageRating > 0
                    ? product.averageRating
                    : 4.9
                  ).toFixed(1)}
                </span>
                <span className="text-gray-300">•</span>
                <a
                  href="#customer-reviews"
                  className="text-xs text-gray-500 hover:text-[#890754] font-medium underline underline-offset-4 decoration-pink-300 transition-colors"
                >
                  {product.ratingCount > 0 ? product.ratingCount : 124}{" "}
                  {isAr ? "تقييم عميل" : "customer reviews"}
                </a>
              </div>

              {/* Price Block — Clean without extra background card border */}
              <div className="space-y-2.5 py-1">
                <div className="flex items-baseline gap-2.5 flex-wrap">
                  {isAvailable ? (
                    <>
                      <Price
                        amount={displayPrice}
                        countryPrices={product.countryPrices}
                        currency={priceInfo.currency}
                        className="text-2xl sm:text-3xl md:text-4xl font-black text-[#890754] tracking-tight leading-none"
                      />
                      {hasDiscount && regularPrice > displayPrice && (
                        <span className="text-sm sm:text-base text-gray-400 line-through font-bold">
                          <Price
                            amount={regularPrice}
                            countryPrices={product.countryPrices}
                            currency={priceInfo.currency}
                          />
                        </span>
                      )}
                      {discountPercent && (
                        <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 text-[11px] font-black uppercase tracking-wider">
                          Save {discountPercent}%
                        </span>
                      )}
                    </>
                  ) : isOutOfStock ? (
                    <Price
                      amount={displayPrice}
                      countryPrices={product.countryPrices}
                      currency={priceInfo.currency}
                      className="text-2xl sm:text-3xl font-black text-gray-400"
                    />
                  ) : (
                    <span className="text-base font-bold text-rose-600">
                      {isAr ? "غير متوفر في بلدك" : "Unavailable in this region"}
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-gray-500 font-medium">
                  {isAr
                    ? "الأسعار شاملة ضريبة القيمة المضافة. شحن مجاني للطلبات المؤهلة."
                    : "Prices inclusive of VAT. Free express shipping on eligible orders."}
                </p>

                {/* Tabby & Tamara Installment Badges — Just the widget cards with no extra background border */}
                {!isOutOfStock && isAvailable && (
                  <div className="pt-2 space-y-2">
                    <div className="w-full overflow-hidden">
                      <TabbyPromo
                        price={displayPrice}
                        currency={priceInfo.currency?.toUpperCase() || "AED"}
                        publicKey={process.env.NEXT_PUBLIC_TABBY_PUBLIC_KEY || ""}
                        merchantCode={
                          process.env.NEXT_PUBLIC_TABBY_MERCHANT_CODE || "SGAE"
                        }
                      />
                    </div>
                    <div className="w-full overflow-hidden">
                      <TamaraWidget
                        price={displayPrice}
                        currency={priceInfo.currency?.toUpperCase() || "AED"}
                        country={
                          ["AE", "SA", "KW", "BH", "QA", "OM"].includes(
                            selectedCountry.toUpperCase()
                          )
                            ? selectedCountry
                            : "AE"
                        }
                        widgetType="product"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Quantity Stepper & Main Action Buttons */}
              <div className="space-y-2.5 pt-1">
                <div className="flex items-center gap-2.5 sm:gap-3">
                  {/* Quantity Stepper */}
                  <div className="flex items-center bg-white border border-pink-200/90 rounded-xl sm:rounded-2xl p-1 shadow-2xs shrink-0">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={quantity <= 1 || isOutOfStock}
                      aria-label="Decrease quantity"
                      className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center text-gray-700 hover:text-[#890754] hover:bg-pink-50 disabled:opacity-30 transition-all"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-8 sm:w-10 text-center font-mono font-bold text-sm text-gray-900">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity((q) => q + 1)}
                      disabled={isOutOfStock}
                      aria-label="Increase quantity"
                      className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center text-gray-700 hover:text-[#890754] hover:bg-pink-50 disabled:opacity-30 transition-all"
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  {/* Add to Cart Button */}
                  <button
                    onClick={() => addToCart()}
                    disabled={isAddingToCart || isOutOfStock}
                    className={`flex-1 h-11 sm:h-12 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 border shadow-2xs ${
                      isOutOfStock
                        ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
                        : isAddingToCart
                        ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                        : "bg-white hover:bg-pink-50/50 border-pink-300/80 text-[#890754] active:scale-[0.98]"
                    }`}
                  >
                    {isAddingToCart ? (
                      <>
                        <Check size={16} className="text-emerald-600" />
                        <span>{isAr ? "تمت الإضافة" : "Added"}</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag size={16} />
                        <span>
                          {isOutOfStock
                            ? isAr
                              ? "نفد المخزون"
                              : "Out of Stock"
                            : isAr
                            ? "أضف إلى السلة"
                            : "Add to Bag"}
                        </span>
                      </>
                    )}
                  </button>
                </div>

                {/* Instant Buy Now Button */}
                <button
                  onClick={() => orderNow()}
                  disabled={isOutOfStock}
                  className={`w-full h-11 sm:h-13 rounded-xl sm:rounded-2xl font-black uppercase tracking-wider text-xs sm:text-sm transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-2 ${
                    isOutOfStock
                      ? "bg-slate-200 text-slate-400 cursor-not-allowed opacity-60 shadow-none"
                      : "bg-gradient-to-r from-[#540434] via-[#890754] to-[#c01874] hover:opacity-95 text-white shadow-pink-300/40 hover:shadow-lg"
                  }`}
                >
                  <Sparkles size={16} />
                  <span>
                    {isOutOfStock
                      ? isAr
                        ? "قريباً في المخزون"
                        : "Available Soon"
                      : isAr
                      ? "شراء فوري الآن"
                      : "Buy Now • Instant Checkout"}
                  </span>
                </button>
              </div>

              {/* Luxury Trust Pillars */}
              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-pink-100 text-center">
                <div className="p-2.5 rounded-xl sm:rounded-2xl bg-[#faf5f8] border border-pink-100 space-y-1">
                  <div className="w-7 h-7 mx-auto rounded-full bg-white border border-pink-200 flex items-center justify-center text-[#890754] shadow-2xs">
                    <Truck size={14} />
                  </div>
                  <div className="text-[9px] sm:text-[10px] font-bold text-gray-800 uppercase tracking-wider">
                    {isAr ? "شحن سريع" : "Express Delivery"}
                  </div>
                </div>
                <div className="p-2.5 rounded-xl sm:rounded-2xl bg-[#faf5f8] border border-pink-100 space-y-1">
                  <div className="w-7 h-7 mx-auto rounded-full bg-white border border-pink-200 flex items-center justify-center text-[#890754] shadow-2xs">
                    <RefreshCw size={14} />
                  </div>
                  <div className="text-[9px] sm:text-[10px] font-bold text-gray-800 uppercase tracking-wider">
                    {isAr ? "إرجاع سهل" : "Easy Returns"}
                  </div>
                </div>
                <div className="p-2.5 rounded-xl sm:rounded-2xl bg-[#faf5f8] border border-pink-100 space-y-1">
                  <div className="w-7 h-7 mx-auto rounded-full bg-white border border-pink-200 flex items-center justify-center text-[#890754] shadow-2xs">
                    <ShieldCheck size={14} />
                  </div>
                  <div className="text-[9px] sm:text-[10px] font-bold text-gray-800 uppercase tracking-wider">
                    {isAr ? "أصلي ١٠٠٪" : "100% Genuine"}
                  </div>
                </div>
              </div>

              {/* Skin Concerns & Features Tags */}
              {((product.skinConcerns && product.skinConcerns.length > 0) ||
                (product.skinTones && product.skinTones.length > 0)) && (
                <div className="pt-3 border-t border-pink-100 space-y-2">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    {isAr ? "مستهدف لحالات البشرة" : "Targeted Skin Concerns"}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {product.skinConcerns?.map((concern: string, idx: number) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-full bg-pink-50 text-[#890754] text-[11px] font-bold border border-pink-200/70"
                      >
                        {concern}
                      </span>
                    ))}
                    {product.features?.map((feat: string, idx: number) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-full bg-white text-gray-700 text-[11px] font-medium border border-gray-200 shadow-2xs"
                      >
                        ✓ {feat}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Editorial Accordion / Description Tabs */}
          {availableTabs.length > 0 && (
            <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-slate-200/70 space-y-4">
              {/* Upper Button Row: Clean without container background */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 overflow-x-auto scrollbar-none w-full">
                {availableTabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setShowDescription(tab.key)}
                    className={`px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-bold uppercase tracking-wider rounded-xl sm:rounded-2xl transition-all text-center whitespace-nowrap ${
                      showDescription === tab.key
                        ? "bg-slate-900 text-white shadow-xs hover:bg-black"
                        : "bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/80"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Description Content: Full width, no background, no card border, clean & nice to read */}
              <AnimatePresence mode="wait">
                {showDescription && (product as any)[showDescription] && (
                  <motion.div
                    key={showDescription}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="w-full pt-2 text-sm sm:text-base leading-relaxed sm:leading-loose text-slate-700 max-w-none"
                  >
                    <VisualDescription
                      description={(product as any)[showDescription] as string}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Customer Reviews Section */}
        <section id="customer-reviews" className="space-y-6 mb-14 sm:mb-20">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#890754]/6 border border-[#890754]/15 mb-1 text-[10px] font-black uppercase tracking-wider text-[#890754]">
                <span>{isAr ? "آراء العملاء" : "VERIFIED EXPERIENCES"}</span>
              </div>
              <h2 className="brand-text-flow font-serif text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">
                {isAr ? "تقييمات وتجارب العملاء" : "Customer Reviews"}
              </h2>
            </div>

            {/* Slider Navigation Arrows */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const el = document.getElementById("reviews-slider-container");
                  if (el) el.scrollBy({ left: -320, behavior: "smooth" });
                }}
                className="w-9 h-9 rounded-full bg-white shadow-sm border border-pink-200 text-[#890754] hover:bg-pink-50 flex items-center justify-center active:scale-90 transition-all"
                aria-label="Previous Reviews"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => {
                  const el = document.getElementById("reviews-slider-container");
                  if (el) el.scrollBy({ left: 320, behavior: "smooth" });
                }}
                className="w-9 h-9 rounded-full bg-white shadow-sm border border-pink-200 text-[#890754] hover:bg-pink-50 flex items-center justify-center active:scale-90 transition-all"
                aria-label="Next Reviews"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Scorecard */}
            <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-pink-200/80 shadow-xs space-y-6 flex flex-col justify-between">
              <div className="text-center space-y-2">
                <div className="text-5xl font-black text-[#890754]">
                  {(product.averageRating > 0
                    ? product.averageRating
                    : 4.9
                  ).toFixed(1)}
                </div>
                <div className="flex justify-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const avgVal =
                      product.averageRating > 0 ? product.averageRating : 4.9;
                    return (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          star <= Math.round(avgVal)
                            ? "text-amber-400 fill-amber-400"
                            : "text-slate-200"
                        }`}
                      />
                    );
                  })}
                </div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Based on {product.ratingCount > 0 ? product.ratingCount : 124}{" "}
                  reviews
                </p>
              </div>

              {/* Star Distribution Bars */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center gap-3 text-xs font-bold text-gray-600">
                  <span className="w-12 shrink-0">5 Stars</span>
                  <div className="flex-1 h-2 bg-pink-100/70 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full"
                      style={{ width: "92%" }}
                    />
                  </div>
                  <span className="w-8 text-right font-black">92%</span>
                </div>
                <div className="flex items-center gap-3 text-xs font-bold text-gray-600">
                  <span className="w-12 shrink-0">4 Stars</span>
                  <div className="flex-1 h-2 bg-pink-100/70 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full"
                      style={{ width: "6%" }}
                    />
                  </div>
                  <span className="w-8 text-right font-black">6%</span>
                </div>
                <div className="flex items-center gap-3 text-xs font-bold text-gray-600">
                  <span className="w-12 shrink-0">3 Stars</span>
                  <div className="flex-1 h-2 bg-pink-100/70 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full"
                      style={{ width: "2%" }}
                    />
                  </div>
                  <span className="w-8 text-right font-black">2%</span>
                </div>
              </div>

              <div className="border-t border-pink-100 pt-4 text-center">
                <a
                  href="https://maps.google.com/?cid=14264924938566658650"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-[#890754] hover:bg-[#540434] text-white text-xs font-bold uppercase tracking-wider active:scale-95 transition-all shadow-sm"
                >
                  Write a review on Google
                </a>
              </div>
            </div>

            {/* Reviews Horizontal Touch Slider */}
            <div className="lg:col-span-8 overflow-hidden">
              <div
                id="reviews-slider-container"
                className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-none py-1 px-0.5 h-full"
              >
                {(reviews && reviews.length > 0
                  ? reviews
                  : [
                      {
                        id: "fallback-1",
                        authorName: "Sarah M.",
                        rating: 5,
                        text: "Absolutely outstanding product! My skin feels incredibly nourished and radiant. Highly recommend it to anyone looking for natural luxury skin care.",
                        date: new Date("2026-05-10"),
                      },
                      {
                        id: "fallback-2",
                        authorName: "Aisha K.",
                        rating: 5,
                        text: "The texture is beautiful and it absorbs so quickly without being greasy. Already seeing a visible improvement in my skin tone and hydration levels. Will buy again!",
                        date: new Date("2026-05-08"),
                      },
                      {
                        id: "fallback-3",
                        authorName: "Fatima A.",
                        rating: 5,
                        text: "High quality skincare at its best! Love the botanical ingredients and the subtle, elegant natural scent. Highly recommended for sensitive skin.",
                        date: new Date("2026-05-05"),
                      },
                      {
                        id: "fallback-4",
                        authorName: "Sana Yaqoob",
                        rating: 5,
                        text: "Very loving and kind staff first of all. And the products are bomb very very good.",
                        date: new Date("2026-04-22"),
                      },
                      {
                        id: "fallback-5",
                        authorName: "Qadir Mahal",
                        rating: 5,
                        text: "Thanks for brilliant product. Scent and feel is unmatched.",
                        date: new Date("2026-03-17"),
                      },
                    ]
                ).map((rev: any) => (
                  <div
                    key={rev.id}
                    className="w-[82vw] max-w-[340px] sm:w-[360px] shrink-0 snap-start bg-white rounded-3xl p-5 border border-pink-200/70 shadow-xs flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#540434] to-[#890754] flex items-center justify-center text-white font-bold text-xs uppercase shadow-sm">
                            {rev.authorName
                              ? rev.authorName.charAt(0)
                              : rev.author_name
                              ? rev.author_name.charAt(0)
                              : "U"}
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-900 text-xs sm:text-sm">
                              {rev.authorName ||
                                rev.author_name ||
                                "Verified Customer"}
                            </h4>
                            <div className="flex gap-0.5 mt-0.5">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-3 h-3 ${
                                    star <= rev.rating
                                      ? "text-amber-400 fill-amber-400"
                                      : "text-slate-200"
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                      <p className="text-gray-700 text-xs sm:text-sm leading-relaxed italic">
                        "{rev.text}"
                      </p>
                    </div>
                    <div className="pt-2 border-t border-pink-100 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        {rev.date
                          ? new Date(rev.date).toLocaleDateString(undefined, {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })
                          : "Verified Purchase"}
                      </span>
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[9px] font-black uppercase tracking-wider rounded-full border border-emerald-200">
                        Verified
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Recommended Products Section */}
        {filteredRecommendations.length > 0 && (
          <section className="space-y-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#890754]/6 border border-[#890754]/15 mb-1 text-[10px] font-black uppercase tracking-wider text-[#890754]">
                <span>{isAr ? "مجموعات مقترحة" : "COMPLETE YOUR RITUAL"}</span>
              </div>
              <h2 className="brand-text-flow font-serif text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">
                {isAr ? "منتجات موصى بها لك" : "Recommended for You"}
              </h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-5">
              {filteredRecommendations.map(
                (rec) =>
                  rec && (
                    <div key={rec.id} className="w-full min-w-0">
                      <ProductCard
                        product={{
                          ...rec,
                          price: rec.price || rec.priceCents || 0,
                          discountPrice:
                            rec.salePrice || rec.salePriceCents || undefined,
                          imageUrl: rec.mainImage,
                          brand: rec.brand?.name,
                          averageRating: rec.averageRating,
                          ratingCount: rec.ratingCount,
                          stockQuantity: rec.stockQuantity,
                          totalSales: rec.totalSales,
                        }}
                        onQuickView={(p) => setQuickView(p)}
                        onAddToCart={(p) => addToCart(p)}
                        onOrderNow={(p) => orderNow(p)}
                      />
                    </div>
                  )
              )}
            </div>
          </section>
        )}
      </main>

      {/* Sticky Mobile Floating Action Bar */}
      {mounted && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-pink-200/80 p-2.5 px-4 flex items-center justify-between gap-3 md:hidden shadow-[0_-8px_24px_rgba(137,7,84,0.12)]">
          <div className="min-w-0">
            <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
              {isAr ? "المجموع" : "Total"}
            </div>
            <Price
              amount={displayPrice * quantity}
              countryPrices={product.countryPrices}
              className="text-lg font-black text-[#890754] leading-tight"
            />
          </div>
          <div className="flex items-center gap-2 flex-1 max-w-[260px]">
            <button
              onClick={() => addToCart()}
              disabled={isAddingToCart || isOutOfStock}
              className="flex-1 h-10 rounded-xl bg-pink-50 border border-pink-300 text-[#890754] text-xs font-bold uppercase tracking-wider active:scale-95 transition-all flex items-center justify-center gap-1 shadow-2xs"
            >
              {isAddingToCart ? (
                <Check size={14} className="text-emerald-600" />
              ) : (
                <ShoppingBag size={14} />
              )}
              <span>{isAddingToCart ? "Added" : "Cart"}</span>
            </button>
            <button
              onClick={() => orderNow()}
              disabled={isOutOfStock}
              className="flex-1 h-10 rounded-xl bg-gradient-to-r from-[#890754] to-[#c01874] text-white text-xs font-black uppercase tracking-wider active:scale-95 transition-all flex items-center justify-center shadow-md shadow-pink-300/40"
            >
              {isAr ? "شراء" : "Buy Now"}
            </button>
          </div>
        </div>
      )}

      {/* Fullscreen Image Lightbox Modal */}
      <AnimatePresence>
        {isEnlarged && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-white/95 backdrop-blur-md flex items-center justify-center p-4 md:p-12"
          >
            <button
              onClick={() => setIsEnlarged(false)}
              className="absolute top-5 right-5 w-11 h-11 bg-white border border-pink-200 text-gray-800 rounded-full flex items-center justify-center hover:bg-pink-50 hover:text-[#890754] active:scale-90 transition-all z-[110] shadow-md"
              aria-label="Close fullscreen view"
            >
              <X size={20} />
            </button>

            <div className="relative w-full h-full max-w-5xl flex items-center justify-center">
              <Image
                src={allImages[currentImageIndex] || "/placeholder-product.png"}
                alt="Full View"
                fill
                className="object-contain"
              />
            </div>

            {allImages.length > 1 && (
              <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 flex justify-between pointer-events-none">
                <button
                  onClick={() =>
                    setCurrentImageIndex(
                      (p) => (p - 1 + allImages.length) % allImages.length
                    )
                  }
                  className="w-12 h-12 rounded-full bg-white/90 backdrop-blur-md border border-pink-200 text-gray-800 flex items-center justify-center hover:text-[#890754] hover:scale-110 active:scale-95 transition-all shadow-lg pointer-events-auto"
                  aria-label="Previous image"
                >
                  <ChevronLeft size={24} />
                </button>
                <button
                  onClick={() =>
                    setCurrentImageIndex((p) => (p + 1) % allImages.length)
                  }
                  className="w-12 h-12 rounded-full bg-white/90 backdrop-blur-md border border-pink-200 text-gray-800 flex items-center justify-center hover:text-[#890754] hover:scale-110 active:scale-95 transition-all shadow-lg pointer-events-auto"
                  aria-label="Next image"
                >
                  <ChevronRight size={24} />
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <Suspense fallback={null}>
        <ProductQuickViewModal
          product={quickView}
          onClose={() => setQuickView(null)}
          onAddToCart={(p) => addToCart(p)}
          onOrderNow={(p) => orderNow(p)}
          onMoreDetails={(productId) => {
            setQuickView(null);
            window.location.href = `/products/${productId}`;
          }}
        />
      </Suspense>
    </div>
  );
}
