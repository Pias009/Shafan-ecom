"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { AdminSidebar } from './AdminSidebar';
import AdminGuard from './AdminGuard';
import { OrderAlertListener } from './OrderAlertListener';

export function UeAdminLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const isAuthPage =
    pathname?.startsWith("/ueadmin/login") ||
    pathname?.startsWith("/ueadmin/verify") ||
    pathname?.startsWith("/ueadmin/setup") ||
    pathname?.startsWith("/ueadmin/unauthorized");

  if (isAuthPage) {
    return (
      <AdminGuard>
        <OrderAlertListener />
        <div
          className="admin-scope min-h-screen flex bg-[#FAF9F6] selection:bg-black selection:text-white select-text"
          data-admin-panel="true"
          data-lenis-prevent="true"
        >
          <main className="flex-1 w-full min-h-screen flex flex-col">
            {children}
          </main>
        </div>
      </AdminGuard>
    );
  }

  return (
    <AdminGuard>
      <OrderAlertListener />
      <div
        className="admin-scope min-h-screen flex flex-col bg-[#FAF9F6] selection:bg-black selection:text-white select-text"
        data-admin-panel="true"
        data-lenis-prevent="true"
      >
        {/* Desktop Fixed Sidebar */}
        <div
          className="fixed inset-y-0 left-0 hidden lg:block z-40 w-80 h-screen"
          data-lenis-prevent="true"
        >
          <AdminSidebar />
        </div>

        {/* Mobile Top Header with Navigation Toggle */}
        <header className="lg:hidden sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-black/5 px-6 py-3.5 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-black rounded-xl flex items-center justify-center text-white font-black text-sm">
              S
            </div>
            <div>
              <span className="font-black text-xs uppercase tracking-widest text-black">
                SHANFA Admin
              </span>
            </div>
          </div>
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 bg-black/5 hover:bg-black/10 rounded-xl text-black transition-colors"
            aria-label="Open Navigation Menu"
          >
            <Menu size={20} />
          </button>
        </header>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div
              className="relative w-80 max-w-[85vw] h-full bg-white z-10 shadow-2xl flex flex-col"
              data-lenis-prevent="true"
            >
              <AdminSidebar onClose={() => setMobileMenuOpen(false)} />
            </div>
          </div>
        )}

        {/* Main Content Area - Native OS Smooth Scrolling */}
        <main
          className="flex-1 lg:pl-80 w-full min-h-screen flex flex-col pt-6 lg:pt-12 px-4 sm:px-8 lg:px-12 overflow-x-hidden"
          data-lenis-prevent="true"
        >
          <div className="flex-1 pb-16">
            {children}
          </div>
        </main>
      </div>
    </AdminGuard>
  );
}
