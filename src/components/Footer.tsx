"use client";

import { useLanguageStore } from "@/lib/language-store";
import { translations } from "@/lib/translations";
import { ArrowRight, ChevronDown, Facebook, Instagram, Mail, Phone, Clock, MessageCircle, Music, Linkedin } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export function Footer() {
  const { currentLanguage } = useLanguageStore();
  const t = translations[currentLanguage.code as keyof typeof translations];
  const [openSection, setOpenSection] = useState<string | null>(null);

  const sections = [
    {
      id: "shop",
      title: t.footer.shop,
      links: [
        { label: t.footer.skinCare, href: "/category/skin-care" },
        { label: t.footer.hairCare, href: "/category/hair-care" },
        { label: t.footer.routines, href: "/routines" },
        { label: t.footer.newArrivals, href: "/products?sort=new" },
        { label: t.footer.brands, href: "/brands" },
        { label: t.footer.deals, href: "/announcements" },
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
        { label: t.footer.bloggers, href: "/bloggers" },
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
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-16 md:py-24">
        <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-10 md:gap-20">
          
          {/* Left text */}
          <div className="text-center md:text-left max-w-lg">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-white/40 mb-3">
              {t.footer.joinNewsletter}
            </p>
            <h2 className="font-display text-4xl md:text-6xl font-black text-white mb-4 leading-none italic tracking-tighter">
              {t.footer.wantOff}
            </h2>
            <p className="text-sm font-medium text-white/50 leading-relaxed">
              {t.footer.receiveCode}
            </p>
          </div>

          {/* Newsletter Form */}
          <div className="w-full max-w-md">
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
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-14 hidden md:grid md:grid-cols-4 gap-12">
        {sections.map((section) => (
          <div key={section.id}>
            <h3 className="text-xs font-black text-white uppercase tracking-[0.2em] mb-6 pb-3 border-b border-white/10">
              {section.title}
            </h3>
            <div className="flex flex-col gap-3.5">
              {section.links.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
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
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-8 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-4">

        {/* Social Media on LEFT side */}
        <div className="flex items-center gap-5 order-2 md:order-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-white/60">{t.footer.followUs || "FOLLOW US"}</span>
          <div className="flex items-center gap-4">
            <Link href="https://wa.me/" target="_blank" className="flex items-center gap-1.5 group">
              <MessageCircle size={16} className="text-white/60 group-hover:text-green-400 transition-colors" />
              <span className="text-[10px] font-black uppercase tracking-wider text-white/60 group-hover:text-white transition-colors hidden lg:inline">WhatsApp</span>
            </Link>
            <Link href="#" className="flex items-center gap-1.5 group">
              <Facebook size={16} className="text-white/60 group-hover:text-blue-400 transition-colors" />
              <span className="text-[10px] font-black uppercase tracking-wider text-white/60 group-hover:text-white transition-colors hidden lg:inline">Facebook</span>
            </Link>
            <Link href="#" className="flex items-center gap-1.5 group">
              <Instagram size={16} className="text-white/60 group-hover:text-pink-400 transition-colors" />
              <span className="text-[10px] font-black uppercase tracking-wider text-white/60 group-hover:text-white transition-colors hidden lg:inline">Instagram</span>
            </Link>
            <Link href="#" className="flex items-center gap-1.5 group">
              <Music size={16} className="text-white/60 group-hover:text-black transition-colors" />
              <span className="text-[10px] font-black uppercase tracking-wider text-white/60 group-hover:text-white transition-colors hidden lg:inline">TikTok</span>
            </Link>
            <Link href="#" className="flex items-center gap-1.5 group">
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
