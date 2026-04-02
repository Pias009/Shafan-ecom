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
      {showNoticeBoard && pathname && <NoticeBoard />}
      <Navbar />
      <main className="flex-1 pt-12">
        {children}
      </main>
      <Footer />
    </div>
  );
}
