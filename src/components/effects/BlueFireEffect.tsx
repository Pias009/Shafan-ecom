"use client";

import { motion } from "framer-motion";

export function BlueFireEffect() {
  return (
    <div className="absolute inset-x-0 bottom-0 -top-10 pointer-events-none z-0 overflow-hidden">
      {/* Subtle Base Glow */}
      <motion.div 
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-16 bg-sky-400/20 blur-[30px] rounded-full"
        animate={{ opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 4, repeat: Infinity }}
      />

      {/* Burning Flames (Lower Count & Scale) */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={`flame-${i}`}
          className="absolute bottom-[-5px] rounded-full"
          style={{
            left: `${10 + (i * 10)}%`,
            width: '15%',
            aspectRatio: '1/3',
            background: `radial-gradient(circle at bottom, ${i % 2 === 0 ? '#0EA5E9' : '#38BDF8'} 0%, transparent 85%)`,
            filter: 'blur(5px)',
          }}
          initial={{ y: 0, opacity: 0, scale: 0.5 }}
          animate={{
            y: [0, -60], // Much less vertical movement
            opacity: [0, 0.7, 0],
            scale: [0.5, 1.1, 0.3],
            x: [0, (Math.sin(i) * 10), 0],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: i * 0.3,
            ease: "easeOut"
          }}
        />
      ))}

      {/* Subtle Sparks */}
      {[...Array(4)].map((_, i) => (
        <motion.div
          key={`spark-${i}`}
          className="absolute bottom-[2%] w-1 h-1 bg-white rounded-full shadow-[0_0_8px_#38BDF8]"
          style={{ left: `${20 + Math.random() * 60}%` }}
          initial={{ y: 0, opacity: 0 }}
          animate={{
            y: -80,
            x: (Math.random() - 0.5) * 40,
            opacity: [0, 1, 0],
            scale: [1, 0.5],
          }}
          transition={{
            duration: 2 + Math.random() * 1.5,
            repeat: Infinity,
            delay: Math.random() * 4,
          }}
        />
      ))}
    </div>
  );
}
