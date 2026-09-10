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
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 350, damping: 30 }}
          className="lg:hidden fixed bottom-[max(1rem,env(safe-area-inset-bottom))] inset-x-0 mx-auto z-[100] w-[92%] max-w-[390px] pointer-events-auto select-none antialiased"
        >
          {/* ── Apple Vision Pro Pure 3D Glass Dock ── */}
          <nav
            aria-label="Mobile Navigation"
            className="relative bg-white/90 backdrop-blur-xl border border-white/90 rounded-full px-2 py-1.5 shadow-[0_12px_36px_-6px_rgba(20,5,15,0.20),0_4px_12px_-2px_rgba(0,0,0,0.08),inset_0_1.5px_2px_0_rgba(255,255,255,1)] flex items-center justify-between gap-1 ring-1 ring-black/[0.04] overflow-hidden"
          >
            {/* Specular Highlights */}
            <div className="absolute inset-x-8 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white to-transparent pointer-events-none" />

            {navItems.map((item) => {
              const isActive = !item.isSesi && pathname === item.href;
              const Icon = item.icon;

              const content = (
                <div className="flex flex-col items-center justify-center gap-0.5 relative py-1 px-2 sm:px-2.5 w-full">
                  {/* 3D Active Pill Background */}
                  {isActive && (
                    <motion.div
                      layoutId="activeTabPill"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      className="absolute inset-0 rounded-full bg-gradient-to-b from-[#890754] via-[#7d064c] to-[#65033d] shadow-[0_3px_10px_rgba(137,7,84,0.4),inset_0_1px_1px_rgba(255,255,255,0.4)]"
                    />
                  )}

                  {/* Sesi AI Accent Background */}
                  {item.isSesi && (
                    <div className="absolute inset-0 rounded-full bg-pink-50/80 border border-pink-200/50 pointer-events-none" />
                  )}

                  {/* Icon */}
                  <div
                    className={`relative z-10 p-0.5 rounded-full transition-all duration-200 ${
                      isActive
                        ? "text-white scale-105"
                        : item.isSesi
                        ? "text-[#890754] group-hover:scale-110"
                        : "text-gray-700 group-hover:text-[#890754] group-active:scale-90"
                    }`}
                  >
                    <Icon size={19} strokeWidth={isActive ? 2.5 : 2.2} />

                    {/* 3D Cart Notification Badge */}
                    {item.isCart && cartCount > 0 && (
                      <span className="absolute -top-1 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-gradient-to-r from-rose-500 to-[#890754] text-white text-[9px] flex items-center justify-center font-black border-2 border-white shadow-xs animate-pulse">
                        {cartCount > 9 ? "9+" : cartCount}
                      </span>
                    )}
                  </div>

                  {/* Label - High Contrast & Pixel-Crisp */}
                  <span
                    className={`relative z-10 text-[10px] font-black tracking-wider uppercase leading-none transition-colors duration-200 ${
                      isActive
                        ? "text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.3)]"
                        : item.isSesi
                        ? "text-[#890754]"
                        : "text-gray-800 group-hover:text-black"
                    }`}
                    style={{ WebkitFontSmoothing: "antialiased" }}
                  >
                    {item.label}
                  </span>
                </div>
              );

              if (item.isSesi) {
                return (
                  <button
                    key="sesi"
                    type="button"
                    onClick={() => openSesi(true)}
                    className="relative group flex-1 flex flex-col items-center justify-center active:scale-95 transition-transform"
                    aria-label="AI Beauty Assistant"
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
                  className="relative group flex-1 flex flex-col items-center justify-center active:scale-95 transition-transform"
                  aria-label={item.label}
                >
                  {content}
                </Link>
              );
            })}
          </nav>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
