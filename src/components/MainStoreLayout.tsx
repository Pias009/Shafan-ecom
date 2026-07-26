"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { MobileBottomNav } from "./MobileBottomNav";
import Sesi from "./Sesi";
import SesiOnboarding from "./SesiOnboarding";

export function MainStoreLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [showSesi, setShowSesi] = useState(false);

  useEffect(() => {
    setShowSesi(true);
  }, []);

  const isAdmin = pathname?.startsWith("/ueadmin");
  const isDoctorSasi = pathname?.startsWith("/doctor-sasi");

  if (isAdmin || isDoctorSasi) {
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
      {showSesi && <SesiOnboarding />}
    </div>
  );
}
