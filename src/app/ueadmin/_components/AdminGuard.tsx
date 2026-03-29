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
    const isAuthPage = pathname?.startsWith("/ueadmin/login") ||
                       pathname?.startsWith("/ueadmin/setup") ||
                       pathname?.startsWith("/ueadmin/verify");
    if (isAuthPage) return;
    
    // Check if user has admin role
    const ok = session?.user?.role === "ADMIN" || session?.user?.role === "SUPERADMIN";
    if (!ok) {
      router.push("/ueadmin/login");
      return;
    }
    
    // CRITICAL: ALL ADMINISTRATORS MUST HAVE MFA VERIFIED
    // This is a client-side check; middleware enforces server-side
    const mfaVerified = (session?.user as any)?.mfaVerified;
    
    // Allow SUPERADMIN to bypass MFA in development for easier testing
    const isDevelopment = process.env.NODE_ENV === 'development';
    const isSuperAdmin = session?.user?.role === 'SUPERADMIN';
    
    if (!mfaVerified && !(isDevelopment && isSuperAdmin)) {
      router.push("/ueadmin/login");
      return;
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

  // While not authenticated or MFA not verified, render nothing (redirect happening)
  const isAuthPage = pathname?.startsWith("/ueadmin/login") ||
                     pathname?.startsWith("/ueadmin/setup") ||
                     pathname?.startsWith("/ueadmin/verify");
  const ok = session?.user?.role === "ADMIN" || session?.user?.role === "SUPERADMIN";
  const mfaVerified = (session?.user as any)?.mfaVerified;
  
  // Allow SUPERADMIN to bypass MFA in development for easier testing
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isSuperAdmin = session?.user?.role === 'SUPERADMIN';
  const mfaOk = mfaVerified || (isDevelopment && isSuperAdmin);
  
  if (!ok || !mfaOk) {
    if (!isAuthPage) return null;
  }

  return <>{children}</>;
}
