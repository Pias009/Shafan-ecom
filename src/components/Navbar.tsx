"use client";

import Link from "next/link";
import { ShoppingBag, UserRound, Menu, X, Tag, Sparkles } from "lucide-react";
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
import { Logo } from "./Logo";

export function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [authOpen, setAuthOpen] = useState(false);
  
  // Safe pathname for SSR - use empty string if null
  const safePathname = pathname || "";
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
    { href: "/products?category=Body+Care", label: t.nav.bodyCare },
    { href: "/products?category=Fragrances", label: t.nav.fragrances },
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
      
      // Hide navbar when scrolling down, show when scrolling up
      // Account for alert section by checking if we're past it
      const scrollThreshold = 50; // Reduced threshold for faster hiding
      
      if (currentScrollY > lastScrollY && currentScrollY > scrollThreshold) {
        // Scrolling down - hide completely
        setVisible(false);
      } else if (currentScrollY < lastScrollY) {
        // Scrolling up - show immediately
        setVisible(true);
      }
      setLastScrollY(currentScrollY);
    };
    
    // Add a slight delay to prevent jitter
    const debouncedScroll = () => {
      window.requestAnimationFrame(onScroll);
    };
    
    window.addEventListener("scroll", debouncedScroll, { passive: true });
    return () => window.removeEventListener("scroll", debouncedScroll);
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
  }, [safePathname]);

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

  const isHomePage = safePathname === "/";
  
  return (
    <>
      <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 transform ${
        scrolled ? "glass-nav shadow-md" : "bg-transparent"
      } ${visible ? "translate-y-0" : "-translate-y-full"}`}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-8 py-2 flex items-center">
        {/* Mobile layout: Logo centered, hamburger on right */}
        <div className="flex items-center justify-between w-full lg:hidden">
          {/* Empty div for spacing to center logo */}
          <div className="w-6"></div>
          
          {/* Logo centered */}
          <div className="flex-shrink-0">
            <Logo />
          </div>
          
          {/* Mobile hamburger on right */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 text-black"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Desktop layout */}
        <div className="hidden lg:flex items-center justify-center w-full gap-3 md:gap-6 lg:gap-8">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Logo />
          </div>

          {/* Navigation - Desktop only */}
          <div className="flex items-center justify-center flex-1">
            <div className="glass-panel rounded-full px-6 py-2 max-w-3xl">
              <div className="flex items-center gap-1 md:gap-2">
                {navLinks.map((link) => {
                  const isOffers = link.href === "/announcements";
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`px-3 md:px-4 py-2 text-xs md:text-sm font-semibold tracking-wide transition-all duration-300 rounded-full relative overflow-hidden group whitespace-nowrap ${
                        safePathname === link.href
                          ? "text-black bg-black/10"
                          : "text-black/70 hover:text-black hover:bg-black/5"
                      } ${isOffers ? "animate-pulse" : ""}`}
                    >
                      {isOffers && (
                        <>
                          <span className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-orange-500/20 animate-shimmer bg-[length:200%_100%] group-hover:bg-[length:400%_100%] transition-all duration-1000"></span>
                          <Sparkles className="inline-block w-3 h-3 mr-1.5 animate-spin-slow" />
                        </>
                      )}
                      {link.label}
                      {isOffers && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Actions (Currency, Language, Cart, User) - Desktop only */}
          <div className="flex items-center gap-2 md:gap-4">
            {/* Currency/Language selectors (desktop) */}
            <div className="hidden md:flex items-center gap-3">
              <LanguageSelector />
              <CurrencySelector />
            </div>

            {/* Cart - visible to all users on desktop */}
            <Link href="/cart" className="hidden md:flex relative p-2 text-black hover:text-black/70 transition-colors items-center">
              <ShoppingBag size={22} />
              {mounted && cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-black text-white text-xs flex items-center justify-center font-bold">
                  {cartCount}
                </span>
              )}
              <span className="ml-1 text-sm font-medium hidden lg:inline">Cart</span>
            </Link>

            {/* User (desktop) */}
            <div className="hidden md:block relative">
              <button
                type="button"
                onClick={onUserButtonClick}
                className="glass-panel inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold text-black transition hover:bg-black/5"
                aria-label={userLabel ? "Open user menu" : t.nav.signIn}
              >
                <UserRound size={18} />
                <span className="uppercase tracking-wide">{userLabel ?? t.nav.signIn}</span>
              </button>
              <UserDropdown open={userMenuOpen} onClose={() => setUserMenuOpen(false)} />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden glass-panel-heavy mx-4 mb-4 rounded-2xl p-6 space-y-2 border border-black/5">
          {/* User profile section */}
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-black/5 mb-2">
            <div className="w-10 h-10 rounded-full bg-black/10 flex items-center justify-center">
              <UserRound size={20} className="text-black" />
            </div>
            <div className="flex-1">
              <div className="font-bold text-sm text-black">
                {userLabel ? `Hello, ${userLabel}` : t.nav.signIn}
              </div>
              <div className="text-xs text-black/60">
                {status === "authenticated" ? "Manage your account" : "Sign in to your account"}
              </div>
            </div>
            <button
              onClick={onUserButtonClick}
              className="text-xs font-bold px-3 py-1.5 rounded-full bg-black text-white"
            >
              {status === "authenticated" ? "Profile" : "Sign In"}
            </button>
          </div>

          {/* Navigation links */}
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="block px-4 py-3 text-sm font-bold tracking-widest rounded-xl transition-colors text-black hover:bg-black/5 truncate"
            >
              {link.label}
            </Link>
          ))}

          {/* Cart section (visible to all users) */}
          <Link
            href="/cart"
            onClick={() => setMobileOpen(false)}
            className="flex items-center justify-between px-4 py-3 rounded-xl bg-black/5 mt-2"
          >
            <div className="flex items-center gap-3">
              <ShoppingBag size={18} className="text-black" />
              <span className="text-sm font-bold text-black">Shopping Cart</span>
            </div>
            {mounted && cartCount > 0 && (
              <span className="w-6 h-6 rounded-full bg-black text-white text-xs flex items-center justify-center font-bold">
                {cartCount}
              </span>
            )}
          </Link>

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
      
      {/* Floating Cart Button for Mobile (Home and Products pages only) */}
      {safePathname && (safePathname === "/" || safePathname.startsWith("/products")) && (
        <Link
          href="/cart"
          className="md:hidden fixed bottom-6 left-6 z-40 w-14 h-14 rounded-full bg-black text-white flex items-center justify-center shadow-2xl shadow-black/30 animate-bounce-subtle"
          aria-label="Open cart"
        >
          <ShoppingBag size={24} />
          {mounted && cartCount > 0 && (
            <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold border-2 border-white">
              {cartCount}
            </span>
          )}
        </Link>
      )}
      
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}
