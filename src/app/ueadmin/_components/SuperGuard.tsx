"use client";

import { useAdminSession } from "./useAdminSession";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SuperGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useAdminSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;
    
    const isSuper = session?.role === "SUPERADMIN";
    
    if (!isSuper) {
      router.push("/ueadmin/dashboard");
    }
  }, [session, status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-4 border-black/10 border-t-black animate-spin" />
          <p className="text-sm font-bold text-black/40">Verifying Super Admin…</p>
        </div>
      </div>
    );
  }

  const isSuper = session?.role === "SUPERADMIN";
  if (!isSuper) return null;

  return <>{children}</>;
}
