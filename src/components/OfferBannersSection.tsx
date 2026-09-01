"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Zap, ShieldCheck, Truck, Lock, ArrowRight, Sparkles } from "lucide-react";
import { useLanguageStore } from "@/lib/language-store";
import { translations } from "@/lib/translations";
import { motion, AnimatePresence } from "framer-motion";

interface EnhancedOfferBanner {
  id: string;
  imageUrl: string;
  title: string | null;
  subtitle: string | null;
  offerText: string | null;
  ctaText: string | null;
  backgroundColor: string | null;
  textColor: string | null;
  backgroundImage: string | null;
  startDate: string | null;
  endDate: string | null;
  active: boolean;
  link: string | null;
  discountId: string | null;
  sortOrder: number;
  priority: number;
  clicks: number;
  conversions: number;
  createdAt: string;
  updatedAt: string;
}

export function OfferBannersSection() {
  const [banners, setBanners] = useState<EnhancedOfferBanner[]>([]);
  const [active, setActive] = useState(0);
  const { currentLanguage } = useLanguageStore();
  const t = translations[currentLanguage.code as keyof typeof translations];

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;
    let timeoutId: NodeJS.Timeout | null = null;
    let aborted = false;
    
    const safeAbort = () => {
      if (!aborted) {
        try {
          controller.abort();
          aborted = true;
        } catch {}
      }
    };
    
    timeoutId = setTimeout(() => {
      safeAbort();
    }, 10000);
    
    fetch("/api/promotional/banners?limit=5", {
      signal,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      credentials: 'same-origin'
    })
      .then((r) => {
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        if (!r.ok) {
          throw new Error(`HTTP error! status: ${r.status}`);
        }
        return r.json();
      })
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setBanners(data);
        } else {
          setBanners([]);
        }
      })
      .catch(() => {
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        setBanners([]);
      });
      
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      safeAbort();
    };
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return;
    const t = setInterval(() => setActive((a) => (a + 1) % banners.length), 5000);
    return () => clearInterval(t);
  }, [banners.length]);

  return (
    <section className="mx-auto w-full max-w-[1536px] px-1 sm:px-3 pt-4 sm:pt-6 pb-6 sm:pb-8">
      {banners.length > 0 ? (
        <div className="relative w-full px-1 md:px-0">
          <AnimatePresence mode="wait">
            {banners.map((banner, index) => (
              index === active && (
                <motion.div
                  key={banner.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                  className="relative w-full flex justify-center"
                >
                  <BannerCard banner={banner} />
                </motion.div>
              )
            ))}
          </AnimatePresence>
        </div>
      ) : (
        /* Advanced Flash Sale Banner matching User's Reference Screenshot 1:1 */
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="relative w-full bg-gradient-to-r from-[#d9f0e6] via-[#eaf6f0] to-[#cbead9] rounded-[2rem] md:rounded-[2.75rem] p-4 sm:p-8 md:p-10 text-[#0c3a32] shadow-2xl overflow-hidden border border-[#b2e2ce]"
        >
          {/* Decorative Curved Glass White Backing Arc on Left */}
          <div className="absolute top-0 left-0 bottom-0 w-full lg:w-[58%] bg-gradient-to-r from-white/70 via-white/50 to-transparent pointer-events-none rounded-r-full" />
          
          {/* Subtle Ambient Radial Highlight */}
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-[radial-gradient(circle,rgba(255,255,255,0.8)_0%,transparent_70%)] pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left Content Area (7 Cols) */}
            <div className="lg:col-span-7 space-y-4 sm:space-y-6 text-center lg:text-left">
              
              {/* Limited Time Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-[#89cfb6] shadow-sm">
                <Zap size={14} className="text-[#0c433a] fill-[#0c433a]" />
                <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-[#0c433a]">
                  LIMITED TIME ONLY
                </span>
              </div>

              {/* Main Display Headline */}
              <div className="space-y-1 sm:space-y-2">
                <div className="flex items-center justify-center lg:justify-start gap-2">
                  <h2 className="font-display font-black text-4xl sm:text-6xl lg:text-7xl leading-none text-[#07362e] tracking-tight">
                    FLASH SALE
                  </h2>
                  <Zap size={42} className="text-amber-400 fill-amber-400 animate-bounce hidden sm:inline-block" />
                </div>
                
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2.5 pt-1">
                  <span className="font-black text-2xl sm:text-4xl text-[#10b981] tracking-tight">
                    UP TO <span className="text-3xl sm:text-5xl font-black text-[#0c433a]">40%</span> OFF
                  </span>
                  
                  {/* Category Pill Tag */}
                  <span className="inline-flex items-center gap-1.5 bg-[#0c433a] text-white px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold uppercase tracking-wider shadow-md">
                    <span>on Bestselling Skincare</span>
                  </span>
                </div>
              </div>

              {/* CTA Action Button */}
              <div className="pt-2 flex justify-center lg:justify-start">
                <Link
                  href="/products/flash-sales"
                  className="group relative inline-flex items-center gap-3 bg-[#10b981] hover:bg-[#059669] text-white px-8 sm:px-10 py-3.5 sm:py-4 rounded-full font-black text-xs sm:text-sm uppercase tracking-widest transition-all shadow-[0_10px_25px_rgba(16,185,129,0.35)] hover:scale-105 active:scale-95 border border-emerald-400/40"
                >
                  <span>SHOP NOW</span>
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

              {/* Bottom Trust Micro-Bar */}
              <div className="pt-3 border-t border-[#b2e2ce]/60 grid grid-cols-3 gap-2 text-[9px] sm:text-[11px] font-bold text-[#356156] uppercase tracking-wider">
                <div className="flex items-center justify-center lg:justify-start gap-1.5">
                  <ShieldCheck size={14} className="text-[#0c433a] shrink-0" />
                  <span>100% AUTHENTIC</span>
                </div>
                <div className="flex items-center justify-center lg:justify-start gap-1.5">
                  <Truck size={14} className="text-[#0c433a] shrink-0" />
                  <span>FAST DELIVERY ACROSS GCC</span>
                </div>
                <div className="flex items-center justify-center lg:justify-start gap-1.5">
                  <Lock size={14} className="text-[#0c433a] shrink-0" />
                  <span>SECURE PAYMENT</span>
                </div>
              </div>

            </div>

            {/* Right Showcase Area (5 Cols) */}
            <div className="lg:col-span-5 relative flex items-center justify-center min-h-[260px] sm:min-h-[340px]">
              
              {/* Round Save Up To Badge Overlay */}
              <motion.div 
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-2 left-2 sm:left-4 z-20 w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#0c433a] text-white flex flex-col items-center justify-center p-2 text-center shadow-xl border-2 border-white/80"
              >
                <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-emerald-300">SAVE UP TO</span>
                <span className="text-xl sm:text-2xl font-black leading-none text-white">40%</span>
              </motion.div>

              {/* Main Skincare Product Pedestal Showcase Image */}
              <div className="relative w-full h-[240px] sm:h-[320px] rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl border-4 border-white/80 group">
                <Image
                  src="/images/banner-skincare-pedestal.png"
                  alt="Bestselling Skincare Products Set"
                  fill
                  className="object-cover object-center group-hover:scale-105 transition-transform duration-700"
                  priority
                />
              </div>

              {/* Glowing Skin Badge Overlay Pill Bottom Right */}
              <motion.div
                animate={{ y: [0, 6, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute -bottom-3 right-2 sm:right-4 z-20 bg-white/95 backdrop-blur-xl px-4 py-2 rounded-full shadow-xl border border-[#b2e2ce] flex items-center gap-2"
              >
                <Sparkles size={14} className="text-amber-500 fill-amber-400" />
                <span className="text-[10px] sm:text-xs font-black text-[#0c433a] uppercase tracking-wider">
                  GLOWING SKIN STARTS HERE
                </span>
              </motion.div>

            </div>

          </div>
        </motion.div>
      )}
    </section>
  );
}

function BannerCard({ banner }: { banner: EnhancedOfferBanner }) {
  return (
    <div className="relative w-full max-w-4xl xl:max-w-6xl mx-auto overflow-hidden rounded-2xl md:rounded-3xl min-h-[200px] md:min-h-[340px] group shadow-xl">
      <Image
        src={banner.imageUrl}
        alt={banner.title || "promotional banner"}
        fill
        className="object-contain"
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 70vw, 60vw"
        priority={true}
      />
      {banner.link ? (
        <Link
          href={banner.link}
          className="absolute inset-0 z-10"
          aria-label={banner.title || "promotional banner"}
        />
      ) : null}
    </div>
  );
}


