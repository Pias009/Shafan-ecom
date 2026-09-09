"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Sparkles, X } from "lucide-react";
import { usePathname } from "next/navigation";

interface ProofNotification {
  name: string;
  city: string;
  country: string;
  flag: string;
  item: string;
  timeAgo: string;
}

const RECENT_ORDERS: ProofNotification[] = [
  { name: "Fatima A.", city: "Dubai", country: "UAE", flag: "🇦🇪", item: "Doctor Sasi Radiance Serum", timeAgo: "2m ago" },
  { name: "Noura M.", city: "Riyadh", country: "Saudi Arabia", flag: "🇸🇦", item: "Glass Skin Glow Routine Bundle", timeAgo: "4m ago" },
  { name: "Mariam K.", city: "Kuwait City", country: "Kuwait", flag: "🇰🇼", item: "Vitamin C Brightening Serum", timeAgo: "7m ago" },
  { name: "Reem H.", city: "Doha", country: "Qatar", flag: "🇶🇦", item: "Deep Moisture Hydrating Cream", timeAgo: "9m ago" },
  { name: "Hessa B.", city: "Manama", country: "Bahrain", flag: "🇧🇭", item: "Clarifying Mint Foam Cleanser", timeAgo: "12m ago" },
  { name: "Aisha S.", city: "Muscat", country: "Oman", flag: "🇴🇲", item: "Advanced Anti-Aging Essence", timeAgo: "15m ago" },
  { name: "Sara D.", city: "Abu Dhabi", country: "UAE", flag: "🇦🇪", item: "Sun Shield Invisible SPF 50", timeAgo: "18m ago" },
];

export function LiveSalesProof() {
  const pathname = usePathname();
  const [current, setCurrent] = useState<ProofNotification | null>(null);
  const [dismissed, setDismissed] = useState(false);

  // Hide on admin or checkout pages
  const isHiddenRoute = pathname?.startsWith("/ueadmin") || pathname?.startsWith("/checkout");

  useEffect(() => {
    if (dismissed || isHiddenRoute) return;

    // Show once after 4s, then auto-hide after 2s
    const showTimer = setTimeout(() => {
      setCurrent(RECENT_ORDERS[Math.floor(Math.random() * RECENT_ORDERS.length)]);

      const hideTimer = setTimeout(() => {
        setCurrent(null);
        setDismissed(true);
      }, 2000);

      return () => clearTimeout(hideTimer);
    }, 4000);

    return () => clearTimeout(showTimer);
  }, [dismissed, isHiddenRoute]);

  if (isHiddenRoute || dismissed || !current) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        key={`${current.name}-${current.item}`}
        initial={{ opacity: 0, y: -30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -30, scale: 0.95 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="fixed bottom-28 sm:bottom-6 left-3 sm:left-6 z-40 right-3 sm:right-auto sm:w-80 pointer-events-auto"
      >
        <div className="relative bg-white/95 backdrop-blur-xl border border-emerald-900/10 rounded-2xl p-2.5 shadow-[0_12px_32px_rgba(0,0,0,0.14)] flex items-center gap-3 text-slate-800 select-none">
          {/* Green Pulse Ring + Flag */}
          <div className="relative w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0 text-base shadow-inner">
            <span>{current.flag}</span>
            <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
            </span>
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-1 leading-none mb-0.5">
              <span className="text-[11px] font-bold text-slate-900 truncate">
                {current.name}
              </span>
              <span className="text-[10px] text-slate-400">• {current.city}</span>
            </div>
            <p className="text-[10px] text-emerald-800 font-semibold truncate leading-snug">
              Purchased <span className="font-bold text-[#0c433a]">{current.item}</span>
            </p>
            <div className="flex items-center gap-1.5 mt-0.5 text-[9px] text-slate-400 leading-none">
              <span className="flex items-center gap-0.5 text-emerald-600 font-bold">
                <CheckCircle2 size={10} /> Verified
              </span>
              <span>•</span>
              <span>{current.timeAgo}</span>
            </div>
          </div>

          {/* Dismiss button */}
          <button
            type="button"
            onClick={() => {
              setCurrent(null);
              setDismissed(true);
            }}
            className="absolute top-2 right-2 p-1 text-slate-300 hover:text-slate-500 rounded-full transition-colors"
            aria-label="Close"
          >
            <X size={13} />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
