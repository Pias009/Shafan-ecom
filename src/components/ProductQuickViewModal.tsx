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
            className="glass glass-3d ring-icy relative w-full max-w-3xl overflow-hidden rounded-3xl"
          >
            <div className="flex items-center justify-between gap-3 border-b border-white/10 px-6 py-4">
              <div className="min-w-0">
                <div className="truncate text-sm text-white/70">{product.brand}</div>
                <div className="truncate text-lg font-semibold tracking-tight text-white">
                  {product.name}
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="glass glass-3d ring-icy inline-flex h-10 w-10 items-center justify-center rounded-full text-white/85 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-6 p-6 md:grid-cols-2">
              <div className="glass glass-3d ring-icy overflow-hidden rounded-3xl bg-white/5">
                <div className="relative aspect-square">
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
                <div className="text-sm text-white/70">Category</div>
                <div className="mt-1 text-base font-semibold text-white">{product.category}</div>

                <div className="mt-4 text-sm text-white/70">Price</div>
                <div className="mt-1 flex items-end gap-2">
                  <div className="text-2xl font-semibold text-white">
                    ${product.discountPrice ?? product.price}
                  </div>
                  {product.discountPrice ? (
                    <div className="text-sm text-white/55 line-through">${product.price}</div>
                  ) : null}
                </div>

                <div className="mt-5 text-sm text-white/70">Details</div>
                <div className="mt-1 text-sm leading-6 text-white/75">{product.details}</div>

                <div className="mt-5 text-sm text-white/70">Features</div>
                <ul className="mt-2 grid gap-2 text-sm text-white/75">
                  {product.features.map((f) => (
                    <li key={f} className="glass ring-icy rounded-2xl bg-white/5 px-3 py-2">
                      {f}
                    </li>
                  ))}
                </ul>

                <div className="mt-6 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => onAddToCart(product)}
                    className="glass glass-3d ring-icy inline-flex h-11 items-center rounded-full px-5 text-sm font-semibold text-white/90 transition hover:text-white"
                  >
                    Add to cart
                  </button>
                  <button
                    type="button"
                    onClick={() => onOrderNow(product)}
                    className="inline-flex h-11 items-center rounded-full bg-white px-5 text-sm font-semibold text-black shadow-lg shadow-black/20 transition hover:translate-y-[-1px]"
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

