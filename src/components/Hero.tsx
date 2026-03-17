"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Price } from "./Price";
import { ShoppingBag, ArrowRight } from "lucide-react";
import { useLanguageStore } from "@/lib/language-store";
import { translations } from "@/lib/translations";

export function Hero() {
  const [products, setProducts] = useState<any[]>([]);
  const { currentLanguage } = useLanguageStore();
  const t = translations[currentLanguage.code as keyof typeof translations];

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((data) => {
        // Take first 3 products
        setProducts(data.slice(0, 3));
      })
      .catch(console.error);
  }, []);

  return (
    <section className="min-h-screen flex flex-col items-center justify-center px-6 pt-32 pb-20">
      {/* Container with increased width */}
      <div className="max-w-[1400px] w-full mx-auto space-y-12">
        
        <div className="glass-panel rounded-[3rem] w-full flex flex-col md:flex-row items-stretch overflow-hidden relative shadow-2xl border border-black/5" style={{ minHeight: 480 }}>
          
          {/* Left — Brand Text (Larger and closer to center) */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1.2, delay: 0.2 }}
            className="flex-shrink-0 flex flex-col justify-center items-center p-12 md:w-[250px] z-10"
          >
            <div className="md:-rotate-90 whitespace-nowrap text-center">
              <h1 className="font-display text-7xl md:text-9xl font-black text-black leading-none tracking-tighter uppercase">
                {t.home.glow}
              </h1>
              <p className="font-display text-lg text-black/40 mt-2 italic tracking-[0.3em] uppercase">
                {t.home.pureEssence}
              </p>
            </div>
          </motion.div>

          {/* Center — Hero Graphic */}
          <div className="flex-1 flex justify-center items-end relative overflow-hidden bg-black/[0.01]">
            <motion.img
              initial={{ scale: 1.1, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1.5 }}
              src="/images/hero-card.svg"
              alt="Hero Graphic"
              className="h-full w-auto object-contain max-h-[600px] relative z-0"
            />
          </div>

          {/* Right — Tagline (Bigger and closer to center) */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1.2, delay: 0.4 }}
            className="flex-shrink-0 flex flex-col justify-center p-12 md:p-16 text-center md:text-right z-10"
          >
            <p className="font-display text-4xl md:text-6xl text-black font-bold italic leading-[1.1] tracking-tight uppercase">
              {t.home.water}<br />{t.home.sun}<br /><span className="text-black/20">{t.home.ice}</span>
            </p>
            <div className="mt-8 flex justify-center md:justify-end">
                <Link href="/products" className="glass-panel inline-flex items-center gap-3 px-8 py-4 rounded-full text-xs font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all shadow-lg active:scale-95">
                    {t.home.exploreAll} <ArrowRight size={14} />
                </Link>
            </div>
          </motion.div>
        </div>

        {/* Small Product Cards in Hero Section */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-8">
          {products.map((p, idx) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + idx * 0.15 }}
              className={`glass-panel-heavy p-2 md:p-4 rounded-3xl md:rounded-[2rem] flex items-center gap-3 md:gap-5 border border-black/5 hover:shadow-xl transition-all cursor-pointer group ${idx === 2 ? 'hidden md:flex' : 'flex'}`}
            >
              <div className="w-12 h-12 md:w-20 md:h-20 bg-black/5 rounded-xl md:rounded-2xl overflow-hidden shrink-0">
                <img src={p.mainImage || "/placeholder-product.png"} alt={p.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-[10px] md:text-sm font-bold text-black truncate">{p.name}</h4>
                <div className="flex items-center justify-between mt-0.5 md:mt-1">
                  <Price amount={p.priceCents / 100} className="text-[10px] md:text-xs font-black text-black/40" />
                  <button className="p-1.5 md:p-2 bg-black text-white rounded-full opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                    <ShoppingBag size={10} className="md:w-3 md:h-3" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
