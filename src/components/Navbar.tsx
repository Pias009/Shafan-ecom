"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ShoppingBag, UserRound } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { useSession } from "next-auth/react";
import { useMemo, useState } from "react";
import { AuthModal } from "./AuthModal";

export function Navbar() {
  const { data } = useSession();
  const [authOpen, setAuthOpen] = useState(false);

  const userLabel = useMemo(() => {
    const u = data?.user;
    if (!u) return null;
    return u.name?.trim() || u.email?.trim() || "Account";
  }, [data?.user]);

  return (
    <header className="sticky top-0 z-50">
      <div className="mx-auto max-w-6xl px-4 pt-4">
        <div className="glass glass-3d ring-icy rounded-2xl px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="flex items-center gap-2"
              >
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/10 text-white ring-1 ring-white/15">
                  ✦
                </div>
                <Link href="/" className="text-base font-semibold tracking-tight text-white">
                  Shafan
                </Link>
              </motion.div>

              <nav className="hidden items-center gap-4 pl-4 text-sm text-white/80 md:flex">
                <Link className="hover:text-white" href="#hot">
                  Hot
                </Link>
                <Link className="hover:text-white" href="#products">
                  Products
                </Link>
                <Link className="hover:text-white" href="#brands">
                  Brands
                </Link>
              </nav>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/cart"
                className="glass glass-3d ring-icy inline-flex h-10 items-center gap-2 rounded-full px-3 text-sm text-white/90 transition hover:text-white"
              >
                <ShoppingBag className="h-4 w-4" />
                Cart
              </Link>

              <button
                type="button"
                onClick={() => setAuthOpen(true)}
                className="glass glass-3d ring-icy inline-flex h-10 items-center gap-2 rounded-full px-3 text-sm font-semibold text-white/90 transition hover:text-white"
                aria-label={userLabel ? "Open user menu" : "Sign in or sign up"}
              >
                <span className="grid h-7 w-7 place-items-center rounded-full bg-white/10 ring-1 ring-white/15">
                  <UserRound className="h-4 w-4" />
                </span>
                <span className="hidden sm:inline">{userLabel ? userLabel : "Sign in"}</span>
              </button>

              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </header>
  );
}

