"use client";

import { useEffect, Suspense, useSyncExternalStore } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { FloatingCartButton } from "./FloatingCartButton";
import { LenisProvider } from "./LenisProvider";

interface ClientLayoutProps {
  children: React.ReactNode;
}

function NavigationScroll() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Use native scroll — Lenis will handle momentum on desktop
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname, searchParams]);

  return null;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  const pathname = usePathname();
  const isDoctorSasi = pathname?.startsWith("/doctor-sasi");

  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  return (
    <>
      {/* Lenis smooth scroll — desktop only, GSAP ticker-synced */}
      <LenisProvider />

      {!isDoctorSasi && (
        <Suspense fallback={null}>
          <NavigationScroll />
        </Suspense>
      )}
      {children}
      {isClient && !isDoctorSasi && <FloatingCartButton />}
    </>
  );
}
