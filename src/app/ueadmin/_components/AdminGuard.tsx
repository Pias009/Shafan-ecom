"use client";

import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

// Simple client-side guard: only allow ADMIN or SUPERADMIN
export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "loading") return;
    // Allow login page to render without guard
    const isAuthPage = pathname?.startsWith("/ueadmin/login") || pathname?.startsWith("/ueadmin/setup");
    if (isAuthPage) return;
    const ok = session?.user?.role === "ADMIN" || session?.user?.role === "SUPERADMIN";
    if (!ok) {
      router.push("/ueadmin/login");
    }
  }, [session, status, router, pathname]);

  // Show spinner while loading
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-4 border-black/10 border-t-black animate-spin" />
          <p className="text-sm font-bold text-black/40">Loading admin panel…</p>
        </div>
      </div>
    );
  }

  // While not authenticated, render nothing (redirect happening)
  const isAuthPage = pathname?.startsWith("/ueadmin/login");
  const ok = session?.user?.role === "ADMIN" || session?.user?.role === "SUPERADMIN";
  if (!ok && !isAuthPage) return null;

  return <>{children}</>;
}
