"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";

/**
 * Client-side security audit logger
 * Tracks super admin access and logs security-relevant actions
 */
export default function SecurityAuditLogger() {
  const { data: session } = useSession();
  const pathname = usePathname();

  useEffect(() => {
    if (!session?.user) return;

    const isSuperAdmin = session.user.role === "SUPERADMIN";
    const isAdmin = session.user.role === "ADMIN" || isSuperAdmin;

    // Only log for admin/super admin access to sensitive areas
    if (isAdmin && pathname?.includes("/ueadmin")) {
      const auditData = {
        userId: session.user.id,
        email: session.user.email,
        role: session.user.role,
        path: pathname,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        ip: "client-side", // IP would be logged server-side
      };

      // In production, this would send to a secure audit log service
      console.debug("[SECURITY AUDIT] Admin access:", auditData);

      // Check for MFA status (this would come from session in a real implementation)
      const hasMFA = (session.user as any).mfaEnabled !== false;
      
      if (isSuperAdmin && !hasMFA) {
        console.warn("[SECURITY WARNING] Super admin accessing without MFA");
      }
    }
  }, [session, pathname]);

  return null; // This is a non-visual component
}