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
  const [isLoading, setIsLoading] = useState(true);
  const [showContent, setShowContent] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const hasLoaded = sessionStorage.getItem("shafan-loaded-v2");
    
    if (hasLoaded) {
      setIsLoading(false);
      setShowContent(true);
      return;
    }
    
    const timer = setTimeout(() => {
      setIsLoading(false);
      setShowContent(true);
      sessionStorage.setItem("shafan-loaded-v2", "true");
    }, 2500); // Reduced from 3500 to 2500 for better feel
    
    return () => clearTimeout(timer);
  }, []);

  const handleLoadingComplete = () => {
    setIsLoading(false);
    setShowContent(true);
    sessionStorage.setItem("shafan-loaded-v2", "true");
  };

  // Always render null on server to match client
  if (!mounted) {
    return null;
  }

  return (
    <>
      {isLoading && <LoadingScreen onLoadingComplete={handleLoadingComplete} />}
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