"use client";

import { useEffect, Suspense, useSyncExternalStore } from "react";
import { usePathname, useSearchParams } from "next/navigation";
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
  const pathname = usePathname();
  const isDoctorSasi = pathname?.startsWith("/doctor-sasi");

  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  return (
    <>
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
