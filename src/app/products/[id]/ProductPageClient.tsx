"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Maximize2, ShoppingBag, ArrowLeft, Star, ShieldCheck, Truck, RefreshCw } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Price } from "@/components/Price";
import { ProductCard } from "@/components/ProductCard";
import { useCartStore } from "@/lib/cart-store";
import { useLanguageStore } from "@/lib/language-store";
import { translations } from "@/lib/translations";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface ProductPageClientProps {
  product: any;
  recommendations: any[];
}

export default function ProductPageClient({ product, recommendations }: ProductPageClientProps) {
  const { currentLanguage } = useLanguageStore();
  const t = translations[currentLanguage.code as keyof typeof translations];
  const { addItem, hasAddress } = useCartStore();
  const router = useRouter();
  
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isEnlarged, setIsEnlarged] = useState(false);
  const [showDescription, setShowDescription] = useState(false);

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

  function addToCart() {
    addItem({
      id: product.id,
      name: product.name,
      brand: product.brand?.name,
      category: product.category?.name,
      price: (product.salePriceCents || product.priceCents) / 100,
      imageUrl: product.mainImage,
    }, 1);
    toast.success(`${product.name} added to cart`);
  }

  async function orderNow() {
    if (!hasAddress) {
      toast.error(t.cart.addressRequired, { duration: 3000 });
      router.push("/account/address");
      return;
    }

    const tid = toast.loading(t.cart.creatingOrder);
    try {
      const res = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          items: [{ productId: product.id, quantity: 1 }] 
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
      addToCart();
      router.push("/cart");
    }
  }

  const displayPrice = (product.salePriceCents || product.priceCents) / 100;
  const originalPrice = product.regularPriceCents / 100;

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
                <span className="px-3 py-1 bg-black text-white text-[9px] font-black uppercase tracking-widest rounded-full">
                  {product.category?.name || "General"}
                </span>
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

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-[10px] font-black uppercase tracking-widest text-black/20">Description</div>
                <button 
                  onClick={() => setShowDescription(!showDescription)}
                  className="text-[10px] font-black uppercase tracking-widest text-black underline underline-offset-4 hover:text-black/60 transition-colors"
                >
                  {showDescription ? "Hide" : "Show"}
                </button>
              </div>
              
              <AnimatePresence>
                {showDescription ? (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden"
                  >
                    <div 
                      className="text-lg leading-relaxed text-black/60 font-medium prose prose-stone max-w-none pt-2"
                      dangerouslySetInnerHTML={{ __html: product.description || "No description available." }}
                    />
                  </motion.div>
                ) : (
                  <button 
                    onClick={() => setShowDescription(true)}
                    className="w-full py-6 bg-black/[0.02] border border-dashed border-black/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-black/30 hover:bg-black/5 hover:text-black transition-all group"
                  >
                    Click to view product description
                  </button>
                )}
              </AnimatePresence>
            </div>

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

            <div className="pt-8 border-t border-black/5 flex flex-col sm:flex-row gap-4">
              <button
                onClick={orderNow}
                className="flex-[2] h-20 rounded-3xl bg-black text-white text-xs font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-2xl shadow-black/20"
              >
                Order Now
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
        {recommendations.length > 0 && (
          <section className="mt-32 space-y-12">
            <div className="flex items-center gap-6">
              <h2 className="text-4xl font-bold tracking-tight text-black">Recommended</h2>
              <div className="h-[1px] flex-1 bg-black/5" />
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-10">
              {recommendations.map((rec, idx) => (rec &&
                <motion.div
                  key={rec.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  viewport={{ once: true }}
                >
                   {/* Simplified Product Card for recommendations - actual ProductCard needs props we might not want to drill deep */}
                  <div className="group relative">
                    <div className="aspect-[4/5] rounded-[2rem] overflow-hidden bg-black/5 transition-transform duration-500 group-hover:scale-[1.02]">
                       <Link href={`/products/${rec.id}`}>
                        <Image src={rec.mainImage || "/placeholder-product.png"} alt={rec.name} fill className="object-cover" />
                       </Link>
                    </div>
                    <div className="mt-6 space-y-2">
                      <div className="text-[9px] font-black uppercase tracking-[0.2em] text-black/30">{rec.brand?.name}</div>
                      <Link href={`/products/${rec.id}`} className="text-lg font-bold block hover:underline leading-tight">{rec.name}</Link>
                      <Price amount={(rec.salePriceCents || rec.priceCents) / 100} className="text-sm font-black" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />

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
            className="flex-1 h-14 rounded-2xl bg-black text-white text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-xl"
          >
             Order Now — <Price amount={displayPrice} />
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
    </div>
  );
}
