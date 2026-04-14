"use client";

import Link from "next/link";
import { ShoppingBag, UserRound, Menu, X, Tag, Sparkles, Search, CheckCircle, ArrowRight } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { useMemo, useState, useEffect, useCallback } from "react";
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
import { SearchOverlay } from "./SearchOverlay";
import { createPortal } from "react-dom";

export function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [authOpen, setAuthOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [orderNotification, setOrderNotification] = useState<string | null>(null);
  
  // Check for recent order notification
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const recentOrder = localStorage.getItem('recent_order');
      if (recentOrder) {
        setOrderNotification(recentOrder);
        
        // Remove from storage immediately so it only shows once
        localStorage.removeItem('recent_order');
        
        // Auto hide after 3 seconds
        const timer = setTimeout(() => {
          setOrderNotification(null);
        }, 3000);
        
        return () => clearTimeout(timer);
      }
    }
  }, []);
  
  const handleOrderClick = () => {
    if (orderNotification) {
      localStorage.removeItem('recent_order');
      setOrderNotification(null);
      router.push(`/account/orders/${orderNotification}`);
    }
  };
  
  const handleSearchClose = useCallback(() => setSearchOpen(false), []);
  
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
      
      // Smart-Hide: Disable scroll hide when mobile menu is open (Force-Locked-Fixed)
      if (mobileOpen) {
        setVisible(true);
        return;
      }
      
      // Hide navbar when scrolling down, show when scrolling up
      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        // Scrolling down - hide
        setVisible(false);
      } else if (currentScrollY < lastScrollY) {
        // Scrolling up - show
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
  }, [lastScrollY, mobileOpen]);

  // Sync address status
  const setHasAddress = useCartStore((state) => state.setHasAddress);
  const hasAddress = useCartStore((state) => state.hasAddress);
  const isUserAuthenticated = status === "authenticated" && session?.user?.role !== "ADMIN" && session?.user?.role !== "SUPERADMIN";
  
  useEffect(() => {
    if (isUserAuthenticated && setHasAddress) {
        fetch("/api/account/address").then(r => r.json()).then(data => {
            setHasAddress(!!data);
        }).catch(() => {
            setHasAddress(false);
        });
    }
  }, [isUserAuthenticated, setHasAddress]);

  // Close menus on navigation and lock scroll
  useEffect(() => {
    setUserMenuOpen(false);
    setMobileOpen(false);
  }, [safePathname]);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [mobileOpen]);

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
        className={`fixed top-0 left-0 right-0 z-40 transition-[transform,background-color,backdrop-filter] duration-300 glass-nav ${
          scrolled ? "shadow-md" : "lg:shadow-none shadow-sm"
        } ${
          mobileOpen
            ? "translate-y-0 !fixed top-0 bg-white z-[100000]"
            : visible
            ? "translate-y-0"
            : "-translate-y-full"
        }`}
        style={{
          willChange: "transform",
          ...(mobileOpen ? {
            position: "fixed",
            top: 0,
            background: "#ffffff",
            opacity: 1,
            zIndex: 100000,
            transform: "translateY(0)",
          } : {})
        }}
      >
      <div className="max-w-[1920px] mx-auto py-2 flex items-center justify-center px-0">
        {/* Mobile layout: Logo centered */}
        <div className="flex items-center justify-between w-full lg:hidden px-6 py-1">
          {/* Left: Menu button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 text-black hover:bg-black/5 rounded-full transition-colors"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          
          {/* Logo centered */}
          <div className="flex-shrink-0 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <Logo />
          </div>
          
          {/* Right: Actions */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="p-2 text-black hover:bg-black/5 rounded-full transition-colors"
              aria-label="Search"
            >
              <Search size={20} />
            </button>
          </div>
        </div>

        {/* Desktop layout - centered */}
        <div className="hidden lg:flex items-center justify-between w-full px-8">
          <div className="flex-shrink-0">
            <Logo />
          </div>

          {/* Navigation - centered */}
          <div className="flex-1 flex justify-center px-4">
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
          <div className="relative flex items-center gap-2">
            {/* Search Button */}
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="inline-flex h-16 items-center justify-center rounded-full px-3 text-black transition hover:bg-black/5"
              aria-label="Search"
            >
              <Search size={22} />
            </button>

            {/* Dynamic Flag - Clickable to open Currency Selector */}
            {mounted && (
              <CurrencySelector direction="down" />
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
                      <CurrencySelector direction="down" />
                    </div>
                    <div className="flex-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-black/30 block mb-1">Language</span>
                      <LanguageSelector direction="down" />
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

      </header>

      {/* Mobile menu - Rendered via Portal for absolute overlay */}
      {mounted && typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ 
                opacity: 1,
                y: 0,
                top: 0,
                left: 0,
                right: 0,
                bottom: 0
              }}
              exit={{ 
                opacity: 0,
                y: 20,
                transition: { duration: 0.2 }
              }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="md:hidden fixed inset-0 z-[99999]"
              style={{
                background: "rgba(255, 255, 255, 0.96)",
                backdropFilter: "blur(12px) saturate(120%)",
                WebkitBackdropFilter: "blur(12px) saturate(120%)",
                position: "fixed",
                top: 0,
                left: 0,
                width: "100vw",
                height: "100dvh",
                willChange: "transform, opacity",
              }}
            >
              {/* Background Accent */}
              <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[40%] bg-emerald-100/50 rounded-full blur-[100px] pointer-events-none" />
              <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[40%] bg-teal-50/50 rounded-full blur-[100px] pointer-events-none" />

              <div className="relative flex flex-col h-full overflow-hidden">
                {/* Header Section */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-black/5 bg-white/20 backdrop-blur-md">
                  <Logo />
                  <button
                    onClick={() => setMobileOpen(false)}
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-black text-white shadow-xl shadow-black/20"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto px-6 py-8 pb-32">
                  {/* User Greeting Section */}
                  <div className="flex items-center gap-4 mb-10 p-4 rounded-3xl bg-black/5 border border-black/5">
                    <div className="w-14 h-14 rounded-full bg-black flex items-center justify-center text-white shadow-lg">
                      <UserRound size={24} />
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-black/30">Welcome back</p>
                      <p className="font-bold text-lg text-black">{userLabel ?? "Guest User"}</p>
                    </div>
                    <button 
                      onClick={() => {
                        if (status === "authenticated") router.push("/account");
                        else setAuthOpen(true);
                        setMobileOpen(false);
                      }}
                      className="p-3 rounded-2xl bg-white text-black shadow-sm"
                    >
                      <ArrowRight size={18} />
                    </button>
                  </div>

                  {/* Main Navigation - High Level Links */}
                  <div className="space-y-6 mb-12">
                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-black/20 px-1">Shop Collections</p>
                    <div className="flex flex-col gap-1">
                      {navLinks.slice(0, 7).map((link, idx) => {
                        const isOffers = link.href === "/offers";
                        return (
                          <Link
                            key={link.href}
                            href={link.href}
                            onClick={() => setMobileOpen(false)}
                            className="flex items-center justify-between group py-2"
                          >
                            <span className={`text-2xl pl-4 font-black tracking-tighter transition-all duration-300 ${isOffers ? "text-emerald-700 italic" : "text-black group-hover:pl-8"}`}>
                              {link.label.replace("🎉 ", "")}
                            </span>
                            <span className={`w-8 h-px transition-all duration-300 ${isOffers ? "bg-emerald-700 opacity-50" : "bg-black/10 group-hover:w-16 group-hover:bg-black"}`} />
                          </Link>
                        );
                      })}
                    </div>
                  </div>

                  {/* Utility Grid */}
                  <div className="grid grid-cols-2 gap-3 mb-12">
                    <Link 
                      href="/cart"
                      onClick={() => setMobileOpen(false)}
                      className="p-5 rounded-3xl bg-white border border-black/5 shadow-sm flex flex-col gap-3"
                    >
                      <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center">
                        <ShoppingBag size={20} />
                      </div>
                      <div>
                        <p className="font-black text-sm text-black">My Cart</p>
                        <p className="text-[10px] font-bold text-black/40 uppercase tracking-widest">{cartCount} Items</p>
                      </div>
                    </Link>
                    <button 
                      onClick={() => { setMobileOpen(false); setSearchOpen(true); }}
                      className="p-5 rounded-3xl bg-white border border-black/5 shadow-sm flex flex-col gap-3 text-left"
                    >
                      <div className="w-10 h-10 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center">
                        <Search size={20} />
                      </div>
                      <div>
                        <p className="font-black text-sm text-black">Search</p>
                        <p className="text-[10px] font-bold text-black/40 uppercase tracking-widest">Find Products</p>
                      </div>
                    </button>
                  </div>

                  {/* Account & Support Grid */}
                  <div className="grid grid-cols-2 gap-3 mb-10">
                    <Link href="/account/orders" onClick={() => setMobileOpen(false)} className="px-4 py-3 rounded-2xl bg-black/5 text-black text-[11px] font-black uppercase tracking-widest text-center">My Orders</Link>
                    <Link href="/contact" onClick={() => setMobileOpen(false)} className="px-4 py-3 rounded-2xl bg-black/5 text-black text-[11px] font-black uppercase tracking-widest text-center">Support</Link>
                  </div>
                </div>

                  {/* Bottom Sticky Section */}
                <div className="mt-auto bg-white/60 backdrop-blur-xl border-t border-black/5 p-6 pb-20">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                      <LanguageSelector align="left" direction="up" />
                      <CurrencySelector align="left" direction="up" />
                    </div>
                    {status === "authenticated" && (
                      <button 
                        onClick={() => { setMobileOpen(false); signOut({ callbackUrl: "/" }); }}
                        className="text-[11px] font-black uppercase tracking-widest text-red-600 px-4 py-2"
                      >
                        Sign Out
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
      
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
      <AnimatePresence>
        {searchOpen && <SearchOverlay onClose={handleSearchClose} />}
      </AnimatePresence>
      
      {/* Post-order notification card */}
      <AnimatePresence>
        {orderNotification && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-50 max-w-sm"
          >
            <div 
              onClick={handleOrderClick}
              className="glass-panel-heavy cursor-pointer rounded-2xl p-4 md:p-5 border border-green-200 shadow-xl shadow-green-100/50 bg-white/90 backdrop-blur-xl hover:scale-105 transition-transform"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-green-100 rounded-full shrink-0">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-black">Order Placed!</p>
                  <p className="text-xs text-black/60 mt-0.5">Check your order details here</p>
                  <p className="text-[10px] font-bold text-green-600 mt-2 uppercase tracking-wider">View Order</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
