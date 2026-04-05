"use client";

import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Maximize2, ShoppingBag, ArrowLeft, Star, ShieldCheck, Truck, RefreshCw } from "lucide-react";
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
import { hasValidPrice, getDisplayPrice, formatPriceUnits } from "@/lib/product-utils";

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
  
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isEnlarged, setIsEnlarged] = useState(false);
  const [showDescription, setShowDescription] = useState<string>('shortDescription');
  const [quickView, setQuickView] = useState<any>(null);

  const descriptionTabs = [
    { key: 'shortDescription', label: 'Overview' },
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

    // Use our utility to get the correct price for the user's country
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

  const displayPrice = product.salePrice || product.salePriceCents || product.price || product.priceCents || 0;
  const originalPrice = product.regularPrice || product.regularPriceCents || product.price || product.priceCents || 0;

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-black">
      {/* Navbar handled globally */}

      <main className="max-w-7xl mx-auto px-6 pt-32 pb-20">
        {/* Breadcrumbs */}
        <div className="mb-10 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-black/30">
          <Link href="/products" className="hover:text-black transition-colors">Products</Link>
          <span className="w-1 h-1 bg-black/10 rounded-full" />
          <span className="text-black/60">{product.name}</span>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">
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

              {/* Progress Bar */}
              {allImages.length > 1 && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/5">
                  <motion.div 
                    className="h-full bg-black/20"
                    initial={{ width: "0%" }}
                    animate={{ width: `${((currentImageIndex + 1) / allImages.length) * 100}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              )}
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
              <h1 className="text-3xl lg:text-5xl font-bold tracking-tighter text-black leading-tight">
                {product.name}
              </h1>
              <div className="flex items-center gap-2 text-black/30">
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={14} className={i < Math.round(product.averageRating || 5) ? "fill-black text-black" : "text-black/10"} />
                  ))}
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest">({product.ratingCount || 0} reviews)</span>
              </div>
            </div>

            <div className="flex items-baseline gap-4">
              <Price amount={displayPrice} className="text-4xl lg:text-5xl font-black text-black" />
              {product.salePriceCents && (
                <Price amount={originalPrice} className="text-xl lg:text-2xl text-red-500 line-through font-bold" />
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
                      <div 
                        className="text-lg leading-relaxed text-black/60 font-medium prose prose-stone max-w-none"
                        dangerouslySetInnerHTML={{ __html: (product as any)[showDescription] || "" }}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {product.features && product.features.length > 0 && (
              <div className="space-y-6">
                <div className="text-[10px] font-black uppercase tracking-widest text-black/20">Specifications</div>
                <div className="grid sm:grid-cols-2 gap-4">
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

            <div className="pt-8 border-t border-black/5 flex flex-col sm:flex-row gap-4">
              <button
                onClick={orderNow}
                className="btn-53 flex-[2] h-20"
              >
                <span className="original">Order Now</span>
                <div className="letters">
                  {Array.from("FAST").map((letter, index) => (
                    <span key={index}>{letter}</span>
                  ))}
                </div>
              </button>
              <button
                onClick={addToCart}
                className="flex-1 h-20 rounded-3xl bg-white border-2 border-black text-black text-xs font-black uppercase tracking-[0.2em] hover:bg-black hover:text-white transition-all"
              >
                Add to Cart
              </button>
            </div>

            {/* Perks */}
            <div className="grid grid-cols-3 gap-4 pt-10 border-t border-black/5 text-center">
              <div className="space-y-2">
                <div className="w-10 h-10 bg-black/5 rounded-full flex items-center justify-center mx-auto"><Truck size={18} className="text-black/40" /></div>
                <div className="text-[8px] font-black uppercase tracking-widest text-black/40">Free Shipping</div>
              </div>
              <div className="space-y-2">
                <div className="w-10 h-10 bg-black/5 rounded-full flex items-center justify-center mx-auto"><RefreshCw size={18} className="text-black/40" /></div>
                <div className="text-[8px] font-black uppercase tracking-widest text-black/40">Easy Returns</div>
              </div>
              <div className="space-y-2">
                <div className="w-10 h-10 bg-black/5 rounded-full flex items-center justify-center mx-auto"><ShieldCheck size={18} className="text-black/40" /></div>
                <div className="text-[8px] font-black uppercase tracking-widest text-black/40">Secured Payment</div>
              </div>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        {filteredRecommendations.length > 0 && (
          <section className="mt-32 space-y-12">
            <div className="flex items-center gap-6">
              <h2 className="text-4xl font-bold tracking-tight text-black">Recommended</h2>
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
      <div className="md:hidden fixed bottom-6 left-6 right-6 z-[40]">
        <div className="glass-panel-heavy rounded-[2rem] p-3 flex items-center gap-3 shadow-2xl shadow-black/20 border border-white/20">
          <button
            onClick={addToCart}
            className="w-14 h-14 rounded-2xl bg-white border-2 border-black flex items-center justify-center text-black active:scale-90 transition-all"
          >
            <ShoppingBag size={22} />
          </button>
          <button
            onClick={orderNow}
            className="btn-53 flex-1 h-14"
          >
            <span className="original">Order Now</span>
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
        onMoreDetails={(productId) => router.push(`/products/${productId}`)}
      />
    </div>
  );
}
