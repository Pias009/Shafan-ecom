"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, ShoppingBag, UserRound } from "lucide-react";
import { useCartStore } from "@/lib/cart-store";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { useLanguageStore } from "@/lib/language-store";
import { translations } from "@/lib/translations";

export function MobileBottomNav() {
  const pathname = usePathname();
  const { items } = useCartStore();
  const { status } = useSession();
  const { currentLanguage } = useLanguageStore();
  const t = translations[currentLanguage.code as keyof typeof translations];
  
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setVisible(false);
      } else {
        setVisible(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  if (!mounted) return null;

  const cartCount = items.reduce((acc, item) => acc + item.quantity, 0);

  const navItems = [
    { href: "/", icon: Home, label: t.nav.home },
    { href: "/products", icon: Search, label: t.nav.products || "Explore" },
    { href: "/cart", icon: ShoppingBag, label: t.nav.cart || "Cart", isCart: true },
    { href: status === "authenticated" ? "/account" : "/account", icon: UserRound, label: t.nav.account },
  ];

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          exit={{ y: 100 }}
          className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-[400px]"
        >
          <div className="bg-white/90 backdrop-blur-xl border border-black/5 shadow-[0_8px_32px_rgba(0,0,0,0.12)] rounded-3xl px-6 py-3 flex items-center justify-between">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="relative group flex flex-col items-center gap-1"
                >
                  <div className={`p-2 rounded-2xl transition-all duration-300 ${isActive ? "bg-black text-white" : "text-black/40 group-hover:bg-black/5"}`}>
                    <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                    {item.isCart && cartCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-black border-2 border-white shadow-sm">
                        {cartCount > 9 ? "9+" : cartCount}
                      </span>
                    )}
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${isActive ? "text-black" : "text-black/20"}`}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
