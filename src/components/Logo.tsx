"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

export function Logo({ className = "", light = false }: { className?: string; light?: boolean }) {
  return (
    <Link href="/" className={`flex items-center group select-none ${className}`}>
      <motion.div
        initial={{ opacity: 0, y: -2 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative h-7 sm:h-8 md:h-9 w-36 sm:w-44 md:w-48 flex items-center"
      >
        <Image
          src={light ? "/images/shanfa-logo-white.png" : "/images/shanfa-logo-official.png"}
          alt="SHANFA GLOBAL"
          fill
          className="object-contain object-left transition-transform duration-300 group-hover:scale-[1.02]"
          priority
        />
      </motion.div>
    </Link>
  );
}
