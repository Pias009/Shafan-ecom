"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { useSesi } from "@/components/Sesi/useSesi";
import { trackSesiOnboardingChoice } from "@/lib/datalayer";
import { SceneErrorBoundary } from "./SceneErrorBoundary";
import SesiOnboardingSceneFallback from "./SesiOnboardingSceneFallback";

const SesiOnboardingScene = dynamic(() => import("./SesiOnboardingScene"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full animate-pulse rounded-full bg-pink-200/30" />
  ),
});

export type DismissReason = "talk" | "explore" | "close";

export function SesiOnboardingOverlay({
  onDismiss,
}: {
  onDismiss: (reason: DismissReason) => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const setOpen = useSesi((s) => s.setOpen);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    setMounted(true);
    const mq = window.matchMedia("(max-width: 767px)");
    setIsMobile(mq.matches);
  }, []);

  useEffect(() => {
    dialogRef.current?.focus();

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onDismiss("close");
        return;
      }
      if (e.key !== "Tab") return;
      const container = dialogRef.current;
      if (!container) return;
      const focusable = container.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onDismiss]);

  function handleTalk() {
    setOpen(true);
    trackSesiOnboardingChoice("talk");
    onDismiss("talk");
  }

  function handleExplore() {
    trackSesiOnboardingChoice("explore");
    onDismiss("explore");
    router.push("/doctor-sasi");
  }

  function handleClose() {
    trackSesiOnboardingChoice("close");
    onDismiss("close");
  }

  if (!mounted) return null;

  const showScene = !isMobile && !prefersReducedMotion;

  return createPortal(
    <AnimatePresence>
      <motion.div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="Welcome"
        className="fixed inset-0 z-[10000] grid place-items-center p-4 overflow-y-auto outline-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: prefersReducedMotion ? 0.15 : 0.3 }}
      >
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md" />

        <motion.div
          initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 24, scale: prefersReducedMotion ? 1 : 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: prefersReducedMotion ? 0 : 24, scale: prefersReducedMotion ? 1 : 0.96 }}
          transition={{ duration: prefersReducedMotion ? 0.15 : 0.4, ease: "easeOut" }}
          className="relative w-full max-w-md rounded-[2rem] border border-black/5 bg-white shadow-2xl overflow-hidden"
        >
          <button
            type="button"
            aria-label="Close"
            onClick={handleClose}
            className="absolute top-4 right-4 z-10 flex items-center justify-center w-9 h-9 rounded-full bg-black/5 hover:bg-black/10 transition-colors"
          >
            <X className="w-4 h-4 text-black/60" />
          </button>

          <div className="w-full h-56 flex items-center justify-center bg-gradient-to-b from-pink-50 to-white">
            {showScene ? (
              <div className="w-48 h-48">
                <SceneErrorBoundary fallback={<SesiOnboardingSceneFallback />}>
                  <SesiOnboardingScene />
                </SceneErrorBoundary>
              </div>
            ) : (
              <div className="w-48 h-48">
                <SesiOnboardingSceneFallback reduced={!!prefersReducedMotion} />
              </div>
            )}
          </div>

          <div className="px-6 pb-8 pt-2 text-center">
            <p className="text-lg font-bold text-black leading-snug">
              Hi, I&apos;m your skin and health care assistant from Shanfa Global.
            </p>
            <p className="text-sm text-black/60 font-medium mt-2">
              Would you like to make a journey with me?
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <button
                type="button"
                onClick={handleTalk}
                className="flex-1 rounded-full px-6 py-3.5 text-xs font-bold uppercase tracking-widest text-white shadow-lg transition hover:scale-[1.02] active:scale-95"
                style={{ background: "linear-gradient(135deg, #db2777, #ec4899)" }}
              >
                Talk to Sesi
              </button>
              <button
                type="button"
                onClick={handleExplore}
                className="flex-1 rounded-full px-6 py-3.5 text-xs font-bold uppercase tracking-widest text-black border border-black/10 bg-white hover:bg-black/5 transition"
              >
                Explore Sesi
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
