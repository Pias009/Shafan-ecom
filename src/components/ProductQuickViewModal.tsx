import { X, ChevronLeft, ChevronRight, Maximize2, ShoppingBag, ArrowRight } from "lucide-react";
import Image from "next/image";
import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Price } from "./Price";
import { useLanguageStore } from "@/lib/language-store";
import { translations } from "@/lib/translations";
import { useCountryStore } from "@/lib/country-store";
import { formatDescription } from "@/utils/formatText";

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
  const allImages = [
    product?.imageUrl,
    ...(product?.images || [])
  ].filter((img, index, self) => img && self.indexOf(img) === index) as string[];

  // Auto-slide effect
  useEffect(() => {
    if (!product || allImages.length <= 1 || isEnlarged) return;
    
    const timer = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
    }, 6000);

    return () => clearInterval(timer);
  }, [product, allImages.length, isEnlarged]);

  if (!product) return <AnimatePresence />;

  const brandName = typeof product.brand === "string" 
    ? product.brand 
    : product.brand?.name || "Shafan Global";

  const categoryName = typeof product.category === "string" 
    ? product.category 
    : product.category?.name || "General";

  const categories = product.categories || [];
  const subCategoryName = product.subCategory?.name;
  const skinTones = product.skinTones || [];
  const skinConcerns = product.skinConcerns || [];

  return (
    <AnimatePresence>
      {product ? (
        <motion.div
          className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center backdrop-blur-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="relative mx-auto w-[95%] max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] flex flex-col md:flex-row"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Image Gallery Side */}
            <div className="md:w-1/2 relative bg-white p-4 md:p-6 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-black/5 shrink-0">
              <div className="relative w-full aspect-square md:aspect-auto md:h-full max-h-[300px] md:max-h-none rounded-[1.5rem] md:rounded-[2rem] overflow-hidden group cursor-zoom-in" onClick={() => setIsEnlarged(true)}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentImageIndex}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                    className="relative w-full h-full"
                  >
                    <Image
                      src={isValidImageUrl(allImages[currentImageIndex]) ? allImages[currentImageIndex] : "/placeholder-product.png"}
                      alt={product.name}
                      fill
                      className="object-contain"
                      priority
                    />
                  </motion.div>
                </AnimatePresence>

                {/* Gallery Controls */}
                {allImages.length > 1 && (
                  <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 flex justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(p => (p - 1 + allImages.length) % allImages.length); }}
                      className="w-10 h-10 rounded-full bg-white/90 shadow-lg flex items-center justify-center hover:scale-110 active:scale-90 transition-all"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(p => (p + 1) % allImages.length); }}
                      className="w-10 h-10 rounded-full bg-white/90 shadow-lg flex items-center justify-center hover:scale-110 active:scale-90 transition-all"
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
                <div className="mt-4 md:mt-6 flex gap-2 md:gap-3 overflow-x-auto pb-2 scrollbar-hide px-2 w-full justify-center">
                  {allImages.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`relative w-12 h-12 md:w-16 md:h-16 rounded-lg md:rounded-xl overflow-hidden flex-shrink-0 transition-all border-2 ${
                        currentImageIndex === idx ? "border-black scale-110 shadow-lg" : "border-transparent opacity-50 hover:opacity-100"
                      }`}
                    >
                      <Image src={isValidImageUrl(img) ? img : "/placeholder-product.png"} alt="Thumb" fill className="object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Content Side */}
            <div className="md:w-1/2 p-6 md:p-10 flex flex-col justify-between bg-white relative overflow-y-auto">
              <button
                type="button"
                onClick={onClose}
                className="absolute top-6 right-6 inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/5 text-black hover:bg-black hover:text-white transition-all z-10"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="space-y-6">
                <div>
                  <div className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.3em] text-black/20 mb-1 md:mb-2">{brandName}</div>
                  <h2 className="text-2xl md:text-4xl font-bold tracking-tight text-black leading-tight">
                    {product.name}
                  </h2>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {categories.map((cat, idx) => (
                      <span key={idx} className="px-3 py-1 bg-black text-white text-[9px] font-black uppercase tracking-widest rounded-full">
                        {cat}
                      </span>
                    ))}
                    {subCategoryName && (
                      <span className="px-3 py-1 bg-gray-200 text-black text-[9px] font-black uppercase tracking-widest rounded-full">
                        {subCategoryName}
                      </span>
                    )}
                  </div>
                </div>

                {/* Skin Tones */}
                {skinTones.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-[10px] font-black uppercase tracking-widest text-black/20">Skin Tones</div>
                    <div className="flex flex-wrap gap-2">
                      {skinTones.map((tone, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1 bg-black/5 text-black text-[9px] font-bold uppercase tracking-widest rounded-full">
                          {tone.hexColor && (
                            <span className="w-3 h-3 rounded-full border border-black/10" style={{ backgroundColor: tone.hexColor }} />
                          )}
                          {tone.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Skin Concerns */}
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

                <div className="flex items-baseline gap-3">
                  {isAvailable ? (
                    <>
                      <span className="text-2xl md:text-4xl font-black text-black">
                        {displayPrice.toFixed(2)} <span className="text-lg">{selectedCurrency}</span>
                      </span>
                    </>
                  ) : (
                    <span className="text-xl md:text-2xl font-black text-red-500">Unavailable in this region</span>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="text-[10px] font-black uppercase tracking-widest text-black/20">Details</div>
                  <div className="border-b border-black/10">
                    <div className="flex flex-wrap gap-1">
                      {[
                        { key: 'shortDescription', label: 'Overview' },
                        { key: 'description', label: 'Description' },
                        { key: 'benefits', label: 'Benefits' },
                        { key: 'ingredients', label: 'Ingredients' },
                        { key: 'howToUse', label: 'How to Use' },
                      ].map(tab => (
                        (product.details && tab.key === 'description') || product[tab.key as keyof typeof product] ? (
                          <button
                            key={tab.key}
                            onClick={() => {
                              const el = document.getElementById(`quickview-tab-${tab.key}`);
                              el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }}
                            className="px-3 py-2 text-[9px] font-black uppercase tracking-widest transition-all text-black/40 hover:text-black/60"
                          >
                            {tab.label}
                          </button>
                        ) : null
                      ))}
                    </div>
                  </div>
                  {product.shortDescription && (
                    <div id="quickview-tab-shortDescription" className="text-sm leading-relaxed text-black/60 font-medium prose prose-sm max-w-none pt-2 whitespace-pre-line">
                      {product.shortDescription}
                    </div>
                  )}
                  {(product.details || product.description) && (
                    <div id="quickview-tab-description" className="text-sm leading-relaxed text-black/60 font-medium prose prose-sm max-w-none pt-2">
                      {formatDescription(product.description || product.details)}
                    </div>
                  )}
                </div>

                {product.features && product.features.length > 0 && (
                  <div className="space-y-3">
                    <div className="text-[10px] font-black uppercase tracking-widest text-black/20">{t.product.information}</div>
                    <div className="grid grid-cols-2 gap-2">
                      {product.features.map((f, i) => (
                        <div key={i} className="flex items-center gap-2 p-2 bg-black/[0.02] border border-black/5 rounded-xl">
                          <div className="w-1 h-1 bg-black/20 rounded-full" />
                          <span className="text-[9px] font-bold text-black/50 uppercase tracking-widest">{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-8 md:mt-10 space-y-3">
                <div className="flex gap-3 md:gap-4 items-center">
                  <button
                    type="button"
                    onClick={() => onAddToCart(product)}
                    className="w-14 h-14 md:w-auto md:h-16 md:flex-1 rounded-2xl bg-black border-2 border-black flex items-center justify-center md:px-8 text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] text-white transition-all hover:bg-gray-800 hover:shadow-lg hover:shadow-gray-200/50 active:scale-[0.98] active:translate-y-0.5 shrink-0"
                    title={t.product.addToCart}
                  >
                    <ShoppingBag size={20} className="md:hidden" />
                    <span className="hidden md:inline">{t.product.addToCart}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onOrderNow(product)}
                    className="btn-53 flex-1 h-14 md:h-16 rounded-2xl shadow-xl shadow-black/20"
                  >
                    <span className="original font-black text-[11px] md:text-[12px] uppercase tracking-[0.15em]">{t.product.orderNow}</span>
                    <div className="letters">
                      {Array.from("FAST").map((letter, index) => (
                        <span key={index}>{letter}</span>
                      ))}
                    </div>
                  </button>
                </div>
                
                {/* More Details Button */}
                <button
                  type="button"
                  onClick={() => onMoreDetails(product.id)}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-black border border-black text-white text-[10px] md:text-[11px] font-bold uppercase tracking-widest transition-all hover:bg-gray-800 hover:shadow-md active:scale-[0.98]"
                >
                  <span>More Details</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </motion.div>

          {/* Lightbox / Enlarged View */}
          <AnimatePresence>
            {isEnlarged && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[70] bg-black flex flex-col items-center justify-center p-4 md:p-10"
              >
                <button 
                  onClick={() => setIsEnlarged(false)}
                  className="absolute top-10 right-10 w-14 h-14 bg-white/10 text-white rounded-full flex items-center justify-center hover:bg-white/20 transition-all z-[80]"
                >
                  <X size={32} />
                </button>
                
                <div className="relative w-full h-full max-w-6xl max-h-[80vh]">
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
      ) : null}
    </AnimatePresence>
  );
}

