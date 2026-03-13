"use client";

import type { DemoProduct } from "@/lib/demo-data";
import { X } from "lucide-react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

export function ProductQuickViewModal({
  product,
  onClose,
  onAddToCart,
  onOrderNow,
}: {
  product: DemoProduct | null;
  onClose: () => void;
  onAddToCart: (product: DemoProduct) => void;
  onOrderNow: (product: DemoProduct) => void;
}) {
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
            className="glass-panel-heavy shadow-2xl relative w-full max-w-3xl overflow-hidden rounded-3xl"
          >
            <div className="flex items-center justify-between gap-3 border-b border-black/10 px-6 py-4">
              <div className="min-w-0">
                <div className="truncate text-sm text-black/60 font-bold">{product.brand}</div>
                <div className="truncate text-lg font-bold tracking-tight text-black">
                  {product.name}
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/5 text-black/60 hover:text-black hover:bg-black/10 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-6 p-6 md:grid-cols-2">
              <div className="glass-panel rounded-3xl overflow-hidden bg-black/5 p-2">
                <div className="relative aspect-square rounded-2xl overflow-hidden">
                  <Image
                    src={product.imageUrl}
                    alt={product.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 520px"
                    className="object-cover"
                    priority
                  />
                </div>
              </div>

              <div className="flex flex-col">
                <div className="text-xs font-bold uppercase tracking-wider text-black/60">Category</div>
                <div className="mt-1 text-base font-bold text-black">{product.category}</div>

                <div className="mt-4 text-xs font-bold uppercase tracking-wider text-black/60">Price</div>
                <div className="mt-1 flex items-end gap-2">
                  <div className="text-2xl font-bold text-black">
                    ${product.discountPrice ?? product.price}
                  </div>
                  {product.discountPrice ? (
                    <div className="text-sm text-black/40 line-through font-medium">${product.price}</div>
                  ) : null}
                </div>

                <div className="mt-5 text-xs font-bold uppercase tracking-wider text-black/60">Details</div>
                <div className="mt-1 text-sm leading-6 text-black/80 font-medium">{product.details}</div>

                <div className="mt-5 text-xs font-bold uppercase tracking-wider text-black/60">Features</div>
                <ul className="mt-2 grid gap-2 text-sm text-black/80">
                  {product.features.map((f) => (
                    <li key={f} className="glass-panel-heavy rounded-xl px-4 py-2 font-medium">
                      {f}
                    </li>
                  ))}
                </ul>

                <div className="mt-8 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => onAddToCart(product)}
                    className="inline-flex h-11 items-center rounded-full bg-black/5 border border-black/10 px-6 text-sm font-bold text-black transition-colors hover:bg-black/10"
                  >
                    Add to cart
                  </button>
                  <button
                    type="button"
                    onClick={() => onOrderNow(product)}
                    className="inline-flex h-11 items-center rounded-full bg-black px-6 text-sm font-bold text-white shadow-xl shadow-black/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
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

