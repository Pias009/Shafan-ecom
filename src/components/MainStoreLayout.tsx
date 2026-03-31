"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { NoticeBoard } from "./NoticeBoard";

export function MainStoreLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  const isAdmin = pathname?.startsWith("/ueadmin");
  const showNoticeBoard = pathname === "/" || pathname === "";

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      {showNoticeBoard && pathname && <NoticeBoard />}
      <main className="flex-1 pt-16 md:pt-0">
        {children}
      </main>
      <Footer />
    </div>
  );
}
