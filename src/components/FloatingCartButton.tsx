"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, Check, Plus, ShoppingCart } from "lucide-react";
import { useCartStore } from "@/lib/cart-store";

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

  if (items.length === 0 && isHidden) return null;

  return (
    <motion.div
      className="fixed bottom-6 right-6 z-40"
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
          className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shadow-2xl ${
            animate 
              ? 'bg-gradient-to-br from-green-400 via-green-500 to-emerald-600 shadow-lg shadow-green-500/50' 
              : 'bg-black shadow-black/30'
          }`}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          animate={animate ? { scale: [1, 1.2, 1.1, 1] } : { scale: 1 }}
          transition={{ duration: 0.4 }}
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
                <ShoppingBag size={20} className="text-white" />
              </motion.div>
            ) : (
              <motion.div
                key="check"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 180 }}
                transition={{ type: "spring", stiffness: 400, damping: 15 }}
              >
                <Check size={20} className="text-white" />
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