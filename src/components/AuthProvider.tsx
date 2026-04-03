"use client";

import { SessionProvider } from "next-auth/react";

interface Props {
  children: React.ReactNode;
  adminAuth?: boolean;
}

export function AuthProvider({ children, adminAuth = false }: Props) {
  // Use different base URL for admin auth
  const router = typeof window !== 'undefined' ? window.location : null;
  
  return (
    <SessionProvider 
      baseUrl={adminAuth ? "/api/auth/admin" : undefined}
    >
      {children}
    </SessionProvider>
  );
}