"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export function Hero() {
  return (
    <section className="min-h-screen flex flex-col items-center justify-center px-6 pt-24 pb-10">
      {/* Main glass hero card - no overflow so image can bleed to top/bottom */}
      <div className="glass-panel rounded-3xl max-w-5xl w-full flex flex-col md:flex-row items-stretch overflow-hidden relative mx-auto" style={{ minHeight: 360 }}>
        {/* Left — rotated brand text */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
          className="flex-shrink-0 flex flex-col justify-center items-center p-6 md:p-8 md:w-[130px]"
        >
          <div className="md:-rotate-90 whitespace-nowrap text-center">
            <h1 className="font-display text-5xl md:text-6xl text-black leading-none tracking-tight">
              GLOW
            </h1>
            <p className="font-display text-sm text-black mt-1 italic tracking-widest">
              with sun
            </p>
          </div>
        </motion.div>

        {/* Center — hero image filling full card height */}
        <div className="flex-1 flex justify-center items-end overflow-hidden">
          <img
            src="/images/hero-card.svg"
            alt="Hero Graphic"
            className="h-full w-auto object-cover object-top max-h-[500px]"
          />
        </div>

        {/* Right — tagline */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
          className="flex-shrink-0 flex flex-col justify-center p-6 md:p-10 text-center md:text-right"
        >
          <p className="font-display text-2xl md:text-3xl text-black italic leading-relaxed">
            with sun<br />water<br />ice
          </p>
        </motion.div>
      </div>


    </section>
  );
}
