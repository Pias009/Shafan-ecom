"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSesi } from "./useSesi";
import { Sparkles } from "lucide-react";

const emojis = [
  { icon: "😊", label: "Happy" },
  { icon: "😐", label: "Okay" },
  { icon: "😞", label: "Sad" },
];

export default function SesiVote() {
  const { isOpen, setOpen, advanceState } = useSesi();
  const [timeElapsed, setTimeElapsed] = useState(false);
  const [voted, setVoted] = useState<string | null>(null);
  const [happyCount, setHappyCount] = useState(0);

  useEffect(() => {
    fetch("/api/sesi/vote")
      .then((r) => r.json())
      .then((d) => { if (d.happyCount) setHappyCount(d.happyCount); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => setTimeElapsed(true), 5000);
    return () => clearTimeout(timer);
  }, [isOpen]);

  const showVote = isOpen && timeElapsed;

  const handleVote = async (label: string) => {
    setVoted(label);
    try {
      const res = await fetch("/api/sesi/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: label }),
      });
      const data = await res.json();
      if (data.happyCount) setHappyCount(data.happyCount);
    } catch {}
  };

  const handleExplore = () => {
    setOpen(true);
    advanceState("SKIN_ANALYSIS");
  };

  if (!showVote) return null;

  return (
    <AnimatePresence>
      {!voted ? (
        <motion.div
          key="vote"
          initial={{ opacity: 0, y: 30, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          className="flex flex-col items-center gap-3 px-6 py-4 rounded-2xl bg-white backdrop-blur-xl shadow-xl border border-gray-200"
        >
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-gray-800 whitespace-nowrap">
              Was Sesi helpful?
            </span>
            <div className="flex items-center gap-1.5">
              {emojis.map((e) => (
                <motion.button
                  key={e.label}
                  onClick={() => handleVote(e.label)}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-xl hover:bg-gray-100 transition-colors"
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  title={e.label}
                >
                  {e.icon}
                </motion.button>
              ))}
            </div>
          </div>

          <span className="text-[10px] text-gray-400 font-medium -mt-1">
            ✨ {happyCount} people found Sesi helpful
          </span>

          <motion.button
            onClick={handleExplore}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[10px] font-black uppercase tracking-widest shadow-md"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Explore Sesi AI Analyzer & Your Skin Pattern
          </motion.button>
        </motion.div>
      ) : (
        <motion.div
          key="thanks"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="px-6 py-3 rounded-2xl bg-white backdrop-blur-xl shadow-xl border border-gray-200"
        >
          <motion.span
            className="text-sm font-bold text-gray-700"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          >
            Thank you! ✨
          </motion.span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
