"use client";

import { X } from "lucide-react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Price } from "./Price";

interface QuickViewProduct {
  id: string;
  name: string;
  brand?: string | { name: string };
  category?: string | { name: string };
  price: number;
  discountPrice?: number;
  imageUrl: string;
  details?: string;
  features?: string[];
}

export function ProductQuickViewModal({
  product,
  onClose,
  onAddToCart,
  onOrderNow,
}: {
  product: QuickViewProduct | null;
  onClose: () => void;
  onAddToCart: (product: any) => void;
  onOrderNow: (product: any) => void;
}) {
  if (!product) return <AnimatePresence />;

  const brandName = typeof product.brand === "string" 
    ? product.brand 
    : product.brand?.name || "Shafan Global";

  const categoryName = typeof product.category === "string" 
    ? product.category 
    : product.category?.name || "General";

  const displayPrice = product.discountPrice ?? product.price;

  return (
    <AnimatePresence>
      {product ? (
        <motion.div
          className="fixed inset-0 z-[60] grid place-items-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="absolute inset-0 bg-black/55 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.985 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="glass-panel-heavy shadow-2xl relative w-full max-w-4xl overflow-hidden rounded-[2.5rem] bg-white"
          >
            <div className="flex items-center justify-between gap-3 border-b border-black/5 px-8 py-5 bg-black/5">
              <div className="min-w-0">
                <div className="truncate text-[10px] text-black/40 font-black uppercase tracking-widest">{brandName}</div>
                <div className="truncate text-xl font-bold tracking-tight text-black">
                  {product.name}
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-black shadow-md hover:scale-110 active:scale-95 transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-8 p-8 md:grid-cols-2 max-h-[80vh] overflow-y-auto">
              <div className="glass-panel rounded-[2rem] overflow-hidden bg-black/[0.02] p-3 h-fit">
                <div className="relative aspect-square rounded-[1.5rem] overflow-hidden shadow-inner">
                  <Image
                    src={product.imageUrl || "/placeholder-product.png"}
                    alt={product.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 520px"
                    className="object-cover"
                    priority
                  />
                </div>
              </div>

              <div className="flex flex-col">
                <div className="text-[10px] font-black uppercase tracking-wider text-black/30">Category</div>
                <div className="mt-1 text-base font-bold text-black">{categoryName}</div>

                <div className="mt-6 text-[10px] font-black uppercase tracking-wider text-black/30">Price</div>
                <div className="mt-1 flex items-baseline gap-2">
                  <Price amount={displayPrice} className="text-3xl font-black text-black" />
                  {product.discountPrice && product.discountPrice < product.price ? (
                    <Price amount={product.price} className="text-base text-black/20 line-through font-bold" />
                  ) : null}
                </div>

                <div className="mt-6 text-[10px] font-black uppercase tracking-wider text-black/30">Description</div>
                <div 
                  className="mt-2 text-sm leading-relaxed text-black/70 font-medium prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: product.details || "No description available." }}
                />

                {product.features && product.features.length > 0 && (
                  <>
                    <div className="mt-6 text-[10px] font-black uppercase tracking-wider text-black/30">Information</div>
                    <ul className="mt-3 grid gap-2">
                      {product.features.map((f, i) => (
                        <li key={i} className="glass-panel rounded-xl px-4 py-2 text-xs font-bold text-black/60 border border-black/5 bg-black/[0.01]">
                          {f}
                        </li>
                      ))}
                    </ul>
                  </>
                )}

                <div className="mt-10 flex flex-wrap gap-4 pt-6 border-t border-black/5">
                  <button
                    type="button"
                    onClick={() => onAddToCart(product)}
                    className="flex-1 min-w-[140px] h-14 rounded-full bg-white border border-black/10 px-8 text-xs font-black uppercase tracking-widest text-black transition-all hover:bg-black hover:text-white shadow-sm"
                  >
                    Add to cart
                  </button>
                  <button
                    type="button"
                    onClick={() => onOrderNow(product)}
                    className="flex-1 min-w-[140px] h-14 rounded-full bg-black px-8 text-xs font-black uppercase tracking-widest text-white shadow-2xl shadow-black/20 hover:scale-[1.03] active:scale-95 transition-all"
                  >
                    Order now
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

