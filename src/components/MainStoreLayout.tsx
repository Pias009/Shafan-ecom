"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { MobileBottomNav } from "./MobileBottomNav";
import Sesi from "./Sesi";

export function MainStoreLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [showSesi, setShowSesi] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      const hostname = window.location.hostname;
      // Show Sesi only on localhost or Vercel preview domains
      // It will not show on the actual production custom domain
      if (hostname === "localhost" || hostname === "127.0.0.1" || hostname.includes("vercel.app")) {
        setShowSesi(true);
      }
    }
  }, []);

  const isAdmin = pathname?.startsWith("/ueadmin");

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-col min-h-screen overflow-x-hidden">
      <Navbar />
      <main className="flex-1 pt-16 overflow-x-hidden">
        {children}
      </main>
      <Footer />
      <MobileBottomNav />
      {showSesi && <Sesi />}
    </div>
  );
}
