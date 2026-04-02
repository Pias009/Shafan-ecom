"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from "next-auth/react";

export default function AdminRoot() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const SUPER_ADMIN_EMAIL = "pvs178380@gmail.com";

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session?.user) {
      router.replace('/ueadmin/login');
      return;
    }

    const userRole = (session.user as any).role;
    const userEmail = session.user.email;
    
    // SUPERADMIN goes to global dashboard
    if (userRole === 'SUPERADMIN') {
      router.replace('/ueadmin/dashboard');
      return;
    }

    // For regular ADMINs, redirect to dashboard
    if (userRole === 'ADMIN') {
      router.replace('/ueadmin/dashboard');
    } else {
      // Not an admin, redirect to login
      router.replace('/ueadmin/login');
    }
  }, [router, session, status]);

  return null;
}
