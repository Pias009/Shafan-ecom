"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useLoadingStore } from "@/lib/loading-store";

export function GlobalLoadingOverlay() {
  const { isRedirecting, message, setRedirecting } = useLoadingStore();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Whenever the route completes loading, clear the overlay
    setRedirecting(false);
  }, [pathname, searchParams, setRedirecting]);

  return (
    <AnimatePresence>
      {isRedirecting && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center backdrop-blur-md"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-emerald-400/20 blur-xl rounded-full" />
            <Loader2 className="w-12 h-12 animate-spin text-black mb-6 relative z-10" />
          </div>
          <h2 className="text-2xl font-black uppercase tracking-widest text-black">{message}</h2>
          <p className="text-black/50 mt-2 text-sm font-medium">Please wait while we redirect you...</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
