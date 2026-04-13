"use client";

import Link from "next/link";
import { ShoppingBag, UserRound, Menu, X, Tag, Sparkles, Search, CheckCircle } from "lucide-react";
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
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 glass-nav ${
          scrolled ? "shadow-md" : "lg:shadow-none shadow-sm"
        } ${
          mobileOpen
            ? "translate-y-0 !fixed top-0 bg-white z-[100000]"
            : visible
            ? "translate-y-0"
            : "-translate-y-full"
        }`}
        style={
          mobileOpen
            ? {
                position: "fixed",
                top: 0,
                background: "#ffffff",
                opacity: 1,
                zIndex: 100000,
                transform: "translateY(0)",
              }
            : undefined
        }
      >
      <div className="max-w-[1920px] mx-auto py-2 flex items-center justify-center px-0">
        {/* Mobile layout: Logo centered */}
        <div className="flex items-center justify-between w-full lg:hidden px-2">
          {/* Left: Search button */}
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="p-2 text-black hover:bg-black/5 rounded-lg transition-colors"
            aria-label="Search"
          >
            <Search size={18} />
          </button>
          
{/* Logo centered */}
          <div className="flex-shrink-0">
            <Logo />
          </div>
          
          {/* Right: Menu button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 text-black hover:bg-black/5 rounded-lg transition-colors"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
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

      {/* Mobile menu - Full page overlay with circular reveal */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="md:hidden fixed inset-0 z-50"
          >
            {/* Circular reveal animation */}
            <motion.div
              initial={{ scale: 0, borderRadius: "50%" }}
              animate={{ 
                scale: 1.175, 
                borderRadius: "0%",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0
              }}
              exit={{ 
                scale: 0, 
                borderRadius: "50%",
                transition: { delay: 0.1 }
              }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              className="absolute inset-0"
              style={{
                background: "rgba(255, 255, 255, 0.98)",
                backdropFilter: "blur(30px) saturate(150%)",
                WebkitBackdropFilter: "blur(30px) saturate(150%)",
                position: "fixed",
                top: 0,
                left: 0,
                width: "100vw",
                height: "100vh",
                zIndex: 9998,
              }}
            >
              {/* Close button */}
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/5 hover:bg-black/10 transition-colors z-10"
              >
                <X size={24} className="text-black" />
              </button>

              {/* Centered content */}
              <div className="flex flex-col items-center justify-center min-h-full py-20 px-6 space-y-6">
                {/* User section */}
                <div className="flex flex-col items-center gap-3 text-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-black/10 flex items-center justify-center">
                    <UserRound size={28} className="text-black" />
                  </div>
                  <div className="font-bold text-lg text-black">
                    {userLabel ? `Hello, ${userLabel}` : t.nav.signIn}
                  </div>
                  <button
                    onClick={() => {
                      if (status === "authenticated") {
                        window.location.href = "/account";
                      } else {
                        setAuthOpen(true);
                      }
                      setMobileOpen(false);
                    }}
                    className="text-sm font-bold px-6 py-2 rounded-full bg-black text-white"
                  >
                    {status === "authenticated" ? "View Profile" : "Sign In"}
                  </button>
                </div>

                {/* Settings row - horizontal on mobile */}
                <div className="flex items-center gap-2 py-2">
                  <LanguageSelector />
                  <CurrencySelector />
                </div>

                {/* Divider */}
                <div className="w-32 h-px bg-black/10" />

                {/* Main links - stacked */}
                <nav className="flex flex-col items-center gap-2">
                  <Link href="/" onClick={() => setMobileOpen(false)} className="text-center px-8 py-3 text-base font-bold tracking-widest rounded-full transition-colors text-black hover:bg-black/5">Home</Link>
                  <Link href="/products" onClick={() => setMobileOpen(false)} className="text-center px-8 py-3 text-base font-bold tracking-widest rounded-full transition-colors text-black hover:bg-black/5">Products</Link>
                  <Link href="/brands" onClick={() => setMobileOpen(false)} className="text-center px-8 py-3 text-base font-bold tracking-widest rounded-full transition-colors text-black hover:bg-black/5">Brands</Link>
                </nav>

                {/* Categories - 2 columns for Skin, Hair, Body, Fragrances */}
                <nav className="grid grid-cols-2 gap-2 w-full max-w-xs">
                  <Link href="/products?category=Skin+Care" onClick={() => setMobileOpen(false)} className="text-center px-3 py-2 text-sm font-semibold tracking-wide rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 transition-colors">Skin Care</Link>
                  <Link href="/products?category=Hair+Care" onClick={() => setMobileOpen(false)} className="text-center px-3 py-2 text-sm font-semibold tracking-wide rounded-full bg-purple-50 border border-purple-200 text-purple-700 hover:bg-purple-100 transition-colors">Hair Care</Link>
                  <Link href="/products?category=Body+Care" onClick={() => setMobileOpen(false)} className="text-center px-3 py-2 text-sm font-semibold tracking-wide rounded-full bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100 transition-colors">Body Care</Link>
                  <Link href="/products?category=Fragrances" onClick={() => setMobileOpen(false)} className="text-center px-3 py-2 text-sm font-semibold tracking-wide rounded-full bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 transition-colors">Fragrances</Link>
                </nav>

                {/* Offers */}
                <nav className="flex flex-col items-center gap-2">
                  <Link href="/offers" onClick={() => setMobileOpen(false)} className="text-center px-8 py-3 text-base font-bold tracking-widest rounded-full transition-colors text-black hover:bg-black/5">🎉 Offers</Link>
                </nav>

                {/* Divider */}
                <div className="w-32 h-px bg-black/10" />

                {/* Additional actions */}
                <div className="flex flex-col items-center gap-3 w-full">
                  <button
                    type="button"
                    onClick={() => {
                      setMobileOpen(false);
                      setSearchOpen(true);
                    }}
                    className="w-full text-center px-8 py-3 text-base font-bold tracking-widest rounded-full hover:bg-black/5 text-black"
                  >
                    Search
                  </button>

                  <Link
                    href="/cart"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-center gap-2 w-full px-8 py-3 text-base font-bold tracking-widest rounded-full hover:bg-black/5 text-black"
                  >
                    <ShoppingBag size={20} />
                    Cart
                    {mounted && cartCount > 0 && (
                      <span className="w-6 h-6 rounded-full bg-black text-white text-xs flex items-center justify-center font-bold">
                        {cartCount}
                      </span>
                    )}
                  </Link>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      </header>
      
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
