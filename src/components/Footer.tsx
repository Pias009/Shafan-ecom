"use client";

import { useLanguageStore } from "@/lib/language-store";
import { translations } from "@/lib/translations";
import { ArrowRight, ChevronDown, Facebook, Instagram, Mail, Phone, Clock, MessageCircle, Music, Linkedin } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Logo } from "./Logo";
import Image from "next/image";

const VIDEO_URL = "https://assets.mixkit.co/videos/51185/51185-720.mp4";

export function Footer() {
  const { currentLanguage } = useLanguageStore();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  const t = translations[(mounted ? currentLanguage.code : "en") as keyof typeof translations];
  const [openSection, setOpenSection] = useState<string | null>(null);

  if (!mounted) return null;

  const sections = [
    {
      id: "shop",
      title: t.footer.shop,
      links: [
        { label: "Shopping Cart", href: "/cart" },
        { label: t.footer.skinCare, href: "/products?category=Skin+Care" },
        { label: t.footer.hairCare, href: "/products?category=Hair+Care" },
        { label: t.footer.routines, href: "/routines" },
        { label: t.footer.newArrivals, href: "/products?sort=new" },
        { label: t.footer.brands, href: "/brands" },
        { label: t.footer.deals, href: "/blog" },
      ],
    },
    {
      id: "customer-service",
      title: t.footer.customerService,
      links: [
        { label: t.footer.contactUs, href: "/contact" },
        { label: t.footer.delivery, href: "/delivery" },
        { label: t.footer.exchangeReturn, href: "/returns" },
        { label: t.footer.payment, href: "/payment" },
      ],
    },
    {
      id: "about",
      title: t.footer.about,
      links: [
        { label: t.footer.aboutUs, href: "/about" },
        { label: t.footer.bloggers, href: "/blog" },
      ],
    },
    {
      id: "policies",
      title: "Policies",
      links: [
        { label: "Terms & Conditions", href: "/terms" },
        { label: "Privacy Policy", href: "/privacy" },
        { label: "Returns Policy", href: "/returns-policy" },
        { label: "Cookie Policy", href: "/privacy" },
      ],
    },
  ];

  const toggleSection = (id: string) => {
    setOpenSection(openSection === id ? null : id);
  };

  return (
    <footer className="w-full bg-black text-white font-body selection:bg-white selection:text-black mt-auto">

      {/* Newsletter Section - WITH VIDEO BACKGROUND */}
      <div className="relative overflow-hidden bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900">
        {/* Video Background */}
        <div className="absolute inset-0 z-0">
          <video
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            className="w-full h-full object-cover opacity-70"
            poster="https://assets.mixkit.co/videos/51185/51185-thumb-720-0.jpg"
          >
            <source src={VIDEO_URL} type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-br from-neutral-900/60 via-neutral-800/60 to-neutral-900/60" />
        </div>

        {/* Animated Background Elements */}
        <div className="relative z-10 absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-white/5 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white/3 rounded-full blur-3xl animate-pulse delay-700" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>

        <div className="relative z-20 max-w-7xl mx-auto px-4 md:px-8 lg:px-12 py-16 md:py-20">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-10 lg:gap-16">
            
            {/* Left Content - Animated */}
            <div className="text-center lg:text-left max-w-xl w-full">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="space-y-4"
              >
                <motion.p 
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="inline-block text-xs font-black uppercase tracking-[0.3em] text-white/40 mb-2"
                >
                  {t.footer.joinNewsletter}
                </motion.p>
                
                <motion.h2 
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="font-display text-4xl md:text-5xl lg:text-6xl font-black text-white leading-none"
                >
                  <span className="bg-gradient-to-r from-white via-white to-white/60 bg-clip-text text-transparent">
                    {t.footer.wantOff}
                  </span>
                </motion.h2>
                
                <motion.p 
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="text-sm font-medium text-white/50 leading-relaxed max-w-md"
                >
                  {t.footer.receiveCode}
                </motion.p>
              </motion.div>
            </div>

            {/* Right Content - Animated Form */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="w-full max-w-md lg:max-w-lg"
            >
              <form
                onSubmit={(e) => e.preventDefault()}
                className="relative"
              >
                {/* Floating badge */}
                <motion.div
                  animate={{ 
                    boxShadow: ['0 0 0 rgba(255,255,255,0)', '0 0 20px rgba(255,255,255,0.1)', '0 0 0 rgba(255,255,255,0)']
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute -inset-2 rounded-2xl border border-white/10 pointer-events-none"
                />
                
                <div className="relative flex items-center bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden group hover:border-white/20 transition-colors">
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  <Mail size={18} className="absolute left-5 text-white/40 pointer-events-none group-hover:text-white/60 transition-colors" />
                  
                  <input
                    type="email"
                    placeholder={t.footer.enterEmail}
                    className="w-full h-14 bg-transparent pl-12 pr-24 text-sm font-medium text-white placeholder:text-white/30 outline-none focus:placeholder:text-white/50 transition-colors rounded-2xl"
                  />
                  
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="absolute right-2 top-2 bottom-2 px-6 bg-white text-black text-xs font-black uppercase tracking-widest hover:bg-neutral-100 transition-colors rounded-xl flex items-center gap-2"
                  >
                    <span>Get</span>
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </motion.button>
                </div>
              </form>
              
              {/* Trust badge with animation */}
              <motion.div 
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="mt-4 flex items-center justify-center lg:justify-start gap-4"
              >
                <div className="flex items-center gap-1.5">
                  <motion.span 
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
                    className="w-2 h-2 bg-green-400 rounded-full"
                  />
                  <span className="text-[10px] font-medium text-white/40">No spam</span>
                </div>
                <div className="w-px h-3 bg-white/10" />
                <div className="flex items-center gap-1.5">
                  <motion.span 
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
                    className="w-2 h-2 bg-green-400 rounded-full"
                  />
                  <span className="text-[10px] font-medium text-white/40">Unsubscribe anytime</span>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-white/10" />

      {/* Main Footer Links — Desktop */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-8 md:py-10 hidden md:grid md:grid-cols-4 gap-6">
        {sections.map((section) => (
          <div key={section.id}>
            <h3 className="text-xs font-black text-white uppercase tracking-[0.2em] mb-4 pb-2 border-b border-white/10">
              {section.title}
            </h3>
            <div className="flex flex-col gap-2.5">
              {section.links.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => window.scrollTo({ top: 0, behavior: 'instant' })}
                  className="text-sm font-medium text-white/60 hover:text-white transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Accordion Footer — Mobile */}
      <div className="md:hidden">
        {sections.map((section) => (
          <div key={section.id} className="border-b border-white/10">
            <button
              onClick={() => toggleSection(section.id)}
              className="w-full flex items-center justify-between px-6 py-5 text-xs font-black text-white uppercase tracking-[0.2em]"
            >
              {section.title}
              <ChevronDown
                size={16}
                className={`text-white/50 transition-transform duration-300 ${openSection === section.id ? "rotate-180" : ""}`}
              />
            </button>
            <AnimatePresence>
              {openSection === section.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex flex-col gap-4 px-6 pb-6 pt-1">
                    {section.links.map((link) => (
                      <Link
                        key={link.label}
                        href={link.href}
                        onClick={() => window.scrollTo({ top: 0, behavior: 'instant' })}
                        className="text-sm font-medium text-white/70 hover:text-white transition-colors"
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {/* Divider */}
      <div className="border-t border-white/10" />

      {/* Bottom Bar - Updated according to feedback */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-6 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-4">

        {/* Social Media on LEFT side */}
        <div className="flex items-center gap-5 order-2 md:order-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-white/60">{t.footer.followUs || "FOLLOW US"}</span>
          <div className="flex items-center gap-4">
            <Link href="https://wa.me/971547206046" target="_blank" className="flex items-center gap-1.5 group">
              <MessageCircle size={16} className="text-white/60 group-hover:text-green-400 transition-colors" />
              <span className="text-[10px] font-black uppercase tracking-wider text-white/60 group-hover:text-white transition-colors hidden lg:inline">WhatsApp</span>
            </Link>
            <Link href="https://www.facebook.com/ShanfaGlobalArabia" target="_blank" className="flex items-center gap-1.5 group">
              <Facebook size={16} className="text-white/60 group-hover:text-blue-400 transition-colors" />
              <span className="text-[10px] font-black uppercase tracking-wider text-white/60 group-hover:text-white transition-colors hidden lg:inline">Facebook</span>
            </Link>
            <Link href="https://www.instagram.com/shanfa.global" target="_blank" className="flex items-center gap-1.5 group">
              <Instagram size={16} className="text-white/60 group-hover:text-pink-400 transition-colors" />
              <span className="text-[10px] font-black uppercase tracking-wider text-white/60 group-hover:text-white transition-colors hidden lg:inline">Instagram</span>
            </Link>
            <Link href="https://www.tiktok.com/@shanfaglobal" target="_blank" className="flex items-center gap-1.5 group">
              <svg width={16} height={16} viewBox="0 0 24 24" fill="currentColor" className="text-white/60 group-hover:text-black transition-colors w-4 h-4">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.93 2.93 0 0 1-5.91 0V4.16A1.17 1.17 0 0 1 5 3h.68a4 4 0 0 1 3.93 4.79 9.64 9.64 0 0 1-7.37 3.1V12h3.11v6.63a4.85 4.85 0 0 0 3.08 4.52 4.82 4.82 0 0 0 5.09-.64V12H22V7.9a4.84 4.84 0 0 0-2.41-1.21Z"/>
              </svg>
              <span className="text-[10px] font-black uppercase tracking-wider text-white/60 group-hover:text-white transition-colors hidden lg:inline">TikTok</span>
            </Link>
            <Link href="https://linkedin.com/company/shanfa-global/" target="_blank" className="flex items-center gap-1.5 group">
              <Linkedin size={16} className="text-white/60 group-hover:text-blue-300 transition-colors" />
              <span className="text-[10px] font-black uppercase tracking-wider text-white/60 group-hover:text-white transition-colors hidden lg:inline">LinkedIn</span>
            </Link>
          </div>
        </div>

        {/* Copyright on RIGHT side */}
        <div className="order-1 md:order-2 text-[8px] font-bold uppercase tracking-[0.15em] text-white/50 text-center md:text-right leading-tight">
          © copyright AL SHANFA GENERAL TRADING CO. L.L.C. All rights reserved
        </div>
      </div>

    </footer>
  );
}
