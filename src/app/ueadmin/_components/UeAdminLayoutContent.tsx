"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { PanelLeft, PanelLeftClose, Menu, X, Globe, Shield } from "lucide-react";
import { AdminSidebar } from './AdminSidebar';
import AdminGuard from './AdminGuard';

export function UeAdminLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // Left sidebar hidden by default so the panel is full width
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Keyboard shortcut: Escape to close, Ctrl+B / Cmd+B to toggle
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && sidebarOpen) {
        setSidebarOpen(false);
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        setSidebarOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [sidebarOpen]);

  const isAuthPage =
    pathname?.startsWith("/ueadmin/login") ||
    pathname?.startsWith("/ueadmin/verify") ||
    pathname?.startsWith("/ueadmin/setup") ||
    pathname?.startsWith("/ueadmin/unauthorized");

  if (isAuthPage) {
    return (
      <AdminGuard>
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
      <div
        className="admin-scope min-h-screen flex flex-col bg-[#FAF9F6] selection:bg-black selection:text-white select-text"
        data-admin-panel="true"
        data-lenis-prevent="true"
      >
        {/* ========================================================= */}
        {/* TOP COMPACT NAVIGATION HEADER WITH SIDEBAR TOGGLE ICON   */}
        {/* ========================================================= */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/90 px-4 sm:px-6 py-2.5 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            {/* Sidebar Toggle Icon Button */}
            <button
              onClick={() => setSidebarOpen((prev) => !prev)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-all cursor-pointer shadow-sm group active:scale-95"
              title={sidebarOpen ? "Hide Navigation Sidebar (Esc)" : "Render / Open Navigation Sidebar (Ctrl+B)"}
              aria-label="Toggle Navigation Sidebar"
            >
              {sidebarOpen ? (
                <PanelLeftClose size={18} className="text-cyan-300" />
              ) : (
                <PanelLeft size={18} className="text-cyan-300 group-hover:scale-110 transition-transform" />
              )}
              <span className="text-xs font-black uppercase tracking-wider hidden sm:inline">
                {sidebarOpen ? "Hide Menu" : "Menu"}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/20 text-white font-mono hidden md:inline">
                ⌘B
              </span>
            </button>

            <div className="h-4 w-px bg-slate-300 hidden sm:block" />

            {/* Brand Logo & Context */}
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-slate-900 rounded-lg flex items-center justify-center text-white font-black text-xs">
                S
              </div>
              <div>
                <span className="text-xs font-black uppercase tracking-widest text-slate-900 block leading-tight">
                  SHANFA Admin
                </span>
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none hidden sm:block">
                  Full Width Control Panel
                </span>
              </div>
            </div>
          </div>

          {/* Right Header Status Telemetry */}
          <div className="flex items-center gap-3">
            <div className="px-3 py-1 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 text-xs font-black uppercase tracking-wider hidden sm:flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Full Width Mode</span>
            </div>

            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors sm:hidden cursor-pointer"
              title="Open Navigation Menu"
              aria-label="Open Navigation Menu"
            >
              <Menu size={18} />
            </button>
          </div>
        </header>

        {/* ========================================================= */}
        {/* SLIDE-OUT DRAWER FOR LEFT SIDEBAR                         */}
        {/* ========================================================= */}
        {/* Dark Backdrop Overlay */}
        <div
          className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-xs transition-opacity duration-300 ${
            sidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
          onClick={() => setSidebarOpen(false)}
          aria-hidden={!sidebarOpen}
        />

        {/* Left Drawer Container */}
        <div
          className={`fixed inset-y-0 left-0 z-50 w-80 max-w-[85vw] h-screen bg-white shadow-2xl transition-transform duration-300 ease-in-out ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
          data-lenis-prevent="true"
        >
          <AdminSidebar onClose={() => setSidebarOpen(false)} />
        </div>

        {/* ========================================================= */}
        {/* FULL WIDTH MAIN CONTENT AREA                              */}
        {/* ========================================================= */}
        <main
          className="flex-1 w-full min-h-screen flex flex-col pt-4 px-3 sm:px-6 lg:px-8 overflow-x-hidden"
          data-lenis-prevent="true"
        >
          <div className="flex-1 pb-16 w-full">
            {children}
          </div>
        </main>
      </div>
    </AdminGuard>
  );
}
