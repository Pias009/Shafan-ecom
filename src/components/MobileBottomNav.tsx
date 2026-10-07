"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, Search, ShoppingBag, UserRound } from "lucide-react";
import { useCartStore } from "@/lib/cart-store";
import { useState, useSyncExternalStore } from "react";
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
  
  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const [visible] = useState(true);
  const router = useRouter();

  const cartCount = items.reduce((acc, item) => acc + item.quantity, 0);

  if (!isClient) return null;

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
              const isActive = pathname === item.href;
              const Icon = item.icon;

              const content = (
                <div className="flex flex-col items-center justify-center gap-0.5 relative py-1 px-2 sm:px-2.5 w-full">
                  {/* Icon */}
                  <div
                    className={`relative z-10 p-0.5 rounded-full transition-all duration-200 ${
                      isActive
                        ? "text-[#890754] scale-105"
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

                  {/* Active indicator: small dot under the icon */}
                  <span
                    className={`w-1 h-1 rounded-full transition-opacity duration-200 ${
                      isActive ? "bg-[#890754] opacity-100" : "opacity-0"
                    }`}
                  />
                </div>
              );

              const href = item.href;
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
