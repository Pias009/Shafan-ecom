"use client";

import { motion } from "framer-motion";
import { Sparkles, Wand2 } from "lucide-react";

interface SkinTestCTAProps {
  onClick: () => void;
}

export default function SkinTestCTA({ onClick }: SkinTestCTAProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="py-3"
    >
      <motion.button
        onClick={onClick}
        className="relative w-full py-3.5 bg-gradient-to-r from-amber-400 via-pink-400 to-purple-400 text-white rounded-2xl font-bold text-sm shadow-lg overflow-hidden group active:scale-95 transition-transform"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
          animate={{ x: ["-100%", "100%"] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
        />
        <div className="relative flex items-center justify-center gap-2">
          <Wand2 className="w-4 h-4 animate-pulse" />
          <span>Take Sesi&apos;s Skin Test</span>
          <Sparkles className="w-4 h-4 animate-pulse" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500 via-pink-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
      </motion.button>
      <p className="text-[10px] text-center text-gray-400 mt-2">
        Takes 30 seconds ✨
      </p>
    </motion.div>
  );
}
