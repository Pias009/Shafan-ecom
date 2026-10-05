"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

// Non-WebGL stand-in for the 3D scene — used on mobile, when
// prefers-reduced-motion is set, and as the error-boundary fallback if the
// Canvas fails (unsupported/lost WebGL context on low-end devices). Echoes
// SesiIcon.tsx's existing glow/gradient language for visual consistency.
export default function SesiOnboardingSceneFallback({ reduced = false }: { reduced?: boolean }) {
  return (
    <div className="relative flex items-center justify-center w-full h-full">
      <motion.div
        className="absolute w-40 h-40 rounded-full pointer-events-none"
        animate={
          reduced
            ? { opacity: 0.5 }
            : { opacity: [0.3, 0.7, 0.3], scale: [1, 1.08, 1] }
        }
        transition={{ duration: 3, repeat: reduced ? 0 : Infinity, ease: "easeInOut" }}
        style={{
          background:
            "radial-gradient(circle at center, rgba(249,168,212,0.45), transparent 70%)",
        }}
      />
      <motion.div
        className="relative flex items-center justify-center w-24 h-24 rounded-full shadow-2xl"
        animate={reduced ? {} : { y: [0, -8, 0] }}
        transition={{ duration: 3, repeat: reduced ? 0 : Infinity, ease: "easeInOut" }}
        style={{
          background: "linear-gradient(135deg, #db2777, #ec4899)",
          border: "1px solid rgba(255,255,255,0.3)",
        }}
      >
        <Sparkles className="w-9 h-9 text-white" strokeWidth={1.5} />
      </motion.div>
    </div>
  );
}
