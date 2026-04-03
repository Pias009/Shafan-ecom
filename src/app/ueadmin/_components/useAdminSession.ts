"use client";

import { useEffect, useState } from "react";

export interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  role: "ADMIN" | "SUPERADMIN";
}

export function useAdminSession() {
  const [session, setSession] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch("/api/admin/session");
        if (res.ok) {
          const data = await res.json();
          setSession(data.user);
        } else {
          setSession(null);
        }
      } catch {
        setSession(null);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  return { data: session, status: loading ? "loading" : (session ? "authenticated" : "unauthenticated") };
}
