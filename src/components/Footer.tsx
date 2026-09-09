"use client";

import { useLanguageStore } from "@/lib/language-store";
import { translations } from "@/lib/translations";
import {
  ArrowRight,
  ChevronDown,
  Facebook,
  Instagram,
  Mail,
  Phone,
  MessageCircle,
  Linkedin,
  ShieldCheck,
  Truck,
  RotateCcw,
  Sparkles,
  Lock,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Logo } from "./Logo";

export function Footer() {
  const { currentLanguage } = useLanguageStore();
  const [mounted, setMounted] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const t = translations[(mounted ? currentLanguage.code : "en") as keyof typeof translations];

  if (!mounted) return null;

  const sections = [
    {
      id: "shop",
      title: t.footer.shop || "Shop",
      links: [
        { label: t.footer.skinCare || "Skin Care", href: "/products?category=Skin+Care" },
        { label: t.footer.hairCare || "Hair Care", href: "/products?category=Hair+Care" },
        { label: t.footer.routines || "Daily Routines", href: "/products/routine" },
        { label: t.footer.newArrivals || "New Arrivals", href: "/products?sort=new" },
        { label: "Best Sellers", href: "/products?sort=best-selling" },
        { label: "Flash Sales", href: "/products/flash-sales" },
        { label: t.footer.brands || "Official Brands", href: "/brands" },
      ],
    },
    {
      id: "customer-service",
      title: t.footer.customerService || "Customer Care",
      links: [
        { label: t.footer.contactUs || "Contact Us", href: "/contact" },
        { label: "Track Your Order", href: "/account/orders" },
        { label: t.footer.delivery || "Shipping & Delivery", href: "/delivery" },
        { label: t.footer.exchangeReturn || "Exchange & Return", href: "/returns" },
        { label: t.footer.payment || "Payment Methods", href: "/payment" },
        { label: "Shopping Bag", href: "/cart" },
      ],
    },
    {
      id: "about",
      title: t.footer.about || "About Shanfa",
      links: [
        { label: t.footer.aboutUs || "About Us", href: "/about" },
        { label: t.footer.partnership || "Partnership & Suppliers", href: "/partnership" },
        { label: "Latest Beauty Blog", href: "/blog" },
        { label: "Authenticity Guarantee", href: "/about" },
      ],
    },
    {
      id: "policies",
      title: "Legal & Policies",
      links: [
        { label: "Terms & Conditions", href: "/terms" },
        { label: "Privacy & Security Policy", href: "/privacy" },
        { label: "Returns & Refund Policy", href: "/returns-policy" },
        { label: "Cookie Policy", href: "/privacy" },
      ],
    },
  ];

  const toggleSection = (id: string) => {
    setOpenSection(openSection === id ? null : id);
  };

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) return;
    setSubscribed(true);
    setTimeout(() => {
      setEmail("");
    }, 4000);
  };

  return (
    <footer className="w-full relative overflow-hidden bg-gradient-to-b from-[#2d021c] via-[#1c0111] to-[#0c0007] text-white selection:bg-[#890754] selection:text-white border-t border-pink-900/40 mt-auto">
      {/* Ambient background glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#890754]/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[600px] h-[600px] bg-[#540434]/25 rounded-full blur-[140px] pointer-events-none" />

      {/* ── 1. Shanfa Privé VIP Invitation Card ── */}
      <div className="relative z-10 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 pb-6">
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-white/[0.07] via-white/[0.04] to-white/[0.07] backdrop-blur-2xl border border-pink-500/20 p-5 sm:p-8 lg:p-10 shadow-[0_16px_48px_rgba(0,0,0,0.4)]">
          {/* Subtle corner light reflection */}
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-pink-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 items-center">
            {/* Left Copy: Compact & Luxury */}
            <div className="lg:col-span-7 text-center lg:text-left space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-pink-300 text-[9.5px] sm:text-[10px] font-black uppercase tracking-[0.22em]">
                <Sparkles size={12} className="text-amber-300" />
                <span>SHANFA PRIVÉ • VIP ACCESS</span>
              </div>
              <h2 className="font-serif text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-white leading-tight">
                Enjoy <span className="wave-text">10% Off</span> Your First Skincare Ritual
              </h2>
              <p className="font-sans text-xs sm:text-sm text-white/70 max-w-xl font-normal leading-relaxed">
                Receive private flash sales, personalized regimen guides, and exclusive GCC luxury beauty drops.
              </p>
            </div>

            {/* Right Form: Sleek Single-Pill Design */}
            <div className="lg:col-span-5 w-full">
              {subscribed ? (
                <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-200">
                  <CheckCircle2 size={22} className="text-emerald-400 shrink-0" />
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm text-white">Welcome to Shanfa Privé!</h4>
                    <p className="text-[11px] text-emerald-200/80">Your 10% privilege code is on its way to your inbox.</p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="relative">
                  <div className="relative flex items-center bg-white/[0.08] hover:bg-white/[0.12] focus-within:bg-white/[0.15] border border-white/20 focus-within:border-pink-400/80 rounded-full p-1.5 transition-all shadow-inner">
                    <Mail size={16} className="text-white/40 ml-3 shrink-0 pointer-events-none" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email address…"
                      className="w-full bg-transparent px-3 text-xs sm:text-sm text-white placeholder:text-white/40 focus:outline-none font-medium"
                    />
                    <button
                      type="submit"
                      className="h-10 sm:h-11 px-4 sm:px-6 rounded-full bg-gradient-to-r from-[#890754] to-[#a8146c] hover:from-[#a8146c] hover:to-[#890754] text-white font-black text-[11px] sm:text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-md hover:scale-[1.03] active:scale-95 shrink-0 border border-pink-400/30 cursor-pointer"
                    >
                      <span>Claim 10%</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                  <p className="text-[10px] text-white/40 text-center lg:text-left mt-2 px-3">
                    Instant delivery to your inbox • Zero spam, unsubscribe anytime.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. Main Navigation Links ── */}
      <div className="relative z-10 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        {/* Desktop 4-Column Grid */}
        <div className="hidden md:grid md:grid-cols-12 gap-8 lg:gap-12">
          {/* Brand & Concierge (5 cols) */}
          <div className="md:col-span-4 lg:col-span-4 space-y-4">
            <Logo light={true} />
            <p className="text-xs sm:text-sm text-white/70 font-normal leading-relaxed pr-4">
              Al Shanfa General Trading — your trusted regional authority for authenticated dermatological skincare, restorative hair care, and luxury personal beauty across the UAE and GCC.
            </p>

            {/* Concierge Contact Card */}
            <div className="pt-2 space-y-2.5">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Customer Concierge Active
              </div>

              <div className="flex flex-col gap-2 text-xs text-white/75 font-medium">
                <Link
                  href="https://wa.me/971547206046"
                  target="_blank"
                  className="inline-flex items-center gap-2 hover:text-pink-300 transition-colors"
                >
                  <MessageCircle size={14} className="text-emerald-400" />
                  <span>WhatsApp: +971 54 720 6046</span>
                </Link>
                <Link
                  href="mailto:support@shanfaglobal.com"
                  className="inline-flex items-center gap-2 hover:text-pink-300 transition-colors"
                >
                  <Mail size={14} className="text-pink-300" />
                  <span>support@shanfaglobal.com</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Links Columns (8 cols: 2 + 2 + 2) */}
          <div className="md:col-span-8 lg:col-span-8 grid grid-cols-3 gap-6 lg:gap-8">
            {sections.slice(0, 3).map((section) => (
              <div key={section.id}>
                <h3 className="text-xs font-black text-white uppercase tracking-[0.18em] mb-4 pb-2 border-b border-white/10">
                  {section.title}
                </h3>
                <ul className="space-y-2.5">
                  {section.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        onClick={() => window.scrollTo({ top: 0, behavior: "instant" })}
                        className="text-xs sm:text-sm text-white/60 hover:text-pink-300 hover:translate-x-1 inline-block transition-all duration-200"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile Accordion */}
        <div className="md:hidden space-y-2">
          {/* Brand Intro on Mobile */}
          <div className="pb-4 mb-2 border-b border-white/10">
            <Logo light={true} />
            <p className="text-xs text-white/70 mt-2 leading-relaxed">
              Al Shanfa General Trading — your trusted regional authority for authenticated skincare and beauty across the GCC.
            </p>
          </div>

          {sections.map((section) => (
            <div key={section.id} className="rounded-2xl bg-white/[0.03] border border-white/10 overflow-hidden">
              <button
                type="button"
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center justify-between px-5 py-4 text-xs font-black text-white uppercase tracking-[0.16em]"
              >
                <span>{section.title}</span>
                <ChevronDown
                  size={16}
                  className={`text-white/60 transition-transform duration-300 ${
                    openSection === section.id ? "rotate-180 text-pink-300" : ""
                  }`}
                />
              </button>
              <AnimatePresence>
                {openSection === section.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <ul className="flex flex-col gap-2.5 px-5 pb-5 pt-1 border-t border-white/5">
                      {section.links.map((link) => (
                        <li key={link.label}>
                          <Link
                            href={link.href}
                            onClick={() => window.scrollTo({ top: 0, behavior: "instant" })}
                            className="text-xs text-white/70 hover:text-pink-300 py-1 block transition-colors"
                          >
                            {link.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>

      {/* ── 3. Payment & Security Badges ── */}
      <div className="relative z-10 border-t border-white/10 bg-black/20">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-white/50 text-[11px] font-bold uppercase tracking-wider">
            <Lock size={13} className="text-pink-300" />
            <span>256-Bit SSL Encrypted & Secure Checkout</span>
          </div>

          {/* Payment Badges */}
          <div className="flex flex-wrap items-center justify-center gap-2 text-[10px] font-black uppercase text-white/75">
            <span className="px-2.5 py-1 rounded-md bg-white/10 border border-white/15">VISA</span>
            <span className="px-2.5 py-1 rounded-md bg-white/10 border border-white/15">MASTERCARD</span>
            <span className="px-2.5 py-1 rounded-md bg-white/10 border border-white/15">APPLE PAY</span>
            <span className="px-2.5 py-1 rounded-md bg-white/10 border border-white/15">MADA</span>
            <span className="px-2.5 py-1 rounded-md bg-white/10 border border-white/15">TABBY</span>
            <span className="px-2.5 py-1 rounded-md bg-white/10 border border-white/15">TAMARA</span>
            <span className="px-2.5 py-1 rounded-md bg-white/10 border border-pink-400/30 text-pink-300">CASH ON DELIVERY</span>
          </div>
        </div>
      </div>

      {/* ── 4. Social Links & Copyright Bottom Bar ── */}
      <div className="relative z-10 border-t border-white/10 bg-black/40 pb-28 sm:pb-8 pt-6">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-4">
          {/* Social Icons */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-white/50">Follow Us:</span>
            <Link
              href="https://wa.me/971547206046"
              target="_blank"
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-[#25D366] text-white flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-sm"
              aria-label="WhatsApp"
            >
              <MessageCircle size={15} />
            </Link>
            <Link
              href="https://www.instagram.com/shanfa.global"
              target="_blank"
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-[#E4405F] text-white flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-sm"
              aria-label="Instagram"
            >
              <Instagram size={15} />
            </Link>
            <Link
              href="https://www.facebook.com/ShanfaGlobalArabia"
              target="_blank"
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-[#1877F2] text-white flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-sm"
              aria-label="Facebook"
            >
              <Facebook size={15} />
            </Link>
            <Link
              href="https://www.tiktok.com/@shanfaglobal"
              target="_blank"
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-black text-white flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-sm"
              aria-label="TikTok"
            >
              <svg width={14} height={14} viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.93 2.93 0 0 1-5.91 0V4.16A1.17 1.17 0 0 1 5 3h.68a4 4 0 0 1 3.93 4.79 9.64 9.64 0 0 1-7.37 3.1V12h3.11v6.63a4.85 4.85 0 0 0 3.08 4.52 4.82 4.82 0 0 0 5.09-.64V12H22V7.9a4.84 4.84 0 0 0-2.41-1.21Z" />
              </svg>
            </Link>
            <Link
              href="https://linkedin.com/company/shanfa-global/"
              target="_blank"
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-[#0A66C2] text-white flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-sm"
              aria-label="LinkedIn"
            >
              <Linkedin size={15} />
            </Link>
          </div>

          {/* Legal Copyright */}
          <div className="text-[10px] sm:text-[11px] font-medium text-white/50 text-center md:text-right leading-relaxed">
            <p>© {new Date().getFullYear()} AL SHANFA GENERAL TRADING CO. L.L.C. All rights reserved.</p>
            <p className="text-[9px] text-white/35">Licensed & Registered Commercial Entity in the United Arab Emirates.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
