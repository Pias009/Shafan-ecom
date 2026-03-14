"use client";

import Link from "next/link";
import { ShoppingBag, UserRound, Menu, X } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { useSession } from "next-auth/react";
import { useMemo, useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { AuthModal } from "./AuthModal";
import { UserDropdown } from "./UserDropdown";
import { CurrencySelector } from "./CurrencySelector";
import { useCartStore } from "@/lib/cart-store";

const navLinks = [
  { href: "/", label: "HOME" },
  { href: "/brands", label: "BRANDS" },
  { href: "#hot", label: "HOT" },
  { href: "/products", label: "ALL PRODUCTS" },
];

export function Navbar() {
  const { data, status } = useSession();
  const pathname = usePathname();
  const [authOpen, setAuthOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const items = useCartStore((state) => state.items);

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
    const u = data?.user;
    if (!u) return null;
    return u.name?.trim() || u.email?.trim() || "Account";
  }, [data?.user]);

  function onUserButtonClick() {
    if (status === "authenticated") {
      setUserMenuOpen(true);
    } else {
      setAuthOpen(true);
    }
  }

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 transform ${
        scrolled ? "glass-nav shadow-sm" : "bg-transparent"
      } ${visible ? "translate-y-0" : "-translate-y-full"}`}
    >
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between relative">
        {/* Centered Desktop Nav */}
        <div className="hidden md:flex items-center gap-1 glass-panel rounded-full px-8 py-2 absolute left-1/2 -translate-x-1/2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-5 py-2 text-xs font-bold tracking-[0.1em] transition-all duration-300 rounded-full ${
                pathname === link.href
                  ? "text-black bg-black/5"
                  : "text-black/60 hover:text-black hover:bg-black/5"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 text-black"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Right side: Auth + Cart + Theme */}
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
              aria-label={userLabel ? "Open user menu" : "Sign in"}
            >
              <UserRound size={16} />
              <span className="hidden sm:inline uppercase tracking-wider">{userLabel ?? "Sign in"}</span>
            </button>
            <UserDropdown open={userMenuOpen} onClose={() => setUserMenuOpen(false)} />
          </div>

          <CurrencySelector />
          <ThemeToggle />
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
        </div>
      )}

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </header>
  );
}
