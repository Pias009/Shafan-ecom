"use client";

import { motion } from "framer-motion";
import { CheckCircle2, AlertCircle, Loader2, Info, X } from "lucide-react";
import React from "react";
import toast from "react-hot-toast";

interface NotificationProps {
  onClose?: () => void;
  autoClose?: number;
}

/**
 * Success Notification with animated checkmark
 */
export function SuccessNotification({
  message,
  onClose = () => {},
  autoClose = 4000,
}: NotificationProps & { message: string }) {
  React.useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(() => onClose(), autoClose);
      return () => clearTimeout(timer);
    }
  }, [autoClose, onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      className="bg-gradient-to-r from-green-950/40 to-emerald-950/40 backdrop-blur-xl rounded-2xl px-6 py-4 flex items-center gap-4 shadow-2xl border border-green-500/30 max-w-md"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
      >
        <CheckCircle2 className="w-6 h-6 text-green-400" />
      </motion.div>
      <p className="text-sm font-medium text-green-100 flex-1">{message}</p>
      <button
        onClick={onClose}
        className="text-white/40 hover:text-white/80 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

/**
 * Error Notification with animated alert
 */
export function ErrorNotification({
  message,
  onClose = () => {},
  autoClose = 5000,
}: NotificationProps & { message: string }) {
  React.useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(() => onClose(), autoClose);
      return () => clearTimeout(timer);
    }
  }, [autoClose, onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      className="bg-gradient-to-r from-red-950/40 to-rose-950/40 backdrop-blur-xl rounded-2xl px-6 py-4 flex items-center gap-4 shadow-2xl border border-red-500/30 max-w-md"
    >
      <motion.div
        animate={{ rotate: [0, -2, 2, 0] }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <AlertCircle className="w-6 h-6 text-red-400" />
      </motion.div>
      <p className="text-sm font-medium text-red-100 flex-1">{message}</p>
      <button
        onClick={onClose}
        className="text-white/40 hover:text-white/80 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

/**
 * Loading Notification with animated spinner
 */
export function LoadingNotification({
  message = "Loading...",
  onClose,
}: NotificationProps & { message?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      className="bg-gradient-to-r from-blue-950/40 to-cyan-950/40 backdrop-blur-xl rounded-2xl px-6 py-4 flex items-center gap-4 shadow-2xl border border-blue-500/30 max-w-md"
    >
      <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
      <p className="text-sm font-medium text-blue-100 flex-1">{message}</p>
      <button
        onClick={onClose}
        className="text-white/40 hover:text-white/80 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

/**
 * Info Notification
 */
export function InfoNotification({
  message,
  onClose = () => {},
  autoClose = 4000,
}: NotificationProps & { message: string }) {
  React.useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(() => onClose(), autoClose);
      return () => clearTimeout(timer);
    }
  }, [autoClose, onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      className="bg-gradient-to-r from-blue-950/40 to-blue-900/40 backdrop-blur-xl rounded-2xl px-6 py-4 flex items-center gap-4 shadow-2xl border border-blue-500/30 max-w-md"
    >
      <motion.div
        animate={{ y: [-2, 2, -2] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <Info className="w-6 h-6 text-blue-400" />
      </motion.div>
      <p className="text-sm font-medium text-blue-100 flex-1">{message}</p>
      <button
        onClick={onClose}
        className="text-white/40 hover:text-white/80 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

/**
 * Custom Toast Manager for showing notifications
 */
export const showNotification = {
  success: (message: string) => {
    return toast.custom((t) => (
      <SuccessNotification
        message={message}
        onClose={() => toast.dismiss(t.id)}
      />
    ));
  },

  error: (message: string) => {
    return toast.custom((t) => (
      <ErrorNotification
        message={message}
        onClose={() => toast.dismiss(t.id)}
      />
    ));
  },

  loading: (message: string = "Loading...") => {
    return toast.custom((t) => (
      <LoadingNotification
        message={message}
        onClose={() => toast.dismiss(t.id)}
      />
    ));
  },

  info: (message: string) => {
    return toast.custom((t) => (
      <InfoNotification
        message={message}
        onClose={() => toast.dismiss(t.id)}
      />
    ));
  },
};
