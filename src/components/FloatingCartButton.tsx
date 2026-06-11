"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";
import { useCartStore } from "@/lib/cart-store";

function AnimatedCartIcon({ animate }: { animate: boolean }) {
  return (
    <motion.svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-white"
      animate={animate ? {
        scale: [1, 1.3, 0.9, 1.1, 1],
        rotate: [0, -10, 10, -5, 0],
      } : {
        scale: 1,
        rotate: 0,
      }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
    >
      <motion.path
        d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
      />
      <motion.line
        x1="3" y1="6" x2="21" y2="6"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.3, delay: 0.4 }}
      />
      <motion.path
        d="M16 10a4 4 0 01-8 0"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.4, delay: 0.6 }}
      />
    </motion.svg>
  );
}

export function FloatingCartButton() {
  const pathname = usePathname();
  const items = useCartStore((state) => state.items);
  const [mounted, setMounted] = useState(false);
  const [animate, setAnimate] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [prevCount, setPrevCount] = useState(0);

  const isAdminRoute = pathname?.startsWith('/ueadmin') || pathname?.startsWith('/admin');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && items.length > prevCount) {
      setAnimate(true);
      setIsHidden(false);
      const timer = setTimeout(() => setAnimate(false), 1000);
      return () => clearTimeout(timer);
    }
    setPrevCount(items.length);
  }, [items.length, mounted, prevCount]);

  useEffect(() => {
    if (mounted && items.length > 0) {
      const hideTimer = setTimeout(() => setIsHidden(true), 5000);
      return () => clearTimeout(hideTimer);
    }
  }, [mounted, items.length]);

  const handleClick = useCallback(() => {
    if (isHidden) {
      setIsHidden(false);
      setAnimate(true);
      setTimeout(() => setAnimate(false), 1000);
    }
  }, [isHidden]);

  if (!mounted || isAdminRoute) return null;

  return (
    <motion.div
      className="fixed bottom-24 right-4 sm:bottom-28 sm:right-6 z-40"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
    >
      <Link
        href="/cart"
        onClick={handleClick}
        className="block"
        aria-label={isHidden ? "Show cart" : "Open cart"}
      >
        <motion.div
          className={`relative w-14 h-14 rounded-full flex items-center justify-center shadow-2xl ${
            animate
              ? 'bg-gradient-to-br from-emerald-400 via-green-500 to-teal-600 shadow-lg shadow-emerald-500/50'
              : 'bg-gradient-to-br from-gray-900 to-black shadow-black/30'
          }`}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          animate={animate ? { scale: [1, 1.2, 1, 1.15, 1] } : { scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <AnimatePresence mode="wait">
            {!animate ? (
              <motion.div
                key="bag"
                initial={{ rotate: -90, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                exit={{ rotate: 90, scale: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <AnimatedCartIcon animate={false} />
              </motion.div>
            ) : (
              <motion.div
                key="animated"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 15 }}
              >
                <AnimatedCartIcon animate={true} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <AnimatePresence>
          {!animate && items.length > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-red-500 text-white text-[9px] sm:text-xs flex items-center justify-center font-bold border-2 border-white"
            >
              {items.length > 9 ? "9+" : items.length}
            </motion.span>
          )}
        </AnimatePresence>

        {animate && (
          <motion.span
            initial={{ scale: 0, y: 10 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0, y: -10 }}
            className="absolute -top-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white text-green-600 text-[9px] sm:text-xs flex items-center justify-center font-bold border-2 border-green-500"
          >
            <Plus size={10} className="font-bold" />
          </motion.span>
        )}
      </Link>
    </motion.div>
  );
}
