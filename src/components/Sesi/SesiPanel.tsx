"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useSesi } from "./useSesi";
import {
  X, Sparkles, Stethoscope, ClipboardList, Minus,
  Maximize2, ShoppingBag, GripHorizontal
} from "lucide-react";
import SesiChat from "./SesiChat";
import SesiRoutine from "./SesiRoutine";
import { useCartStore } from "@/lib/cart-store";
import { useRouter } from "next/navigation";

export default function SesiPanel() {
  const {
    isOpen, state, persona, setOpen, reset, suggestedProducts,
    isMinimized, toggleMinimize,
  } = useSesi();
  const cartItems = useCartStore((s) => s.items);
  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const router = useRouter();

  const panelRef = useRef<HTMLDivElement>(null);
  const [panelWidth, setPanelWidth] = useState(480);
  const [isFloating, setIsFloating] = useState(false);

  useEffect(() => {
    const updateWidth = () => {
      const vw = window.innerWidth;
      setPanelWidth(Math.min(480, vw - 32));
    };
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  const colorTheme = persona === "doctor"
    ? "teal"
    : state === "ROUTINE_UPSELL"
    ? "amber"
    : "pink";

  const themeClasses: Record<string, string> = {
    teal: "bg-teal-50/80 backdrop-blur-xl border border-teal-200/50",
    amber: "bg-amber-50/80 backdrop-blur-xl border border-amber-200/50",
    pink: "bg-pink-50/80 backdrop-blur-xl border border-pink-200/50",
  };

  const floatWidth = Math.min(400, panelWidth);

  return (
    <AnimatePresence mode="wait">
      {isOpen && !isFloating && (
        <motion.div
          key="docked"
          ref={panelRef}
          initial={{ x: panelWidth + 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: panelWidth + 20, opacity: 0 }}
          transition={{ type: "spring", damping: 28, stiffness: 300 }}
          style={{
            position: "fixed",
            right: 0,
            top: 0,
            bottom: 0,
            zIndex: 9997,
            width: panelWidth,
            overflow: "hidden",
          }}
          className={themeClasses[colorTheme]}
        >
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-white/30 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-white/20 rounded-full blur-3xl" />
          </div>

          <div className="relative z-10 flex flex-col h-full">
            {/* Header */}
            <div className="px-5 py-4 flex items-center justify-between border-b border-white/30">
              <div className="flex items-center gap-3">
                <motion.div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all duration-500 ${
                    colorTheme === "teal" ? "bg-teal-100/80"
                    : colorTheme === "amber" ? "bg-amber-100/80"
                    : "bg-pink-100/80"
                  }`}
                  key={persona + state}
                  initial={{ scale: 0, rotate: -30 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                >
                  {persona === "doctor"
                    ? "\u{1F469}\u200D\u2695\uFE0F"
                    : state === "ROUTINE_UPSELL"
                    ? "\u2728"
                    : "\u{1F476}"}
                </motion.div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h2 className="text-sm font-bold text-gray-900 tracking-wide">
                      {persona === "doctor" ? "Dr. Sesi" : "Sesi"}
                    </h2>
                    <span className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white">v2.0</span>
                  </div>
                  <p className="text-[10px] text-gray-500 font-medium flex items-center gap-1">
                    {persona === "doctor" ? (
                      <><Stethoscope className="w-3 h-3" /> Skin Diagnosis</>
                    ) : state === "ROUTINE_UPSELL" ? (
                      <><ClipboardList className="w-3 h-3" /> Your Routine</>
                    ) : (
                      <><Sparkles className="w-3 h-3" /> Your glow bestie</>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setIsFloating(true)}
                  className="w-8 h-8 rounded-full bg-white/50 hover:bg-white/80 flex items-center justify-center transition-colors"
                  title="Float"
                >
                  <GripHorizontal className="w-3.5 h-3.5 text-gray-500" />
                </button>
                <button
                  onClick={() => toggleMinimize()}
                  className="w-8 h-8 rounded-full bg-white/50 hover:bg-white/80 flex items-center justify-center transition-colors"
                  title={isMinimized ? "Expand" : "Minimize"}
                >
                  {isMinimized ? (
                    <Maximize2 className="w-3.5 h-3.5 text-gray-500" />
                  ) : (
                    <Minus className="w-3.5 h-3.5 text-gray-500" />
                  )}
                </button>
                {state !== "PLAYFUL_FRIEND" && (
                  <button
                    onClick={() => reset()}
                    className="w-8 h-8 rounded-full bg-white/50 hover:bg-white/80 flex items-center justify-center transition-colors"
                    title="Start over"
                  >
                    <X className="w-3.5 h-3.5 text-gray-500" />
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/50 hover:bg-white/80 flex items-center justify-center transition-colors"
                  title="Close"
                >
                  <X className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Prescription badge */}
            {suggestedProducts.length > 0 && !isMinimized && (
              <div className="px-5 py-2 flex items-center gap-2 border-b border-white/20">
                <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                <span className="text-[10px] font-bold text-teal-600 uppercase tracking-wider">
                  {suggestedProducts.length} prescription{suggestedProducts.length > 1 ? "s" : ""}
                </span>
              </div>
            )}

            {/* Body */}
            {!isMinimized && (
              <div className="flex-1 overflow-hidden">
                {state !== "ROUTINE_UPSELL" && <SesiChat />}
                {state === "ROUTINE_UPSELL" && <SesiRoutine />}
              </div>
            )}

            {/* Cart Summary */}
            {!isMinimized && cartCount > 0 && (
              <div className="px-4 py-3 border-t border-white/30">
                <button
                  onClick={() => router.push("/cart")}
                  className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  <ShoppingBag className="w-4 h-4" />
                  View Cart ({cartCount} {cartCount === 1 ? "item" : "items"})
                </button>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {isOpen && isFloating && (
        <motion.div
          key="floating"
          ref={panelRef}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ type: "spring", damping: 26, stiffness: 280 }}
          drag
          dragMomentum={false}
          style={{
            position: "fixed",
            right: 24,
            bottom: 140,
            zIndex: 9999,
            width: floatWidth,
            maxHeight: "60vh",
            borderRadius: 20,
            overflow: "hidden",
          }}
          className={`shadow-2xl ${themeClasses[colorTheme]} cursor-grab active:cursor-grabbing`}
        >
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-white/30 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-white/20 rounded-full blur-3xl" />
          </div>

          <div className="relative z-10 flex flex-col h-full max-h-[60vh]">
            {/* Header */}
            <div className="px-4 py-3 flex items-center justify-between border-b border-white/30">
              <div className="flex items-center gap-2">
                <GripHorizontal className="w-4 h-4 text-gray-400" />
                <motion.div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-base transition-all duration-500 ${
                    colorTheme === "teal" ? "bg-teal-100/80"
                    : colorTheme === "amber" ? "bg-amber-100/80"
                    : "bg-pink-100/80"
                  }`}
                  key={persona + state}
                  initial={{ scale: 0, rotate: -30 }}
                  animate={{ scale: 1, rotate: 0 }}
                >
                  {persona === "doctor"
                    ? "\u{1F469}\u200D\u2695\uFE0F"
                    : state === "ROUTINE_UPSELL"
                    ? "\u2728"
                    : "\u{1F476}"}
                </motion.div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h2 className="text-xs font-bold text-gray-900 tracking-wide">
                      {persona === "doctor" ? "Dr. Sesi" : "Sesi"}
                    </h2>
                    <span className="text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white">v2.0</span>
                  </div>
                  <p className="text-[9px] text-gray-500 font-medium">
                    {persona === "doctor" ? "Skin Diagnosis" : "Your glow bestie"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsFloating(false)}
                  className="w-7 h-7 rounded-full bg-white/50 hover:bg-white/80 flex items-center justify-center transition-colors"
                  title="Dock"
                >
                  <Maximize2 className="w-3 h-3 text-gray-500" />
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="w-7 h-7 rounded-full bg-white/50 hover:bg-white/80 flex items-center justify-center transition-colors"
                  title="Close"
                >
                  <X className="w-3.5 h-3.5 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-hidden">
              {state !== "ROUTINE_UPSELL" && <SesiChat />}
              {state === "ROUTINE_UPSELL" && <SesiRoutine />}
            </div>

            {/* Cart Summary */}
            {cartCount > 0 && (
              <div className="px-3 py-2 border-t border-white/30">
                <button
                  onClick={() => router.push("/cart")}
                  className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-black text-[9px] uppercase tracking-[0.2em] shadow-lg flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  Cart ({cartCount})
                </button>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
