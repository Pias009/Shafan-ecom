"use client";

import { AnimatePresence, motion } from "framer-motion";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { User, ShoppingCart, Package, LogOut, Shield, LayoutDashboard } from "lucide-react";

export function UserDropdown({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { data } = useSession();
  const userName = data?.user?.name?.split(" ")[0] || data?.user?.email?.split("@")[0] || "User";

  return (
    <AnimatePresence>
      {open ? (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-md cursor-default"
            role="dialog"
            aria-modal="true"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute right-0 top-full mt-2 w-60 origin-top-right z-50"
          >
            <div className="glass-panel-heavy shadow-2xl relative overflow-hidden rounded-2xl border border-black/5">
              <div className="p-2">
                <div className="px-3 py-2">
                  <div className="truncate text-sm font-bold text-black">{data?.user?.name}</div>
                  <div className="truncate text-xs text-black/60">{data?.user?.email}</div>
                </div>
                <div className="my-1 h-px bg-black/5" />
                <div className="grid gap-1">
                  <Link 
                    href="/account" 
                    onClick={onClose}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-black/80 hover:bg-black/5 hover:text-black transition-colors font-bold"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    Overview
                  </Link>
                  <Link 
                    href="/account/profile" 
                    onClick={onClose}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-black/80 hover:bg-black/5 hover:text-black transition-colors"
                  >
                    <User className="h-4 w-4" />
                    Profile
                  </Link>
                  <Link 
                    href="/account/orders" 
                    onClick={onClose}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-black/80 hover:bg-black/5 hover:text-black transition-colors"
                  >
                    <Package className="h-4 w-4" />
                    Orders
                  </Link>
                  <Link 
                    href="/cart" 
                    onClick={onClose}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-black/80 hover:bg-black/5 hover:text-black transition-colors"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    Cart
                  </Link>
                </div>
                <div className="my-1 h-px bg-black/5" />
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    signOut();
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-red-600/80 hover:bg-red-50 hover:text-red-600 transition-colors font-bold"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
