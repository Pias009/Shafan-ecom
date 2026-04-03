"use client";

import { useEffect } from "react";
import { useAdminSession } from "./useAdminSession";
import { usePathname } from "next/navigation";

export default function SecurityAuditLogger() {
  const { data: session } = useAdminSession();
  const pathname = usePathname();

  useEffect(() => {
    if (!session) return;

    const isSuperAdmin = session.role === "SUPERADMIN";
    const isAdmin = session.role === "ADMIN" || isSuperAdmin;

    if (isAdmin && pathname?.includes("/ueadmin")) {
      const auditData = {
        userId: session.id,
        email: session.email,
        role: session.role,
        path: pathname,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        ip: "client-side",
      };

      console.debug("[SECURITY AUDIT] Admin access:", auditData);
    }
  }, [session, pathname]);

  return null;
}
