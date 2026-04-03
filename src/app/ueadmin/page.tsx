"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminRoot() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkAdminSession = async () => {
      try {
        const res = await fetch("/api/admin/session");
        if (res.ok) {
          const data = await res.json();
          if (data.user?.role === 'ADMIN' || data.user?.role === 'SUPERADMIN') {
            router.replace('/ueadmin/dashboard');
          } else {
            router.replace('/ueadmin/login');
          }
        } else {
          router.replace('/ueadmin/login');
        }
      } catch {
        router.replace('/ueadmin/login');
      } finally {
        setChecking(false);
      }
    };

    checkAdminSession();
  }, [router]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-4 border-black/10 border-t-black animate-spin" />
          <p className="text-sm font-bold text-black/40">Loading admin panel…</p>
        </div>
      </div>
    );
  }

  return null;
}
