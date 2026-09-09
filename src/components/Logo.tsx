"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export function Logo({ className = "", light = false }: { className?: string; light?: boolean }) {
  return (
    <Link href="/" className={`flex items-center group whitespace-nowrap select-none ${className}`}>
      <motion.div
        initial={{ opacity: 0, y: -2 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="flex flex-col text-left py-1"
      >
        {/* BasharaCare-style clean modern bold uppercase wordmark */}
        <span
          className={`font-sans text-lg sm:text-2xl font-black tracking-[0.18em] uppercase leading-none transition-all ${
            light ? 'text-white group-hover:text-white/90' : 'text-[#0c3a32] group-hover:text-black'
          }`}
          style={{ letterSpacing: "0.2em" }}
        >
          SHANFA GLOBAL
        </span>
        <span
          className={`text-[8px] sm:text-[9px] font-extrabold uppercase tracking-[0.35em] leading-tight mt-1 transition-opacity ${
            light ? 'text-white/75' : 'text-[#0c3a32]/70'
          }`}
        >
          LUXURY SKINCARE
        </span>
      </motion.div>
    </Link>
  );
}
