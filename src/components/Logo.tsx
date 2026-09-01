"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Leaf } from "lucide-react";

export function Logo({ className = "", light = false }: { className?: string; light?: boolean }) {
  return (
    <Link href="/" className={`flex items-center gap-2.5 group whitespace-nowrap select-none ${className}`}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex items-center gap-2.5"
      >
        {/* Leaf Circle Badge */}
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white text-[#0c433a] flex items-center justify-center shrink-0 border border-[#b5dbce] shadow-sm group-hover:scale-105 transition-transform">
          <Leaf className="w-4 h-4 sm:w-5 sm:h-5 text-[#0c433a] fill-[#0c433a]/20" />
        </div>

        {/* SHANFA GLOBAL Typography */}
        <div className="flex flex-col text-left">
          <span className={`font-display text-base sm:text-xl font-black tracking-tight leading-none group-hover:opacity-90 transition-opacity ${light ? 'text-white' : 'text-[#0c3a32]'}`}>
            SHANFA GLOBAL
          </span>
          <span className={`text-[8px] sm:text-[9px] font-black uppercase tracking-[0.22em] leading-tight mt-0.5 ${light ? 'text-white/80' : 'text-[#52736b]'}`}>
            NATURAL SKINCARE
          </span>
        </div>
      </motion.div>
    </Link>
  );
}
