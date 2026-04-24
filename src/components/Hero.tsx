"use client";

import { motion, useMotionValue, useSpring, AnimatePresence, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Sparkles, Brain, MessageCircleQuestion, ArrowRight, ShoppingBag, Zap, ShieldCheck, Globe } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";

const skinTypes = ["Oily", "Dry", "Combination", "Sensitive", "Normal"];

// Floating product component with drag ("grab") functionality
function FloatingProduct({ src, size, delay, x, y, rotate, label }: { src: string, size: number, delay: number, x: string, y: string, rotate: number, label: string }) {
  return (
    <motion.div
      drag
      dragConstraints={{ left: -50, right: 50, top: -50, bottom: 50 }}
      dragElastic={0.2}
      whileDrag={{ scale: 1.1, zIndex: 50, cursor: "grabbing" }}
      initial={{ opacity: 0, scale: 0.8, x: 0, y: 0 }}
      animate={{ 
        opacity: 1, 
        scale: 1,
        y: [0, -15, 0],
        rotate: [rotate, rotate + 5, rotate],
      }}
      transition={{ 
        opacity: { duration: 1, delay },
        scale: { duration: 1, delay },
        y: { duration: 4, repeat: Infinity, ease: "easeInOut", delay },
        rotate: { duration: 5, repeat: Infinity, ease: "easeInOut", delay }
      }}
      className="absolute cursor-grab group will-change-transform"
      style={{ left: x, top: y }}
    >
      <div className="relative">
        {/* Glow effect on hover */}
        <div className="absolute inset-0 bg-emerald-400/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        <div className="relative bg-white/40 backdrop-blur-md p-3 rounded-2xl border border-white/60 shadow-xl overflow-hidden group-hover:border-emerald-300/50 transition-colors">
          <div className="relative" style={{ width: size, height: size }}>
            <Image
              src={src}
              alt={label}
              fill
              className="object-contain drop-shadow-2xl"
              priority
            />
          </div>
          
          {/* Tag */}
          <div className="mt-2 text-center">
            <span className="text-[8px] font-black uppercase tracking-widest text-black/40 group-hover:text-emerald-600 transition-colors">{label}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function StatBadge({ icon: Icon, label, value, delay }: { icon: any, label: string, value: string, delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay }}
      className="flex items-center gap-3 glass-panel-heavy px-4 py-2 rounded-2xl border border-white/80 shadow-sm"
    >
      <div className="w-8 h-8 rounded-xl bg-black flex items-center justify-center text-white">
        <Icon size={14} />
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-wider text-black/30 leading-none mb-1">{label}</p>
        <p className="text-sm font-bold text-black leading-none">{value}</p>
      </div>
    </motion.div>
  );
}

export function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springX = useSpring(mouseX, { stiffness: 50, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 50, damping: 20 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const { left, top, width, height } = containerRef.current.getBoundingClientRect();
      const x = (e.clientX - left) / width - 0.5;
      const y = (e.clientY - top) / height - 0.5;
      mouseX.set(x * 40);
      mouseY.set(y * 40);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <section 
      ref={containerRef}
      className="relative min-h-[350px] sm:min-h-[600px] md:min-h-[700px] lg:min-h-[850px] flex flex-col items-center justify-center px-2 sm:px-6 md:px-8 py-6 lg:py-20 overflow-hidden"
    >
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div 
          style={{ x: springX, y: springY }}
          className="absolute top-1/4 -left-20 w-96 h-96 bg-[radial-gradient(circle,rgba(167,243,208,0.4)_0%,transparent_60%)] rounded-full will-change-transform" 
        />
        <motion.div 
          style={{ x: springY, y: springX }}
          className="absolute bottom-1/4 -right-20 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(233,213,255,0.4)_0%,transparent_60%)] rounded-full will-change-transform" 
        />
      </div>

      <div className="max-w-7xl w-full mx-auto flex flex-row items-center justify-between gap-2 sm:gap-8 z-10">
        
        {/* Left Content — Compact on Mobile */}
        <div className="flex-[1.2] lg:col-span-7 flex flex-col items-start text-left space-y-3 sm:space-y-8">
          
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="inline-flex items-center gap-2 glass-panel px-4 py-2 rounded-full border border-white/60 shadow-sm"
          >
            <div className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </div>
            <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.2em] text-black/60">
              New Generation Skincare
            </span>
          </motion.div>

          <div className="space-y-4 md:space-y-6">
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="font-display font-black text-2xl sm:text-6xl md:text-7xl lg:text-8xl text-black leading-[0.9] tracking-[-0.04em]"
            >
              YOUR SKIN, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-500 to-sky-600">REIMAGINED.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="max-w-xl text-[10px] sm:text-xl text-black/60 font-medium leading-relaxed"
            >
              Harness the power of AI-driven analysis. Science-backed formulas.
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-wrap gap-4 items-center"
          >
            <Link 
              href="/products"
              className="group relative inline-flex items-center gap-2 bg-black text-white px-4 py-2 sm:px-8 sm:py-4 rounded-xl sm:rounded-2xl font-black text-[8px] sm:text-sm uppercase tracking-widest overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-lg shadow-black/10"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <span className="relative z-10 flex items-center gap-2">
                Explore
                <ShoppingBag size={12} />
              </span>
            </Link>

            <button
              onClick={() => toast.success("AI Analysis Loading...")}
              className="hidden sm:inline-flex glass-panel-heavy items-center gap-3 px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest text-black border border-white/80 hover:bg-white/80 transition-all active:scale-95 shadow-sm"
            >
              Try AI Analysis
              <Zap size={18} className="text-emerald-600" />
            </button>
          </motion.div>

          {/* Trust Stats */}
          <div className="hidden sm:flex flex-wrap gap-4 pt-4 md:pt-8">
            <StatBadge icon={ShieldCheck} label="Dermatologist" value="Approved" delay={0.8} />
            <StatBadge icon={Globe} label="Global" value="Shipping" delay={0.9} />
            <StatBadge icon={Sparkles} label="Results" value="Guaranteed" delay={1.0} />
          </div>
        </div>

        {/* Right Content — Compact on Mobile */}
        <div className="flex-1 lg:col-span-5 relative h-[250px] sm:h-[600px] flex items-center justify-center">
          
          {/* Central Stage Glow */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                opacity: [0.3, 0.5, 0.3]
              }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
              className="w-80 h-80 md:w-[450px] md:h-[450px] rounded-full bg-[radial-gradient(circle,rgba(209,250,229,1)_0%,rgba(243,232,255,0.8)_40%,transparent_70%)] will-change-transform"
            />
          </div>

          {/* Main Hero Visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-40 h-40 sm:w-[400px] sm:h-[400px] z-20"
          >
            <div className="absolute inset-0 rounded-full border-[1.5px] border-white/40 shadow-inner" />
            <div className="absolute inset-4 rounded-full border-[0.5px] border-black/5" />
            
            <div className="relative w-full h-full rounded-full overflow-hidden border-8 border-white/60 shadow-2xl">
              <Image
                src="/images/hero-radiant.png"
                alt="Radiant Beauty"
                fill
                className="object-cover scale-110"
                priority
              />
            </div>

            {/* Orbiting Ring */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
              className="absolute -inset-8 border-[0.5px] border-dashed border-black/10 rounded-full pointer-events-none will-change-transform"
            />
          </motion.div>

          {/* Floating Grab-able Products */}
          <FloatingProduct 
            src="/images/serum.png" 
            size={60} 
            label="Serum"
            delay={0.5} 
            x="0%" 
            y="10%" 
            rotate={-15} 
          />
          
          <FloatingProduct 
            src="/images/cream.png" 
            size={50} 
            label="Cream"
            delay={0.8} 
            x="70%" 
            y="65%" 
            rotate={12} 
          />

          {/* Micro-Interaction Hint - Desktop Only */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2, duration: 1 }}
            className="hidden md:flex absolute -bottom-8 left-1/2 -translate-x-1/2 flex-col items-center gap-2"
          >
            <div className="w-1 h-8 rounded-full bg-black/10 relative overflow-hidden">
              <motion.div 
                animate={{ y: [0, 32] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-emerald-500 to-transparent"
              />
            </div>
            <span className="text-[8px] font-black uppercase tracking-[0.3em] text-black/30">Interact & Discover</span>
          </motion.div>
        </div>
      </div>

      {/* Decorative Orbs */}
      <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-emerald-50/30 to-transparent pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-1/3 h-1/2 bg-gradient-to-t from-purple-50/20 to-transparent pointer-events-none" />

      {/* Feature Section - The "AI & Expertise" Layer - Smaller on mobile */}
      <div className="max-w-7xl w-full mx-auto mt-10 md:mt-32 px-4">
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="grid grid-cols-3 gap-2 md:gap-6"
        >
          <FeatureCard 
            icon={Brain} 
            title="AI Skin Analysis" 
            desc="Upload a photo for a professional-grade skin analysis in seconds." 
            color="emerald" 
            delay={0.1}
          />
          <FeatureCard 
            icon={Sparkles} 
            title="Skin Type Quiz" 
            desc="Discover your unique profile and get personalized product matches." 
            color="purple" 
            delay={0.2}
          />
          <FeatureCard 
            icon={MessageCircleQuestion} 
            title="Ask Our Experts" 
            desc="Get 1-on-1 guidance from certified dermatologists and estheticians." 
            color="amber" 
            delay={0.3}
          />
        </motion.div>
      </div>

      {/* Bottom Marquee - Slim & Scroll-reactive on mobile */}
      <MarqueeSection />
    </section>
  );
}

function MarqueeSection() {
  const { scrollYProgress } = useScroll();
  const xMove = useTransform(scrollYProgress, [0, 1], [0, -500]);
  const xMoveReverse = useTransform(scrollYProgress, [0, 1], [-500, 0]);

  return (
    <div className="w-full mt-10 md:mt-32 py-2 md:py-10 border-y border-black/5 bg-white/30 backdrop-blur-sm overflow-hidden">
      {/* Mobile: Scroll-reactive - Single Slim Line */}
      <div className="md:hidden flex overflow-hidden">
        <motion.div style={{ x: xMove }} className="flex whitespace-nowrap gap-8 will-change-transform">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <span className="text-[12px] font-display font-black uppercase tracking-tighter text-black/10">SHANFA GLOBAL • PREMIUM CARE • AI DRIVEN</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/50" />
            </div>
          ))}
        </motion.div>
      </div>

      {/* Desktop: Auto-playing Marquee */}
      <div className="hidden md:flex whitespace-nowrap animate-marquee">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="flex items-center gap-10 mx-10">
            <span className="text-2xl md:text-4xl font-display font-black uppercase tracking-tighter text-black/10">SHANFA GLOBAL</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-2xl md:text-4xl font-display font-black uppercase tracking-tighter text-black/10">PREMIUM CARE</span>
            <span className="w-2 h-2 rounded-full bg-purple-500" />
            <span className="text-2xl md:text-4xl font-display font-black uppercase tracking-tighter text-black/10">AI DRIVEN</span>
            <span className="w-2 h-2 rounded-full bg-amber-500" />
          </div>
        ))}
      </div>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, desc, color, delay }: { icon: any, title: string, desc: string, color: "emerald" | "purple" | "amber", delay: number }) {
  const colorMap = {
    emerald: "from-emerald-500 to-teal-600 bg-emerald-50 text-emerald-600",
    purple: "from-purple-500 to-violet-600 bg-purple-50 text-purple-600",
    amber: "from-amber-500 to-orange-600 bg-amber-50 text-amber-600"
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -10 }}
      className="group relative p-3 md:p-8 rounded-[1rem] md:rounded-[2rem] glass-panel-heavy border border-white/80 shadow-sm hover:shadow-2xl hover:shadow-black/5 transition-all cursor-pointer overflow-hidden"
      onClick={() => toast.success("Feature Coming Soon!")}
    >
      {/* Decorative Gradient Blob */}
      <div className={`absolute -top-12 -right-12 w-32 h-32 bg-gradient-to-br ${colorMap[color].split(' ').slice(0, 2).join(' ')} opacity-0 group-hover:opacity-10 blur-2xl transition-opacity`} />
      
      <div className={`w-8 h-8 md:w-14 md:h-14 rounded-lg md:rounded-2xl flex items-center justify-center mb-2 md:mb-6 shadow-lg transition-transform group-hover:scale-110 group-hover:rotate-3 ${colorMap[color].split(' ').slice(0, 2).join(' ')} text-white`}>
        <Icon className="w-4 h-4 md:w-7 md:h-7" strokeWidth={2.5} />
      </div>
      
      <h3 className="text-[9px] md:text-xl font-display font-black text-black mb-1 md:mb-3 group-hover:text-emerald-600 transition-colors uppercase tracking-tight line-clamp-1">{title}</h3>
      <p className="hidden md:block text-black/50 font-medium leading-relaxed">{desc}</p>
      
      <div className="hidden md:flex mt-6 items-center gap-2 text-xs font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0">
        Launch Tool <ArrowRight size={14} />
      </div>
    </motion.div>
  );
}