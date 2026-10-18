"use client";

import { createContext, useContext } from "react";

export interface AdminUser {
  id: string;
  email: string | null;
  name: string | null;
  role: "ADMIN" | "SUPERADMIN";
}

const AdminSessionContext = createContext<AdminUser | null>(null);

export function AdminSessionProvider({ user, children }: { user: AdminUser | null; children: React.ReactNode }) {
  return <AdminSessionContext.Provider value={user}>{children}</AdminSessionContext.Provider>;
}

/** The signed-in admin, resolved once on the server by the /ueadmin layout. */
export function useAdminSession(): {
  data: AdminUser | null;
  // "loading" stays in the type for older callers; it is never returned now.
  status: "authenticated" | "unauthenticated" | "loading";
} {
  const user = useContext(AdminSessionContext);
  return { data: user, status: user ? "authenticated" : "unauthenticated" };
}
