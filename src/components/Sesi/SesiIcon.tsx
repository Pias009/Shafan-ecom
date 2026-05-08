"use client";

import { useRef, useLayoutEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSesi } from "./useSesi";
import { Search, Sparkles, Stethoscope } from "lucide-react";

const STORAGE_KEY = "sesi-position";

function loadPosition(): { x: number; y: number } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed.x === "number" && typeof parsed.y === "number" && parsed.x > 0 && parsed.y > 0) {
        return parsed;
      }
    }
  } catch {
    // ignore
  }
  return null;
}

function savePosition(x: number, y: number) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ x, y }));
  } catch {
    // ignore
  }
}

export default function SesiIcon() {
  const { isOpen, persona, state, setOpen, cooldownExpiry } = useSesi();
  const constraintsRef = useRef<HTMLDivElement>(null);
  const [initialPos, setInitialPos] = useState<{ x: number; y: number } | null>(null);
  const [isOnCooldown, setIsOnCooldown] = useState(() => cooldownExpiry ? cooldownExpiry > Date.now() : false);

  useLayoutEffect(() => {
    const check = () => setIsOnCooldown(cooldownExpiry ? cooldownExpiry > Date.now() : false);
    check();
    const interval = setInterval(check, 1000);
    return () => clearInterval(interval);
  }, [cooldownExpiry]);

  useLayoutEffect(() => {
    const saved = loadPosition();
    const pos = saved || { x: window.innerWidth - 100, y: window.innerHeight - 120 };
    setTimeout(() => setInitialPos(pos), 0);
  }, []);

  const handleOpen = () => setOpen(!isOpen);

  const handleDragEnd = (
    _: MouseEvent | TouchEvent | PointerEvent,
    info: { point: { x: number; y: number } }
  ) => {
    savePosition(info.point.x, info.point.y);
  };

  if (!initialPos) return null;

  return (
    <div ref={constraintsRef} className="fixed inset-0 pointer-events-none z-[9998]">
      <motion.div
        drag
        dragConstraints={constraintsRef}
        dragMomentum={false}
        dragElastic={0.08}
        initial={initialPos}
        className="pointer-events-auto"
        style={{ position: "fixed" }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.92 }}
        onDragEnd={handleDragEnd}
      >
        <motion.button
          onClick={handleOpen}
          className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden shadow-2xl ring-4 transition-all duration-500 cursor-grab active:cursor-grabbing ${
            isOnCooldown
              ? "bg-gradient-to-br from-gray-300 via-gray-200 to-gray-300 ring-gray-400/50 opacity-70"
              : persona === "doctor"
              ? "bg-gradient-to-br from-teal-200 via-white to-emerald-100 ring-teal-300/50"
              : "bg-gradient-to-br from-pink-200 via-pink-100 to-rose-200 ring-pink-300/40"
          }`}
          animate={{ scale: isOpen ? 1.05 : 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <AnimatePresence mode="wait">
              {persona === "doctor" ? (
                <motion.div
                  key="doctor"
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: 20 }}
                  transition={{ type: "spring", stiffness: 400, damping: 18 }}
                  className="flex flex-col items-center justify-center"
                >
                  <div className="text-3xl sm:text-4xl leading-none">{"\u{1F469}\u200D\u2695\uFE0F"}</div>
                  <motion.div
                    className="absolute -top-0.5 -right-0.5 bg-teal-500 rounded-full p-1"
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Stethoscope className="w-2.5 h-2.5 text-white" />
                  </motion.div>
                  <motion.div
                    className="absolute bottom-1 right-1 w-4 h-4 bg-teal-400 rounded-full flex items-center justify-center"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2.5, repeat: Infinity }}
                  >
                    <Search className="w-2.5 h-2.5 text-white" />
                  </motion.div>
                </motion.div>
              ) : (
                <motion.div
                  key="baby"
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: 20 }}
                  transition={{ type: "spring", stiffness: 400, damping: 18 }}
                  className="flex flex-col items-center justify-center"
                >
                  <div className="text-3xl sm:text-4xl leading-none">{"\u{1F476}"}</div>
                  <motion.div
                    className="absolute bottom-1 right-1 w-4 h-4 bg-pink-400 rounded-full flex items-center justify-center"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Sparkles className="w-2.5 h-2.5 text-white" />
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {persona === "doctor" && (
            <motion.div
              className="absolute inset-0 border-[3px] border-teal-300/60 rounded-full"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
            />
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
        </motion.button>

        <AnimatePresence>
          {!isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              transition={{ delay: 0.5 }}
              className="absolute -top-9 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-full shadow-lg whitespace-nowrap"
            >
              <span className="text-[10px] font-bold text-gray-700 tracking-wide uppercase">
                {isOnCooldown
                  ? "Resting..."
                  : persona === "doctor"
                  ? "Dr. Sesi"
                  : state === "ROUTINE_UPSELL"
                  ? "Your Routine"
                  : "Need help?"}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
