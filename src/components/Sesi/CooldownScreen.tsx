"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Clock, ShoppingBag, Sparkles } from "lucide-react";
import { useSesi } from "./useSesi";
import ProductRecommendationCard from "./ProductRecommendationCard";

function formatTime(ms: number): { hours: number; minutes: number; seconds: number } {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { hours, minutes, seconds };
}

export default function CooldownScreen() {
  const { cooldownExpiry, suggestedProducts } = useSesi();
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!cooldownExpiry) return;

    const update = () => {
      const remaining = cooldownExpiry - Date.now();
      if (remaining <= 0) {
        setTimeLeft(0);
        return;
      }
      setTimeLeft(remaining);
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [cooldownExpiry]);

  if (timeLeft === null) return null;

  const { hours, minutes, seconds } = formatTime(Math.max(0, timeLeft));
  const isExpired = timeLeft <= 0;

  return (
    <div className="flex flex-col h-full relative overflow-hidden">
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gray-400 to-transparent" />
      </motion.div>

      <div className="relative z-10 flex-1 overflow-y-auto px-4 py-4 pb-4 custom-scrollbar">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center h-full text-center space-y-6 py-8"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
            className="w-20 h-20 bg-gradient-to-br from-gray-300 to-gray-400 rounded-full flex items-center justify-center shadow-lg"
          >
            <Clock className="w-10 h-10 text-white" />
          </motion.div>

          <div>
            <h4 className="text-base font-bold text-gray-900 mb-1">
              {isExpired ? "Dr. Sesi is Back! ✨" : "Dr. Sesi is Resting... 💤"}
            </h4>
            <p className="text-xs text-gray-500 max-w-[260px] mx-auto">
              {isExpired
                ? "Refresh to start your new skin session!"
                : "Dr. Sesi will look after you after 24 hours. Take care of your skin! 💖"}
            </p>
          </div>

          {!isExpired && (
            <motion.div
              className="flex items-center gap-3 px-6 py-4 bg-gray-100/80 backdrop-blur-md rounded-3xl border border-gray-200/50"
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <div className="text-center">
                <span className="text-2xl font-black text-gray-700">{hours}</span>
                <span className="text-[10px] font-bold text-gray-500 uppercase block">Hours</span>
              </div>
              <span className="text-xl font-bold text-gray-400">:</span>
              <div className="text-center">
                <span className="text-2xl font-black text-gray-700">{minutes}</span>
                <span className="text-[10px] font-bold text-gray-500 uppercase block">Min</span>
              </div>
              <span className="text-xl font-bold text-gray-400">:</span>
              <div className="text-center">
                <span className="text-2xl font-black text-gray-700">{seconds}</span>
                <span className="text-[10px] font-bold text-gray-500 uppercase block">Sec</span>
              </div>
            </motion.div>
          )}

          {suggestedProducts.length > 0 && (
            <div className="w-full space-y-3">
              <div className="flex items-center gap-2 px-3 py-2 bg-pink-50/80 rounded-xl border border-pink-200/50">
                <ShoppingBag className="w-4 h-4 text-pink-500" />
                <span className="text-[10px] font-bold text-pink-700 uppercase tracking-wider">
                  Before you go, check these picks!
                </span>
              </div>
              {suggestedProducts.slice(0, 2).map((product) => (
                <ProductRecommendationCard key={product.id} product={product} />
              ))}
            </div>
          )}

          <motion.div
            className="flex gap-1.5"
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <Sparkles className="w-5 h-5 text-gray-400" />
            <Sparkles className="w-4 h-4 text-gray-300" />
            <Sparkles className="w-5 h-5 text-gray-400" />
          </motion.div>

          <p className="text-[10px] text-gray-400">
            {isExpired
              ? "Tap refresh or reopen Sesi to start again ✨"
              : "Bye! Take care of your skin! 💖"}
          </p>
        </motion.div>
      </div>
    </div>
  );
}
