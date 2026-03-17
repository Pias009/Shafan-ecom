"use client";

import { useLanguageStore } from "@/lib/language-store";
import { translations } from "@/lib/translations";
import { ArrowRight, ChevronDown, Facebook, Instagram } from "lucide-react";
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
    <footer className="w-full bg-black text-white font-body selection:bg-white selection:text-black">
      {/* Newsletter Section */}
      <div className="max-w-7xl mx-auto px-6 py-20 text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-10">
        <div className="max-w-xl">
          <h2 className="font-display text-4xl md:text-5xl font-black text-white mb-4 leading-none italic tracking-tighter">
            {t.footer.wantOff}
          </h2>
          <p className="text-xl font-bold text-white mb-2">{t.footer.joinNewsletter}</p>
          <p className="text-sm font-medium text-white/50">
            {t.footer.receiveCode}
          </p>
        </div>

        <div className="w-full max-w-md">
          <form 
            onSubmit={(e) => e.preventDefault()}
            className="relative group h-fit flex items-center"
          >
            <input
              type="email"
              placeholder={t.footer.enterEmail}
              className="w-full h-14 bg-white/5 border border-white/10 px-6 pr-14 text-sm font-bold text-white placeholder:text-white/20 outline-none focus:border-white transition-colors"
            />
            <button 
              type="submit"
              className="absolute right-1 top-1 bottom-1 w-12 bg-white text-black flex items-center justify-center hover:bg-white/90 transition-colors"
            >
              <ArrowRight size={20} />
            </button>
          </form>
          <p className="mt-3 text-[10px] text-white/40 font-bold uppercase tracking-widest leading-relaxed">
            {t.footer.disclosure}
          </p>
        </div>
      </div>

      {/* Main Footer Links - Desktop */}
      <div className="bg-white/5 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-16 hidden md:grid md:grid-cols-4 lg:grid-cols-4 gap-12">
          {sections.map((section) => (
            <div key={section.id}>
              <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] mb-8 border-b border-white/5 pb-4">
                {section.title}
              </h3>
              <div className="flex flex-col gap-4">
                {section.links.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="text-xs font-bold text-white/50 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Accordion Footer - Mobile */}
        <div className="md:hidden">
          {sections.map((section) => (
            <div key={section.id} className="border-b border-white/5">
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center justify-between px-6 py-6 text-sm font-black text-white uppercase tracking-[0.2em]"
              >
                {section.title}
                <ChevronDown 
                  size={16} 
                  className={`transition-transform duration-300 ${openSection === section.id ? "rotate-180" : ""}`} 
                />
              </button>
              <AnimatePresence>
                {openSection === section.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden bg-white/[0.02]"
                  >
                    <div className="flex flex-col gap-4 px-6 pb-8">
                      {section.links.map((link) => (
                        <Link
                          key={link.label}
                          href={link.href}
                          className="text-xs font-bold text-white/50"
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
      </div>

      {/* Bottom Bar */}
      <div className="bg-black text-white w-full border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-10 md:py-8 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-8 md:gap-4">
          
          {/* Contact Info */}
          <div className="flex flex-col gap-1 md:gap-2">
            <div className="flex items-center justify-between md:justify-start md:gap-6">
                <span className="text-[10px] font-black uppercase tracking-widest text-white/40 md:text-white/60">
                    {t.footer.contactUs}
                </span>
                <span className="md:hidden text-[10px] font-black uppercase tracking-widest text-white/40">
                    {t.footer.followUs}
                </span>
            </div>
            
            <div className="flex items-center justify-between md:justify-start md:gap-10">
                <span className="text-lg md:text-xl font-black italic tracking-tighter text-white">
                    +971 4 543 4800
                </span>
                <div className="md:hidden flex items-center gap-4">
                    <Link href="#" className="p-1 hover:text-white/70 transition-colors"><Facebook size={20} /></Link>
                    <Link href="#" className="p-1 hover:text-white/70 transition-colors"><Instagram size={20} /></Link>
                </div>
            </div>

            <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest md:text-white/60">
                {t.footer.workingHours}
            </span>
          </div>

          {/* Social Links - Desktop */}
          <div className="hidden md:flex items-center gap-10">
            <div className="flex flex-col gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-white/40 text-right">{t.footer.followUs}</span>
                <div className="flex items-center gap-6">
                    <Link href="#" className="flex items-center gap-2 group">
                        <Facebook size={18} className="text-white group-hover:text-white/70 transition-colors" />
                        <span className="text-[10px] font-black uppercase tracking-widest hidden lg:inline ml-1">Facebook</span>
                    </Link>
                    <Link href="#" className="flex items-center gap-2 group">
                       <Instagram size={18} className="text-white group-hover:text-white/70 transition-colors" />
                       <span className="text-[10px] font-black uppercase tracking-widest hidden lg:inline ml-1">Instagram</span>
                    </Link>
                </div>
            </div>
            <div className="text-[9px] font-black uppercase tracking-[0.2em] text-white/20 border-l border-white/10 pl-10 h-10 flex items-center">
                © 2026 Shafan {t.footer.rights}
            </div>
          </div>

          {/* Copyright - Mobile Only */}
          <div className="md:hidden text-[9px] font-black uppercase tracking-[0.2em] text-white/20 text-center border-t border-white/5 pt-6">
             © 2026 Shafan {t.footer.rights}
          </div>
        </div>
      </div>
    </footer>
  );
}
