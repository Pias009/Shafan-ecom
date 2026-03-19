"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from "next-auth/react";

export default function AdminRoot() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const SUPER_ADMIN_EMAIL = "pvs178380@gmail.com";

  useEffect(() => {
    router.replace('/ueadmin/dashboard');
  }, [router, session, status]);

  return null;
}
