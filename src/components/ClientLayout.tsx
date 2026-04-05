"use client";

import { useState, useEffect } from "react";
import LoadingScreen from "./LoadingScreen";

interface ClientLayoutProps {
  children: React.ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [showContent, setShowContent] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    sessionStorage.removeItem("shafan-loaded-v2");
    
    const timer = setTimeout(() => {
      setIsLoading(false);
      setShowContent(true);
      sessionStorage.setItem("shafan-loaded-v2", "true");
    }, 3500);
    
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
      {showContent && children}
    </>
  );
}