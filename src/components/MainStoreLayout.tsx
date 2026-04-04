"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { NoticeBoard } from "./NoticeBoard";
import { useState, useEffect } from "react";

export function MainStoreLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [noticeBoardEnabled, setNoticeBoardEnabled] = useState(true);
  
  const isAdmin = pathname?.startsWith("/ueadmin");
  const showNoticeBoard = (pathname === "/" || pathname === "") && noticeBoardEnabled;

  // Check if notice board is enabled (stored in localStorage)
  useEffect(() => {
    const enabled = localStorage.getItem("noticeBoardEnabled");
    if (enabled !== null) {
      setNoticeBoardEnabled(enabled === "true");
    }
  }, []);

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-col min-h-screen">
      {showNoticeBoard && pathname && <NoticeBoard onClose={() => {
        setNoticeBoardEnabled(false);
        localStorage.setItem("noticeBoardEnabled", "false");
      }} />}
      <Navbar NoticeBoardVisible={showNoticeBoard} />
      <main className={`flex-1 ${showNoticeBoard ? 'pt-0' : 'pt-12'}`}>
        {children}
      </main>
      <Footer />
    </div>
  );
}
