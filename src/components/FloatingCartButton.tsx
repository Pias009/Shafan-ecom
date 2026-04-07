"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useCartStore } from "@/lib/cart-store";

export function FloatingCartButton() {
  const items = useCartStore((state) => state.items);
  const [mounted, setMounted] = useState(false);
  const [animate, setAnimate] = useState(false);
  const [prevCount, setPrevCount] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && items.length > prevCount) {
      setAnimate(true);
      const timer = setTimeout(() => setAnimate(false), 400);
      return () => clearTimeout(timer);
    }
    setPrevCount(items.length);
  }, [items.length, mounted, prevCount]);

  if (!mounted) return null;

  return (
    <Link
      href="/cart"
      className={`fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-black text-white flex items-center justify-center shadow-2xl shadow-black/30 transition-transform hover:scale-110 active:scale-95 ${animate ? "animate-cart-bounce" : ""}`}
      aria-label="Open cart"
    >
      <ShoppingBag size={24} />
      {items.length > 0 && (
        <span className={`absolute -top-1 -right-1 w-6 h-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold border-2 border-white ${animate ? "animate-pulse" : ""}`}>
          {items.length > 9 ? "9+" : items.length}
        </span>
      )}
    </Link>
  );
}