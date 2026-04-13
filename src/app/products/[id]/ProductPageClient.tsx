"use client";

import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Maximize2, ArrowLeft, ShieldCheck, Truck, RefreshCw, Check } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Price } from "@/components/Price";
import { ProductCard } from "@/components/ProductCard";
import { ProductQuickViewModal } from "@/components/ProductQuickViewModal";
import { useCartStore } from "@/lib/cart-store";
import { useLanguageStore } from "@/lib/language-store";
import { translations } from "@/lib/translations";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useUserCountry } from "@/lib/country-detection";
import { useCountryStore } from "@/lib/country-store";
import { hasValidPrice, getDisplayPrice, formatPriceUnits } from "@/lib/product-utils";
import { formatDescription } from "@/utils/formatText";

interface ProductPageClientProps {
  product: any;
  recommendations: any[];
}

export default function ProductPageClient({ product, recommendations }: ProductPageClientProps) {
  const { currentLanguage } = useLanguageStore();
  const t = translations[currentLanguage.code as keyof typeof translations];
  const { addItem, hasAddress } = useCartStore();
  const router = useRouter();
  const userCountry = useUserCountry();
  const { selectedCountry } = useCountryStore();
  
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isEnlarged, setIsEnlarged] = useState(false);
  const [showDescription, setShowDescription] = useState<string>('description');
  const [quickView, setQuickView] = useState<any>(null);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  
  // Price calculation using getDisplayPrice
  const priceInfo = useMemo(() => {
    return getDisplayPrice(product, selectedCountry);
  }, [product, selectedCountry]);
  const displayPrice = priceInfo.price || product.price || 0;
  const isAvailable = displayPrice > 0;

  const descriptionTabs = [
    { key: 'description', label: 'Description' },
    { key: 'benefits', label: 'Benefits' },
    { key: 'ingredients', label: 'Ingredients' },
    { key: 'howToUse', label: 'How to Use' },
  ];

  const availableTabs = descriptionTabs.filter(tab => (product as any)[tab.key]);
  const defaultTab = availableTabs[0]?.key || null;
  
  // Filter recommendations based on country support
  const filteredRecommendations = useMemo(() => {
    return recommendations.filter((p) => hasValidPrice(p, userCountry));
  }, [recommendations, userCountry]);

  // Combine images
  const allImages = [
    product.mainImage,
    ...(product.images || [])
  ].filter((img, index, self) => img && self.indexOf(img) === index) as string[];

  // Auto-slide
  useEffect(() => {
    if (allImages.length <= 1 || isEnlarged) return;
    const timer = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [allImages.length, isEnlarged]);

  function addToCart(productToAdd?: any) {
    const p = productToAdd || product;
    if (!p) return;

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
    }, 1);
    
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
      // Calculate unit price matching cart calculation
      const countryPrice = p.countryPrices?.find((cp: any) =>
        cp.country.toUpperCase() === userCountry.toUpperCase()
      );
      const unitPrice = countryPrice && Number(countryPrice.price) > 0
        ? Number(countryPrice.price)
        : (p.salePrice || p.price);

      const res = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [{ 
            productId: p.id, 
            quantity: 1,
            unitPrice
          }],
          country: userCountry
        }),
      });
      const data = await res.json();
      if (data.orderId) {
        toast.success("Redirecting...", { id: tid });
        router.push(`/checkout/payment/${data.orderId}`);
      } else {
        throw new Error(data.error || "Failed");
      }
    } catch (err: any) {
      toast.error(err.message, { id: tid });
      addToCart(p);
      router.push("/cart");
    }
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-black">
      {/* Navbar handled globally */}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 sm:pt-32 pb-20 sm:pb-28">
        {/* Breadcrumbs */}
        <div className="mb-10 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-black/30">
          <Link href="/products" className="hover:text-black transition-colors">Products</Link>
          <span className="w-1 h-1 bg-black/10 rounded-full" />
          <span className="text-black/60">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-20 items-start">
          {/* Gallery Section */}
          <div className="space-y-6">
            <div 
              className="relative aspect-square rounded-[3rem] overflow-hidden bg-black/[0.02] border border-black/5 group cursor-zoom-in shadow-2xl shadow-black/5"
              onClick={() => setIsEnlarged(true)}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentImageIndex}
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className="relative w-full h-full"
                >
                  <Image
                    src={allImages[currentImageIndex] || "/placeholder-product.png"}
                    alt={product.name}
                    fill
                    className="object-cover"
                    priority
                  />
                </motion.div>
              </AnimatePresence>

              {allImages.length > 1 && (
                <div className="absolute inset-x-6 top-1/2 -translate-y-1/2 flex justify-between opacity-0 group-hover:opacity-100 transition-all duration-300">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(p => (p - 1 + allImages.length) % allImages.length); }}
                    className="w-12 h-12 rounded-full bg-white shadow-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all text-black"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(p => (p + 1) % allImages.length); }}
                    className="w-12 h-12 rounded-full bg-white shadow-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all text-black"
                  >
                    <ChevronRight size={24} />
                  </button>
                </div>
              )}
              
              <div className="absolute bottom-6 right-6 p-3 bg-black/10 backdrop-blur-md rounded-full text-white pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                <Maximize2 size={20} />
              </div>
              </div>

            {/* Thumbnails */}
            {allImages.length > 1 && (
              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                {allImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`relative w-24 h-24 rounded-3xl overflow-hidden flex-shrink-0 transition-all border-2 ${
                      currentImageIndex === idx ? "border-black scale-105 shadow-xl" : "border-transparent opacity-40 hover:opacity-100"
                    }`}
                  >
                    <Image src={img} alt="Thumbnail" fill className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info Section */}
          <div className="space-y-10">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                {product.categories?.map((cat: string, idx: number) => (
                  <span key={idx} className="px-3 py-1 bg-black text-white text-[9px] font-black uppercase tracking-widest rounded-full">
                    {cat}
                  </span>
                ))}
                {product.subCategory?.name && (
                  <span className="px-3 py-1 bg-gray-200 text-black text-[9px] font-black uppercase tracking-widest rounded-full">
                    {product.subCategory.name}
                  </span>
                )}
                {product.hot && (
                  <span className="px-3 py-1 bg-red-500 text-white text-[9px] font-black uppercase tracking-widest rounded-full">Hot</span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-5xl font-bold tracking-tighter text-black leading-tight">
                {product.name}
              </h1>
              
            </div>

            <div className="flex items-baseline gap-4">
              {isAvailable ? (
                <Price amount={displayPrice} className="text-3xl sm:text-4xl lg:text-5xl font-black text-black" />
              ) : (
                <span className="text-xl sm:text-2xl lg:text-3xl font-black text-red-500">Unavailable in this region</span>
              )}
            </div>

            {availableTabs.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-[10px] font-black uppercase tracking-widest text-black/20">Details</div>
                </div>
                
                <div className="border-b border-black/10">
                  <div className="flex flex-wrap gap-1">
                    {availableTabs.map(tab => (
                      <button
                        key={tab.key}
                        onClick={() => setShowDescription(tab.key)}
                        className={`px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${
                          showDescription === tab.key 
                            ? 'text-black border-b-2 border-black' 
                            : 'text-black/40 hover:text-black/60'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>
                
                <AnimatePresence mode="wait">
                  {showDescription && (product as any)[showDescription] && (
                    <motion.div
                      key={showDescription}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="py-4"
                    >
                      <div className="text-lg leading-relaxed text-black/60 font-medium prose prose-stone max-w-none">
                        {formatDescription((product as any)[showDescription] as string)}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {product.features && product.features.length > 0 && (
              <div className="space-y-6">
                <div className="text-[10px] font-black uppercase tracking-widest text-black/20">Specifications</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {product.features.map((f: string, i: number) => (
                    <div key={i} className="flex items-center gap-3 p-4 bg-black/[0.02] border border-black/5 rounded-2xl">
                      <div className="w-1.5 h-1.5 bg-black/20 rounded-full" />
                      <span className="text-[11px] font-bold text-black/50 uppercase tracking-widest">{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Skin Tones */}
            {product.skinTones && product.skinTones.length > 0 && (
              <div className="space-y-4">
                <div className="text-[10px] font-black uppercase tracking-widest text-black/20">Suitable for Skin Tones</div>
                <div className="flex flex-wrap gap-3">
                  {product.skinTones.map((tone: any, idx: number) => (
                    <span key={idx} className="inline-flex items-center gap-2 px-4 py-2 bg-black/[0.03] border border-black/5 text-black text-[10px] font-bold uppercase tracking-widest rounded-full">
                      {tone.hexColor && (
                        <span className="w-4 h-4 rounded-full border border-black/10" style={{ backgroundColor: tone.hexColor }} />
                      )}
                      {tone.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Skin Concerns */}
            {product.skinConcerns && product.skinConcerns.length > 0 && (
              <div className="space-y-4">
                <div className="text-[10px] font-black uppercase tracking-widest text-black/20">Addresses Skin Concerns</div>
                <div className="flex flex-wrap gap-3">
                  {product.skinConcerns.map((concern: string, idx: number) => (
                    <span key={idx} className="px-4 py-2 bg-red-50 text-red-600 text-[10px] font-bold uppercase tracking-widest rounded-full border border-red-100">
                      {concern}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="hidden md:flex pt-6 sm:pt-8 border-t border-black/5 flex flex-col sm:flex-row gap-3 sm:gap-4">
              <button
                onClick={orderNow}
                className="btn-53 flex-[2] h-24 rounded-3xl shadow-xl shadow-black/20 text-xl"
              >
                <span className="original font-black uppercase tracking-[0.15em] text-lg">Order Now</span>
                <div className="letters text-lg">
                  {Array.from("FAST").map((letter, index) => (
                    <span key={index}>{letter}</span>
                  ))}
                </div>
              </button>
              <button
                onClick={addToCart}
                className="flex-1 h-24 rounded-3xl bg-gradient-to-b from-white to-gray-100 border-2 border-gray-200 text-gray-700 text-sm font-black uppercase tracking-[0.2em] hover:from-gray-50 hover:to-gray-200 hover:border-gray-300 hover:shadow-xl hover:shadow-gray-200/50 transition-all active:scale-[0.98]"
              >
                Add to Cart
              </button>
            </div>

            {/* Perks */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-8 sm:pt-10 border-t border-black/5 text-center">
              <div className="space-y-2">
                <div className="w-10 h-10 bg-gradient-to-b from-gray-50 to-gray-100 rounded-full flex items-center justify-center mx-auto border border-gray-200"><Truck size={18} className="text-slate-700" /></div>
                <div className="text-[8px] font-black uppercase tracking-widest text-slate-600">Free Shipping</div>
              </div>
              <div className="space-y-2">
                <div className="w-10 h-10 bg-gradient-to-b from-gray-50 to-gray-100 rounded-full flex items-center justify-center mx-auto border border-gray-200"><RefreshCw size={18} className="text-slate-700" /></div>
                <div className="text-[8px] font-black uppercase tracking-widest text-slate-600">Easy Returns</div>
              </div>
              <div className="space-y-2">
                <div className="w-10 h-10 bg-gradient-to-b from-gray-50 to-gray-100 rounded-full flex items-center justify-center mx-auto border border-gray-200"><ShieldCheck size={18} className="text-slate-700" /></div>
                <div className="text-[8px] font-black uppercase tracking-widest text-slate-600">Secured Payment</div>
              </div>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        {filteredRecommendations.length > 0 && (
          <section className="mt-20 sm:mt-32 space-y-8 sm:space-y-12">
            <div className="flex items-center gap-6">
              <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-black">Recommended</h2>
              <div className="h-[1px] flex-1 bg-black/5" />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-6">
              {filteredRecommendations.map((rec, idx) => (rec &&
                <ProductCard
                  key={rec.id}
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
              ))}
            </div>
          </section>
        )}
      </main>


      {/* Mobile Sticky Bar */}
      <div className="md:hidden fixed bottom-4 left-4 right-4 z-[40] max-w-lg mx-auto">
        <div className="glass-panel-heavy rounded-[2rem] p-2 sm:p-3 flex items-center gap-2 sm:gap-3 shadow-2xl shadow-black/20 border border-white/20">
          <motion.button
            onClick={addToCart}
            disabled={isAddingToCart}
            className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center ${
              isAddingToCart 
                ? 'bg-green-500 shadow-lg shadow-green-500/40' 
                : 'bg-gradient-to-b from-white to-gray-100 border-2 border-gray-200'
            }`}
            whileHover={!isAddingToCart ? { scale: 1.05 } : {}}
            whileTap={!isAddingToCart ? { scale: 0.95 } : {}}
            animate={isAddingToCart ? { scale: [1, 1.15, 1.05, 1] } : {}}
            transition={{ duration: 0.3 }}
          >
            <AnimatePresence mode="wait">
              {!isAddingToCart ? (
                <motion.div
                  key="bag"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <svg width="24" height="24" viewBox="0 0 64 64" className="w-6 h-6">
                    <defs>
                      <linearGradient id="cartGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#f97316" />
                        <stop offset="50%" stopColor="#ef4444" />
                        <stop offset="100%" stopColor="#ec4899" />
                      </linearGradient>
                    </defs>
                    <motion.path
                      d="M4 12h8l4 16h28l-4-16H12l-8-4v0l4 20h8"
                      fill="url(#cartGrad)"
                      stroke="none"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.5 }}
                    />
                    <motion.circle
                      cx="20"
                      cy="52"
                      r="6"
                      fill="#f97316"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2 }}
                    />
                    <motion.circle
                      cx="44"
                      cy="52"
                      r="6"
                      fill="#ec4899"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.3 }}
                    />
                  </svg>
                </motion.div>
              ) : (
                <motion.div
                  key="check"
                  initial={{ scale: 0.5, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                >
                  <Check size={20} className="text-green-500" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
          <button
            onClick={orderNow}
            className="btn-53 flex-1 h-14 sm:h-16 rounded-2xl shadow-xl text-base"
          >
            <span className="original font-black uppercase tracking-[0.15em]">Order Now</span>
            <div className="letters">
              {Array.from("FAST").map((letter, index) => (
                <span key={index}>{letter}</span>
              ))}
            </div>
          </button>
        </div>
      </div>

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
              className="absolute top-10 right-10 w-16 h-16 bg-black text-white rounded-full flex items-center justify-center hover:scale-110 active:scale-90 transition-all z-[110] shadow-2xl"
            >
              <X size={32} />
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
              <div className="absolute inset-x-10 top-1/2 -translate-y-1/2 flex justify-between">
                <button 
                  onClick={() => setCurrentImageIndex(p => (p - 1 + allImages.length) % allImages.length)}
                  className="w-20 h-20 rounded-full bg-black/5 text-black flex items-center justify-center hover:bg-black hover:text-white transition-all shadow-xl"
                >
                  <ChevronLeft size={48} />
                </button>
                <button 
                  onClick={() => setCurrentImageIndex(p => (p + 1) % allImages.length)}
                  className="w-20 h-20 rounded-full bg-black/5 text-black flex items-center justify-center hover:bg-black hover:text-white transition-all shadow-xl"
                >
                  <ChevronRight size={48} />
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <ProductQuickViewModal
        product={quickView}
        onClose={() => setQuickView(null)}
        onAddToCart={(p) => addToCart(p)}
        onOrderNow={(p) => orderNow(p)}
        onMoreDetails={(productId) => { setQuickView(null); window.location.href = `/products/${productId}`; }}
      />
    </div>
  );
}
