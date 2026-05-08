"use client";

import { motion } from "framer-motion";
import { ExternalLink, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { ProductSuggestion } from "./useSesi";

export default function ProductRecommendationCard({
  product,
}: {
  product: ProductSuggestion;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="bg-gradient-to-br from-pink-50/90 to-purple-50/90 backdrop-blur-md rounded-3xl p-4 border border-pink-200/50 shadow-sm"
    >
      <div className="flex items-center gap-2 mb-3">
        <ShoppingBag className="w-4 h-4 text-pink-500" />
        <span className="text-[10px] font-bold text-pink-700 uppercase tracking-widest">
          Recommended for You
        </span>
      </div>

      <div className="flex gap-3">
        <div className="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 bg-white/60 border border-pink-100/50 shadow-sm">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-pink-100 to-purple-100">
              <ShoppingBag className="w-6 h-6 text-pink-400" />
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
          {product.concerns.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {product.concerns.slice(0, 2).map((c, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 bg-purple-100 text-purple-700 text-[9px] font-bold rounded-full"
                >
                  {c}
                </span>
              ))}
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className="text-sm font-black text-pink-600">
              {product.price}
            </span>
            <Link
              href={product.productUrl}
              className="ml-auto flex items-center gap-1 px-3 py-1.5 bg-pink-500 hover:bg-pink-600 text-white text-[10px] font-bold uppercase tracking-wider rounded-full active:scale-95 transition-all shadow-sm shadow-pink-200/50"
            >
              View Product
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {product.howToUse && (
        <div className="mt-3 px-3 py-2 bg-white/60 rounded-xl border border-pink-100/50">
          <p className="text-[10px] text-pink-700 font-medium leading-relaxed">
            {"💡 How to use: "}{product.howToUse}
          </p>
        </div>
      )}
    </motion.div>
  );
}
