"use client";

import { Toaster, Toast as ReactHotToast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertCircle, Info, Loader2, X } from "lucide-react";
import React from "react";
import toast from "react-hot-toast";

const toastVariants = {
  initial: { opacity: 0, y: 50, scale: 0.9 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.3, ease: "easeOut" as const },
  },
  exit: {
    opacity: 0,
    y: 50,
    scale: 0.9,
    transition: { duration: 0.2, ease: "easeIn" as const },
  },
  hover: {
    scale: 1.05,
    y: -5,
    transition: { duration: 0.2 },
  },
};

interface CustomToastProps {
  toast: ReactHotToast;
  message: string;
  onClose?: () => void;
}

export function CustomToast({ toast: toastObj, message, onClose }: CustomToastProps) {
  const getIcon = () => {
    if (toastObj.type === "success") {
      return <CheckCircle2 className="w-5 h-5 text-green-400" />;
    }
    if (toastObj.type === "error") {
      return <AlertCircle className="w-5 h-5 text-red-400" />;
    }
    if (toastObj.type === "loading") {
      return <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />;
    }
    return <Info className="w-5 h-5 text-blue-400" />;
  };

  const getBackgroundGradient = () => {
    switch (toastObj.type) {
      case "success":
        return "from-green-950/40 to-emerald-950/40 border-green-500/30";
      case "error":
        return "from-red-950/40 to-rose-950/40 border-red-500/30";
      case "loading":
        return "from-blue-950/40 to-cyan-950/40 border-blue-500/30";
      default:
        return "from-blue-950/40 to-blue-900/40 border-blue-500/30";
    }
  };

  const getTextColor = () => {
    switch (toastObj.type) {
      case "success":
        return "text-green-100";
      case "error":
        return "text-red-100";
      case "loading":
        return "text-blue-100";
      default:
        return "text-blue-100";
    }
  };

  return (
    <motion.div
      key={toastObj.id}
      variants={toastVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      whileHover="hover"
      className={`bg-gradient-to-r ${getBackgroundGradient()} backdrop-blur-xl rounded-2xl px-6 py-4 flex items-center gap-4 shadow-2xl border max-w-md pointer-events-auto group`}
    >
      {/* Icon Container */}
      <div className="flex-shrink-0 flex items-center justify-center w-6 h-6">
        {getIcon()}
      </div>

      {/* Message */}
      <p className={`text-sm font-medium ${getTextColor()} flex-1 leading-relaxed`}>
        {message}
      </p>

      {/* Close Button */}
      <button
        onClick={() => {
          toast.dismiss(toastObj.id);
          onClose?.();
        }}
        className="flex-shrink-0 text-white/40 hover:text-white/80 transition-colors duration-200 opacity-0 group-hover:opacity-100"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

interface CustomToasterProps {
  position?: "top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right";
}

export function CustomToaster({ position = "bottom-center" }: CustomToasterProps) {
  return (
    <Toaster
      position={position}
      containerStyle={{
        top: position.includes("top") ? 20 : "auto",
        bottom: position.includes("bottom") ? 20 : "auto",
        left: position.includes("left") ? 20 : "auto",
        right: position.includes("right") ? 20 : "auto",
      }}
      toastOptions={{
        custom: {
          duration: 4000,
          style: {
            padding: 0,
            background: "transparent",
          },
        },
        success: {
          duration: 4000,
          style: {
            padding: 0,
            background: "transparent",
          },
        },
        error: {
          duration: 5000,
          style: {
            padding: 0,
            background: "transparent",
          },
        },
        loading: {
          duration: Infinity,
          style: {
            padding: 0,
            background: "transparent",
          },
        },
      }}
    >
      {(t) => (
        <AnimatePresence mode="popLayout">
          {t.visible && (
            <CustomToast
              toast={t}
              message={typeof t.message === "string" ? t.message : ""}
              onClose={() => {}}
            />
          )}
        </AnimatePresence>
      )}
    </Toaster>
  );
}
