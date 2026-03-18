"use client";

import Link from "next/link";
import { ShoppingBag, UserRound, Menu, X } from "lucide-react";
import { useSession } from "next-auth/react";
import { useMemo, useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { AuthModal } from "./AuthModal";
import { UserDropdown } from "./UserDropdown";
import { CurrencySelector } from "./CurrencySelector";
import { LanguageSelector } from "./LanguageSelector";
import { useCartStore } from "@/lib/cart-store";
import { useLanguageStore } from "@/lib/language-store";
import { translations } from "@/lib/translations";

export function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [authOpen, setAuthOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const items = useCartStore((state) => state.items);
  const { currentLanguage } = useLanguageStore();

  const t = translations[currentLanguage.code as keyof typeof translations];

  const navLinks = [
    { href: "/", label: t.nav.home },
    { href: "/brands", label: t.nav.brands },
    { href: "/products?category=Skin+Care", label: t.nav.skinCare },
    { href: "/products?category=Hair+Care", label: t.nav.hairCare },
    { href: "/products", label: t.nav.products },
    { href: "/announcements", label: t.nav.offers },
  ];

  const [visible, setVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    setMounted(true);
    const onScroll = () => {
      const currentScrollY = window.scrollY;
      setScrolled(currentScrollY > 20);
      
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down
        setVisible(false);
      } else {
        // Scrolling up
        setVisible(true);
      }
      setLastScrollY(currentScrollY);
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [lastScrollY]);

  // Sync address status
  const setHasAddress = useCartStore(state => state.setHasAddress);
  useEffect(() => {
    if (status === "authenticated") {
        fetch("/api/account/address").then(r => r.json()).then(data => {
            setHasAddress(!!data);
        });
    }
  }, [status, setHasAddress]);

  // Close menus on navigation
  useEffect(() => {
    setUserMenuOpen(false);
    setMobileOpen(false);
  }, [pathname]);

  const cartCount = items.reduce((acc, item) => acc + item.quantity, 0);

  const userLabel = useMemo(() => {
    const u = session?.user;
    if (!u) return null;
    return u.name?.trim() || u.email?.trim() || t.nav.account;
  }, [session?.user, t.nav.account]);

  function onUserButtonClick() {
    if (status === "authenticated") {
      setUserMenuOpen(true);
    } else {
      setAuthOpen(true);
    }
  }

  return (
    <>
      <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 transform ${
        scrolled ? "glass-nav shadow-sm" : "bg-transparent"
      } ${visible ? "translate-y-0" : "-translate-y-full"}`}
    >
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between relative">
        {/* Centered Desktop Nav */}
        <div className="hidden md:flex items-center gap-6 glass-panel rounded-full pl-8 pr-2 py-1.5 absolute left-1/2 -translate-x-1/2 transition-all duration-300">
          <div className="flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-5 py-2 text-[10px] font-black tracking-[0.15em] transition-all duration-300 rounded-full ${
                  pathname === link.href
                    ? "text-black bg-black/5"
                    : "text-black/60 hover:text-black hover:bg-black/5"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-2 border-l border-black/5 pl-4 ml-1">
            <LanguageSelector />
            <CurrencySelector />
          </div>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 text-black"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Right side Actions */}
        <div className="flex items-center gap-3">

          {/* Cart - only visible if signed in */}
          {status === "authenticated" && (
            <Link href="/cart" className="relative p-2 text-black hover:text-black/70 transition-colors">
              <ShoppingBag size={20} />
              {mounted && cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-black text-white text-[10px] flex items-center justify-center font-bold">
                  {cartCount}
                </span>
              )}
            </Link>
          )}

          {/* User */}
          <div className="relative">
            <button
              type="button"
              onClick={onUserButtonClick}
              className="glass-panel inline-flex h-9 items-center gap-2 rounded-full px-4 text-xs font-bold text-black transition hover:bg-black/5"
              aria-label={userLabel ? "Open user menu" : t.nav.signIn}
            >
              <UserRound size={16} />
              <span className="hidden sm:inline uppercase tracking-wider">{userLabel ?? t.nav.signIn}</span>
            </button>
            <UserDropdown open={userMenuOpen} onClose={() => setUserMenuOpen(false)} />
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden glass-panel-heavy mx-4 mb-4 rounded-2xl p-6 space-y-2 border border-black/5">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="block px-4 py-3 text-sm font-bold tracking-widest rounded-xl transition-colors text-black hover:bg-black/5"
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-4 mt-2 border-t border-black/5 flex items-center justify-between px-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-black/40">Settings</span>
            <div className="flex items-center gap-2">
              <LanguageSelector />
              <CurrencySelector />
            </div>
          </div>
        </div>
      )}

      </header>
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}
