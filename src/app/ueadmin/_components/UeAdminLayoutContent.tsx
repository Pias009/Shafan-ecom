"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AdminSidebar } from "./AdminSidebar";
import { AdminTopbar } from "./AdminTopbar";
import { CommandPalette } from "./CommandPalette";
import { AdminSessionProvider, type AdminUser } from "./AdminSessionContext";

const COLLAPSE_KEY = "adm-sidebar-collapsed";

function isAuthPath(pathname: string | null) {
  return !!pathname && (
    pathname.startsWith("/ueadmin/login") ||
    pathname.startsWith("/ueadmin/verify") ||
    pathname.startsWith("/ueadmin/setup") ||
    pathname.startsWith("/ueadmin/unauthorized")
  );
}

export function UeAdminLayoutContent({ user, children }: { user: AdminUser | null; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const authPage = isAuthPath(pathname);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    try { setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "1"); } catch {}
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      try { localStorage.setItem(COLLAPSE_KEY, prev ? "0" : "1"); } catch {}
      return !prev;
    });
  };

  // Close the mobile drawer on navigation.
  useEffect(() => setMobileOpen(false), [pathname]);

  // The middleware already rejects missing/forged tokens; this covers a valid
  // token whose user is no longer an admin.
  useEffect(() => {
    if (!authPage && !user) router.replace("/ueadmin/login");
  }, [authPage, user, router]);

  useEffect(() => {
    if (authPage) return;
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      } else if (mod && e.key.toLowerCase() === "b") {
        e.preventDefault();
        if (window.matchMedia("(min-width: 1024px)").matches) toggleCollapsed();
        else setMobileOpen((v) => !v);
      } else if (e.key === "Escape") {
        setMobileOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [authPage]);

  if (authPage) {
    return (
      <AdminSessionProvider user={user}>
        <div className="admin-scope min-h-screen select-text" data-admin-panel="true" data-lenis-prevent="true">
          {children}
        </div>
      </AdminSessionProvider>
    );
  }

  if (!user) return null;

  // Kira HQ is a full-screen workspace with its own top bar (and a link back to the admin).
  if (pathname?.startsWith("/ueadmin/kira")) {
    return (
      <AdminSessionProvider user={user}>
        <div className="admin-scope adm-raw select-text" data-admin-panel="true" data-lenis-prevent="true">
          {children}
        </div>
      </AdminSessionProvider>
    );
  }

  return (
    <AdminSessionProvider user={user}>
      <div
        className="admin-scope flex h-dvh overflow-hidden bg-[#F6F7F9] text-slate-900 select-text"
        data-admin-panel="true"
        data-lenis-prevent="true"
      >
        {/* Desktop sidebar */}
        <div className="hidden shrink-0 lg:block">
          <AdminSidebar collapsed={collapsed} onOpenSearch={() => setPaletteOpen(true)} />
        </div>

        {/* Mobile drawer */}
        <div
          className={`fixed inset-0 z-40 bg-slate-950/50 transition-opacity duration-200 lg:hidden ${mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}
          onClick={() => setMobileOpen(false)}
          aria-hidden={!mobileOpen}
        />
        <div
          className={`fixed inset-y-0 left-0 z-50 shadow-2xl transition-transform duration-200 ease-out lg:hidden ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
        >
          <AdminSidebar
            onClose={() => setMobileOpen(false)}
            onOpenSearch={() => { setMobileOpen(false); setPaletteOpen(true); }}
          />
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <AdminTopbar
            onOpenMobileNav={() => setMobileOpen(true)}
            onToggleCollapse={toggleCollapsed}
            onOpenSearch={() => setPaletteOpen(true)}
          />
          <main
            id="admin-main"
            className="custom-scrollbar min-w-0 flex-1 overflow-y-auto overflow-x-hidden"
            data-lenis-prevent="true"
          >
            <div className="mx-auto w-full max-w-[1600px] px-4 pb-16 pt-6 sm:px-6 lg:px-8">
              {children}
            </div>
          </main>
        </div>

        <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} isSuper={user.role === "SUPERADMIN"} />
      </div>
    </AdminSessionProvider>
  );
}
