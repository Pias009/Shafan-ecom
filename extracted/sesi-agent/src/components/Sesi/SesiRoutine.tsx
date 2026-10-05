"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSesi } from "./useSesi";
import {
  Sparkles,
  Clock,
  Droplet,
  Moon,
  CheckCircle2,
  Shield,
} from "lucide-react";

interface RoutineStep {
  id: string;
  time: "Morning" | "Night";
  title: string;
  description: string;
  icon: React.ReactNode;
  products: string[];
  tip?: string;
}

const DEFAULT_ROUTINE: RoutineStep[] = [
  {
    id: "1",
    time: "Morning",
    title: "Gentle Cleanse",
    description: "Start fresh with a cleanser that loves your skin",
    icon: <Droplet className="w-5 h-5" />,
    products: ["Gentle Foaming Cleanser", "Hydrating Toner"],
  },
  {
    id: "2",
    time: "Morning",
    title: "Protect & Glow",
    description: "Serum + SPF for all-day skin happiness",
    icon: <Shield className="w-5 h-5" />,
    products: ["Vitamin C Serum", "SPF 50 Daily"],
    tip: "Apply SPF as the last step every morning!",
  },
  {
    id: "3",
    time: "Night",
    title: "Repair While You Sleep",
    description: "Let your skin heal and glow overnight",
    icon: <Moon className="w-5 h-5" />,
    products: ["Night Repair Serum", "Hydrating Night Cream"],
  },
];

export default function SesiRoutine() {
  const { markRoutineComplete } = useSesi();
  const [currentStep, setCurrentStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const steps = DEFAULT_ROUTINE;

  const handleComplete = () => {
    setIsComplete(true);
    markRoutineComplete();
  };

  return (
    <div className="flex flex-col h-full relative overflow-hidden">
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
        <motion.div
          className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-amber-100/30 via-transparent to-transparent"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
      </motion.div>

      <motion.div
        className="relative z-10 p-5 text-center border-b border-amber-100/30"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        <motion.div
          className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100/80 backdrop-blur-md rounded-full mb-3"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span className="text-[10px] font-bold text-amber-700 uppercase tracking-widest">
            Your Personal Routine
          </span>
        </motion.div>
        <h3 className="text-base font-bold text-gray-900 mb-1">
          Daily Glow Plan
        </h3>
        <p className="text-[10px] text-gray-500">
          {steps.length} steps to your best skin ever ✨
        </p>
      </motion.div>

      <div className="relative z-10 flex-1 overflow-y-auto px-4 py-4 pb-4 custom-scrollbar">
        <AnimatePresence mode="wait">
          {isComplete ? (
            <motion.div
              key="complete"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center h-full text-center space-y-5 py-8"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 15 }}
                className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-200/50"
              >
                <CheckCircle2 className="w-10 h-10 text-white" />
              </motion.div>
              <div>
                <h4 className="text-base font-bold text-gray-900 mb-1">
                  {"Routine Saved! 🎉"}
                </h4>
                <p className="text-xs text-gray-500 max-w-[220px] mx-auto">
                  Follow this daily for best results. Your skin will thank you!
                </p>
              </div>
              <motion.div
                className="flex gap-1.5"
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <Sparkles className="w-5 h-5 text-amber-400" />
                <Sparkles className="w-4 h-4 text-pink-400" />
                <Sparkles className="w-5 h-5 text-amber-400" />
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key={`step-${currentStep}`}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">
                  Step {currentStep + 1} / {steps.length}
                </span>
                <div className="flex gap-1">
                  {steps.map((_, i) => (
                    <motion.div
                      key={i}
                      className={`h-1.5 rounded-full transition-all ${
                        i <= currentStep ? "bg-amber-400" : "bg-gray-200"
                      }`}
                      animate={
                        i === currentStep
                          ? { width: [8, 20, 8] }
                          : { width: i < currentStep ? 20 : 8 }
                      }
                      transition={{
                        duration: 1,
                        repeat: i === currentStep ? Infinity : 0,
                      }}
                    />
                  ))}
                </div>
              </div>

              <motion.div
                className="bg-white/70 backdrop-blur-md rounded-3xl p-5 shadow-sm border border-amber-100/50"
                whileHover={{ scale: 1.01 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl flex items-center justify-center flex-shrink-0 text-amber-600">
                    {steps[currentStep].icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="w-3 h-3 text-amber-500" />
                      <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">
                        {steps[currentStep].time}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-gray-900 mb-1">
                      {steps[currentStep].title}
                    </h4>
                    <p className="text-xs text-gray-500 mb-3">
                      {steps[currentStep].description}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {steps[currentStep].products.map((product, i) => (
                        <span
                          key={i}
                          className="px-3 py-1.5 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-full border border-amber-200/50"
                        >
                          {product}
                        </span>
                      ))}
                    </div>
                    {steps[currentStep].tip && (
                      <div className="px-3 py-2 bg-blue-50/80 rounded-xl border border-blue-100/50">
                        <p className="text-[10px] text-blue-700 font-medium">
                          {"💡"} Tip: {steps[currentStep].tip}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>

              <div className="flex gap-3 pt-2">
                {currentStep > 0 && (
                  <button
                    onClick={() => setCurrentStep(currentStep - 1)}
                    className="flex-1 py-3 bg-white/50 backdrop-blur-md text-gray-600 rounded-2xl text-xs font-bold border border-gray-200/50 active:scale-95 transition-transform"
                  >
                    Back
                  </button>
                )}
                <button
                  onClick={() => {
                    if (currentStep < steps.length - 1) {
                      setCurrentStep(currentStep + 1);
                    } else {
                      handleComplete();
                    }
                  }}
                  className="flex-1 py-3 bg-gradient-to-r from-amber-400 to-orange-400 text-white rounded-2xl text-xs font-bold shadow-lg shadow-amber-200/50 active:scale-95 transition-transform"
                >
                  {currentStep < steps.length - 1
                    ? "Next Step"
                    : "Complete Routine"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
