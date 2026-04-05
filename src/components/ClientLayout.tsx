"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";

const LoadingScreen = dynamic(() => import("./LoadingScreen"), {
  ssr: false,
  loading: () => null,
});

interface ClientLayoutProps {
  children: React.ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Clear old session key to force show new loading
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

  return (
    <>
      {isLoading && <LoadingScreen onLoadingComplete={handleLoadingComplete} />}
      {showContent && children}
    </>
  );
}