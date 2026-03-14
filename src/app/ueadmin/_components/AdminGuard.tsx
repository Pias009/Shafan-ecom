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
    const isAuthPage = pathname.startsWith("/ueadmin/login");
    if (isAuthPage) return;
    const ok = session?.user?.role === "ADMIN" || session?.user?.role === "SUPERADMIN";
    if (!session || !ok) {
      // redirect to main app sign-in
      router.push("/auth/sign-in");
    }
  }, [session, status, router, pathname]);

  // While checking, render nothing or a tiny loader
  if (status === "loading" || !session) {
    return null;
  }

  return <>{children}</>;
}
