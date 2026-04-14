import { X, ChevronLeft, ChevronRight, Maximize2, ShoppingBag, ArrowRight, Flame } from "lucide-react";
import Image from "next/image";
import { useEffect, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Price } from "./Price";
import { useLanguageStore } from "@/lib/language-store";
import { translations } from "@/lib/translations";
import { useCountryStore } from "@/lib/country-store";
import { formatDescription } from "@/utils/formatText";
import { getOptimizedUrl } from "@/lib/cloudinary-url";

function isValidImageUrl(url: any): boolean {
  if (!url || typeof url !== 'string') return false;
  return url.startsWith('/') || url.startsWith('http');
}

interface QuickViewProduct {
  id: string;
  name: string;
  brand?: string | { name: string };
  category?: string | { name: string };
  categories?: string[];
  subCategory?: { name: string; category?: string } | null;
  skinTones?: { name: string; hexColor?: string }[];
  skinConcerns?: string[];
  price: number;
  discountPrice?: number;
  priceCents?: number;
  regularPriceCents?: number;
  salePriceCents?: number;
  regularPrice?: number;
  salePrice?: number;
  countryPrices?: Array<{
    country: string;
    price: number;
    currency: string;
    active?: boolean;
  }>;
  imageUrl: string;
  images?: string[];
  details?: string;
  description?: string;
  shortDescription?: string;
  benefits?: string;
  ingredients?: string;
  howToUse?: string;
  features?: string[];
  hot?: boolean;
  trending?: boolean;
}

export function ProductQuickViewModal({
  product,
  onClose,
  onAddToCart,
  onOrderNow,
  onMoreDetails,
}: {
  product: QuickViewProduct | null;
  onClose: () => void;
  onAddToCart: (product: any) => void;
  onOrderNow: (product: any) => void;
  onMoreDetails: (productId: string) => void;
}) {
  const { currentLanguage } = useLanguageStore();
  const t = translations[currentLanguage.code as keyof typeof translations];
  const { selectedCountry, selectedCurrency } = useCountryStore();
  
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isEnlarged, setIsEnlarged] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // STRICT: Compute price using selectedCountry - no fallbacks
  const { displayPrice, originalPrice, isAvailable } = useMemo(() => {
    if (!product) return { displayPrice: 0, originalPrice: 0, isAvailable: false };
    
    // Debug logging
    console.log('QuickView selectedCountry:', selectedCountry, 'product:', product.name);
    
    // Ensure countryPrices is an array
    const cpArray = Array.isArray(product.countryPrices) ? product.countryPrices : [];
    console.log('QuickView countryPrices:', cpArray);
    
    // If no country prices at all, show unavailable
    if (cpArray.length === 0) {
      console.log('No country prices for:', product.name);
      return { displayPrice: 0, originalPrice: 0, isAvailable: false };
    }
    
    const countryUpper = selectedCountry.toUpperCase();
    
    // Find matching country price - simpler logic
    const countryPrice = cpArray.find((cp: any) => {
      if (!cp) return false;
      const cpCountry = (cp.country?.toUpperCase() || '').trim();
      const cpPriceValue = Number(cp.price) || 0;
      return cpCountry === countryUpper && cpPriceValue > 0;
    });
    
    console.log('Found countryPrice:', countryPrice);
    
    if (countryPrice) {
      const priceValue = Number(countryPrice.price) || 0;
      if (priceValue > 0) {
        return {
          displayPrice: priceValue,
          originalPrice: priceValue,
          isAvailable: true
        };
      }
    }
    
    // NO FALLBACK - if no valid country price, show unavailable
    return { displayPrice: 0, originalPrice: 0, isAvailable: false };
  }, [product, selectedCountry]);

  // Combine main image with gallery images, filtering out duplicates
  const { allImages, brandName, categoryName, categories, subCategoryName, skinTones, skinConcerns } = useMemo(() => {
    if (!product) {
      return {
        allImages: [] as string[],
        brandName: "Shafan Global",
        categoryName: "General",
        categories: [] as string[],
        subCategoryName: undefined as string | undefined,
        skinTones: [] as any[],
        skinConcerns: [] as string[],
      };
    }

    const imgs = [
      product.imageUrl,
      (product as any).mainImage,
      ...(product.images || [])
    ].filter((img, index, self) => img && self.indexOf(img) === index) as string[];

    const bName = typeof product.brand === "string" 
      ? product.brand 
      : product.brand?.name || "Shafan Global";

    const cName = typeof product.category === "string" 
      ? product.category 
      : product.category?.name || "General";

    return {
      allImages: imgs,
      brandName: bName,
      categoryName: cName,
      categories: product.categories || [],
      subCategoryName: product.subCategory?.name,
      skinTones: product.skinTones || [],
      skinConcerns: product.skinConcerns || [],
    };
  }, [product]);

  // Auto-slide effect
  useEffect(() => {
    if (!product || allImages.length <= 1 || isEnlarged) return;
    
    const timer = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
    }, 6000);

    return () => clearInterval(timer);
  }, [product, allImages.length, isEnlarged]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {product && (
        <motion.div
          className="fixed inset-0 z-[999] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
        >
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-md cursor-pointer" 
            onClick={onClose} 
          />
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="relative mx-auto w-full md:w-[95%] max-w-5xl h-[80vh] md:h-auto md:min-h-[500px] rounded-t-[2.5rem] md:rounded-[2.5rem] bg-white shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] flex flex-col md:flex-row items-stretch pointer-events-auto overflow-hidden mt-auto md:mt-0"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="md:w-[48%] h-[40vh] md:h-full relative bg-white flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-black/5 shrink-0 overflow-hidden">
              <div 
                className="relative w-full h-[40vh] md:h-full min-h-[300px] md:min-h-[500px] p-4 md:p-8 overflow-hidden group cursor-zoom-in flex flex-col" 
                onClick={() => setIsEnlarged(true)}
              >
                <div className="relative w-full flex-1 min-h-[250px] md:min-h-[400px] flex items-center justify-center">
                  <Image
                    src={isValidImageUrl(allImages[currentImageIndex]) ? getOptimizedUrl(allImages[currentImageIndex], 800) : "/placeholder-product.png"}
                    alt={product.name}
                    fill
                    className="object-contain"
                    priority={true}
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
                {allImages.length > 1 && (
                  <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 flex justify-between opacity-0 group-hover:opacity-100 transition-opacity z-30">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(p => (p - 1 + allImages.length) % allImages.length); }}
                      className="w-12 h-12 rounded-full bg-white/90 backdrop-blur-md shadow-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all text-black border border-black/5"
                    >
                      <ChevronLeft size={24} />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(p => (p + 1) % allImages.length); }}
                      className="w-12 h-12 rounded-full bg-white/90 backdrop-blur-md shadow-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all text-black border border-black/5"
                    >
                      <ChevronRight size={24} />
                    </button>
                  </div>
                )}
                <div className="absolute top-4 left-4 flex flex-col gap-2 z-20">
                  {(product.hot || product.trending) && (
                    <motion.span 
                      initial={{ x: -10, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      className="bg-red-600 text-white text-[8px] px-2 py-0.5 font-black uppercase tracking-widest rounded shadow-xl flex items-center gap-1 border border-white/20"
                    >
                      <Flame size={10} className="fill-white" />
                      Trending
                    </motion.span>
                  )}
                </div>
                <div className="absolute top-6 right-6 flex flex-col gap-2 z-20">
                  {displayPrice < originalPrice && originalPrice > 0 && (
                    <motion.div 
                      initial={{ x: 10, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      className="bg-rose-600 text-white rounded-2xl px-4 py-2.5 shadow-2xl flex flex-col items-center justify-center border border-white/20"
                    >
                      <span className="text-sm font-black leading-none">
                        -{Math.round(((originalPrice - displayPrice) / originalPrice) * 100)}%
                      </span>
                      <span className="text-[9px] font-bold leading-tight uppercase tracking-tighter opacity-80 mt-1">OFFER</span>
                    </motion.div>
                  )}
                </div>
                <div className="absolute bottom-6 right-6 p-3 bg-black/10 backdrop-blur-md rounded-full text-black/50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity border border-black/5">
                  <Maximize2 size={20} />
                </div>

                {/* Thumbnails - Floating Overlay */}
                {allImages.length > 1 && (
                  <div className="absolute inset-x-0 bottom-4 flex gap-2 md:gap-3 overflow-x-auto pb-2 scrollbar-hide px-4 w-full justify-center z-40 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    {allImages.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(idx); }}
                        className={`relative w-10 h-10 md:w-14 md:h-14 rounded-xl overflow-hidden flex-shrink-0 transition-all border-2 ${
                          currentImageIndex === idx ? "border-black scale-105 shadow-xl bg-white" : "border-white/50 bg-white/80 backdrop-blur-sm opacity-60 hover:opacity-100"
                        }`}
                      >
                        <Image 
                          src={isValidImageUrl(img) ? getOptimizedUrl(img, 100) : "/placeholder-product.png"} 
                          alt="Thumb" 
                          fill 
                          className="object-cover p-1"
                          sizes="100px"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="md:w-[55%] p-4 md:p-8 flex flex-col justify-start bg-white relative overflow-hidden">
              <button
                type="button"
                onClick={onClose}
                className="absolute top-6 right-6 md:top-8 md:right-8 inline-flex h-12 w-12 items-center justify-center rounded-full bg-black/5 text-black hover:bg-black hover:text-white transition-all z-50 group active:scale-90"
              >
                <X className="h-6 w-6 transition-transform group-hover:rotate-90" />
              </button>
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar text-left">
                <div className="space-y-3 md:space-y-6">
                  <div>
                    <div className="text-[9px] md:text-[11px] font-black uppercase tracking-[0.4em] text-emerald-600 mb-2 md:mb-3">{brandName}</div>
                    <h2 className="text-lg md:text-2xl lg:text-3xl font-black tracking-tight text-black leading-tight italic decoration-emerald-500/30 underline-offset-8">
                      {product.name}
                    </h2>
                    <div className="mt-4 md:mt-6 flex flex-wrap gap-2 sm:gap-3">
                      {categories.map((cat, idx) => (
                        <span key={idx} className="px-4 py-1.5 bg-black text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-black/10">
                          {cat}
                        </span>
                      ))}
                      {subCategoryName && (
                        <span className="px-4 py-1.5 bg-gray-100 text-black/60 text-[10px] font-black uppercase tracking-widest rounded-full border border-black/5">
                          {subCategoryName}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {skinTones.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-[10px] font-black uppercase tracking-widest text-black/20">Skin Tones</div>
                        <div className="flex flex-wrap gap-2">
                          {skinTones.map((tone, idx) => (
                            <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1 bg-black/5 text-black text-[9px] font-bold uppercase tracking-widest rounded-full">
                              {tone.hexColor && <span className="w-3 h-3 rounded-full border border-black/10" style={{ backgroundColor: tone.hexColor }} />}
                              {tone.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {skinConcerns.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-[10px] font-black uppercase tracking-widest text-black/20">Skin Concerns</div>
                        <div className="flex flex-wrap gap-2">
                          {skinConcerns.map((concern, idx) => (
                            <span key={idx} className="px-3 py-1 bg-red-50 text-red-600 text-[9px] font-bold uppercase tracking-widest rounded-full border border-red-100">
                              {concern}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-4 py-2 md:py-4 border-y border-black/5">
                    {isAvailable ? (
                      <div className="flex flex-col">
                        <span className="text-3xl md:text-5xl font-black text-black flex items-baseline gap-2">
                          {displayPrice.toFixed(2)}
                          <span className="text-lg md:text-xl font-bold text-black/40 uppercase tracking-widest">{selectedCurrency}</span>
                        </span>
                        {displayPrice < originalPrice && (
                          <span className="text-sm md:text-lg font-bold text-red-500/60 line-through">
                            {originalPrice.toFixed(2)} {selectedCurrency}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-100 rounded-xl">
                        <span className="w-2 h-2 rounded-full bg-red-500" />
                        <span className="text-xs md:text-sm font-black text-red-600 uppercase tracking-wider">Unavailable in this region</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-4">
                    <div className="text-[10px] font-black uppercase tracking-widest text-black/20">Product Details</div>
                    <div className="prose prose-sm max-w-none text-black/70 leading-relaxed font-medium">
                      {(product.description || product.details) && formatDescription(product.description || product.details)}
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-auto pt-4 space-y-3">
                <div className="flex gap-3 items-center">
                  <button
                    type="button"
                    onClick={() => onAddToCart(product)}
                    className="w-12 h-12 md:w-auto md:h-20 md:flex-1 rounded-2xl md:rounded-3xl bg-white border-2 border-black/10 flex items-center justify-center md:px-8 text-black hover:bg-black hover:text-white transition-all shadow-xl shadow-black/5 active:scale-95 group shrink-0"
                  >
                    <ShoppingBag size={20} className="md:mr-3 transition-transform group-hover:rotate-12" />
                    <span className="hidden md:inline text-[11px] font-black uppercase tracking-[0.2em]">{t.product.addToCart}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onOrderNow(product)}
                    className="relative flex-[2] h-12 md:h-20 rounded-2xl md:rounded-3xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xl shadow-emerald-600/20 transition-all active:scale-95 overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    <span className="font-black text-[10px] md:text-sm lg:text-base uppercase tracking-[0.2em]">{t.product.orderNow}</span>
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => onMoreDetails(product.id)}
                  className="w-full flex items-center justify-center gap-3 px-8 py-3 rounded-2xl md:rounded-3xl bg-black text-white text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] transition-all hover:bg-gray-800 hover:shadow-2xl active:scale-95 group"
                >
                  <span>More Details</span>
                  <ArrowRight size={14} className="transition-transform group-hover:translate-x-2" />
                </button>
              </div>
            </div>
          </motion.div>
          <AnimatePresence>
            {isEnlarged && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[1000] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-4 md:p-10"
              >
                <button 
                  onClick={() => setIsEnlarged(false)}
                  className="absolute top-10 right-10 w-14 h-14 bg-white/10 text-white rounded-full flex items-center justify-center hover:bg-white/20 transition-all z-[1010]"
                >
                  <X size={32} />
                </button>
                <div className="relative w-full h-[60vh] md:h-[80vh] min-h-[300px] max-w-6xl mx-auto flex-1">
                  <Image 
                    src={isValidImageUrl(allImages[currentImageIndex]) ? allImages[currentImageIndex] : "/placeholder-product.png"} 
                    alt="Full View" 
                    fill 
                    className="object-contain"
                  />
                </div>
                {allImages.length > 1 && (
                  <div className="mt-8 flex gap-4">
                    <button 
                      onClick={() => setCurrentImageIndex(p => (p - 1 + allImages.length) % allImages.length)}
                      className="w-16 h-16 rounded-full bg-white/5 text-white flex items-center justify-center hover:bg-white/10"
                    >
                      <ChevronLeft size={32} />
                    </button>
                    <button 
                      onClick={() => setCurrentImageIndex(p => (p + 1) % allImages.length)}
                      className="w-16 h-16 rounded-full bg-white/5 text-white flex items-center justify-center hover:bg-white/10"
                    >
                      <ChevronRight size={32} />
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
