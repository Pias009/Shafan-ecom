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
  const [isLoading, setIsLoading] = useState(false);
  const [showContent, setShowContent] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLoadingComplete = () => {
    setIsLoading(false);
    setShowContent(true);
    sessionStorage.setItem("shanfa-loaded-v2", "true");
  };

  // Always render null on server to match client
  if (!mounted) {
    return null;
  }

  return (
    <>
      {/* Loading screen removed */}
      {showContent && (
        <>
          <Suspense fallback={null}>
            <NavigationScroll />
          </Suspense>
          {children}
          <FloatingCartButton />
        </>
      )}
    </>
  );
}