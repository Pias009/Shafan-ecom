"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { NoticeBoard } from "./NoticeBoard";

export function MainStoreLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Define paths where the store layout (Navbar/Footer) should NOT appear
  const isAdmin = pathname?.startsWith("/ueadmin");
  const isAuth = pathname?.startsWith("/auth");
  
  // If it's an admin page, just render children without store chrome
  if (isAdmin) {
    return <>{children}</>;
  }

  // NoticeBoard usually only shows on homepage or specific store pages
  const showNoticeBoard = pathname === "/";

  return (
    <div className="flex flex-col min-h-screen">
      {showNoticeBoard && <NoticeBoard />}
      <Navbar />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}
