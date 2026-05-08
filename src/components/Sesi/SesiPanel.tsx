"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useSesi } from "./useSesi";
import { X, Sparkles, Stethoscope, ClipboardList } from "lucide-react";
import SesiChat from "./SesiChat";
import SesiRoutine from "./SesiRoutine";

export default function SesiPanel() {
  const { isOpen, state, persona, setOpen, reset, suggestedProducts } = useSesi();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.85, filter: "blur(20px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          exit={{ opacity: 0, scale: 0.85, filter: "blur(20px)" }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          style={{ transformOrigin: "bottom right" }}
          className={`fixed bottom-24 right-6 sm:bottom-32 sm:right-10 w-[calc(100vw-3rem)] sm:w-[380px] h-[65vh] sm:h-[580px] rounded-[2.5rem] shadow-2xl overflow-hidden z-[9997] ${
            persona === "doctor"
              ? "bg-teal-50/80 backdrop-blur-xl border border-teal-200/50"
              : state === "ROUTINE_UPSELL"
              ? "bg-amber-50/80 backdrop-blur-xl border border-amber-200/50"
              : "bg-pink-50/80 backdrop-blur-xl border border-pink-200/50"
          }`}
        >
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-white/30 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-white/20 rounded-full blur-3xl" />
          </div>

          <div className="relative z-10 flex flex-col h-full">
            <div className="px-5 py-4 flex items-center justify-between border-b border-white/30">
              <div className="flex items-center gap-3">
                <motion.div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all duration-500 ${
                    persona === "doctor"
                      ? "bg-teal-100/80"
                      : state === "ROUTINE_UPSELL"
                      ? "bg-amber-100/80"
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
                  <h2 className="text-sm font-bold text-gray-900 tracking-wide">
                    {persona === "doctor" ? "Dr. Sesi" : "Sesi"}
                  </h2>
                  <p className="text-[10px] text-gray-500 font-medium flex items-center gap-1">
                    {persona === "doctor" ? (
                      <>
                        <Stethoscope className="w-3 h-3" />
                        Skin Diagnosis
                      </>
                    ) : state === "ROUTINE_UPSELL" ? (
                      <>
                        <ClipboardList className="w-3 h-3" />
                        Your Routine
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3 h-3" />
                        Your glow bestie
                      </>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
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
                  className="w-10 h-10 rounded-full bg-white/50 hover:bg-white/80 flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>

            {suggestedProducts.length > 0 && (
              <div className="px-5 py-2 flex items-center gap-2 border-b border-white/20">
                <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                <span className="text-[10px] font-bold text-teal-600 uppercase tracking-wider">
                  {suggestedProducts.length} prescription{suggestedProducts.length > 1 ? "s" : ""}
                </span>
              </div>
            )}

            <div className="flex-1 overflow-hidden">
              {state !== "ROUTINE_UPSELL" && <SesiChat />}
              {state === "ROUTINE_UPSELL" && <SesiRoutine />}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
