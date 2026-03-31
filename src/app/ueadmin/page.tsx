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

    // For regular ADMINs, redirect based on their country assignment
    // We need to fetch the user's country from the API
    if (userRole === 'ADMIN') {
      fetch('/api/auth/admin-country')
        .then(res => res.json())
        .then(data => {
          if (data.country) {
            const country = data.country.toUpperCase();
            // Map country codes to admin panel routes
            const countryToRoute: Record<string, string> = {
              'KW': '/ueadmin/kuwait',
              'AE': '/ueadmin/dashboard', // UAE uses global dashboard
              'BH': '/ueadmin/bahrain',
              'SA': '/ueadmin/saudi',
              'OM': '/ueadmin/oman',
              'QA': '/ueadmin/qatar',
            };
            
            const targetRoute = countryToRoute[country] || '/ueadmin/dashboard';
            router.replace(targetRoute);
          } else {
            // No country assigned, redirect to setup or unauthorized
            router.replace('/ueadmin/setup');
          }
        })
        .catch(() => {
          // On error, default to dashboard
          router.replace('/ueadmin/dashboard');
        });
    } else {
      // Not an admin, redirect to login
      router.replace('/ueadmin/login');
    }
  }, [router, session, status]);

  return null;
}
