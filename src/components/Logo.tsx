"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`flex items-center group ${className}`}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative flex items-center"
      >
        {/* Main Logo Text - smaller */}
        <h1 className="font-display text-lg md:text-xl font-bold tracking-tight">
          <motion.span
            className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-600 bg-clip-text text-transparent"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            SHANFA GLOBAL
          </motion.span>
        </h1>
      </motion.div>
    </Link>
  );
}
