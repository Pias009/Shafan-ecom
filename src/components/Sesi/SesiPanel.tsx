"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useSesi } from "./useSesi";
import {
  X, Sparkles, Stethoscope, ClipboardList, Minus,
  Maximize2
} from "lucide-react";
import SesiChat from "./SesiChat";
import SesiRoutine from "./SesiRoutine";

function ResizeHandle({ onResize }: { onResize: (delta: { x: number; y: number }) => void }) {
  const dragging = useRef(false);
  const start = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      const dx = e.clientX - start.current.x;
      const dy = e.clientY - start.current.y;
      start.current = { x: e.clientX, y: e.clientY };
      onResize({ x: dx, y: dy });
    };
    const handleMouseUp = () => { dragging.current = false; };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [onResize]);

  return (
    <div
      className="absolute bottom-0 right-0 w-8 h-8 cursor-se-resize z-20 flex items-end justify-end pr-1 pb-1"
      onMouseDown={(e) => {
        dragging.current = true;
        start.current = { x: e.clientX, y: e.clientY };
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <div className="w-4 h-4 rounded-bl-lg border-b-2 border-r-2 border-white/30" />
    </div>
  );
}

const MIN_W = 280;
const MAX_W = 700;
const MIN_H = 400;
const MAX_H = 900;

function useViewportClamp(val: number, maxVal: number, offset: number) {
  const [clamped, setClamped] = useState(val);
  useEffect(() => {
    setClamped(Math.min(val, maxVal - offset));
  }, [val, maxVal, offset]);
  return clamped;
}

export default function SesiPanel() {
  const {
    isOpen, state, persona, setOpen, reset, suggestedProducts,
    isMinimized, toggleMinimize, panelSize, setPanelSize,
    panelPosition, setPanelPosition,
  } = useSesi();

  const panelRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [localPos, setLocalPos] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (panelPosition && !localPos) setLocalPos(panelPosition);
  }, [panelPosition, localPos]);

  const [vw, setVw] = useState(0);
  const [vh, setVh] = useState(0);

  useEffect(() => {
    const update = () => { setVw(window.innerWidth); setVh(window.innerHeight); };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const clampedW = Math.min(isMinimized ? 280 : panelSize.width, vw - 32);
  const clampedH = isMinimized ? 60 : Math.min(panelSize.height, vh - 128);

  const handleResize = useCallback((delta: { x: number; y: number }) => {
    const newWidth = Math.max(MIN_W, Math.min(MAX_W, panelSize.width + delta.x));
    const newHeight = Math.max(MIN_H, Math.min(MAX_H, panelSize.height + delta.y));
    setPanelSize({ width: newWidth, height: newHeight });
  }, [panelSize, setPanelSize]);

  const pos = (isDragging ? localPos : (localPos ?? panelPosition));

  const handleHeaderDragStart = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button")) return;
    setIsDragging(true);
    const currentX = pos?.x ?? vw - clampedW - 24;
    const currentY = pos?.y ?? vh - clampedH - 96;
    setDragStart({ x: e.clientX - currentX, y: e.clientY - currentY });
  };

  useEffect(() => {
    if (!isDragging) return;
    const handleMouseMove = (e: MouseEvent) => {
      const newX = Math.max(0, Math.min(vw - clampedW - 8, e.clientX - dragStart.x));
      const newY = Math.max(0, Math.min(vh - clampedH - 8, e.clientY - dragStart.y));
      setLocalPos({ x: newX, y: newY });
    };
    const handleMouseUp = () => {
      setIsDragging(false);
      if (localPos) setPanelPosition(localPos);
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dragStart, localPos, setPanelPosition, vw, vh, clampedW, clampedH]);

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

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={panelRef}
          initial={{ opacity: 0, scale: 0.85, filter: "blur(20px)" }}
          animate={{
            opacity: 1,
            scale: 1,
            filter: "blur(0px)",
          }}
          exit={{ opacity: 0, scale: 0.85, filter: "blur(20px)" }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          style={{
            position: "fixed",
            zIndex: 9997,
            overflow: "hidden",
            cursor: isDragging ? "grabbing" : undefined,
            transformOrigin: "bottom right",
            ...(pos
              ? { left: pos.x, top: pos.y, width: clampedW, height: clampedH }
              : { bottom: 96, right: 24, width: clampedW, height: clampedH }
            ),
          }}
          className={`rounded-[2.5rem] shadow-2xl ${themeClasses[colorTheme]}`}
        >
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-white/30 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-white/20 rounded-full blur-3xl" />
          </div>

          <div className="relative z-10 flex flex-col h-full">
            <div
              className="px-5 py-4 flex items-center justify-between border-b border-white/30 cursor-grab active:cursor-grabbing select-none"
              onMouseDown={handleHeaderDragStart}
            >
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
                  <h2 className="text-sm font-bold text-gray-900 tracking-wide">
                    {persona === "doctor" ? "Dr. Sesi" : "Sesi"}
                  </h2>
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
                  onClick={(e) => { e.stopPropagation(); toggleMinimize(); }}
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
                    onClick={(e) => { e.stopPropagation(); reset(); }}
                    className="w-8 h-8 rounded-full bg-white/50 hover:bg-white/80 flex items-center justify-center transition-colors"
                    title="Start over"
                  >
                    <X className="w-3.5 h-3.5 text-gray-500" />
                  </button>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); setOpen(false); }}
                  className="w-8 h-8 rounded-full bg-white/50 hover:bg-white/80 flex items-center justify-center transition-colors"
                  title="Close"
                >
                  <X className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>

            {suggestedProducts.length > 0 && !isMinimized && (
              <div className="px-5 py-2 flex items-center gap-2 border-b border-white/20">
                <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                <span className="text-[10px] font-bold text-teal-600 uppercase tracking-wider">
                  {suggestedProducts.length} prescription{suggestedProducts.length > 1 ? "s" : ""}
                </span>
              </div>
            )}

            {!isMinimized && (
              <div className="flex-1 overflow-hidden">
                {state !== "ROUTINE_UPSELL" && <SesiChat />}
                {state === "ROUTINE_UPSELL" && <SesiRoutine />}
              </div>
            )}

            {!isMinimized && <ResizeHandle onResize={handleResize} />}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
