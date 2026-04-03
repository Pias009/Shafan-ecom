"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      // Allow auth pages
      const isAuthPage = pathname?.startsWith("/ueadmin/login") ||
                         pathname?.startsWith("/ueadmin/verify") ||
                         pathname?.startsWith("/ueadmin/setup") ||
                         pathname?.startsWith("/ueadmin/unauthorized");
      
      if (isAuthPage) {
        setLoading(false);
        setAuthorized(true);
        return;
      }

      try {
        const res = await fetch("/api/admin/session");
        if (res.ok) {
          const data = await res.json();
          if (data.user && (data.user.role === 'ADMIN' || data.user.role === 'SUPERADMIN')) {
            setAuthorized(true);
          } else {
            router.push("/ueadmin/login");
          }
        } else {
          router.push("/ueadmin/login");
        }
      } catch {
        router.push("/ueadmin/login");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [pathname, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-4 border-black/10 border-t-black animate-spin" />
          <p className="text-sm font-bold text-black/40">Loading admin panel…</p>
        </div>
      </div>
    );
  }

  if (!authorized) {
    return null;
  }

  return <>{children}</>;
}