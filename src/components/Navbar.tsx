"use client";

import Link from "next/link";
import { ShoppingBag, UserRound, Menu, X, Tag, Sparkles } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { useMemo, useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { AuthModal } from "./AuthModal";
import { UserDropdown } from "./UserDropdown";
import { CurrencySelector } from "./CurrencySelector";
import { LanguageSelector } from "./LanguageSelector";
import { useCartStore } from "@/lib/cart-store";
import { useLanguageStore } from "@/lib/language-store";
import { translations } from "@/lib/translations";
import { Logo } from "./Logo";
import { useCountryStore } from "@/lib/country-store";

export function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [authOpen, setAuthOpen] = useState(false);
  
  // Safe pathname for SSR - use empty string if null
  const safePathname = pathname || "";
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const items = useCartStore((state) => state.items);
  const { currentLanguage } = useLanguageStore();
  const { selectedCountry, detectedCountry, setDetectedCountry } = useCountryStore();

  const t = translations[currentLanguage.code as keyof typeof translations];

  useEffect(() => {
    if (typeof window !== 'undefined' && !detectedCountry) {
      import("@/lib/country-detection").then(({ detectUserCountry }) => {
        const detected = detectUserCountry();
        setDetectedCountry(detected);
      });
    }
  }, [detectedCountry, setDetectedCountry]);

  const navLinks = [
    { href: "/", label: t.nav.home },
    { href: "/products", label: t.nav.products },
    { href: "/brands", label: t.nav.brands },
    { href: "/products?category=Skin+Care", label: t.nav.skinCare },
    { href: "/products?category=Hair+Care", label: t.nav.hairCare },
    { href: "/products?category=Body+Care", label: t.nav.bodyCare },
    { href: "/products?category=Fragrances", label: t.nav.fragrances },
    { href: "/offers", label: "🎉 Offers" },
  ];

  const [visible, setVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.user-dropdown-container')) {
        setUserMenuOpen(false);
      }
    };
    
    if (userMenuOpen) {
      document.addEventListener('click', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [userMenuOpen]);

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
  const isUserAuthenticated = status === "authenticated" && session?.user?.role !== "ADMIN" && session?.user?.role !== "SUPERADMIN";
  
  useEffect(() => {
    if (isUserAuthenticated) {
        fetch("/api/account/address").then(r => r.json()).then(data => {
            setHasAddress(!!data);
        });
    }
  }, [isUserAuthenticated, setHasAddress]);

  // Close menus on navigation
  useEffect(() => {
    setUserMenuOpen(false);
    setMobileOpen(false);
  }, [safePathname]);

  const cartCount = items.reduce((acc, item) => acc + item.quantity, 0);

  const userLabel = useMemo(() => {
    const u = session?.user;
    if (!u) return null;
    // Hide user session if they have admin role (treat as not logged in on user site)
    if (u.role === "ADMIN" || u.role === "SUPERADMIN") return null;
    return u.name?.trim() || u.email?.trim() || t.nav.account;
  }, [session?.user, t.nav.account]);

  function onUserButtonClick() {
    if (isUserAuthenticated) {
      setUserMenuOpen(true);
    } else {
      setAuthOpen(true);
    }
  }

  const isHomePage = safePathname === "/";
  
  return (
    <>
      <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 transform ${
        scrolled ? "glass-nav shadow-md" : "bg-transparent"
      } ${visible ? "translate-y-0" : "-translate-y-full"}`}
    >
      <div className="max-w-[1920px] mx-auto py-2 flex items-center justify-center px-0">
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

        {/* Desktop layout - centered */}
        <div className="hidden lg:flex items-center justify-center">
          <div className="-ml-16">
            <Logo />
          </div>

          {/* Navigation - centered */}
          <div className="ml-16 mr-32 flex-1 flex justify-center">
            <div className="glass-panel rounded-full px-8 py-3">
              <div className="flex items-center gap-2">
                {navLinks.map((link) => {
                const isOffers = link.href === "/offers";
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-3 py-2 text-sm font-body font-bold tracking-wide transition-all duration-300 rounded-full relative overflow-hidden group whitespace-nowrap hover:scale-105 hover:bg-emerald-50 ${safePathname === link.href ? "text-emerald-700 bg-emerald-100" : "text-black/70 hover:text-emerald-700"} ${isOffers ? "animate-pulse" : ""}`}
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

          {/* User + Actions dropdown */}
          <div className="relative -ml-4 flex items-center gap-2">
            {/* Dynamic Flag - Clickable to open Currency Selector */}
            {mounted && (
              <CurrencySelector />
            )}
            
            {/* User Button - SEPARATE */}
            <button
              type="button"
              onClick={() => {
                if (status === "authenticated") {
                  setUserMenuOpen(!userMenuOpen);
                } else {
                  setAuthOpen(true);
                }
              }}
              className="inline-flex h-16 items-center gap-2 rounded-full px-2 text-lg font-semibold text-black transition hover:bg-black/5"
              aria-label={userLabel ? "Open user menu" : "Sign in"}
            >
              <div className="relative flex items-center">
                <UserRound size={24} />
              </div>
              <span className="uppercase tracking-wide">{userLabel ?? t.nav.signIn}</span>
              {mounted && cartCount > 0 && (
                <div className="relative flex items-center ml-2">
                  <ShoppingBag size={24} />
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[8px] flex items-center justify-center font-bold">
                    {cartCount > 9 ? "9+" : cartCount}
                  </span>
                </div>
              )}
            </button>
            
            {/* Dropdown with User options, Currency, Language, Cart */}
            {userMenuOpen && (
              <div className="user-dropdown-container absolute right-0 top-full mt-2 w-60 glass-panel-heavy rounded-2xl p-3 border border-black/5 shadow-xl z-50">
                {/* User Section - only when logged in */}
                {status === "authenticated" && (
                  <div className="pb-2 mb-2 border-b border-black/5">
                    <div className="px-2 py-1">
                      <div className="text-sm font-bold text-black">{session?.user?.name}</div>
                      <div className="text-xs text-black/50">{session?.user?.email}</div>
                    </div>
                  </div>
                )}
                
                <div className="space-y-1">
                  {/* Currency & Language - horizontal row */}
                  <div className="flex flex-row gap-2 px-2 py-1">
                    <div className="flex-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-black/30 block mb-1">Currency</span>
                      <CurrencySelector />
                    </div>
                    <div className="flex-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-black/30 block mb-1">Language</span>
                      <LanguageSelector />
                    </div>
                  </div>
                  
                  {/* User links - only when logged in */}
                  {status === "authenticated" && (
                    <>
                      <div className="my-1 h-px bg-black/5" />
                      <button type="button" onClick={() => { setUserMenuOpen(false); window.location.href = "/account"; }} className="flex items-center gap-2 px-2 py-2 text-sm font-semibold text-black/70 hover:bg-black/5 rounded-lg w-full">
                        Dashboard
                      </button>
                      <button type="button" onClick={() => { setUserMenuOpen(false); window.location.href = "/account/orders"; }} className="flex items-center gap-2 px-2 py-2 text-sm font-semibold text-black/70 hover:bg-black/5 rounded-lg w-full">
                        Orders
                      </button>
                      <button type="button" onClick={() => { setUserMenuOpen(false); window.location.href = "/account/profile"; }} className="flex items-center gap-2 px-2 py-2 text-sm font-semibold text-black/70 hover:bg-black/5 rounded-lg w-full">
                        Profile
                      </button>
                    </>
                  )}
                  
                  <div className="my-1 h-px bg-black/5" />
                  
                  {/* Cart */}
                  <Link href="/cart" onClick={() => setUserMenuOpen(false)} className="flex items-center justify-between px-2 py-2 text-sm font-semibold text-black/70 hover:bg-black/5 rounded-lg">
                    <span className="flex items-center gap-2">
                      <ShoppingBag size={16} />
                      Cart
                    </span>
                    {cartCount > 0 && (
                      <span className="w-5 h-5 rounded-full bg-black text-white text-xs flex items-center justify-center font-bold">
                        {cartCount}
                      </span>
                    )}
                  </Link>

                  {/* Sign Out - only when logged in */}
                  {status === "authenticated" && (
                    <button 
                      type="button"
                      onClick={async () => { 
                        setUserMenuOpen(false); 
                        await signOut({ callbackUrl: "/" });
                      }} 
                      className="flex items-center gap-2 px-2 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-lg w-full cursor-pointer"
                    >
                      Sign Out
                    </button>
                  )}
                </div>
              </div>
            )}
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
