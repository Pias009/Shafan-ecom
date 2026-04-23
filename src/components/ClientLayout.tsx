"use client";

import { useState, useEffect, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import LoadingScreen from "./LoadingScreen";
import { FloatingCartButton } from "./FloatingCartButton";

interface ClientLayoutProps {
  children: React.ReactNode;
}

function NavigationScroll() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname, searchParams]);

  return null;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);



  return (
    <>
      {/* Loading screen removed */}
      <Suspense fallback={null}>
        <NavigationScroll />
      </Suspense>
      {children}
      {mounted && <FloatingCartButton />}
    </>
  );
}