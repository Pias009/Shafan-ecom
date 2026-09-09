"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, Search, ShoppingBag, UserRound, Sparkles } from "lucide-react";
import { useCartStore } from "@/lib/cart-store";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { useLanguageStore } from "@/lib/language-store";
import { translations } from "@/lib/translations";
import { useSesi } from "./Sesi/useSesi";

export function MobileBottomNav() {
  const pathname = usePathname();
  const { items } = useCartStore();
  const { status } = useSession();
  const { currentLanguage } = useLanguageStore();
  const t = translations[currentLanguage.code as keyof typeof translations];
  
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Keep bottom navigation comfortably accessible while browsing
    setVisible(true);
  }, []);

  const cartCount = items.reduce((acc, item) => acc + item.quantity, 0);
  const sesiEnabled = useSesi((s) => s.enabled);
  const openSesi = useSesi((s) => s.setOpen);

  if (!mounted) return null;

  const navItems = [
    { href: "/", icon: Home, label: t.nav.home },
    { href: "/products", icon: Search, label: t.nav.products || "Explore" },
    ...(sesiEnabled ? [{ icon: Sparkles, label: "Sesi", isSesi: true }] : []),
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
          className="lg:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] w-[92%] max-w-[400px]"
          style={{ willChange: "transform" }}
        >
          <div className="bg-white/95 backdrop-blur-2xl border border-white/60 shadow-[0_12px_36px_rgba(0,0,0,0.18)] rounded-3xl px-5 py-2.5 flex items-center justify-between">
            {navItems.map((item) => {
              const isActive = !item.isSesi && pathname === item.href;
              const Icon = item.icon;
              const content = (
                <>
                  <div className={`relative p-2 rounded-2xl transition-all duration-300 ${isActive ? "bg-black text-white shadow-xs" : "text-black/50 hover:bg-black/5"}`}>
                    <Icon size={21} strokeWidth={isActive ? 2.5 : 2} />
                    {item.isCart && cartCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-gradient-to-r from-rose-500 to-red-600 text-white text-[10px] flex items-center justify-center font-black border-2 border-white shadow-md animate-pulse">
                        {cartCount > 9 ? "9+" : cartCount}
                      </span>
                    )}
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${isActive ? "text-black" : "text-black/20"}`}>
                    {item.label}
                  </span>
                </>
              );

              if (item.isSesi) {
                return (
                  <button
                    key="sesi"
                    onClick={() => openSesi(true)}
                    className="relative group flex flex-col items-center gap-1"
                  >
                    {content}
                  </button>
                );
              }

              const href = item.href!;
              return (
                <Link
                  key={href}
                  href={href}
                  onTouchStart={() => router?.prefetch(href)}
                  className="relative group flex flex-col items-center gap-1"
                >
                  {content}
                </Link>
              );
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
