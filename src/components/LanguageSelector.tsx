"use client";

import { useLanguageStore, SUPPORTED_LANGUAGES, LanguageCode } from "@/lib/language-store";
import { useState, useEffect, useRef } from "react";
import { Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function LanguageSelector({ direction = "up", align = "right" }: { direction?: "up" | "down", align?: "left" | "right" }) {
  const { currentLanguage, setLanguage } = useLanguageStore();
  const [open, setOpen] = useState(false);
  const current = SUPPORTED_LANGUAGES.find(l => l.code === currentLanguage.code) || SUPPORTED_LANGUAGES[0];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-full bg-black/5 hover:bg-black/10 transition"
      >
        <span className="text-lg">{current.flag}</span>
        <span className="text-sm font-semibold uppercase">{current.code}</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: direction === "up" ? 10 : -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: direction === "up" ? 10 : -10, scale: 0.95 }}
            className={`absolute ${direction === "up" ? "bottom-full mb-2" : "top-full mt-2"} ${align === "right" ? "right-0" : "left-0"} w-48 rounded-2xl p-2 border border-black/10 shadow-[0_20px_50px_rgba(0,0,0,0.2)] z-[999999] bg-white transition-all pointer-events-auto`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-3 py-2 text-[9px] font-black uppercase tracking-widest text-black/20 border-b border-black/5 mb-1">
              {currentLanguage.code === "ar" ? "اختر اللغة" : "Select Language"}
            </div>
            <div className="space-y-1">
              {SUPPORTED_LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setLanguage(lang.code as LanguageCode);
                    setOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${currentLanguage.code === lang.code
                      ? "bg-black text-white border border-black/10 shadow-sm scale-[0.98]"
                      : "text-black/80 hover:bg-black/5 hover:text-black"
                    }`}
                >
                  <div className="flex items-center gap-2">
                    <span>{lang.flag}</span>
                    <span>{lang.name}</span>
                  </div>
                  {currentLanguage.code === lang.code && <Check size={12} className="text-white/40" />}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}