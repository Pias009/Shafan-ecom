"use client";

import Link from "next/link";
import { ShoppingBag, UserRound, Menu, X, Tag, Sparkles, Search, CheckCircle, ArrowRight } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { useMemo, useState, useEffect, useCallback, useRef, useSyncExternalStore } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { AuthModal } from "./AuthModal";
import { UserDropdown } from "./UserDropdown";
import { LanguageSelector } from "./LanguageSelector";
import { CountrySelector } from "./CountrySelector";
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
  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const items = useCartStore((state) => state.items);
  const { currentLanguage } = useLanguageStore();
  const { selectedCountry, detectedCountry, setDetectedCountry } = useCountryStore();

  const t = translations[(isClient ? currentLanguage.code : "en") as keyof typeof translations];

  // Country detection is now handled by GlobalInitializer


  const navLinks = [
    { href: "/", label: t.nav.home },
    { href: "/products", label: "PRODUCTS" },
    { href: "#", label: "CATEGORIES" },
    { href: "/products/routine", label: "ROUTINE" },
    { href: "/offers", label: "🎉 OFFERS" },
    { href: "/about", label: "ABOUT US" },
    { href: "/blog", label: "BLOG" },
  ];

  const [visible, setVisible] = useState(true);

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

  const lastScrollYRef = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const currentScrollY = window.scrollY;
      setScrolled(currentScrollY > 20);
      
      // Smart-Hide: Disable scroll hide when mobile menu is open
      if (mobileOpen) {
        setVisible(true);
        return;
      }
      
      // Hide navbar when scrolling down, show when scrolling up
      if (currentScrollY > lastScrollYRef.current && currentScrollY > 50) {
        setVisible(false);
      } else if (currentScrollY < lastScrollYRef.current) {
        setVisible(true);
      }
      lastScrollYRef.current = currentScrollY;
    };
    
    const debouncedScroll = () => {
      window.requestAnimationFrame(onScroll);
    };
    
    window.addEventListener("scroll", debouncedScroll, { passive: true });
    return () => window.removeEventListener("scroll", debouncedScroll);
  }, [mobileOpen]);

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
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          scrolled ? "bg-[#50aba1]/95 backdrop-blur-md shadow-md text-white" : "bg-[#50aba1]/90 backdrop-blur-md text-white border-b border-white/10"
        } ${
          mobileOpen
            ? "translate-y-0 !fixed top-0 bg-white text-[#0c3a32] z-[100000]"
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
        {/* Top Announcement Bar matching Reference UI */}
        <div className="bg-[#083029] text-white/95 text-[10.5px] sm:text-[11px] py-1.5 px-4 hidden md:block border-b border-emerald-900/40">
          <div className="max-w-[1536px] mx-auto flex items-center justify-between font-medium">
            <div className="flex items-center gap-2">
              <span>🚚 Free Shipping on Orders Over $50</span>
            </div>
            <div className="flex items-center gap-4 text-white/80 text-[10.5px]">
              <Link href="/account/orders" className="hover:text-white transition-colors">Track Order</Link>
              <span className="text-white/30">|</span>
              <Link href="/faq" className="hover:text-white transition-colors">FAQ</Link>
              <span className="text-white/30">|</span>
              <Link href="/stores" className="hover:text-white transition-colors">Store Locator</Link>
              <span className="text-white/30">|</span>
              <Link href="/contact" className="hover:text-white transition-colors">Contact Us</Link>
            </div>
          </div>
        </div>

        <div className="max-w-[1536px] mx-auto py-2.5 flex items-center justify-between px-4 sm:px-6">
          
          {/* Mobile layout */}
          <div className="flex items-center justify-between w-full lg:hidden py-1">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 text-white hover:bg-white/10 rounded-full transition-colors"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={22} className="text-[#0c3a32]" /> : <Menu size={22} />}
            </button>
            
            {/* Logo centered */}
            <div className="flex-shrink-0">
              <Logo light={!mobileOpen} />
            </div>
            
            {/* Right: Actions */}
            <div className="flex items-center gap-1 text-white">
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                aria-label="Search"
              >
                <Search size={20} />
              </button>
            </div>
          </div>

          {/* Desktop layout matching Reference UI */}
          <div className="hidden lg:flex items-center justify-between w-full">
            <div className="flex-shrink-0">
              <Logo light={true} />
            </div>

            {/* Navigation - Centered */}
            <div className="flex-1 flex justify-center px-4">
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-6 py-1.5 shadow-sm">
                <div className="flex items-center gap-1">
                  {navLinks.map((link) => {
                    const isOffers = link.href === "/offers";
                    const isActive = safePathname === link.href;
                    
                    if (link.label === "CATEGORIES") {
                      return (
                        <div className="relative group px-0.5" key="categories">
                          <button className="px-3.5 py-1.5 text-xs font-black tracking-widest uppercase transition-all duration-300 rounded-full flex items-center gap-1 text-white/90 hover:text-white hover:bg-white/20">
                            CATEGORIES
                          </button>
                          <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-300">
                            <div className="bg-white rounded-2xl shadow-xl border border-black/5 p-2 w-48 flex flex-col">
                              <Link href="/products?category=Skin+Care" className="px-4 py-2.5 text-xs font-bold text-[#0c433a]/70 hover:text-[#0c433a] hover:bg-black/5 rounded-xl transition-colors">Skin Care</Link>
                              <Link href="/products?category=Body+Care" className="px-4 py-2.5 text-xs font-bold text-[#0c433a]/70 hover:text-[#0c433a] hover:bg-black/5 rounded-xl transition-colors">Body Care</Link>
                              <Link href="/products?category=Hair+Care" className="px-4 py-2.5 text-xs font-bold text-[#0c433a]/70 hover:text-[#0c433a] hover:bg-black/5 rounded-xl transition-colors">Hair Care</Link>
                              <div className="border-t border-black/5 my-1" />
                              <Link href="/products" className="px-4 py-2.5 text-xs font-black text-[#0c433a] hover:bg-black/5 rounded-xl transition-colors">All Categories</Link>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        prefetch={true}
                        onMouseEnter={() => router.prefetch(link.href)}
                        className={`px-3.5 py-1.5 text-xs font-black tracking-widest uppercase transition-all duration-300 rounded-full relative overflow-hidden whitespace-nowrap ${
                          isActive 
                            ? "text-[#0c433a] bg-white shadow-sm font-black" 
                            : "text-white/90 hover:text-white hover:bg-white/20"
                        } ${isOffers ? "animate-pulse" : ""}`}
                      >
                        {isOffers && (
                          <Sparkles className="inline-block w-3 h-3 mr-1 text-amber-300 animate-spin-slow" />
                        )}
                        {link.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Actions: Search & Consolidated Menu */}
            <div className="relative flex items-center gap-2">
              {/* Search Button */}
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="p-2 rounded-full text-white hover:bg-white/15 transition"
                aria-label="Search"
              >
                <Search size={20} />
              </button>

              {/* Consolidated Menu */}
              <div className="relative group">
                <button
                  type="button"
                  className="p-2 rounded-full text-white hover:bg-white/15 transition flex items-center gap-1.5"
                  aria-label="Menu"
                >
                  <UserRound size={20} />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400 text-[#0c433a] font-black text-[9px] flex items-center justify-center shadow-md">
                      {cartCount}
                    </span>
                  )}
                </button>
                <div className="absolute top-full right-0 pt-2 opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-300">
                  <div className="bg-white rounded-2xl shadow-xl border border-black/5 p-3 w-56 flex flex-col gap-1 text-[#0c433a]">
                    <Link href="/cart" className="flex items-center justify-between px-3 py-2.5 text-xs font-bold hover:bg-black/5 rounded-xl transition-colors">
                      <div className="flex items-center gap-2"><ShoppingBag size={16} /> My Cart</div>
                      {cartCount > 0 && <span className="bg-[#0c433a] text-white px-2 py-0.5 rounded-full text-[10px]">{cartCount}</span>}
                    </Link>
                    <button onClick={onUserButtonClick} className="flex items-center gap-2 px-3 py-2.5 text-xs font-bold hover:bg-black/5 rounded-xl text-left w-full transition-colors">
                      <UserRound size={16} /> {userLabel || "Account"}
                    </button>
                    <div className="border-t border-black/5 my-2" />
                    {isClient && (
                      <div className="flex flex-col gap-3 px-3 py-1">
                        <CountrySelector direction="down" />
                        <LanguageSelector direction="down" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </header>

      {/* Mobile menu - Rendered via Portal for absolute overlay */}
      {isClient && createPortal(
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
                        router.push("/account");
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
                      {navLinks.map((link, idx) => {
                        const isOffers = link.href === "/offers";
                        
                        if (link.label === "CATEGORIES") {
                          return (
                            <div key="mobile-cats" className="py-2 pl-4">
                              <span className="text-2xl font-black tracking-tighter text-black">Categories</span>
                              <div className="flex flex-col gap-2 mt-3 pl-4 border-l-2 border-black/10">
                                <Link href="/products?category=Skin+Care" onClick={() => setMobileOpen(false)} className="text-lg font-bold text-black/60">Skin Care</Link>
                                <Link href="/products?category=Body+Care" onClick={() => setMobileOpen(false)} className="text-lg font-bold text-black/60">Body Care</Link>
                                <Link href="/products?category=Hair+Care" onClick={() => setMobileOpen(false)} className="text-lg font-bold text-black/60">Hair Care</Link>
                              </div>
                            </div>
                          );
                        }

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
                      <CountrySelector align="left" direction="up" compact />
                      <LanguageSelector align="left" direction="up" />
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
