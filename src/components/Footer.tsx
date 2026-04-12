"use client";

import { useLanguageStore } from "@/lib/language-store";
import { translations } from "@/lib/translations";
import { ArrowRight, ChevronDown, Facebook, Instagram, Mail, Phone, Clock, MessageCircle, Music, Linkedin } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Logo } from "./Logo";

export function Footer() {
  const { currentLanguage } = useLanguageStore();
  const t = translations[currentLanguage.code as keyof typeof translations];
  const [openSection, setOpenSection] = useState<string | null>(null);

  const sections = [
    {
      id: "shop",
      title: t.footer.shop,
      links: [
        { label: "Shopping Cart", href: "/cart" },
        { label: t.footer.skinCare, href: "/category/skin-care" },
        { label: t.footer.hairCare, href: "/category/hair-care" },
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
        { label: t.footer.faq, href: "/faq" },
        { label: t.footer.rewardPoints, href: "/rewards" },
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
      title: t.footer.policies,
      links: [
        { label: t.footer.termsConditions, href: "/terms" },
        { label: t.footer.privacyPolicy, href: "/privacy" },
        { label: t.footer.returnsPolicy, href: "/returns-policy" },
      ],
    },
  ];

  const toggleSection = (id: string) => {
    setOpenSection(openSection === id ? null : id);
  };

  return (
    <footer className="w-full bg-black text-white font-body selection:bg-white selection:text-black mt-auto">

      {/* Newsletter Section */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 py-8 md:py-12 lg:py-16">
        <div className="flex flex-col lg:flex-row items-center lg:items-start justify-between gap-8 lg:gap-16 xl:gap-20">
          
          {/* Logo Section */}
          <div className="flex flex-col items-center lg:items-start">
            <Logo className="mb-4" />
            <p className="text-xs font-medium text-white/50 text-center lg:text-left max-w-[200px]">
              Discover the essence of natural beauty with our premium skincare collection.
            </p>
          </div>

          {/* Left text */}
          <div className="text-center lg:text-left max-w-lg w-full">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-white/40 mb-3">
              {t.footer.joinNewsletter}
            </p>
            <h2 className="font-display text-3xl md:text-5xl lg:text-6xl font-black text-white mb-4 leading-none italic tracking-tighter">
              {t.footer.wantOff}
            </h2>
            <p className="text-sm font-medium text-white/50 leading-relaxed">
              {t.footer.receiveCode}
            </p>
          </div>

          {/* Newsletter Form */}
          <div className="w-full max-w-md lg:max-w-lg">
            <form
              onSubmit={(e) => e.preventDefault()}
              className="relative flex items-center"
            >
              <Mail size={16} className="absolute left-4 text-white/30 pointer-events-none" />
              <input
                type="email"
                placeholder={t.footer.enterEmail}
                className="w-full h-14 bg-white/5 border border-white/20 pl-10 pr-16 text-sm font-bold text-white placeholder:text-white/30 outline-none focus:border-white/60 transition-colors rounded-xl"
              />
              <button
                type="submit"
                className="absolute right-2 top-2 bottom-2 px-4 bg-white text-black text-xs font-black uppercase tracking-widest hover:bg-white/90 transition-colors rounded-lg flex items-center gap-1.5"
              >
                <ArrowRight size={14} />
              </button>
            </form>
            <p className="mt-3 text-[10px] text-white/30 font-bold uppercase tracking-widest leading-relaxed">
              {t.footer.disclosure}
            </p>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-white/10" />

      {/* Main Footer Links — Desktop */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-8 md:py-10 hidden md:grid md:grid-cols-4 gap-8">
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
        <div className="order-1 md:order-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/50 text-center md:text-right">
          copyright© AL SHANFA GENERAL TRADING CO. L.L.C. All rights reserved
        </div>
      </div>

    </footer>
  );
}
