"use client";

import { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, ArrowRight, Sparkles, Truck, ShieldCheck } from "lucide-react";
import { useCartStore } from "@/lib/cart-store";
import { useCountryStore } from "@/lib/country-store";
import { COUNTRY_CONFIG } from "@/lib/address-config";
import { Price } from "@/components/Price";

export function MobileFloatingCartBar() {
  const pathname = usePathname();
  const { items } = useCartStore();
  const { selectedCountry, selectedCurrency } = useCountryStore();

  const cartCount = items.reduce((acc, item) => acc + item.quantity, 0);

  // Calculate cart total subtotal
  const subtotal = useMemo(() => {
    return items.reduce((acc, item) => {
      let unitPrice = item.price;
      if (item.countryPrices && Array.isArray(item.countryPrices)) {
        const cp = item.countryPrices.find(
          (c) => c.country.toUpperCase() === selectedCountry.toUpperCase()
        );
        if (cp && Number(cp.price) > 0) {
          unitPrice = Number(cp.price);
        }
      }
      return acc + unitPrice * item.quantity;
    }, 0);
  }, [items, selectedCountry]);

  // Determine Free Shipping threshold from COUNTRY_CONFIG
  const countryConfig = COUNTRY_CONFIG[selectedCountry.toUpperCase()] || COUNTRY_CONFIG.AE;
  const freeThreshold = countryConfig?.freeDelivery || 150;
  const progressPercent = Math.min(100, Math.round((subtotal / freeThreshold) * 100));
  const amountRemaining = Math.max(0, freeThreshold - subtotal);
  const unlockedFree = subtotal >= freeThreshold;

  // Don't display on checkout, cart, or admin pages
  const isHiddenRoute =
    pathname?.startsWith("/cart") ||
    pathname?.startsWith("/checkout") ||
    pathname?.startsWith("/ueadmin");

  if (isHiddenRoute || cartCount === 0) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        key="mobile-floating-cart"
        initial={{ y: 80, opacity: 0, scale: 0.94 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 80, opacity: 0, scale: 0.94 }}
        transition={{ type: "spring", stiffness: 350, damping: 28 }}
        className="lg:hidden fixed bottom-[78px] left-1/2 -translate-x-1/2 z-[90] w-[94%] max-w-[420px] pointer-events-auto"
        style={{ willChange: "transform, opacity" }}
      >
        <div className="relative bg-[#540434]/95 backdrop-blur-2xl border border-pink-400/30 rounded-2xl p-2.5 shadow-[0_16px_36px_rgba(84,4,52,0.4)] text-white overflow-hidden">
          {/* Subtle glowing ambient back-light */}
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-48 h-12 bg-pink-500/20 blur-xl pointer-events-none" />

          {/* Top Micro-Bar: Free Delivery Incentive Bar */}
          <div className="mb-2">
            <div className="flex items-center justify-between text-[9.5px] font-bold tracking-tight mb-1">
              <span className="flex items-center gap-1 text-pink-200">
                <Truck size={11} className="text-pink-300" />
                {unlockedFree ? (
                  <span className="text-amber-300 flex items-center gap-0.5 font-black">
                    <Sparkles size={10} className="fill-amber-300" />
                    YOU UNLOCKED FREE GCC DELIVERY!
                  </span>
                ) : (
                  <span>
                    Add{" "}
                    <span className="text-white font-black">
                      {selectedCurrency} {amountRemaining.toFixed(amountRemaining % 1 === 0 ? 0 : 1)}
                    </span>{" "}
                    for Free Delivery
                  </span>
                )}
              </span>
              <span className="text-[9px] text-pink-200 font-bold">{progressPercent}%</span>
            </div>
            {/* Progress bar track */}
            <div className="w-full h-1 bg-black/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-pink-400 via-rose-300 to-amber-300 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Main Action Strip: Items + Total + 1-Tap Checkout */}
          <div className="flex items-center justify-between gap-2.5">
            {/* Left: Cart Info Pill */}
            <Link
              href="/cart"
              className="flex items-center gap-2 hover:opacity-90 active:scale-95 transition-transform"
            >
              <div className="relative w-9 h-9 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0 shadow-inner">
                <ShoppingBag size={17} className="text-pink-200" />
                <span className="absolute -top-1 -right-1 w-4.5 h-4.5 bg-[#890754] text-white text-[9px] font-black rounded-full flex items-center justify-center border border-[#540434] shadow-xs">
                  {cartCount}
                </span>
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-[9px] text-pink-200/90 uppercase font-black tracking-wider mb-0.5">
                  Subtotal
                </span>
                <Price
                  amount={subtotal}
                  className="text-xs xs:text-sm font-black text-white tracking-tight"
                />
              </div>
            </Link>

            {/* Right: Instant Express Checkout CTA */}
            <Link
              href="/cart"
              className="relative group inline-flex items-center justify-center gap-1.5 bg-white hover:bg-pink-50 text-[#890754] px-4 py-2 rounded-xl font-black text-xs uppercase tracking-wider shadow-[0_4px_16px_rgba(255,255,255,0.25)] hover:scale-105 active:scale-95 transition-all shrink-0 border border-white"
            >
              <span>Checkout</span>
              <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
