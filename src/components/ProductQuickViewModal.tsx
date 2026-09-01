import { X, ChevronLeft, ChevronRight, ShoppingCart, Zap, ArrowRight, Flame, Star, Check, Package } from "lucide-react";
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
import TabbyPromo from "./TabbyPromo";

function isValidImageUrl(url: unknown): boolean {
  if (!url || typeof url !== "string") return false;
  return url.startsWith("/") || url.startsWith("http");
}

interface QuickViewProduct {
  id: string;
  name: string;
  slug?: string;
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
  countryPrices?: Array<{ country: string; price: number; currency: string; active?: boolean }>;
  stockQuantity?: number;
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
  onAddToCart: (product: unknown) => void;
  onOrderNow: (product: unknown) => void;
  onMoreDetails: (productId: string) => void;
}) {
  const { currentLanguage } = useLanguageStore();
  const t = translations[currentLanguage.code as keyof typeof translations];
  const { selectedCountry, selectedCurrency } = useCountryStore();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { setCurrentImageIndex(0); setAddedToCart(false); }, [product?.id]);

  const { displayPrice, originalPrice, isAvailable, isOutOfStock } = useMemo(() => {
    if (!product) return { displayPrice: 0, originalPrice: 0, isAvailable: false, isOutOfStock: false };
    const outOfStock = typeof product.stockQuantity === "number" && product.stockQuantity <= 0;
    const cpArray = Array.isArray(product.countryPrices) ? product.countryPrices : [];
    if (cpArray.length === 0) return { displayPrice: 0, originalPrice: 0, isAvailable: false, isOutOfStock: outOfStock };
    const countryUpper = selectedCountry.toUpperCase();
    const countryPrice = cpArray.find((cp: any) => {
      const cpCountry = (cp.country?.toUpperCase() || "").trim();
      return cpCountry === countryUpper && Number(cp.price) > 0;
    });
    if (countryPrice) {
      const priceValue = Number(countryPrice.price) || 0;
      if (priceValue > 0) return { displayPrice: priceValue, originalPrice: priceValue, isAvailable: !outOfStock, isOutOfStock: outOfStock };
    }
    return { displayPrice: 0, originalPrice: 0, isAvailable: false, isOutOfStock: outOfStock };
  }, [product, selectedCountry]);

  const { allImages, brandName, categories, subCategoryName, skinTones, skinConcerns } = useMemo(() => {
    if (!product) return { allImages: [] as string[], brandName: "SHANFA GLOBAL", categories: [] as string[], subCategoryName: undefined as string | undefined, skinTones: [] as { name: string; hexColor?: string }[], skinConcerns: [] as string[] };
    const imgs = [product.imageUrl, (product as any).mainImage, ...(product.images || [])].filter((img, i, s) => img && s.indexOf(img) === i) as string[];
    const bName = typeof product.brand === "string" ? product.brand : product.brand?.name || "SHANFA GLOBAL";
    return {
      allImages: imgs,
      brandName: bName,
      categories: product.categories || [],
      subCategoryName: product.subCategory?.name,
      skinTones: product.skinTones || [],
      skinConcerns: product.skinConcerns || [],
    };
  }, [product]);

  // Auto-slide
  useEffect(() => {
    if (!product || allImages.length <= 1) return;
    const t = setInterval(() => setCurrentImageIndex((p) => (p + 1) % allImages.length), 6000);
    return () => clearInterval(t);
  }, [product, allImages.length]);

  const discountPct = displayPrice < originalPrice && originalPrice > 0
    ? Math.round(((originalPrice - displayPrice) / originalPrice) * 100) : 0;

  const handleAddToCart = () => {
    onAddToCart(product);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {product && (
        <motion.div
          className="fixed inset-0 z-[999] flex items-end md:items-center justify-center p-0 md:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
        >
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/65 backdrop-blur-lg cursor-pointer"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Modal */}
          <motion.div
            initial={{ y: 80, opacity: 0, scale: 0.97 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 60, opacity: 0, scale: 0.97 }}
            transition={{ type: "spring", damping: 28, stiffness: 220 }}
            className="relative w-full md:max-w-[900px] max-h-[92vh] md:max-h-[88vh] rounded-t-[2.5rem] md:rounded-[2.5rem] bg-white overflow-hidden flex flex-col md:flex-row shadow-[0_40px_80px_-20px_rgba(0,0,0,0.45)] pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* ── LEFT: Image Gallery ───────────────────────────── */}
            <div className="relative md:w-[44%] bg-gradient-to-br from-[#edf9f5] to-[#d4f0e6] flex-shrink-0 overflow-hidden">
              {/* Ambient glow */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(255,255,255,0.7)_0%,transparent_70%)] pointer-events-none z-10" />

              {/* Badges */}
              <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
                {(product.hot || product.trending) && (
                  <motion.span
                    initial={{ x: -12, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
                    className="inline-flex items-center gap-1.5 bg-[#0c433a] text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg"
                  >
                    <Flame size={9} className="fill-amber-400 text-amber-400" /> BEST SELLER
                  </motion.span>
                )}
                {discountPct > 0 && (
                  <motion.span
                    initial={{ x: -12, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.08 }}
                    className="inline-flex items-center gap-1 bg-rose-500 text-white text-[9px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-lg"
                  >
                    -{discountPct}% OFF
                  </motion.span>
                )}
              </div>

              {/* Close button (mobile top-right) */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-30 w-9 h-9 rounded-full bg-white/80 backdrop-blur-md border border-white/60 text-[#0c3a32] hover:bg-[#0c433a] hover:text-white transition-all flex items-center justify-center shadow-md md:hidden"
              >
                <X size={16} />
              </button>

              {/* Main image */}
              <div className="relative w-full h-[280px] md:h-full min-h-[360px] flex items-center justify-center p-6 md:p-8 group">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentImageIndex}
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.02 }}
                    transition={{ duration: 0.35 }}
                    className="relative w-full h-full"
                  >
                    <Image
                      src={isValidImageUrl(allImages[currentImageIndex]) ? getOptimizedUrl(allImages[currentImageIndex], 800) : "/placeholder-product.png"}
                      alt={product.name}
                      fill
                      className="object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.12)]"
                      priority
                      sizes="(max-width: 768px) 100vw, 44vw"
                    />
                  </motion.div>
                </AnimatePresence>

                {/* Prev/Next */}
                {allImages.length > 1 && (
                  <>
                    <button
                      onClick={(e) => { e.stopPropagation(); setCurrentImageIndex((p) => (p - 1 + allImages.length) % allImages.length); }}
                      className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/90 border border-[#c5e1d7] text-[#0c433a] flex items-center justify-center shadow-lg hover:bg-[#0c433a] hover:text-white transition-all opacity-0 group-hover:opacity-100"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setCurrentImageIndex((p) => (p + 1) % allImages.length); }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/90 border border-[#c5e1d7] text-[#0c433a] flex items-center justify-center shadow-lg hover:bg-[#0c433a] hover:text-white transition-all opacity-0 group-hover:opacity-100"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </>
                )}
              </div>

              {/* Thumbnail strip */}
              {allImages.length > 1 && (
                <div className="absolute bottom-4 inset-x-0 flex justify-center gap-2 px-4 z-20">
                  {allImages.slice(0, 5).map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`relative w-10 h-10 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${currentImageIndex === idx ? "border-[#0c433a] scale-110 shadow-lg" : "border-white/60 opacity-60 hover:opacity-90 hover:scale-105"} bg-white`}
                    >
                      <Image src={isValidImageUrl(img) ? getOptimizedUrl(img, 100) : "/placeholder-product.png"} alt="" fill className="object-contain p-1" sizes="44px" />
                    </button>
                  ))}
                </div>
              )}

              {/* Dot indicator */}
              {allImages.length > 1 && (
                <div className="absolute bottom-[4.5rem] inset-x-0 flex justify-center gap-1.5 z-20">
                  {allImages.slice(0, 5).map((_, idx) => (
                    <span key={idx} className={`rounded-full transition-all ${currentImageIndex === idx ? "w-4 h-1.5 bg-[#0c433a]" : "w-1.5 h-1.5 bg-[#0c433a]/30"}`} />
                  ))}
                </div>
              )}
            </div>

            {/* ── RIGHT: Info ──────────────────────────────────── */}
            <div className="flex flex-col flex-1 min-h-0 bg-white">
              {/* Close — desktop */}
              <button
                onClick={onClose}
                className="absolute top-5 right-5 z-30 w-9 h-9 rounded-full bg-[#f0f9f5] border border-[#c5e1d7] text-[#0c3a32] hover:bg-[#0c433a] hover:text-white transition-all flex items-center justify-center shadow-sm hidden md:flex"
              >
                <X size={15} />
              </button>

              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto px-5 md:px-7 pt-6 pb-4 space-y-4 custom-scrollbar">

                {/* Brand */}
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#72ccbd]">{brandName}</p>

                {/* Name */}
                <h2 className="font-serif text-xl md:text-2xl font-semibold text-[#0c3a32] leading-tight">
                  {product.name}
                </h2>

                {/* Stars */}
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => <Star key={i} size={12} className="text-amber-400 fill-amber-400" />)}
                  </div>
                  <span className="text-xs font-semibold text-[#52736b]">4.9 (245 reviews)</span>
                </div>

                {/* Category tags */}
                {(categories.length > 0 || subCategoryName) && (
                  <div className="flex flex-wrap gap-2">
                    {categories.map((cat, i) => (
                      <span key={i} className="px-3 py-1 bg-[#0c433a] text-white text-[9px] font-black uppercase tracking-widest rounded-full">{cat}</span>
                    ))}
                    {subCategoryName && (
                      <span className="px-3 py-1 bg-[#edf9f5] text-[#0c3a32] text-[9px] font-black uppercase tracking-widest rounded-full border border-[#c5e1d7]">{subCategoryName}</span>
                    )}
                  </div>
                )}

                {/* Skin tones / Concerns */}
                {(skinTones.length > 0 || skinConcerns.length > 0) && (
                  <div className="grid grid-cols-2 gap-3 p-3.5 bg-[#f4fbf8] rounded-2xl border border-[#e0f0e8]">
                    {skinTones.length > 0 && (
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-[#52736b] mb-1.5">Skin Tones</p>
                        <div className="flex flex-wrap gap-1.5">
                          {skinTones.map((tone, i) => (
                            <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-white text-[#0c3a32] text-[8px] font-bold uppercase tracking-wide rounded-full border border-[#c5e1d7]">
                              {tone.hexColor && <span className="w-2.5 h-2.5 rounded-full border border-black/10" style={{ backgroundColor: tone.hexColor }} />}
                              {tone.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {skinConcerns.length > 0 && (
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-[#52736b] mb-1.5">Skin Concerns</p>
                        <div className="flex flex-wrap gap-1.5">
                          {skinConcerns.map((concern, i) => (
                            <span key={i} className="px-2 py-0.5 bg-rose-50 text-rose-600 text-[8px] font-bold uppercase tracking-wide rounded-full border border-rose-100">{concern}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Price block */}
                <div className="py-3.5 border-y border-[#e5f3ee]">
                  {isOutOfStock ? (
                    <div className="space-y-2">
                      <p className="text-3xl font-black text-[#0c3a32]">
                        {displayPrice.toFixed(2)} <span className="text-sm font-bold text-[#52736b]">{selectedCurrency}</span>
                      </p>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-600 text-xs font-black uppercase tracking-wider rounded-full border border-orange-200">
                        <Package size={12} /> Out of Stock
                      </span>
                    </div>
                  ) : isAvailable ? (
                    <div className="flex items-end gap-3">
                      <p className="text-3xl md:text-4xl font-black text-[#0c3a32] leading-none">
                        {displayPrice.toFixed(2)} <span className="text-base font-bold text-[#52736b]">{selectedCurrency}</span>
                      </p>
                      {discountPct > 0 && (
                        <p className="text-sm font-bold text-[#82a49b] line-through mb-0.5">
                          {originalPrice.toFixed(2)} {selectedCurrency}
                        </p>
                      )}
                    </div>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 text-xs font-black uppercase tracking-wider rounded-full border border-red-100">
                      Unavailable in this region
                    </span>
                  )}
                </div>

                {/* Tabby promo */}
                {isAvailable && !isOutOfStock && displayPrice > 0 && ["AED", "SAR", "KWD"].includes((selectedCurrency || "").toUpperCase()) && (
                  <TabbyPromo
                    id="TabbyPromoQuickView"
                    source="product"
                    price={displayPrice}
                    currency={selectedCurrency.toUpperCase()}
                    publicKey={process.env.NEXT_PUBLIC_TABBY_PUBLIC_KEY || ""}
                    merchantCode={process.env.NEXT_PUBLIC_TABBY_MERCHANT_CODE || "SGAE"}
                    lang={currentLanguage.code === "ar" ? "ar" : "en"}
                  />
                )}

                {/* Description */}
                {(product.description || product.details) && (
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-[#52736b] mb-2">Product Details</p>
                    <div className="text-sm text-[#0c3a32]/70 leading-relaxed font-medium line-clamp-4">
                      {formatDescription(product.description || product.details)}
                    </div>
                  </div>
                )}
              </div>

              {/* ── Action buttons ── */}
              <div className="px-5 md:px-7 pt-3 pb-5 border-t border-[#e5f3ee] space-y-2.5 bg-white">
                <div className="grid grid-cols-2 gap-2.5">
                  {/* Add to cart */}
                  <button
                    type="button"
                    disabled={isOutOfStock || !isAvailable}
                    onClick={handleAddToCart}
                    className={`flex items-center justify-center gap-2 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-300 border ${
                      addedToCart
                        ? "bg-[#edf9f5] border-[#72ccbd] text-[#0c433a]"
                        : isOutOfStock || !isAvailable
                        ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
                        : "bg-white border-[#0c433a] text-[#0c433a] hover:bg-[#0c433a] hover:text-white shadow-sm hover:shadow-md active:scale-95"
                    }`}
                  >
                    {addedToCart ? <Check size={14} /> : <ShoppingCart size={14} />}
                    <span>{addedToCart ? "Added!" : isOutOfStock ? "Out of Stock" : t.product.addToCart}</span>
                  </button>

                  {/* Order now */}
                  <button
                    type="button"
                    disabled={isOutOfStock || !isAvailable}
                    onClick={() => onOrderNow(product)}
                    className={`relative flex items-center justify-center gap-2 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-300 overflow-hidden group ${
                      isOutOfStock || !isAvailable
                        ? "bg-slate-300 text-white cursor-not-allowed"
                        : "bg-[#0c433a] hover:bg-[#072a24] text-white shadow-[0_6px_20px_rgba(12,67,58,0.35)] hover:shadow-[0_10px_28px_rgba(12,67,58,0.5)] active:scale-95"
                    }`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                    <Zap size={14} className="shrink-0" />
                    <span>{isOutOfStock ? "Soon" : t.product.orderNow}</span>
                  </button>
                </div>

                {/* More details */}
                <button
                  type="button"
                  onClick={() => onMoreDetails(product.slug || product.id)}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#f4fbf8] border border-[#c5e1d7] text-[#0c3a32] text-[10px] font-black uppercase tracking-widest hover:bg-[#0c433a] hover:text-white hover:border-[#0c433a] transition-all duration-300 group active:scale-95"
                >
                  <span>Full Product Details</span>
                  <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
