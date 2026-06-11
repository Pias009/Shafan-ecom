"use client";

import { useLayoutEffect, useState } from "react";
import { motion } from "framer-motion";
import { useSesi } from "./useSesi";
import { Sparkles, Stethoscope, Heart } from "lucide-react";

export default function SesiIcon() {
  const { isOpen, isMinimized, persona, cooldownExpiry, setOpen, toggleMinimize } = useSesi();
  const [isOnCooldown, setIsOnCooldown] = useState(() => cooldownExpiry ? cooldownExpiry > Date.now() : false);

  useLayoutEffect(() => {
    const check = () => setIsOnCooldown(cooldownExpiry ? cooldownExpiry > Date.now() : false);
    check();
    const interval = setInterval(check, 1000);
    return () => clearInterval(interval);
  }, [cooldownExpiry]);

  const handleOpen = () => {
    if (isOpen && isMinimized) {
      toggleMinimize();
    } else {
      setOpen(!isOpen);
    }
  };

  return (
    <div className="hidden md:block">
    <motion.button
      onClick={handleOpen}
      className={`fixed top-1/2 -translate-y-1/2 right-0 z-[9998] flex-col items-center justify-center gap-2 w-10 py-5 rounded-l-xl shadow-2xl overflow-hidden group ${isOpen ? 'hidden' : 'flex'}`}
      whileHover={{ x: -4 }}
      whileTap={{ scale: 0.97 }}
      style={{
        background: isOnCooldown
          ? "linear-gradient(135deg, #d1d5db, #e5e7eb)"
          : persona === "doctor"
          ? "linear-gradient(135deg, #0d9488, #14b8a6)"
          : "linear-gradient(135deg, #db2777, #ec4899)",
        border: "1px solid rgba(255,255,255,0.2)",
        borderRight: "none",
      }}
    >
      {/* Animated glow */}
      <motion.div
        className="absolute inset-0 rounded-l-xl pointer-events-none"
        animate={isOnCooldown ? { opacity: 0.3 } : { opacity: [0.3, 0.7, 0.3], scale: [1, 1.08, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        style={{
          background: isOnCooldown
            ? "radial-gradient(circle at center, rgba(255,255,255,0.1), transparent)"
            : persona === "doctor"
            ? "radial-gradient(circle at center, rgba(153,246,228,0.3), transparent)"
            : "radial-gradient(circle at center, rgba(249,168,212,0.3), transparent)",
        }}
      />

      {/* Hover glow */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-25 transition-opacity duration-300 pointer-events-none bg-white" />

      {/* Icon */}
      <motion.div
        className="relative flex items-center justify-center w-6 h-6 rounded-full bg-white/90"
        whileHover={{ rotate: [0, -10, 10, -5, 0] }}
        transition={{ duration: 0.5 }}
      >
        {isOnCooldown ? (
          <Sparkles className="w-3.5 h-3.5 text-gray-400" />
        ) : persona === "doctor" ? (
          <Stethoscope className="w-3.5 h-3.5 text-teal-600" strokeWidth={2} />
        ) : (
          <Heart className="w-3.5 h-3.5 text-pink-600" fill="#db2777" strokeWidth={1.5} />
        )}
      </motion.div>

      {/* Text - vertical */}
      <span
        className="relative text-[9px] font-black uppercase tracking-widest"
        style={{
          color: isOnCooldown ? "#9ca3af" : "#ffffff",
          writingMode: "vertical-rl",
          textOrientation: "mixed",
        }}
      >
        {isOnCooldown ? "Rest" : "Sesi"}
      </span>
    </motion.button>
    </div>
  );
}
