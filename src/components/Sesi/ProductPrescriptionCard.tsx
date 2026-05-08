"use client";

import { motion } from "framer-motion";
import { ExternalLink, Heart, Sparkles } from "lucide-react";
import { ProductSuggestion } from "./useSesi";

export default function ProductPrescriptionCard({
  product,
}: {
  product: ProductSuggestion;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="bg-gradient-to-br from-teal-50/90 to-emerald-50/90 backdrop-blur-md rounded-3xl p-4 border border-teal-200/50 shadow-sm"
    >
      <div className="flex items-center gap-2 mb-3">
        <Heart className="w-4 h-4 text-teal-500 fill-teal-500" />
        <span className="text-[10px] font-bold text-teal-700 uppercase tracking-widest">
          Sesi&apos;s Prescription for Happiness
        </span>
      </div>

      <div className="flex gap-3">
        <div className="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 bg-white/60 border border-teal-100/50 shadow-sm">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-teal-100 to-emerald-100">
              <Sparkles className="w-6 h-6 text-teal-400" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold text-gray-900 truncate mb-0.5">
            {product.name}
          </h4>
          <p className="text-xs text-gray-500 mb-2 line-clamp-2">
            {product.description}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-sm font-black text-teal-600">
              {product.price}
            </span>
            <a
              href={product.productUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto flex items-center gap-1 px-3 py-1.5 bg-teal-500 hover:bg-teal-600 text-white text-[10px] font-bold uppercase tracking-wider rounded-full active:scale-95 transition-all shadow-sm shadow-teal-200/50"
            >
              See Details
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
