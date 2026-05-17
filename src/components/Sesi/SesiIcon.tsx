"use client";

import { useRef, useLayoutEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSesi } from "./useSesi";
import { Search, Sparkles, Stethoscope, Star, Droplets, UserRound, Plus } from "lucide-react";

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
  const { isOpen, isMinimized, persona, state, setOpen, toggleMinimize, cooldownExpiry } = useSesi();
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
    const pos = saved || { x: window.innerWidth - 80, y: window.innerHeight - 100 };
    setTimeout(() => setInitialPos(pos), 0);
  }, []);

  const handleOpen = () => {
    if (isOpen && isMinimized) {
      toggleMinimize();
    } else {
      setOpen(!isOpen);
    }
  };

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
          className={`relative w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden shadow-lg transition-all duration-500 cursor-grab active:cursor-grabbing ${
            isOnCooldown
              ? "bg-gradient-to-br from-gray-300 via-gray-200 to-gray-300 opacity-70"
              : persona === "doctor"
              ? "bg-gradient-to-br from-teal-200 via-white to-emerald-100"
              : "bg-gradient-to-br from-pink-200 via-pink-100 to-rose-200"
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
                  className="relative flex items-center justify-center"
                >
                  <Stethoscope className="w-5 h-5 sm:w-6 sm:h-6 text-teal-500" strokeWidth={1.5} />

                  <motion.div
                    className="absolute -top-1 -right-1 bg-teal-500 rounded-full p-0.5"
                    animate={{ rotate: [0, 15, -15, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Search className="w-2 h-2 text-white" strokeWidth={2.5} />
                  </motion.div>

                  <motion.div
                    className="absolute -bottom-0.5 -left-1"
                    animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Sparkles className="w-1.5 h-1.5 text-emerald-400" />
                  </motion.div>
                </motion.div>
              ) : (
                <motion.div
                  key="baby"
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: 20 }}
                  transition={{ type: "spring", stiffness: 400, damping: 18 }}
                  className="relative flex items-center justify-center"
                >
                  <UserRound className="w-5 h-5 sm:w-6 sm:h-6 text-pink-500" strokeWidth={1.5} />

                  <motion.div
                    className="absolute -top-1 left-1/2 -translate-x-1/2 bg-pink-400 rounded-full p-0.5"
                    animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <Plus className="w-1.5 h-1.5 text-white" strokeWidth={3} />
                  </motion.div>

                  <motion.div
                    className="absolute -top-1 -left-1"
                    animate={{ rotate: [0, 360], scale: [1, 1.3, 1] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    <Star className="w-2 h-2 text-amber-400 fill-amber-400" />
                  </motion.div>

                  <motion.div
                    className="absolute -top-1 -right-1"
                    animate={{ rotate: [360, 0], scale: [1, 1.2, 1] }}
                    transition={{ duration: 2.5, repeat: Infinity }}
                  >
                    <Sparkles className="w-1.5 h-1.5 text-pink-400" />
                  </motion.div>

                  <motion.div
                    className="absolute -bottom-0.5 left-1/2 -translate-x-1/2"
                    animate={{ y: [0, -3, 0], opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Droplets className="w-1.5 h-1.5 text-blue-300" />
                  </motion.div>

                  <motion.div
                    className="absolute -bottom-1 -right-2"
                    animate={{ scale: [1, 1.4, 1], opacity: [0.6, 1, 0.6] }}
                    transition={{ duration: 1.8, repeat: Infinity, delay: 0.5 }}
                  >
                    <Star className="w-1.5 h-1.5 text-rose-300 fill-rose-300" />
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {persona === "doctor" && (
            <motion.div
              className="absolute inset-0 border-[2px] border-teal-300/40 rounded-full"
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
              className="absolute -top-7 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-white/90 backdrop-blur-sm rounded-full shadow-lg whitespace-nowrap"
            >
              <span className="text-[8px] font-bold text-gray-700 tracking-wide uppercase">
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
