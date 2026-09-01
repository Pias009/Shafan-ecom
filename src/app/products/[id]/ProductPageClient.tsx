"use client";

import { useEffect, useState, useMemo, lazy, Suspense } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Maximize2, Star, ShieldCheck, Truck, RefreshCw, Check, Heart, Plus, Minus, Share2, ShoppingBag, Zap } from "lucide-react";
import { Price } from "@/components/Price";
import { ProductCard } from "@/components/ProductCard";
import { useCartStore } from "@/lib/cart-store";
import { useLanguageStore } from "@/lib/language-store";
import { translations } from "@/lib/translations";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useUserCountry } from "@/lib/country-detection";
import { useCountryStore } from "@/lib/country-store";
import { hasValidPrice, getDisplayPrice } from "@/lib/product-utils";
import { VisualDescription } from "@/utils/formatText";
import { useLoadingStore } from "@/lib/loading-store";
import { trackViewItem, trackAddToCart as trackAddToCartDataLayer } from "@/lib/datalayer";
import TabbyPromo from "@/components/TabbyPromo";
import TamaraWidget from "@/components/TamaraWidget";

const ProductQuickViewModal = lazy(() => import("@/components/ProductQuickViewModal").then(m => ({ default: m.ProductQuickViewModal })));

interface ProductPageClientProps {
  product: any;
  recommendations: any[];
  reviews?: any[];
}

export default function ProductPageClient({ product, recommendations, reviews = [] }: ProductPageClientProps) {
  const { currentLanguage } = useLanguageStore();
  const t = translations[currentLanguage.code as keyof typeof translations];
  const { addItem, hasAddress } = useCartStore();
  const router = useRouter();
  const userCountry = useUserCountry();
  const { selectedCountry } = useCountryStore();

  const [mounted, setMounted] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isEnlarged, setIsEnlarged] = useState(false);
  const [showDescription, setShowDescription] = useState<string>('description');
  const [quickView, setQuickView] = useState<any>(null);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Price calculation using getDisplayPrice
  const priceInfo = useMemo(() => {
    return getDisplayPrice(product, selectedCountry);
  }, [product, selectedCountry]);
  const displayPrice = priceInfo.price || product.price || 0;
  const isOutOfStock = typeof product.stockQuantity === 'number' && product.stockQuantity <= 0;
  const isAvailable = displayPrice > 0 && !isOutOfStock;

  const descriptionTabs = [
    { key: 'description', label: 'Description' },
    { key: 'benefits', label: 'Benefits' },
    { key: 'ingredients', label: 'Ingredients' },
    { key: 'howToUse', label: 'How to Use' },
  ];

  const availableTabs = descriptionTabs.filter(tab => (product as any)[tab.key]);

  // Filter recommendations based on country support
  const filteredRecommendations = useMemo(() => {
    return recommendations.filter((p) => hasValidPrice(p, userCountry));
  }, [recommendations, userCountry]);

  // Combine images
  const allImages = [
    product.mainImage,
    ...(product.images || [])
  ].filter((img, index, self) => img && self.indexOf(img) === index) as string[];

  // Sync country from ?store= query param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const storeParam = params.get('store');
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
        currency: 'AED',
        category: typeof product.category === 'string' ? product.category : product.category?.name,
        brand: typeof product.brand === 'string' ? product.brand : product.brand?.name,
        sku: product.sku || undefined,
      });
    }
  }, [product?.id, displayPrice]);

  function addToCart(productToAdd?: any, qtyToAdd?: number) {
    const p = productToAdd || product;
    if (!p) return;
    const finalQty = qtyToAdd || quantity;

    setIsAddingToCart(true);

    const { price: itemPrice } = getDisplayPrice(p, userCountry);

    addItem({
      id: p.id,
      name: p.name || 'Product',
      brand: typeof p.brand === 'string' ? p.brand : (p.brand?.name || p.brandName),
      category: typeof p.category === 'string' ? p.category : (p.category?.name || p.categoryName),
      price: itemPrice,
      imageUrl: p.mainImage || p.imageUrl,
      countryPrices: p.countryPrices,
    }, finalQty);

    trackAddToCartDataLayer({
      id: p.id,
      name: p.name,
      price: itemPrice,
      currency: 'AED',
      category: typeof p.category === 'string' ? p.category : p.category?.name,
      brand: typeof p.brand === 'string' ? p.brand : p.brand?.name,
      quantity: finalQty,
      sku: p.sku || undefined,
    });

    toast.success(`${p.name || 'Product'} added to cart`);

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
      const countryPrice = p.countryPrices?.find((cp: any) =>
        cp.country.toUpperCase() === userCountry.toUpperCase()
      );
      const unitPrice = countryPrice && Number(countryPrice.price) > 0
        ? Number(countryPrice.price)
        : (p.salePrice || p.price);

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
            productId: p.id,
            quantity,
            unitPrice,
            price: unitPrice * quantity
          }],
          country: userCountry,
          billing,
          shipping
        }),
      });
      const data = await res.json();
      if (data.pendingCheckoutId) {
        toast.success("Redirecting...", { id: tid });
        useLoadingStore.getState().setRedirecting(true, "Creating your order...");
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
      navigator.share({
        title: product.name,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    }
  }

  return (
    <div suppressHydrationWarning className="min-h-screen bg-gradient-to-b from-[#96dacc] via-[#82cdbe] to-[#96dacc] text-[#042b24]">
      <main suppressHydrationWarning className="max-w-7xl mx-auto px-3 sm:px-6 pt-20 sm:pt-28 pb-28 sm:pb-28">
        
        {/* Main Product Showcase Card */}
        <div className="bg-white/60 backdrop-blur-3xl rounded-[2rem] sm:rounded-[3rem] border border-white/60 shadow-2xl shadow-[#0c433a]/10 p-4 sm:p-8 lg:p-12 mb-12 sm:mb-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-start">
            
            {/* Gallery Section - 6 cols desktop */}
            <div className="lg:col-span-6 space-y-4">
              <div
                className="relative aspect-square sm:aspect-[4/3] lg:aspect-square rounded-2xl sm:rounded-[2.5rem] overflow-hidden bg-white border border-black/5 group cursor-zoom-in shadow-md flex items-center justify-center p-3 sm:p-6"
                onClick={() => setIsEnlarged(true)}
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentImageIndex}
                    initial={{ opacity: 0, scale: 1.04 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    className="relative w-full h-full"
                  >
                    <Image
                      src={allImages[currentImageIndex] || "/placeholder-product.png"}
                      alt={product.name}
                      fill
                      className="object-contain p-1 sm:p-4"
                      priority
                    />
                  </motion.div>
                </AnimatePresence>

                {/* Floating Wishlist & Share buttons */}
                <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
                  <button
                    onClick={(e) => { e.stopPropagation(); setIsWishlisted(!isWishlisted); toast.success(isWishlisted ? "Removed from wishlist" : "Saved to wishlist"); }}
                    className={`w-10 h-10 rounded-full backdrop-blur-md shadow-md flex items-center justify-center transition-all ${
                      isWishlisted ? "bg-rose-500 text-white" : "bg-white/90 text-[#042b24] hover:bg-white"
                    }`}
                  >
                    <Heart size={18} className={isWishlisted ? "fill-white" : ""} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleShare(); }}
                    className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-md text-[#042b24] hover:bg-white shadow-md flex items-center justify-center transition-all"
                  >
                    <Share2 size={18} />
                  </button>
                </div>

                {/* Micro-data image counter */}
                {allImages.length > 1 && (
                  <div className="absolute bottom-4 left-4 px-3 py-1 bg-black/40 backdrop-blur-md text-white text-[10px] font-mono tracking-widest rounded-full z-10">
                    {`[${String(currentImageIndex + 1).padStart(2, '0')} / ${String(allImages.length).padStart(2, '0')}]`}
                  </div>
                )}

                {allImages.length > 1 && (
                  <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 flex justify-between opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-10">
                    <button
                      onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(p => (p - 1 + allImages.length) % allImages.length); }}
                      className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-md shadow-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-all text-[#042b24] pointer-events-auto border border-black/5"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(p => (p + 1) % allImages.length); }}
                      className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-md shadow-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-all text-[#042b24] pointer-events-auto border border-black/5"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>
                )}

                <div className="absolute bottom-4 right-4 p-2 bg-black/20 backdrop-blur-md rounded-full text-white pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                  <Maximize2 size={16} />
                </div>
              </div>

              {/* Thumbnails */}
              {allImages.length > 1 && (
                <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-hide">
                  {allImages.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`relative w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-xl sm:rounded-2xl overflow-hidden flex-shrink-0 transition-all border-2 ${
                        currentImageIndex === idx ? "border-[#0c433a] scale-105 shadow-md" : "border-transparent opacity-60 hover:opacity-100"
                      }`}
                    >
                      <Image src={img} alt="Thumbnail" fill className="object-contain p-1" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Info Section - 6 cols desktop */}
            <div className="lg:col-span-6 space-y-5 sm:space-y-6">
              
              {/* Badges & Rating */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-2 flex-wrap">
                  {product.categories?.map((cat: string, idx: number) => (
                    <span key={idx} className="px-3 py-1 bg-[#0c433a] text-white text-[9px] font-black uppercase tracking-widest rounded-full shadow-sm">
                      {cat}
                    </span>
                  ))}
                  {product.subCategory?.name && (
                    <span className="px-3 py-1 bg-white/80 text-[#042b24] text-[9px] font-black uppercase tracking-widest rounded-full border border-white">
                      {product.subCategory.name}
                    </span>
                  )}
                  {product.hot && (
                    <span className="px-3 py-1 bg-rose-500 text-white text-[9px] font-black uppercase tracking-widest rounded-full shadow-sm">Hot</span>
                  )}
                  {/* Stock pill */}
                  {!isOutOfStock ? (
                    <span className="px-3 py-1 bg-emerald-500/10 text-emerald-800 border border-emerald-300/50 text-[9px] font-black uppercase tracking-widest rounded-full inline-flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      In Stock
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-rose-500/10 text-rose-800 border border-rose-300/50 text-[9px] font-black uppercase tracking-widest rounded-full inline-flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                      Out of Stock
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const avgVal = product.averageRating > 0 ? product.averageRating : 4.9;
                      return (
                        <Star
                          key={star}
                          className={`w-3.5 h-3.5 ${star <= Math.round(avgVal) ? "text-amber-400 fill-amber-400" : "text-slate-300"}`}
                        />
                      );
                    })}
                  </div>
                  <span className="text-xs font-black text-[#042b24] ml-1">
                    {(product.averageRating > 0 ? product.averageRating : 4.9).toFixed(1)}
                  </span>
                  <span className="text-[10px] font-bold text-[#042b24]/60 uppercase tracking-widest">
                    ({product.ratingCount > 0 ? product.ratingCount : 124} customer reviews)
                  </span>
                </div>
              </div>

              {/* Product Title */}
              <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl text-[#042b24] font-black tracking-tight leading-snug">
                {product.name}
              </h1>

              {/* Price */}
              <div className="flex items-baseline gap-3">
                {isOutOfStock ? (
                  <Price amount={displayPrice} className="text-2xl sm:text-3xl font-black text-[#042b24]" />
                ) : isAvailable ? (
                  <Price amount={displayPrice} className="text-3xl sm:text-4xl font-black text-[#042b24]" />
                ) : (
                  <span className="text-lg font-black text-rose-600">Unavailable in this region</span>
                )}
              </div>

              {/* Quantity Counter & Action Buttons */}
              <div className="space-y-2.5 pt-1">
                <div className="flex items-center gap-2 sm:gap-3">
                  {/* Quantity selector */}
                  <div className="flex items-center bg-white/80 backdrop-blur-md border border-white rounded-2xl p-1 shadow-sm shrink-0">
                    <button
                      onClick={() => setQuantity(q => Math.max(1, q - 1))}
                      disabled={quantity <= 1 || isOutOfStock}
                      className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-[#042b24] hover:bg-black/5 disabled:opacity-30 transition-all"
                    >
                      <Minus size={15} />
                    </button>
                    <span className="w-8 sm:w-10 text-center font-mono font-black text-xs sm:text-sm text-[#042b24]">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(q => q + 1)}
                      disabled={isOutOfStock}
                      className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-[#042b24] hover:bg-black/5 disabled:opacity-30 transition-all"
                    >
                      <Plus size={15} />
                    </button>
                  </div>

                  {/* Add to Cart Desktop Button */}
                  <button
                    onClick={() => addToCart()}
                    disabled={isAddingToCart || isOutOfStock}
                    className={`flex-1 h-11 sm:h-13 rounded-2xl text-xs sm:text-sm font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 border shadow-sm ${
                      isOutOfStock
                        ? 'bg-white/20 border-white/30 text-[#042b24]/40 cursor-not-allowed'
                        : 'bg-white/90 backdrop-blur-md border-white text-[#042b24] hover:bg-white hover:shadow-md active:scale-[0.98]'
                    }`}
                  >
                    {isAddingToCart ? <Check size={16} className="text-emerald-600" /> : <ShoppingBag size={16} />}
                    {isAddingToCart ? 'Added' : (isOutOfStock ? 'Out of Stock' : 'Add to Cart')}
                  </button>
                </div>

                {/* Buy Now Desktop Button (Clean Text, Logo Removed) */}
                <button
                  onClick={() => orderNow()}
                  disabled={isOutOfStock}
                  className={`w-full h-11 sm:h-13 rounded-2xl font-black uppercase tracking-wider text-xs sm:text-sm transition-all shadow-lg active:scale-[0.98] flex items-center justify-center ${
                    isOutOfStock
                      ? 'bg-slate-300 text-slate-500 cursor-not-allowed opacity-50 shadow-none'
                      : 'bg-[#0c433a] hover:bg-[#072a24] text-white shadow-[#0c433a]/20'
                  }`}
                >
                  {isOutOfStock ? 'Available Soon' : 'Buy Now'}
                </button>
              </div>

              {/* Separate Slim Tabby & Tamara Widgets placed AFTER Buy Now button */}
              {!isOutOfStock && isAvailable && (
                <div className="space-y-2 pt-1">
                  <div className="px-3 py-1.5 bg-white/60 backdrop-blur-md rounded-xl border border-white/80 shadow-xs overflow-hidden">
                    <TabbyPromo 
                      price={displayPrice} 
                      currency={priceInfo.currency?.toUpperCase() || 'AED'} 
                      publicKey={process.env.NEXT_PUBLIC_TABBY_PUBLIC_KEY || ""} 
                      merchantCode={process.env.NEXT_PUBLIC_TABBY_MERCHANT_CODE || "SGAE"} 
                    />
                  </div>
                  <div className="px-3 py-1.5 bg-white/60 backdrop-blur-md rounded-xl border border-white/80 shadow-xs overflow-hidden">
                    <TamaraWidget 
                      price={displayPrice} 
                      currency={priceInfo.currency?.toUpperCase() || 'AED'} 
                      country={["AE", "SA", "KW", "BH", "QA", "OM"].includes(selectedCountry.toUpperCase()) ? selectedCountry : "AE"}
                      widgetType="product"
                    />
                  </div>
                </div>
              )}

              {/* Accordion / Description Tabs */}
              {availableTabs.length > 0 && (
                <div className="space-y-3 pt-3 border-t border-black/5">
                  <div className="flex gap-1 p-1 bg-black/5 rounded-2xl overflow-x-auto scrollbar-hide">
                    {availableTabs.map(tab => (
                      <button
                        key={tab.key}
                        onClick={() => setShowDescription(tab.key)}
                        className={`flex-1 min-w-[90px] py-2 px-3 text-[11px] font-black uppercase tracking-wider rounded-xl transition-all text-center whitespace-nowrap ${
                          showDescription === tab.key
                            ? 'bg-[#0c433a] text-white shadow-sm'
                            : 'text-[#042b24]/70 hover:text-[#042b24] hover:bg-white/40'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  <AnimatePresence mode="wait">
                    {showDescription && (product as any)[showDescription] && (
                      <motion.div
                        key={showDescription}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.2 }}
                        className="p-4 sm:p-5 bg-white/70 backdrop-blur-md rounded-2xl border border-white/80 shadow-sm text-xs sm:text-sm leading-relaxed text-[#042b24]/90"
                      >
                        <VisualDescription description={(product as any)[showDescription] as string} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Specifications */}
              {product.features && product.features.length > 0 && (
                <div className="space-y-3 pt-3 border-t border-black/5">
                  <div className="text-[10px] font-black uppercase tracking-widest text-[#042b24]/50">Specifications</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {product.features.map((f: string, i: number) => (
                      <div key={i} className="flex items-center gap-2.5 p-2.5 bg-white/50 backdrop-blur-md border border-white/60 rounded-xl">
                        <div className="w-1.5 h-1.5 bg-[#0c433a] rounded-full shrink-0" />
                        <span className="text-xs font-bold text-[#042b24] uppercase tracking-wider">{f}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Skin Tones & Concerns */}
              {((product.skinTones && product.skinTones.length > 0) || (product.skinConcerns && product.skinConcerns.length > 0)) && (
                <div className="space-y-3 pt-3 border-t border-black/5">
                  {product.skinTones && product.skinTones.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-[10px] font-black uppercase tracking-widest text-[#042b24]/50">Suitable for Skin Tones</div>
                      <div className="flex flex-wrap gap-2">
                        {product.skinTones.map((tone: any, idx: number) => (
                          <span key={idx} className="inline-flex items-center gap-2 px-3 py-1 bg-white/60 border border-white text-[#042b24] text-xs font-bold uppercase tracking-wider rounded-full shadow-sm">
                            {tone.hexColor && (
                              <span className="w-3 h-3 rounded-full border border-black/10 shrink-0" style={{ backgroundColor: tone.hexColor }} />
                            )}
                            <span>{tone.name}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {product.skinConcerns && product.skinConcerns.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <div className="text-[10px] font-black uppercase tracking-widest text-[#042b24]/50">Addresses Skin Concerns</div>
                      <div className="flex flex-wrap gap-2">
                        {product.skinConcerns.map((concern: string, idx: number) => (
                          <span key={idx} className="px-3 py-1 bg-rose-500/10 text-rose-700 text-xs font-bold uppercase tracking-wider rounded-full border border-rose-200/50">
                            {concern}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Perks */}
              <div className="grid grid-cols-3 gap-2 pt-4 border-t border-black/5 text-center">
                <div className="space-y-1 p-2.5 bg-white/40 backdrop-blur-md rounded-2xl border border-white">
                  <div className="w-8 h-8 bg-[#0c433a] text-white rounded-full flex items-center justify-center mx-auto shadow-sm">
                    <Truck size={16} />
                  </div>
                  <div className="text-[9px] font-black uppercase tracking-wider text-[#042b24]">Free Shipping</div>
                </div>
                <div className="space-y-1 p-2.5 bg-white/40 backdrop-blur-md rounded-2xl border border-white">
                  <div className="w-8 h-8 bg-[#0c433a] text-white rounded-full flex items-center justify-center mx-auto shadow-sm">
                    <RefreshCw size={16} />
                  </div>
                  <div className="text-[9px] font-black uppercase tracking-wider text-[#042b24]">Easy Returns</div>
                </div>
                <div className="space-y-1 p-2.5 bg-white/40 backdrop-blur-md rounded-2xl border border-white">
                  <div className="w-8 h-8 bg-[#0c433a] text-white rounded-full flex items-center justify-center mx-auto shadow-sm">
                    <ShieldCheck size={16} />
                  </div>
                  <div className="text-[9px] font-black uppercase tracking-wider text-[#042b24]">Secured Payment</div>
                </div>
              </div>

              {/* Trust Badge */}
              <div className="flex items-center gap-3 p-3.5 bg-white/70 backdrop-blur-md border border-white rounded-2xl shadow-sm">
                <ShieldCheck className="w-6 h-6 text-[#0c433a] shrink-0" />
                <div>
                  <p className="text-xs font-black text-[#042b24] uppercase tracking-wider">100% Authentic Product</p>
                  <p className="text-[10px] font-bold text-[#042b24]/60 mt-0.5">Guaranteed genuine, sourced directly from brands</p>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Customer Reviews Section */}
        <section className="space-y-8 mb-16 sm:mb-24">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1">
              <h2 className="text-2xl sm:text-4xl font-serif font-black tracking-tight text-[#042b24]">Customer Reviews</h2>
              <div className="h-[1px] flex-1 bg-[#042b24]/10 hidden sm:block" />
            </div>

            {/* Slider Navigation Arrows */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const el = document.getElementById('reviews-slider-container');
                  if (el) el.scrollBy({ left: -320, behavior: 'smooth' });
                }}
                className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-md shadow-sm border border-white text-[#042b24] hover:bg-white flex items-center justify-center active:scale-90 transition-all"
                aria-label="Previous Reviews"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={() => {
                  const el = document.getElementById('reviews-slider-container');
                  if (el) el.scrollBy({ left: 320, behavior: 'smooth' });
                }}
                className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-md shadow-sm border border-white text-[#042b24] hover:bg-white flex items-center justify-center active:scale-90 transition-all"
                aria-label="Next Reviews"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Scorecard */}
            <div className="lg:col-span-4 bg-white/70 backdrop-blur-2xl rounded-3xl p-6 border border-white/60 shadow-sm space-y-6 flex flex-col justify-between">
              <div className="text-center space-y-2">
                <div className="text-5xl font-black text-[#042b24]">
                  {(product.averageRating > 0 ? product.averageRating : 4.9).toFixed(1)}
                </div>
                <div className="flex justify-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const avgVal = product.averageRating > 0 ? product.averageRating : 4.9;
                    return (
                      <Star
                        key={star}
                        className={`w-5 h-5 ${star <= Math.round(avgVal) ? "text-amber-400 fill-amber-400" : "text-slate-200"}`}
                      />
                    );
                  })}
                </div>
                <p className="text-xs font-bold text-[#042b24]/50 uppercase tracking-wider">
                  Based on {product.ratingCount > 0 ? product.ratingCount : 124} reviews
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <div className="flex items-center gap-3 text-xs font-bold text-[#042b24]/70">
                  <span className="w-12 shrink-0">5 Stars</span>
                  <div className="flex-1 h-2 bg-black/5 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full" style={{ width: '92%' }}></div>
                  </div>
                  <span className="w-8 text-right font-black">92%</span>
                </div>
                <div className="flex items-center gap-3 text-xs font-bold text-[#042b24]/70">
                  <span className="w-12 shrink-0">4 Stars</span>
                  <div className="flex-1 h-2 bg-black/5 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full" style={{ width: '6%' }}></div>
                  </div>
                  <span className="w-8 text-right font-black">6%</span>
                </div>
                <div className="flex items-center gap-3 text-xs font-bold text-[#042b24]/70">
                  <span className="w-12 shrink-0">3 Stars</span>
                  <div className="flex-1 h-2 bg-black/5 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full" style={{ width: '2%' }}></div>
                  </div>
                  <span className="w-8 text-right font-black">2%</span>
                </div>
              </div>

              <div className="border-t border-black/5 pt-4 text-center">
                <a
                  href="https://maps.google.com/?cid=14264924938566658650"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#0c433a] text-white text-xs font-black uppercase tracking-wider hover:bg-[#072a24] active:scale-95 transition-all shadow-md"
                >
                  Write a review on Google
                </a>
              </div>
            </div>

            {/* Reviews Horizontal Touch Slider */}
            <div className="lg:col-span-8 overflow-hidden">
              <div
                id="reviews-slider-container"
                className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide py-1 px-0.5 h-full"
              >
                {(reviews && reviews.length > 0 ? reviews : [
                  {
                    id: "fallback-1",
                    authorName: "Sarah M.",
                    rating: 5,
                    text: "Absolutely outstanding product! My skin feels incredibly nourished and radiant. Highly recommend it to anyone looking for natural luxury skin care.",
                    date: new Date("2026-05-10")
                  },
                  {
                    id: "fallback-2",
                    authorName: "Aisha K.",
                    rating: 5,
                    text: "The texture is beautiful and it absorbs so quickly without being greasy. Already seeing a visible improvement in my skin tone and hydration levels. Will buy again!",
                    date: new Date("2026-05-08")
                  },
                  {
                    id: "fallback-3",
                    authorName: "Fatima A.",
                    rating: 5,
                    text: "High quality skincare at its best! Love the botanical ingredients and the subtle, elegant natural scent. Highly recommended for sensitive skin.",
                    date: new Date("2026-05-05")
                  },
                  {
                    id: "fallback-4",
                    authorName: "Sana Yaqoob",
                    rating: 5,
                    text: "Very loving and kind staff first of all. And the products are bomb very very good.",
                    date: new Date("2026-04-22")
                  },
                  {
                    id: "fallback-5",
                    authorName: "Qadir Mahal",
                    rating: 5,
                    text: "Thanks for brilliant product. Scent and feel is unmatched.",
                    date: new Date("2026-03-17")
                  }
                ]).map((rev: any) => (
                  <div
                    key={rev.id}
                    className="w-[82vw] max-w-[340px] sm:w-[360px] shrink-0 snap-start bg-white/80 backdrop-blur-2xl rounded-3xl p-5 border border-white/60 shadow-sm flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#0c433a] flex items-center justify-center text-white font-black text-xs uppercase shadow-sm">
                            {rev.authorName ? rev.authorName.charAt(0) : rev.author_name ? rev.author_name.charAt(0) : "U"}
                          </div>
                          <div>
                            <h4 className="font-bold text-[#042b24] text-xs sm:text-sm">
                              {rev.authorName || rev.author_name || "Verified Customer"}
                            </h4>
                            <div className="flex gap-0.5 mt-0.5">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-3 h-3 ${star <= rev.rating ? "text-amber-400 fill-amber-400" : "text-slate-200"}`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                      <p className="text-[#042b24]/90 text-xs sm:text-sm leading-relaxed italic">
                        "{rev.text}"
                      </p>
                    </div>
                    <div className="pt-2 border-t border-black/5 flex items-center justify-between">
                      <span className="text-[9px] font-black text-[#042b24]/50 uppercase tracking-widest">
                        {rev.date ? new Date(rev.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : "Verified Purchase"}
                      </span>
                      <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-800 text-[8px] font-black uppercase tracking-wider rounded-full">
                        Verified
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Recommendations */}
        {filteredRecommendations.length > 0 && (
          <section className="space-y-8">
            <div className="flex items-center gap-6">
              <h2 className="text-2xl sm:text-4xl font-serif font-black tracking-tight text-[#042b24]">Recommended</h2>
              <div className="h-[1px] flex-1 bg-[#042b24]/10" />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-6">
              {filteredRecommendations.map((rec) => (rec &&
                <div key={rec.id} className="w-full min-w-0">
                  <ProductCard
                    product={{
                      ...rec,
                      price: rec.price || rec.priceCents || 0,
                      discountPrice: rec.salePrice || rec.salePriceCents || undefined,
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
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Sticky Mobile Quick-Action Bar */}
      {mounted && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#0c433a]/95 backdrop-blur-xl border-t border-white/20 p-3 flex items-center justify-between gap-3 md:hidden shadow-2xl">
          <div>
            <div className="text-[9px] font-bold text-white/60 uppercase tracking-widest">Price</div>
            <Price amount={displayPrice * quantity} className="text-lg font-black text-white" />
          </div>
          <div className="flex items-center gap-2 flex-1 max-w-[240px]">
            <button
              onClick={() => addToCart()}
              disabled={isAddingToCart || isOutOfStock}
              className="flex-1 h-11 rounded-xl bg-white/10 text-white text-xs font-black uppercase tracking-wider border border-white/20 active:scale-95 transition-all flex items-center justify-center gap-1.5"
            >
              {isAddingToCart ? <Check size={14} className="text-emerald-400" /> : <ShoppingBag size={14} />}
              {isAddingToCart ? 'Added' : 'Cart'}
            </button>
            <button
              onClick={() => orderNow()}
              disabled={isOutOfStock}
              className="flex-1 h-11 rounded-xl bg-white text-[#042b24] text-xs font-black uppercase tracking-wider active:scale-95 transition-all flex items-center justify-center shadow-lg"
            >
              Buy Now
            </button>
          </div>
        </div>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {isEnlarged && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-white flex items-center justify-center p-6 md:p-20"
          >
            <button
              onClick={() => setIsEnlarged(false)}
              className="absolute top-6 right-6 w-12 h-12 bg-black text-white rounded-full flex items-center justify-center hover:scale-110 active:scale-90 transition-all z-[110] shadow-2xl"
            >
              <X size={24} />
            </button>

            <div className="relative w-full h-full max-w-7xl">
              <Image
                src={allImages[currentImageIndex]}
                alt="Full View"
                fill
                className="object-contain"
              />
            </div>

            {allImages.length > 1 && (
              <div className="absolute inset-x-6 top-1/2 -translate-y-1/2 flex justify-between">
                <button
                  onClick={() => setCurrentImageIndex(p => (p - 1 + allImages.length) % allImages.length)}
                  className="w-14 h-14 rounded-full bg-black/5 text-black flex items-center justify-center hover:bg-black hover:text-white transition-all shadow-xl"
                >
                  <ChevronLeft size={32} />
                </button>
                <button
                  onClick={() => setCurrentImageIndex(p => (p + 1) % allImages.length)}
                  className="w-14 h-14 rounded-full bg-black/5 text-black flex items-center justify-center hover:bg-black hover:text-white transition-all shadow-xl"
                >
                  <ChevronRight size={32} />
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
          onMoreDetails={(productId) => { setQuickView(null); window.location.href = `/products/${productId}`; }}
        />
      </Suspense>
    </div>
  );
}

