"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { WebGLLogo } from "./WebGLLogo";

export function Logo({ className = "", light = false }: { className?: string; light?: boolean }) {
  return (
    <Link href="/" className={`flex items-center group select-none ${className}`} aria-label="SHANFA GLOBAL Home">
      <motion.div
        initial={{ opacity: 0, y: -2 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative h-9 sm:h-9.5 md:h-10 lg:h-11 w-46 sm:w-52 md:w-58 lg:w-64 max-w-[65vw] flex items-center"
      >
        <WebGLLogo light={light} />
      </motion.div>
    </Link>
  );
}
